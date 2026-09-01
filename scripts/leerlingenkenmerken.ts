import type { Leerlingenkenmerken } from '../src/types.ts'
import { excelDatum, leesEersteWerkblad, type XlsxRij } from './xlsx.ts'

/**
 * De GOK-leerlingenkenmerken per school, uit de publicatie "Overzicht leerlingkenmerken
 * secundair onderwijs voorschot werkingstoelagen" van AgODi.
 *
 * Waarom dit bestand en niet Dataloep: Dataloep heeft dezelfde cijfers per vestigingsplaats,
 * maar enkel via een handmatige kruistabel-export. Dit is een gewone xlsx op het
 * documentenportaal, dus automatiseerbaar. De prijs is dat het per school is en niet per
 * vestigingsplaats. Zie ROADMAP.md voor die afweging.
 */

const BESTAND_BASIS = 'https://data-onderwijs.vlaanderen.be/documenten/bestanden'

/**
 * ⚠️ De bestandsnaam is niet voorspelbaar: 2021-2022 en 2022-2023 heten `..._so_1.xlsx`,
 * 2023-2024 en 2024-2025 heten `..._so.xlsx`. Een patroon hardcoden en het jaartal ophogen
 * gaat dus stuk. We proberen beide varianten, nieuwste schooljaar eerst.
 */
function kandidaatUrls(vanafJaar: number, jarenTerug: number): string[] {
  const urls: string[] = []
  for (let jaar = vanafJaar; jaar > vanafJaar - jarenTerug; jaar--) {
    for (const achtervoegsel of ['so', 'so_1']) {
      urls.push(`${BESTAND_BASIS}/Publicaties_Leerlingenkenmerken_Overzicht_${jaar}-${jaar + 1}_${achtervoegsel}.xlsx`)
    }
  }
  return urls
}

export interface KenmerkenDataset {
  /** Bv. '2024-2025', uit de titelregel van het bestand zelf. */
  schooljaar: string
  /** Teldatum als ISO-datum. Dit is de financieringsteling van 1 februari van het jaar ervóór. */
  teldatum: string
  bron: string
  /** Schoolnummer → kenmerken. Niet elke school komt voor; zie de join-noot in ROADMAP.md. */
  perSchoolnummer: Map<string, Leerlingenkenmerken>
}

