/**
 * Genereert één statische pagina per stad uit `public/data/vestigingen.json`.
 *
 * Waarom dit bestaat: de zoeker heeft één URL en alle gemeentekeuze zit in de querystring,
 * dus er valt niets te ranken op "middelbare scholen <stad>". Deze pagina's geven elke stad
 * een eigen adres, zonder backend: alles komt build-time uit de gecommitte dataset.
 *
 * Draait als `prebuild` en `predev`, dus de uitvoer staat niet in git (zie .gitignore).
 * De projectregel "geen hardgecodeerde schoolnaam of richting in de code" blijft daarmee
 * overeind: dit script kent geen enkele school, het leest ze.
 *
 * De tellingen volgen bewust dezelfde regels als de zoeker zelf (`heeftAanbod` en
 * `scholenMetAanbod` uit src/lib/aanbod.ts). Anders belooft de pagina 21 scholen en toont de
 * dieplink er 19.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { heeftAanbod, scholenMetAanbod } from '../src/lib/aanbod.ts'
import { DOMEIN_VOLGORDE, domeinLabel } from '../src/lib/domein.ts'
import { haversineKm } from '../src/lib/haversine.ts'
import type { Campus, DatasetMeta } from '../src/types.ts'
import { pagina } from './gemeentepagina-html.ts'
import { STEDEN, UITVOERMAP, stadPad, type Stad } from './steden.ts'

const WORTEL = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://zoekjeschool.be'
/** Hoe ver "in de buurt" reikt bij de lijst met buurgemeenten. */
const BUURT_KM = 10

export interface Profiel {
  adressen: Campus[]
  /** Per adres de regels zoals ze op de pagina komen: naam + net, zonder dubbels. */
  regelsPerAdres: Map<string, { naam: string; net: string }[]>
  /** Unieke scholen, op schoolnummer. Eén school kan meerdere adressen in dezelfde stad hebben. */
  aantalScholen: number
  /** Schoolrijen: één school op twee adressen telt hier twee keer, net als in de lijst. */
  aantalSchoolrijen: number
  aantalRichtingen: number
  domeinen: { code: string; label: string; adressen: number }[]
  ontbrekend: { code: string; label: string; dichtstbij: { gemeente: string; km: number } | null }[]
  netten: { net: string; scholen: number }[]
  okanAdressen: number
  duaalRichtingen: number
  buurgemeenten: { gemeente: string; adressen: number; km: number }[]
  midden: { lat: number; lon: number }
  /** De plaatsnamen die samen deze stad vormen, voor de dieplinks naar de zoeker. */
  gemeenteNamen: string[]
}

function main(): void {
  const campussen: Campus[] = JSON.parse(
    readFileSync(resolve(WORTEL, 'public/data/vestigingen.json'), 'utf8'),
  )
  const meta: DatasetMeta = JSON.parse(
    readFileSync(resolve(WORTEL, 'public/data/meta.json'), 'utf8'),
  )

  // Alleen adressen die de zoeker standaard ook toont, en per adres alleen de scholen die
  // er echt lesgeven. Zie de docstring bovenaan.
  const zichtbaar = campussen.filter(heeftAanbod).map(scholenMetAanbod)

  rmSync(resolve(WORTEL, UITVOERMAP), { recursive: true, force: true })

  for (const stad of STEDEN) {
    const profiel = maakProfiel(stad, zichtbaar)
    if (profiel.adressen.length === 0) {
      throw new Error(
        `Geen adressen gevonden voor ${stad.naam} (niscode ${stad.niscode}). ` +
          'Controleer de code tegen het veld "niscode" in vestigingen.json.',
      )
    }
    const map = resolve(WORTEL, UITVOERMAP, stad.slug)
    mkdirSync(map, { recursive: true })
    writeFileSync(resolve(map, 'index.html'), pagina(stad, profiel, meta), 'utf8')
    console.log(
      `${stad.naam}: ${profiel.adressen.length} adressen, ${profiel.aantalScholen} scholen ` +
        `(${profiel.aantalSchoolrijen} rijen), ` +
        `${profiel.aantalRichtingen} richtingen, ${profiel.ontbrekend.length} ontbrekende domeinen`,
    )
  }

  controleerSitemap()
}

