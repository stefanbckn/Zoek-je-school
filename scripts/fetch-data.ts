import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  Campus,
  DatasetMeta,
  Finaliteit,
  Net,
  Richting,
  SchoolOpCampus,
  SoortBestuur,
} from '../src/types.ts'
import { haalLeerlingenkenmerken } from './leerlingenkenmerken.ts'

// Laad .env.local (voorrang) en .env. Node 21+ heeft loadEnvFile ingebouwd — geen dotenv nodig.
for (const bestand of ['.env', '.env.local']) {
  try {
    process.loadEnvFile(bestand)
  } catch {
    // Bestand bestaat niet — dat mag, de key kan ook uit de omgeving komen (CI).
  }
}

// Alle endpoints geverifieerd tegen de officiële specs op onderwijs-api-portaal.vlaanderen.be
// én door de response effectief op te halen. Nooit gokken — zie CLAUDE.md.
const API = 'https://onderwijs.api.vlaanderen.be/instellingsgegevens'
const EP = {
  locaties: `${API}/instellingslocatie/v1/instellingslocatie`,
  instellingen: `${API}/instelling/v2/instelling`,
  ingerichtAanbod: `${API}/onderwijsaanbod_so/v2/ingerichteadministratievegroep`,
  catalogus: `${API}/onderwijsaanbod_so/v2/administratievegroep`,
}
const BRON_PAGINA = 'https://onderwijs-api-portaal.vlaanderen.be/documentatie/instellingsgegevens'
const FICHE_BASE_URL = 'https://data-onderwijs.vlaanderen.be/onderwijsaanbod/instelling'

/** Hoofdstructuur 311 = gewoon voltijds secundair onderwijs. Dat is de scope van deze site. */
const HOOFDSTRUCTUUR_VOLTIJDS_SO = '311'
const PROVINCIE = 'Provincie Antwerpen'
/** Instellingstype 300 = Bestuur. Daar (en niet op de school) zit `instelling_soort_bestuur`. */
const TYPE_BESTUUR = '300'

const OUTPUT_DIR = path.resolve(import.meta.dirname, '../public/data')

// --- API-client ------------------------------------------------------------------------

interface Pagina<T> {
  meta: { total_elements: number; total_pages: number; number: number; last: boolean }
  content: T[]
}

function apiKey(): string {
  const key = process.env.ONDERWIJS_API_KEY
  if (!key) {
    throw new Error(
      'ONDERWIJS_API_KEY ontbreekt. Zet hem in .env.local (lokaal) of als omgevingsvariabele (CI).\n' +
        'Zie .env.example. Bewust geen VITE_-prefix: deze key mag nooit in de client-bundle.',
    )
  }
  return key
}

