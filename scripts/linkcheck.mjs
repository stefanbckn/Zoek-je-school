/**
 * Controleert of alle externe links in de repo nog werken.
 *
 * Draai met: node scripts/linkcheck.mjs        (of --strict, zie onderaan)
 *
 * Waarom dit bestaat: overheidspagina's verhuizen. Op 04/09/2026 bleek een pagina over de
 * modernisering van het secundair onderwijs een 301 te geven naar een algemene
 * professionalspagina — technisch een geldig antwoord, inhoudelijk waardeloos. Zoiets merk je
 * nooit uit jezelf, want niemand klikt zijn eigen footer aan.
 *
 * **Dit script past niets aan, en dat is met opzet.** Een dode link vervangen vraagt precies
 * het oordeel dat de projectregel "nooit gokken" beschermt: het doel is de juiste pagina, niet
 * een adres dat toevallig 200 teruggeeft. Het script zegt wat er stuk is; wat ervoor in de
 * plaats komt, beslist een mens.
 *
 * Vier uitkomsten, en het onderscheid tussen de laatste twee is de kern van het nut:
 *   ok          antwoordt op het adres dat in de code staat
 *   verhuisd    antwoordt, maar op een ánder adres — het eindadres hoort in de code
 *   geblokkeerd 401/403/429: de server weigert óns, niet de pagina (API-keys, bot-filters)
 *   dood        4xx, 5xx, time-out of een netwerkfout
 *
 * Alleen "dood" laat het script falen. Zou "geblokkeerd" dat ook doen, dan gaat het elk
 * kwartaal krijsen over de API-endpoints die een key vragen, en dan kijkt niemand er nog naar.
 *
 * **Exitcodes: 0 = niets aan de hand, 2 = bevindingen, 1 = het script zelf is stukgelopen.**
 * Bevindingen krijgen bewust een eigen code en niet de gebruikelijke 1. De GitHub Action moet
 * die twee uit elkaar kunnen houden: bij bevindingen hoort een issue, bij een crash hoort een
 * rode run. Met één code voor allebei zou een kapot script zich voordoen als een dode link.
 */

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const WORTEL = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Waar gezocht wordt. Een pad kan een bestand of een map zijn; mappen gaan recursief. */
const BRONNEN = [
  'index.html',
  'uitleg',
  'src',
  'scripts',
  'public/robots.txt',
  'public/sitemap.xml',
  'docs',
  '.github',
  'README.md',
  'CLAUDE.md',
  'CHANGELOG.md',
  'ROADMAP.md',
  'netlify.toml',
]

/** Nooit binnengaan. dist en node_modules bevatten gegenereerde en vreemde links. */
const OVERSLAAN_MAPPEN = new Set(['node_modules', 'dist', '.git', 'data'])

/** Alleen tekstbestanden waar een link in kán staan. */
const EXTENSIES = /\.(html|css|ts|tsx|js|mjs|md|json|xml|txt|toml|yml|yaml)$/

/**
 * Adressen die niet te controleren zijn en ook niet horen te falen.
 * - localhost: draait hier niet tijdens een CI-run.
 * - example/placeholder: staan er als voorbeeld, niet als link.
 * - de XML-namespace van sitemaps.org is een identificatie, geen pagina.
 */
const NEGEREN = [
  /^https?:\/\/localhost/,
  /^https?:\/\/127\.0\.0\.1/,
  /example\.(com|org)/,
  /^http:\/\/www\.sitemaps\.org\/schemas\//,
]

/**
 * API-endpoints, geen pagina's. Deze horen hier niet omdat ze stuk zijn, maar omdat een kale
 * GET erop niets bewijst: zonder parameters en zonder key antwoorden ze met 400, 401 of 404,
 * en dat is hun correcte gedrag. Ze zouden dus voor altijd rood staan.
 *
 * Blijft de vraag of ze nog bestaan. Dat bewaakt `npm run fetch-data`, dat er echte calls op
 * doet met echte parameters; die faalt luid als een endpoint verdwijnt. Twee keer half
 * controleren is slechter dan één keer goed.
 */