function maakProfiel(stad: Stad, alle: Campus[]): Profiel {
  const hoortErbij = (c: Campus) => c.niscode === stad.niscode
  const adressen = alle
    .filter(hoortErbij)
    .slice()
    .sort((a, b) => a.straat.localeCompare(b.straat, 'nl') || a.huisnummer.localeCompare(b.huisnummer, 'nl'))

  const schoolnummers = new Set(adressen.flatMap((c) => c.scholen.map((s) => s.schoolnummer)))
  // Twee scholen met een eigen schoolnummer kunnen dezelfde naam én hetzelfde net hebben op
  // hetzelfde adres (GO! Stamina op Daverlostraat 132 in Brugge). In de lijst wordt dat twee
  // keer exact dezelfde regel, met dezelfde link. Eén regel dus, het aantal scholen hierboven
  // blijft wel op het schoolnummer gebaseerd.
  const regelsPerAdres = new Map<string, { naam: string; net: string }[]>()
  for (const c of adressen) {
    const gezien = new Set<string>()
    const regels: { naam: string; net: string }[] = []
    for (const s of c.scholen) {
      const sleutel = `${s.naam}|${s.net}`
      if (gezien.has(sleutel)) continue
      gezien.add(sleutel)
      regels.push({ naam: s.naam, net: s.net })
    }
    regelsPerAdres.set(c.id, regels)
  }
  const aantalSchoolrijen = adressen.reduce((t, c) => t + c.scholen.length, 0)
  const richtingen = new Set<string>()
  const duaal = new Set<string>()
  const adressenPerDomein = new Map<string, number>()
  const scholenPerNet = new Map<string, number>()
  let okanAdressen = 0

  for (const c of adressen) {
    const domeinenHier = new Set<string>()
    let okanHier = false
    for (const s of c.scholen) {
      scholenPerNet.set(s.net, (scholenPerNet.get(s.net) ?? 0) + 1)
      for (const r of s.richtingen) {
        // `studierichtingCode` mag null zijn in het model; zonder code valt er niets te
        // ontdubbelen, dus telt zo'n rij niet mee in het aantal verschillende richtingen.
        if (r.studierichtingCode !== null) {
          richtingen.add(r.studierichtingCode)
          if (r.duaal) duaal.add(r.studierichtingCode)
        }
        if (r.onderwijsvorm === 'OKAN') okanHier = true
        if (r.domeinCode !== null && DOMEIN_VOLGORDE.includes(r.domeinCode)) {
          domeinenHier.add(r.domeinCode)
        }
      }
    }
    if (okanHier) okanAdressen++
    for (const d of domeinenHier) adressenPerDomein.set(d, (adressenPerDomein.get(d) ?? 0) + 1)
  }

  const midden = middelpunt(adressen)
  const aanwezig = DOMEIN_VOLGORDE.filter((d) => adressenPerDomein.has(d))
  const ontbrekend = DOMEIN_VOLGORDE.filter((d) => !adressenPerDomein.has(d)).map((code) => ({
    code,
    label: domeinLabel(code),
    dichtstbij: dichtstbijMetDomein(code, midden, alle.filter((c) => !hoortErbij(c))),
  }))

  return {
    adressen,
    regelsPerAdres,
    aantalScholen: schoolnummers.size,
    aantalSchoolrijen,
    aantalRichtingen: richtingen.size,
    domeinen: aanwezig.map((code) => ({
      code,
      label: domeinLabel(code),
      adressen: adressenPerDomein.get(code) ?? 0,
    })),
    ontbrekend,
    netten: [...scholenPerNet.entries()]
      .map(([net, s]) => ({ net, scholen: s }))
      .sort((a, b) => a.net.localeCompare(b.net, 'nl')),
    okanAdressen,
    duaalRichtingen: duaal.size,
    buurgemeenten: buurgemeenten(stad, midden, alle),
    midden,
    gemeenteNamen: [...new Set(adressen.map((c) => c.gemeente))].sort((a, b) =>
      a.localeCompare(b, 'nl'),
    ),
  }
}

/** Het gemiddelde van de coördinaten: goed genoeg om afstanden tot een stad mee te schatten. */
function middelpunt(adressen: Campus[]): { lat: number; lon: number } {
  const met = adressen.filter((c) => c.lat !== null && c.lon !== null)
  const lat = met.reduce((t, c) => t + (c.lat as number), 0) / met.length
  const lon = met.reduce((t, c) => t + (c.lon as number), 0) / met.length
  return { lat, lon }
}

function dichtstbijMetDomein(
  code: string,
  midden: { lat: number; lon: number },
  elders: Campus[],
): { gemeente: string; km: number } | null {
  let beste: { gemeente: string; km: number } | null = null
  for (const c of elders) {
    if (c.lat === null || c.lon === null) continue
    const heeft = c.scholen.some((s) => s.richtingen.some((r) => r.domeinCode === code))
    if (!heeft) continue
    const km = haversineKm(midden.lat, midden.lon, c.lat, c.lon)
    if (beste === null || km < beste.km) beste = { gemeente: c.gemeente, km }
  }
  return beste
}

function buurgemeenten(
  stad: Stad,
  midden: { lat: number; lon: number },
  alle: Campus[],
): { gemeente: string; adressen: number; km: number }[] {
  const per = new Map<string, { adressen: number; km: number }>()
  for (const c of alle) {
    // Op niscode uitsluiten, niet op naam: anders staat Sint-Andries als buurgemeente van
    // Brugge terwijl het Brugge zelf is.
    if (c.niscode === stad.niscode) continue
    if (c.lat === null || c.lon === null) continue
    const km = haversineKm(midden.lat, midden.lon, c.lat, c.lon)
    if (km > BUURT_KM) continue
    const vorig = per.get(c.gemeente)
    per.set(c.gemeente, {
      adressen: (vorig?.adressen ?? 0) + 1,
      km: Math.min(vorig?.km ?? Infinity, km),
    })
  }
  return [...per.entries()]
    .map(([gemeente, v]) => ({ gemeente, ...v }))
    .sort((a, b) => a.km - b.km)
}

/**
 * Een gegenereerde pagina die niet in de sitemap staat, wordt trager of niet gevonden, en dat
 * merk je pas maanden later. Daarom een harde fout in plaats van een waarschuwing: de sitemap
 * staat in git en het script niet, dus alleen deze controle houdt ze gelijk.
 */
function controleerSitemap(): void {
  const pad = resolve(WORTEL, 'public/sitemap.xml')
  const sitemap = readFileSync(pad, 'utf8')
  const ontbreekt = STEDEN.filter((s) => !sitemap.includes(`${SITE}${stadPad(s)}`))
  if (ontbreekt.length > 0) {
    throw new Error(
      'Deze pagina\'s staan niet in public/sitemap.xml:\n' +
        ontbreekt.map((s) => `  <url><loc>${SITE}${stadPad(s)}</loc></url>`).join('\n'),
    )
  }
}

main()