/** Kolomkoppen bevatten harde spaties en dubbele spaties — vergelijk genormaliseerd. */
function normaliseer(tekst: string): string {
  return tekst.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Zoekt de kolomletter waarvan de kop het fragment bevat. Een exacte kop wint van een
 * gedeeltelijke: zowel "Instelling" (het schoolnummer) als "Naam instelling" bevatten
 * "instelling", en dan moet je de eerste hebben.
 */
function kolomVoor(kop: XlsxRij, fragment: string): string {
  const kolommen = Object.entries(kop)
  for (const [kolom, waarde] of kolommen) {
    if (normaliseer(waarde) === fragment) return kolom
  }
  for (const [kolom, waarde] of kolommen) {
    if (normaliseer(waarde).includes(fragment)) return kolom
  }
  throw new Error(
    `Kolom met "${fragment}" niet gevonden in de leerlingenkenmerken-publicatie. ` +
      `Gevonden koppen: ${Object.values(kop).map(normaliseer).join(' | ')}`,
  )
}

function getal(rij: XlsxRij, kolom: string): number | null {
  const waarde = rij[kolom]
  if (waarde === undefined) return null
  const nummer = Number(waarde)
  return Number.isFinite(nummer) ? nummer : null
}

/** Aandeel als fractie, afgerond op 4 cijfers. Null als de deling niet kan. */
function aandeel(teller: number | null, noemer: number): number | null {
  if (teller === null || noemer <= 0) return null
  return Math.round((teller / noemer) * 10_000) / 10_000
}

export function verwerkWerkboek(bestand: Buffer, bron: string): KenmerkenDataset {
  const rijen = leesEersteWerkblad(bestand)

  // Het bestand begint met een titelregel en een blok lege rijen; de kop staat pas rond rij 11.
  // Zoek hem op inhoud in plaats van op een vast rijnummer.
  const kopIndex = rijen.findIndex((rij) => Object.values(rij).some((w) => normaliseer(w) === 'provincie'))
  if (kopIndex === -1) throw new Error('Kopregel met "Provincie" niet gevonden in de leerlingenkenmerken-publicatie.')
  const kop = rijen[kopIndex]

  const kolom = {
    instelling: kolomVoor(kop, 'instelling'),
    teldatum: kolomVoor(kop, 'teldatum'),
    aantal: kolomVoor(kop, 'aantal lln'),
    opleidingMoeder: kolomVoor(kop, 'opleiding moeder'),
    schooltoelage: kolomVoor(kop, 'schooltoelage'),
    thuistaal: kolomVoor(kop, 'thuistaal'),
    buurt: kolomVoor(kop, 'buurt'),
  }

  const titel = rijen[0]?.['A'] ?? ''
  const schooljaar = /(\d{4}-\d{4})/.exec(titel)?.[1]
  if (!schooljaar) throw new Error(`Geen schooljaar te lezen uit de titelregel: "${titel}"`)

  const perSchoolnummer = new Map<string, Leerlingenkenmerken>()
  let teldatum: string | null = null
  let overgeslagen = 0

  for (const rij of rijen.slice(kopIndex + 1)) {
    const schoolnummer = rij[kolom.instelling]
    const aantalLeerlingen = getal(rij, kolom.aantal)
    if (!schoolnummer || aantalLeerlingen === null || aantalLeerlingen <= 0) {
      if (Object.keys(rij).length > 0) overgeslagen++
      continue
    }
    const kenmerken: Leerlingenkenmerken = {
      aantalLeerlingen,
      opleidingMoeder: aandeel(getal(rij, kolom.opleidingMoeder), aantalLeerlingen),
      schooltoelage: aandeel(getal(rij, kolom.schooltoelage), aantalLeerlingen),
      thuistaal: aandeel(getal(rij, kolom.thuistaal), aantalLeerlingen),
      buurt: aandeel(getal(rij, kolom.buurt), aantalLeerlingen),
    }
    perSchoolnummer.set(schoolnummer, kenmerken)

    const serieel = getal(rij, kolom.teldatum)
    if (teldatum === null && serieel !== null) teldatum = excelDatum(serieel)
  }

  if (perSchoolnummer.size === 0) throw new Error('Geen bruikbare rijen in de leerlingenkenmerken-publicatie.')
  if (teldatum === null) throw new Error('Geen teldatum gevonden in de leerlingenkenmerken-publicatie.')
  if (overgeslagen > 0) {
    console.warn(`  ${overgeslagen} rij(en) in de leerlingenkenmerken zonder schoolnummer of leerlingenaantal — overgeslagen.`)
  }

  return { schooljaar, teldatum, bron, perSchoolnummer }
}

/**
 * Haalt de meest recente publicatie op. Geeft `null` als geen van de kandidaat-URL's bestaat:
 * de cijfers zijn een aanvulling, dus een gemiste publicatie mag de hele dataset niet blokkeren.
 * Wat er dán gebeurt, staat in fetch-data.ts.
 */
export async function haalLeerlingenkenmerken(): Promise<KenmerkenDataset | null> {
  // Een schooljaar begint in september; in de eerste helft van het kalenderjaar is het
  // lopende schooljaar dus dat van vorig jaar. Vier jaar terugkijken is ruim: de publicatie
  // van 2024-2025 stond er in september 2026 nog steeds als nieuwste.
  const nu = new Date()
  const lopendJaar = nu.getUTCMonth() >= 8 ? nu.getUTCFullYear() : nu.getUTCFullYear() - 1

  for (const url of kandidaatUrls(lopendJaar, 4)) {
    let res: Response
    try {
      res = await fetch(url)
    } catch (err) {
      console.warn(`  ${url} niet bereikbaar: ${err instanceof Error ? err.message : err}`)
      continue
    }
    if (!res.ok) continue
    const dataset = verwerkWerkboek(Buffer.from(await res.arrayBuffer()), url)
    console.log(
      `  leerlingenkenmerken: ${dataset.perSchoolnummer.size} scholen, schooljaar ` +
        `${dataset.schooljaar}, teldatum ${dataset.teldatum}`,
    )
    return dataset
  }

  console.warn('  leerlingenkenmerken: geen publicatie gevonden op het documentenportaal.')
  return null
}