const API_ENDPOINTS = [
  /^https:\/\/api\.delijn\.be\//,
  /^https:\/\/api\.transitous\.org\//,
  /^https:\/\/geo\.api\.vlaanderen\.be\//,
  /^https:\/\/onderwijs\.api\.vlaanderen\.be\//,
  /^https:\/\/data-onderwijs\.vlaanderen\.be\/documenten\/bestanden/,
]

// Puur ASCII, en dat is geen stijlkwestie: een HTTP-header is een ByteString, dus een teken
// boven 255 (een kastlijntje bijvoorbeeld) laat fetch struikelen nog voor er een verbinding is.
// Elke controle faalt dan met een netwerkfout die op een dode link lijkt. Zelf ingelopen.
const UA = 'zoekjeschool-linkcheck/1 (+https://zoekjeschool.be; info@zoekjeschool.be)'

const TIMEOUT_MS = 20000
const GELIJKTIJDIG = 6

async function* bestanden(pad) {
  const vol = join(WORTEL, pad)
  let items
  try {
    items = await readdir(vol, { withFileTypes: true })
  } catch {
    // Geen map: dan is het een bestand (of het bestaat niet, en dat merken we bij het lezen).
    yield pad
    return
  }
  for (const item of items) {
    if (item.isDirectory()) {
      if (OVERSLAAN_MAPPEN.has(item.name)) continue
      yield* bestanden(join(pad, item.name))
    } else if (EXTENSIES.test(item.name)) {
      yield join(pad, item.name)
    }
  }
}

/**
 * Haalt URL's uit tekst. De afsluitende leestekens moeten eraf: in lopende tekst eindigt een
 * link vaak op een punt of een haakje dat er niet bij hoort, en in HTML op een aanhalingsteken.
 */
function urlsUit(tekst) {
  const gevonden = new Set()
  for (const ruw of tekst.match(/https?:\/\/[^\s"'`<>()[\]{},;\\]+/g) ?? []) {
    const url = ruw.replace(/[.,:;!?)\]}>]+$/, '')
    // Geen letterlijk adres maar een patroon: een sjabloonvariabele die pas tijdens het draaien
    // ingevuld wordt (`https://${host}/...`, waar de regex hierboven afkapt op de accolade), of
    // een jokerteken zoals de `https://*.tile.openstreetmap.org` uit de CSP in netlify.toml.
    if (/[${*]/.test(url) || url.includes('{{')) continue
    if (NEGEREN.some((r) => r.test(url))) continue
    if (API_ENDPOINTS.some((r) => r.test(url))) continue
    gevonden.add(url)
  }
  return gevonden
}

/**
 * Zijn dit hetzelfde adres, praktisch gezien?
 *
 * Drie verschillen tellen niet mee, en die kwamen alle drie uit een echte run:
 *   - een fragment (#/directions/...). Dat wordt nooit naar de server gestuurd, dus het kan
 *     onmogelijk in het antwoord terugkomen. Meetellen betekent elke link met een anker als
 *     "verhuisd" melden.
 *   - een lege pad-component: example.com?q= tegenover example.com/?q= is hetzelfde adres.
 *     (Voorbeelden hier bewust op example.com: dit script controleert ook zichzelf.)
 *   - een slash op het einde.
 * Wat overblijft is een echte verhuizing, en dan is het eindadres wat in de code hoort.
 */
function zelfdeAdres(a, b) {
  const normaliseer = (u) => {
    const url = new URL(u)
    return url.origin + url.pathname.replace(/\/$/, '') + url.search
  }
  try {
    return normaliseer(a) === normaliseer(b)
  } catch {
    return a === b
  }
}