async function haalPagina<T>(url: string): Promise<Pagina<T>> {
  const pogingen = 3
  let laatsteFout: unknown
  for (let i = 1; i <= pogingen; i++) {
    try {
      const res = await fetch(url, {
        // Auth via header, niet via ?apikey= — anders staat de key in serverlogs en referers.
        headers: { 'x-api-key': apiKey(), accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${(await res.text()).slice(0, 300)}`)
      return (await res.json()) as Pagina<T>
    } catch (err) {
      laatsteFout = err
      console.warn(`  poging ${i}/${pogingen} mislukt: ${err instanceof Error ? err.message : err}`)
      if (i < pogingen) await new Promise((r) => setTimeout(r, i * 2000))
    }
  }
  throw laatsteFout
}

/**
 * Haalt alle pagina's op. Let op: de paginatieparameter is `page` — `number` wordt stil
 * genegeerd en levert dan eindeloos pagina 1 op (geverifieerd, zie CLAUDE.md).
 */
async function haalAlles<T>(label: string, basisUrl: string, params: Record<string, string> = {}): Promise<T[]> {
  const alles: T[] = []
  for (let p = 1; ; p++) {
    const url = new URL(basisUrl)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    url.searchParams.set('size', '5000')
    url.searchParams.set('page', String(p))
    const pagina = await haalPagina<T>(url.toString())
    alles.push(...pagina.content)
    if (pagina.meta.last || p >= pagina.meta.total_pages) break
  }
  console.log(`  ${label}: ${alles.length} records`)
  return alles
}

// --- Mapping ---------------------------------------------------------------------------

/**
 * Het net van de school, fijner dan `instelling_net` alleen toelaat. Binnen "Officieel
 * gesubsidieerd" splitsen we op `soort_bestuur` van het schoolbestuur: code 3 = Provincie,
 * code 4 = Gemeente. Andere officiële besturen (OCMW, intercommunale, Vlaamse Gemeenschap)
 * houden het algemene label — niet gokken dat die gemeentelijk zijn.
 *
 * Bewust "Gemeentelijk" en niet "Stedelijk": van de 63 gemeentelijke vestigingen in de provincie
 * liggen er 13 in Brasschaat, Duffel, Kalmthout, Nijlen en Zandhoven. Dat zijn geen steden.
 */
function mapNet(omschrijving: string | undefined, soortBestuur: SoortBestuur | null): Net {
  switch (omschrijving) {
    case 'Gemeenschapsonderwijs':
      return 'GO!'
    case 'Officieel gesubsidieerd onderwijs':
      if (soortBestuur === 'Provincie') return 'Provinciaal'
      if (soortBestuur === 'Gemeente') return 'Gemeentelijk'
      return 'Officieel gesubsidieerd'
    case 'Vrij gesubsidieerd onderwijs':
      return 'Vrij gesubsidieerd'
    default:
      return 'Onafhankelijk'
  }
}

const SOORT_BESTUUR: Record<string, SoortBestuur> = {
  '1': 'GO!',
  '2': 'Vrij',
  '3': 'Provincie',
  '4': 'Gemeente',
  '5': 'OCMW',
  '6': 'Intercommunale',
  '7': 'Vlaamse Gemeenschap',
  '9': 'Andere',
}

/** Codes uit `administratievegroep_finaliteit`. E en 7E zijn expliciet "niet van toepassing". */
const FINALITEIT: Record<string, Finaliteit> = {
  DO: 'Doorstroom',
  DU: 'Dubbel',
  A: 'Arbeidsmarkt',
  E: null,
  '7E': null,
}

function normalizeWebsite(raw: string | undefined): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function orNull(raw: string | undefined): string | null {
  const trimmed = raw?.trim()
  return trimmed ? trimmed : null
}

// --- Fallback --------------------------------------------------------------------------

/** De eerder gegenereerde (en gecommitte) dataset, of null als die er niet is. */
async function bestaandeDataset(): Promise<Campus[] | null> {
  try {
    const inhoud = await readFile(path.join(OUTPUT_DIR, 'vestigingen.json'), 'utf-8')
    const campussen = JSON.parse(inhoud) as Campus[]
    return campussen.length > 0 ? campussen : null
  } catch {
    return null
  }
}

/**
 * Vangnet tegen stilzwijgend databederf. Dit script draait ook ongesuperviseerd (GitHub
 * Action), en een API die plots de helft minder teruggeeft — gewijzigde filterparam,
 * halve storing, gewijzigde scope — mag niet zomaar over de goede dataset heen gecommit
 * worden. Krimpt de dataset meer dan MAX_KRIMP, dan stoppen we en moet een mens kijken.
 * Groei is nooit verdacht; enkel krimp.
 */
const MAX_KRIMP = 0.15

async function controleerOmvang(nieuweCampussen: Campus[]): Promise<void> {
  const oud = await bestaandeDataset()
  if (!oud) return

  const oudeVestigingen = oud.reduce((n, c) => n + c.scholen.length, 0)
  const nieuweVestigingen = nieuweCampussen.reduce((n, c) => n + c.scholen.length, 0)
  const krimp = (oudeVestigingen - nieuweVestigingen) / oudeVestigingen

  if (krimp > MAX_KRIMP) {
    throw new Error(
      `Datasetcontrole mislukt: ${nieuweVestigingen} vestigingen tegenover ${oudeVestigingen} ` +
        `in de vorige dataset — een krimp van ${(krimp * 100).toFixed(1)}% (drempel ` +
        `${(MAX_KRIMP * 100).toFixed(0)}%).\n` +
        `Dat kan echt zijn (scholen sluiten), maar het is vaker een gewijzigde API of een ` +
        `halve storing. Controleer eerst handmatig; draai daarna met --force om de nieuwe ` +
        `dataset toch weg te schrijven.`,
    )
  }
  const verschil = nieuweVestigingen - oudeVestigingen
  if (verschil !== 0) {
    console.log(`Verschil met de vorige dataset: ${verschil > 0 ? '+' : ''}${verschil} vestigingen.`)
  }
}

// --- Hoofdprogramma --------------------------------------------------------------------

async function bouwDataset() {
  console.log('Ophalen via de API van Onderwijs en Vorming...')

  const [locaties, instellingen, besturen, ingericht, catalogus, kenmerken] = await Promise.all([
    haalAlles<any>('vestigingsplaatsen (311)', EP.locaties, {
      filter_instellingslocatie_hoofdstructuur: HOOFDSTRUCTUUR_VOLTIJDS_SO,
    }),
    haalAlles<any>('instellingen SO', EP.instellingen, { filter_instelling_niveau: 'SO' }),
    haalAlles<any>('schoolbesturen', EP.instellingen, { filter_instelling_type: TYPE_BESTUUR }),
    haalAlles<any>('ingericht aanbod', EP.ingerichtAanbod),
    haalAlles<any>('richtingencatalogus', EP.catalogus),
    haalLeerlingenkenmerken(),
  ])

  const instellingPerNr = new Map<number, any>(instellingen.map((i) => [i.instelling_nummer, i]))
  const bestuurPerNr = new Map<number, any>(besturen.map((b) => [b.instelling_nummer, b]))
  const richtingPerCode = new Map<number, any>(catalogus.map((c) => [c.administratievegroep_code, c]))

  // De API kent geen provinciefilter — dat doen we hier. Geverifieerd: het provincieveld
  // staat op de vestigingsplaats zelf, niet enkel op de hoofdzetel.
  const antwerpen = locaties.filter((l) => l.instellingslocatie_provincie === PROVINCIE)
  console.log(`\nVestigingsplaatsen in ${PROVINCIE}: ${antwerpen.length} (van ${locaties.length} in Vlaanderen/Brussel)`)

  // Aanbod per (school, vestiging). Dit endpoint geeft enkel de kóppeling; de inhoudelijke
  // velden (finaliteit, graad, studiegebied) komen uit de catalogus, join op de code.
  const aanbodPerVestiging = new Map<string, Richting[]>()
  let schooljaarAanbod: number | null = null
  let zonderCatalogus = 0
  for (const rij of ingericht) {
    const sleutel = `${rij.instelling_nummer}-${rij.instellingslocatie_vestigingsnummer}`
    const cat = richtingPerCode.get(rij.administratievegroep_code)
    if (!cat) {
      zonderCatalogus++
      continue
    }
    schooljaarAanbod ??= rij.schooljaar ?? null
    const finaliteitCode = cat.administratievegroep_finaliteit?.code
    const lijst = aanbodPerVestiging.get(sleutel) ?? []
    lijst.push({
      code: rij.administratievegroep_code,
      naam: rij.administratievegroep_omschrijving,
      graad: cat.administratievegroep_graad?.omschrijving ?? null,
      finaliteit: finaliteitCode ? (FINALITEIT[finaliteitCode] ?? null) : null,
      onderwijsvorm: cat.administratievegroep_onderwijsvorm?.code ?? null,
      studiegebied: cat.administratievegroep_studiegebied?.omschrijving ?? null,
      duaal: cat.administratievegroep_duaal === true,
      inschrijvingenOpen: rij.inschrijvingen === true,
    })
    aanbodPerVestiging.set(sleutel, lijst)
  }
  if (zonderCatalogus > 0) {
    console.warn(`Let op: ${zonderCatalogus} aanbodrijen verwijzen naar een richtingcode die niet in de catalogus staat — overgeslagen.`)
  }

  // Groepeer vestigingsplaatsen op fysiek adres tot één campus. Meerdere apart geregistreerde
  // scholen (elk een eigen schoolnummer) delen vaak hetzelfde gebouw — dat als losse kaartjes
  // tonen is pure ruis voor wie een school zoekt. Zie CLAUDE.md.
  const campussenPerAdres = new Map<string, Campus>()
  let zonderCoordinaten = 0
  let zonderInstelling = 0
  let zonderAanbod = 0

  for (const loc of antwerpen) {
    const inst = instellingPerNr.get(loc.instelling_nummer)
    if (!inst) {
      zonderInstelling++
      continue
    }
    const bestuur = bestuurPerNr.get(inst.instelling_bestuur?.instellingsnummer)
    const heeftCoordinaten = loc.gps_breedtegraad != null && loc.gps_lengtegraad != null
    if (!heeftCoordinaten) zonderCoordinaten++

    const soortBestuur = SOORT_BESTUUR[bestuur?.instelling_soort_bestuur?.code] ?? null
    const vpl = String(loc.instellingslocatie_vestigingsnummer)
    const richtingen = aanbodPerVestiging.get(`${loc.instelling_nummer}-${vpl}`) ?? []
    if (richtingen.length === 0) zonderAanbod++

    const school: SchoolOpCampus = {
      id: `${loc.instelling_nummer}-${vpl}`,
      schoolnummer: String(loc.instelling_nummer),
      internVplnummer: vpl,
      naam: inst.instelling_naam_volledig ?? inst.instelling_naam,
      isHoofdzetel: inst.instelling_hoofdzetel_vestigingsnr === loc.instellingslocatie_vestigingsnummer,
      net: mapNet(inst.instelling_net?.omschrijving, soortBestuur),
      soortBestuur,
      levensbeschouwing: orNull(inst.instelling_levensbeschouwing?.omschrijving),
      // Locatie-eigen telefoonnummer heeft voorrang; anders dat van de instelling.
      telefoon: orNull(loc.instellingslocatie_telefoonnummers?.[0]) ?? orNull(inst.instelling_telefoon),
      email: orNull(inst.instelling_email),
      website: normalizeWebsite(inst.instelling_website),
      linkFiche: `${FICHE_BASE_URL}?sn=${loc.instelling_nummer}`,
      statusErkenning: inst.instelling_status_erkenning?.code === 'E' ? 'E' : 'S',
      scholengemeenschap: inst.instelling_scholengemeenschap?.instellingsnummer
        ? String(inst.instelling_scholengemeenschap.instellingsnummer)
        : null,
      richtingen: richtingen.sort((a, b) => a.naam.localeCompare(b.naam, 'nl')),
      // Join op schoolnummer, nooit op adres: de publicatie draagt het adres van de instelling,
      // dat bij 86 van de 269 gematchte scholen afwijkt van het campusadres dat wij tonen.
      leerlingenkenmerken: kenmerken?.perSchoolnummer.get(String(loc.instelling_nummer)) ?? null,
      kostprijs: null,
      vervoer: null,
    }

    // Busnummer telt niet mee in de sleutel: een andere ingang van hetzelfde gebouw is
    // nog steeds dezelfde campus.
    const straat = loc.instellingslocatie_straatnaam ?? ''
    const huisnummer = loc.instellingslocatie_huisnummer ?? ''
    const postcode = loc.instellingslocatie_postcode ?? ''
    const adresKey = `${postcode}|${straat}|${huisnummer}`.toLowerCase()

    let campus = campussenPerAdres.get(adresKey)
    if (!campus) {
      campus = {
        id: adresKey,
        straat,
        huisnummer,
        postcode,
        gemeente: loc.instellingslocatie_gemeente ?? '',
        niscode: String(loc.instellingslocatie_gemeente_nis ?? ''),
        lat: heeftCoordinaten ? loc.gps_breedtegraad : null,
        lon: heeftCoordinaten ? loc.gps_lengtegraad : null,
        scholen: [],
      }
      campussenPerAdres.set(adresKey, campus)
    }
    campus.scholen.push(school)
  }

  const campussen = [...campussenPerAdres.values()].sort((a, b) =>
    a.gemeente.localeCompare(b.gemeente, 'nl') || a.straat.localeCompare(b.straat, 'nl'),
  )

  if (zonderInstelling > 0) {
    console.warn(`Let op: ${zonderInstelling} vestigingsplaats(en) zonder bijhorende instelling in de instellingen-lijst — overgeslagen.`)
  }
  if (zonderCoordinaten > 0) {
    console.warn(`Let op: ${zonderCoordinaten} vestiging(en) zonder GPS-coördinaten. Die krijgen lat/lon = null en vallen weg op de kaart en in de afstandsberekening.`)
  }

  const aantalScholen = campussen.reduce((n, c) => n + c.scholen.length, 0)
  const aantalRichtingen = campussen.reduce(
    (n, c) => n + c.scholen.reduce((m, s) => m + s.richtingen.length, 0),
    0,
  )
  const gedeeldeAdressen = campussen.filter((c) => c.scholen.length > 1).length

  // Tel per school, niet per vestiging: een school met drie campussen deelt één cijfer.
  const eigenSchoolnummers = new Set<string>()
  const schoolnummersMetCijfers = new Set<string>()
  for (const campus of campussen) {
    for (const school of campus.scholen) {
      eigenSchoolnummers.add(school.schoolnummer)
      if (school.leerlingenkenmerken) schoolnummersMetCijfers.add(school.schoolnummer)
    }
  }

  console.log(
    `\n${campussen.length} campussen (adressen) met ${aantalScholen} vestigingen, waarvan ` +
      `${gedeeldeAdressen} adressen met meer dan 1 apart geregistreerde school.`,
  )
  console.log(`${aantalRichtingen} richtingen gekoppeld (schooljaar ${schooljaarAanbod}); ${zonderAanbod} vestiging(en) zonder aanbod.`)
  if (kenmerken) {
    console.log(
      `Leerlingenkenmerken (${kenmerken.schooljaar}): ${schoolnummersMetCijfers.size} van ` +
        `${eigenSchoolnummers.size} scholen gekoppeld.`,
    )
  } else {
    // Geen harde fout: de cijfers zijn een aanvulling. Wel luid, want stil verdwijnen is
    // precies wat je bij een ongesuperviseerde run niet wil.
    console.warn('Let op: geen leerlingenkenmerken in deze dataset — het blok valt weg in de app.')
  }

  const meta: DatasetMeta = {
    opgehaaldOp: new Date().toISOString(),
    bron: [BRON_PAGINA, EP.locaties, EP.instellingen, EP.ingerichtAanbod, EP.catalogus],
    schooljaarAanbod,
    aantalVestigingenTotaal: locaties.length,
    aantalVestigingenAntwerpen: aantalScholen,
    aantalCampussenAntwerpen: campussen.length,
    aantalRichtingen,
    leerlingenkenmerken: kenmerken
      ? {
          schooljaar: kenmerken.schooljaar,
          teldatum: kenmerken.teldatum,
          bron: kenmerken.bron,
          aantalScholenMetCijfers: schoolnummersMetCijfers.size,
        }
      : null,
  }

  return { campussen, meta }
}

async function main() {
  // --force slaat de omvangcontrole over. Bewust een expliciete handeling: de controle
  // bestaat net om een ongesuperviseerde run te stoppen.
  const force = process.argv.includes('--force')

  let resultaat: Awaited<ReturnType<typeof bouwDataset>>
  try {
    resultaat = await bouwDataset()
  } catch (err) {
    // Geen verse data. Ligt er een gecommitte dataset, dan bouwen we daarmee verder: een
    // hikkende API mag geen deploy tegenhouden. De footer toont de ophaaldatum uit meta.json,
    // dus verouderde data blijft zichtbaar voor de bezoeker.
    if (await bestaandeDataset()) {
      console.warn(
        `\nLet op: ophalen mislukt (${err instanceof Error ? err.message : err}).\n` +
          `Er ligt wel een eerder gegenereerde dataset in ${OUTPUT_DIR} — die blijft ongewijzigd\n` +
          `en de build gaat door. De datumstempel in de footer toont dus de vórige ophaaldatum.\n`,
      )
      return
    }
    throw new Error(
      `Ophalen mislukt én er is geen eerder gegenereerde dataset om op terug te vallen.\n` +
        `Oorzaak: ${err instanceof Error ? err.message : err}`,
    )
  }

  if (force) {
    console.warn('--force: omvangcontrole overgeslagen.')
  } else {
    await controleerOmvang(resultaat.campussen)
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(
    path.join(OUTPUT_DIR, 'vestigingen.json'),
    JSON.stringify(resultaat.campussen, null, 2),
    'utf-8',
  )
  await writeFile(path.join(OUTPUT_DIR, 'meta.json'), JSON.stringify(resultaat.meta, null, 2), 'utf-8')
  console.log(`\nWeggeschreven naar ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
