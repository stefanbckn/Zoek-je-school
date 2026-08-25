import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import proj4 from 'proj4'
import type { Campus, DatasetMeta, Net, SchoolOpCampus } from '../src/types.ts'

// Geverifieerd via data-onderwijs.vlaanderen.be/onderwijsaanbod/lijsten (nooit gokken, zie CLAUDE.md).
const VESTIGINGEN_CSV_URL =
  'https://data-onderwijs.vlaanderen.be/onderwijsaanbod/csv.ashx?s=01&n=2&hs=311'
const FICHE_BASE_URL = 'https://data-onderwijs.vlaanderen.be/onderwijsaanbod/instelling'
const BRON_PAGINA = 'https://data-onderwijs.vlaanderen.be/onderwijsaanbod/lijsten'

const OUTPUT_DIR = path.resolve(import.meta.dirname, '../public/data')

// EPSG:31370 (Belgische Lambert 72), standaard parameterset.
const LAMBERT72 =
  '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 ' +
  '+x_0=150000.013 +y_0=5400088.438 +ellps=intl ' +
  '+towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs'

function parseCsvRow(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

function parseCsv(content: string): Record<string, string>[] {
  // Deze CSV's van data-onderwijs.vlaanderen.be gebruiken CR (\r) als regeleinde, geen \n.
  const withoutBom = content.replace(/^﻿/, '')
  const lines = withoutBom.split('\r').filter((l) => l.trim().length > 0)
  const header = parseCsvRow(lines[0], ';')
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line, ';')
    const row: Record<string, string> = {}
    header.forEach((key, i) => {
      row[key] = values[i] ?? ''
    })
    return row
  })
}

function mapNet(raw: string): Net {
  switch (raw) {
    case 'Gemeenschapsonderwijs':
      return 'GO!'
    case 'Officieel gesubsidieerd onderwijs':
      return 'Officieel gesubsidieerd'
    case 'Vrij gesubsidieerd onderwijs':
      return 'Vrij gesubsidieerd'
    default:
      return 'Onafhankelijk'
  }
}

function normalizeWebsite(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function orNull(raw: string): string | null {
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

interface RuweSchool {
  school: SchoolOpCampus
  straat: string
  huisnummer: string
  postcode: string
  gemeente: string
  niscode: string
  lat: number | null
  lon: number | null
}

async function main() {
  console.log(`Ophalen: ${VESTIGINGEN_CSV_URL}`)
  const res = await fetch(VESTIGINGEN_CSV_URL)
  if (!res.ok) {
    throw new Error(`Download mislukt (${res.status} ${res.statusText}) voor ${VESTIGINGEN_CSV_URL}`)
  }
  const csvText = await res.text()
  const rows = parseCsv(csvText)
  console.log(`Totaal aantal vestigingsplaatsen (heel Vlaanderen/Brussel): ${rows.length}`)

  const antwerpenRows = rows.filter(
    (r) => r.provincie === 'Antwerpen' && r['soort instelling'] === 'Onderwijsinstelling',
  )
  console.log(`Waarvan provincie Antwerpen, soort instelling "Onderwijsinstelling": ${antwerpenRows.length}`)

  const verwacht = 562
  if (antwerpenRows.length !== verwacht) {
    console.warn(
      `Let op: aantal (${antwerpenRows.length}) wijkt af van het aantal bij de laatste handmatige ` +
        `verificatie (${verwacht}). Dat kan normaal zijn (nieuw schooljaar, nieuwe/gesloten scholen) ` +
        `maar controleer even of de bron niet gewijzigd is.`,
    )
  }

  let zonderCoordinaten = 0

  const ruweScholen: RuweSchool[] = antwerpenRows.map((r) => {
    const lx = Number(r.lx)
    const ly = Number(r.ly)
    const heeftCoordinaten = lx !== 0 && ly !== 0 && !Number.isNaN(lx) && !Number.isNaN(ly)
    if (!heeftCoordinaten) zonderCoordinaten++
    const [lon, lat] = heeftCoordinaten ? proj4(LAMBERT72, 'WGS84', [lx, ly]) : [null, null]
    return {
      school: {
        id: `${r.schoolnummer}-${r.intern_vplnummer}`,
        schoolnummer: r.schoolnummer,
        internVplnummer: r.intern_vplnummer,
        naam: r.naam,
        isHoofdzetel: r.hoofdzetel === 'True',
        net: mapNet(r.net),
        telefoon: orNull(r.telefoon),
        email: orNull(r['e-mail']),
        website: normalizeWebsite(r.website),
        linkFiche: `${FICHE_BASE_URL}?sn=${r.schoolnummer}`,
        statusErkenning: r['status erkenning'] === 'E' ? 'E' : 'S',
        scholengemeenschap:
          r.scholengemeenschap && r.scholengemeenschap !== '0' ? r.scholengemeenschap : null,
        richtingen: null,
        kostprijs: null,
        vervoer: null,
      },
      // Groeperen op straat+huisnummer zonder busnummer: verschillende bus-ingangen van
      // hetzelfde gebouw zijn nog steeds dezelfde campus.
      straat: r.straat,
      huisnummer: r.huisnummer,
      postcode: r.postcode,
      gemeente: r.gemeente,
      niscode: r.niscode,
      lat,
      lon,
    }
  })

  if (zonderCoordinaten > 0) {
    console.warn(
      `Let op: ${zonderCoordinaten} vestiging(en) hebben lx/ly = 0 in de brondata (geen coördinaten). ` +
        `Deze krijgen lat/lon = null en worden overgeslagen op de kaart en in de afstandsberekening.`,
    )
  }

  // Groepeer scholen op hetzelfde fysieke adres tot één campus. Meerdere apart geregistreerde
  // scholen (elk een eigen schoolnummer) delen vaak hetzelfde gebouw — dat als losse kaartjes
  // tonen is pure ruis voor wie een school zoekt. Zie CLAUDE.md.
  const campussenPerAdres = new Map<string, Campus>()
  for (const r of ruweScholen) {
    const adresKey = `${r.postcode}|${r.straat}|${r.huisnummer}`.toLowerCase()
    let campus = campussenPerAdres.get(adresKey)
    if (!campus) {
      campus = {
        id: adresKey,
        straat: r.straat,
        huisnummer: r.huisnummer,
        postcode: r.postcode,
        gemeente: r.gemeente,
        niscode: r.niscode,
        lat: r.lat,
        lon: r.lon,
        scholen: [],
      }
      campussenPerAdres.set(adresKey, campus)
    }
    campus.scholen.push(r.school)
  }
  const campussen = [...campussenPerAdres.values()]

  const gedeeldeAdressen = campussen.filter((c) => c.scholen.length > 1).length
  console.log(
    `${campussen.length} campussen (adressen), waarvan ${gedeeldeAdressen} met meer dan 1 ` +
      `apart geregistreerde school op hetzelfde adres.`,
  )

  const meta: DatasetMeta = {
    opgehaaldOp: new Date().toISOString(),
    bron: [BRON_PAGINA, VESTIGINGEN_CSV_URL],
    aantalVestigingenTotaal: rows.length,
    aantalVestigingenAntwerpen: ruweScholen.length,
    aantalCampussenAntwerpen: campussen.length,
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(
    path.join(OUTPUT_DIR, 'vestigingen.json'),
    JSON.stringify(campussen, null, 2),
    'utf-8',
  )
  await writeFile(path.join(OUTPUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8')

  console.log(`Weggeschreven naar ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