async function controleer(url) {
  const opties = {
    redirect: 'follow',
    headers: { 'user-agent': UA, accept: '*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }
  let res
  try {
    res = await fetch(url, { ...opties, method: 'HEAD' })
    // Niet elke server begrijpt HEAD. 405 en 501 zijn de nette weigering, maar in de praktijk
    // antwoorden sommige met 403 of 404 op HEAD terwijl GET gewoon werkt. Bij alles wat geen
    // 2xx is dus opnieuw proberen met GET, dat is de enige betrouwbare uitslag.
    if (!res.ok) res = await fetch(url, { ...opties, method: 'GET' })
  } catch (err) {
    try {
      res = await fetch(url, { ...opties, method: 'GET' })
    } catch (err2) {
      const reden = err2.name === 'TimeoutError' ? `time-out na ${TIMEOUT_MS / 1000}s` : err2.message
      return { status: 'dood', detail: reden, oorspronkelijk: err.message }
    }
  }

  if ([401, 403, 429].includes(res.status)) {
    return { status: 'geblokkeerd', detail: `HTTP ${res.status}` }
  }
  if (!res.ok) {
    return { status: 'dood', detail: `HTTP ${res.status}` }
  }
  // `res.url` is het adres waar we ná alle redirects uitkwamen. Alleen een echt ánder adres
  // telt als verhuizing; zie `zelfdeAdres` voor wat "hetzelfde" hier betekent.
  const eind = res.url
  if (eind && !zelfdeAdres(url, eind)) {
    return { status: 'verhuisd', detail: eind }
  }
  return { status: 'ok', detail: `HTTP ${res.status}` }
}

/** Draait `taken` met een vaste gelijktijdigheid, zodat we geen enkele server overrompelen. */
async function inGroepjes(items, n, doe) {
  const rij = [...items]
  const werkers = Array.from({ length: Math.min(n, rij.length) }, async () => {
    while (rij.length > 0) await doe(rij.shift())
  })
  await Promise.all(werkers)
}

const strict = process.argv.includes('--strict')

/** url -> Set van bestanden waarin hij voorkomt. */
const vindplaatsen = new Map()
for (const bron of BRONNEN) {
  for await (const bestand of bestanden(bron)) {
    let inhoud
    try {
      inhoud = await readFile(join(WORTEL, bestand), 'utf8')
    } catch {
      console.warn(`  (overgeslagen, niet leesbaar: ${bestand})`)
      continue
    }
    for (const url of urlsUit(inhoud)) {
      if (!vindplaatsen.has(url)) vindplaatsen.set(url, new Set())
      vindplaatsen.get(url).add(relative(WORTEL, join(WORTEL, bestand)))
    }
  }
}

const urls = [...vindplaatsen.keys()].sort()
console.log(`${urls.length} unieke adressen gevonden. Controleren...\n`)

const uitslagen = new Map()
let klaar = 0
await inGroepjes(urls, GELIJKTIJDIG, async (url) => {
  uitslagen.set(url, await controleer(url))
  klaar++
  if (klaar % 10 === 0) console.log(`  ${klaar}/${urls.length}`)
})

const per = { dood: [], verhuisd: [], geblokkeerd: [], ok: [] }
for (const url of urls) per[uitslagen.get(url).status].push(url)

function toon(titel, lijst, metVindplaats) {
  if (lijst.length === 0) return
  console.log(`\n${titel} (${lijst.length})`)
  for (const url of lijst) {
    console.log(`  ${url}`)
    console.log(`    ${uitslagen.get(url).detail}`)
    if (metVindplaats) console.log(`    in: ${[...vindplaatsen.get(url)].join(', ')}`)
  }
}

toon('DOOD — vervang deze, maar zoek eerst de juiste pagina', per.dood, true)
toon('VERHUISD — zet het eindadres in de code', per.verhuisd, true)
toon('GEBLOKKEERD — de server weigert ons, niet de pagina', per.geblokkeerd, false)

console.log(
  `\nSamenvatting: ${per.ok.length} ok, ${per.verhuisd.length} verhuisd, ` +
    `${per.geblokkeerd.length} geblokkeerd, ${per.dood.length} dood.`,
)

// Verhuisd laat de run standaard niet falen: een redirect wérkt, hij is alleen slordig om te
// laten staan. Met --strict telt hij wel mee, voor wie de repo helemaal schoon wil.
const problemen = per.dood.length + (strict ? per.verhuisd.length : 0)
console.log(problemen === 0 ? 'Alles in orde.' : `${problemen} adres(sen) om na te kijken.`)
process.exit(problemen === 0 ? 0 : 2)
