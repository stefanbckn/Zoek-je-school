/**
 * Maandelijks onderhoudsrapport: wat er aan de techniek onder de site verouderd of kwetsbaar is.
 *
 * Draai met: node scripts/onderhoud.mjs   (na npm ci: npm audit en npm outdated hebben
 * node_modules nodig). Schrijft Markdown naar stdout; de GitHub Action maakt er een issue van.
 *
 * Waarom dit bestaat: de Dependabot-alerts dekken bekende lekken in npm-pakketten, maar niet hoe
 * ver de pakketten achterop raken, niet de Node-versie die op Netlify en in de workflows draait,
 * en niet de versies van de GitHub Actions zelf. Een einddatum van Node valt nooit vanzelf op tot
 * hij voorbij is. Versie-updates van Dependabot staan bewust uit (zie ROADMAP.md): een stroom
 * bot-PR's wordt op den duur blind gemerged. Eén rapport per maand geeft het overzicht, en een
 * mens beslist wat er in de volgende versie meegaat.
 *
 * **Dit script past niets aan.** Net als de linkcheck zegt het enkel wat er te doen is.
 *
 * Wat het nakijkt:
 *   - npm audit over alle dependencies, ook de devDependencies (die draaien bij de build)
 *   - open Dependabot-alerts, als de token ze mag lezen
 *   - verouderde pakketten, gesplitst in "kan zo mee" (patch/minor) en "vraagt werk" (major)
 *   - de Node-versie uit netlify.toml: dezelfde in elke workflow, en hoe ver van de einddatum
 *   - de GitHub Actions in .github/workflows: draait er een oudere major dan de nieuwste?
 *
 * **Exitcodes: 0 = niets te doen, 2 = bevindingen, 1 = het script zelf is stukgelopen.** Zelfde
 * afspraak als scripts/linkcheck.mjs, en om dezelfde reden: bij bevindingen hoort een issue, bij
 * een crash een rode run.
 */

import { execFile } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const WORTEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = 'stefanbckn/Zoek-je-school'

/** Zoveel dagen voor de einddatum van Node begint het rapport te waarschuwen. */
const NODE_WAARSCHUWING_DAGEN = 183

const exec = promisify(execFile)
const vandaag = new Date()

/**
 * npm audit en npm outdated eindigen met exitcode 1 zodra ze iets vinden. Dat is hier geen fout:
 * de JSON op stdout is wat telt. Enkel zonder bruikbare JSON is er echt iets mis.
 */
async function npmJson(args) {
  try {
    const { stdout } = await exec('npm', args, { cwd: WORTEL, maxBuffer: 20 * 1024 * 1024 })
    return JSON.parse(stdout || '{}')
  } catch (fout) {
    if (fout.stdout) return JSON.parse(fout.stdout)
    throw fout
  }
}

async function githubApi(pad) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'zoekjeschool-onderhoud' }
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN
  if (token) headers.authorization = `Bearer ${token}`
  return fetch(`https://api.github.com/${pad}`, { headers })
}

const major = (versie) => Number(String(versie).replace(/^[^\d]*/, '').split('.')[0])
const datum = (iso) => new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })

const secties = []
let bevindingen = 0

// --- 1. npm audit ---------------------------------------------------------------------------

{
  const audit = await npmJson(['audit', '--json'])
  const lekken = Object.values(audit.vulnerabilities ?? {})
  const regels = []
  if (lekken.length === 0) {
    regels.push('Geen bekende lekken in de dependencies.')
  } else {
    bevindingen += lekken.length
    regels.push('| Pakket | Ernst | Rechtstreeks? | Oplossing |', '| --- | --- | --- | --- |')
    for (const l of lekken.sort((a, b) => a.name.localeCompare(b.name))) {
      const oplossing =
        l.fixAvailable === true ? '`npm audit fix`'
        : l.fixAvailable ? `${l.fixAvailable.name} ${l.fixAvailable.version}${l.fixAvailable.isSemVerMajor ? ' (major)' : ''}`
        : 'nog geen'
      regels.push(`| ${l.name} | ${l.severity} | ${l.isDirect ? 'ja' : 'nee'} | ${oplossing} |`)
    }
    regels.push(
      '',
      '"Ernst" is die van het lek in het algemeen, niet voor deze site: een pakket dat enkel bij de build draait, raakt geen bezoeker.',
    )
  }
  secties.push(['Bekende lekken (npm audit)', regels])
}

// --- 2. Dependabot-alerts -------------------------------------------------------------------

{
  const regels = []
  const antwoord = await githubApi(`repos/${REPO}/dependabot/alerts?state=open&per_page=100`)
  if (antwoord.ok) {
    const alerts = await antwoord.json()
    if (alerts.length === 0) {
      regels.push('Geen open alerts.')
    } else {
      bevindingen += alerts.length
      for (const a of alerts) {
        regels.push(`- [#${a.number}](${a.html_url}) ${a.dependency.package.name}: ${a.security_advisory.summary} (${a.security_advisory.severity})`)
      }
    }
  } else {
    // Geen bevinding: wat npm audit hierboven vindt, komt uit dezelfde advisorydatabank van
    // GitHub. Dit is enkel de lijst zoals GitHub ze zelf bijhoudt.
    regels.push(
      `Niet te lezen met deze token (HTTP ${antwoord.status}). De lijst staat op [GitHub](https://github.com/${REPO}/security/dependabot); npm audit hierboven gebruikt dezelfde databank.`,
    )
  }
  secties.push(['Dependabot-alerts', regels])
}

// --- 3. Verouderde pakketten ----------------------------------------------------------------

{
  const verouderd = await npmJson(['outdated', '--json'])
  const zoMee = []
  const werk = []
  for (const [naam, info] of Object.entries(verouderd).sort(([a], [b]) => a.localeCompare(b))) {
    if (!info.current) continue // niet geïnstalleerd: dan is npm ci niet gedraaid
    const regel = `| ${naam} | ${info.current} | ${info.latest} |`
    if (major(info.latest) > major(info.current)) werk.push(regel)
    else zoMee.push(regel)
  }
  const regels = []
  if (zoMee.length === 0 && werk.length === 0) {
    regels.push('Alle pakketten staan op de nieuwste versie.')
  }
  if (zoMee.length > 0) {
    bevindingen += zoMee.length
    regels.push(
      '**Kan zo mee** (patch of minor, hoort volgens SemVer niets te breken):',
      '',
      '| Pakket | Nu | Nieuwste |',
      '| --- | --- | --- |',
      ...zoMee,
      '',
    )
  }
  if (werk.length > 0) {
    bevindingen += werk.length
    regels.push(
      '**Vraagt werk** (nieuwe major: lees de release notes voor je optilt):',
      '',
      '| Pakket | Nu | Nieuwste |',
      '| --- | --- | --- |',
      ...werk,
      '',
    )
  }
  if (verouderd['@types/node']) {
    regels.push('`@types/node` volgt de Node-versie die we draaien (zie hieronder), niet de nieuwste major.')
  }
  secties.push(['Verouderde pakketten (npm outdated)', regels])
}

// --- 4. Node ----------------------------------------------------------------------------------

const workflowMap = join(WORTEL, '.github', 'workflows')
const workflows = await Promise.all(
  (await readdir(workflowMap))
    .filter((f) => /\.ya?ml$/.test(f))
    .map(async (f) => [f, await readFile(join(workflowMap, f), 'utf8')]),
)

{
  const regels = []
  const toml = await readFile(join(WORTEL, 'netlify.toml'), 'utf8')
  const netlifyNode = toml.match(/NODE_VERSION\s*=\s*"(\d+)/)?.[1]
  if (!netlifyNode) throw new Error('NODE_VERSION niet gevonden in netlify.toml')

  const afwijkend = []
  for (const [f, tekst] of workflows) {
    for (const m of tekst.matchAll(/node-version:\s*['"]?(\d+)/g)) {
      if (m[1] !== netlifyNode) afwijkend.push(`${f} (Node ${m[1]})`)
    }
  }
  if (afwijkend.length > 0) {
    bevindingen += afwijkend.length
    regels.push(`**Wijkt af van netlify.toml (Node ${netlifyNode}):** ${afwijkend.join(', ')}. Dan kan CI groen zijn terwijl de deploy breekt.`, '')
  }

  // https://endoflife.date/docs/api: dezelfde data als op de pagina van Node zelf, maar als JSON.
  const antwoord = await fetch('https://endoflife.date/api/nodejs.json')
  if (!antwoord.ok) throw new Error(`endoflife.date gaf HTTP ${antwoord.status}`)
  const cycli = await antwoord.json()
  const huidig = cycli.find((c) => c.cycle === netlifyNode)
  if (!huidig) throw new Error(`Node ${netlifyNode} niet gevonden bij endoflife.date`)

  const eol = new Date(huidig.eol)
  const dagen = Math.round((eol - vandaag) / 86_400_000)
  const nieuwsteLts = cycli.filter((c) => c.lts && new Date(c.lts) <= vandaag).map((c) => c.cycle).sort((a, b) => b - a)[0]

  if (dagen < 0) {
    bevindingen++
    regels.push(`**Node ${netlifyNode} krijgt sinds ${datum(huidig.eol)} geen beveiligingsupdates meer.** Overstappen op Node ${nieuwsteLts} (LTS).`)
  } else if (dagen <= NODE_WAARSCHUWING_DAGEN) {
    bevindingen++
    regels.push(`**Node ${netlifyNode} krijgt vanaf ${datum(huidig.eol)} geen beveiligingsupdates meer** (nog ${dagen} dagen). Plan de overstap naar Node ${nieuwsteLts} (LTS).`)
  } else {
    regels.push(`Node ${netlifyNode} krijgt beveiligingsupdates tot ${datum(huidig.eol)}.`)
  }
  if (nieuwsteLts && Number(nieuwsteLts) > Number(netlifyNode)) {
    regels.push('', `Nieuwste LTS: Node ${nieuwsteLts}. Overstappen betekent: \`NODE_VERSION\` in netlify.toml, \`node-version\` in elke workflow en \`@types/node\` samen optillen.`)
  }
  secties.push(['Node', regels])
}

// --- 5. GitHub Actions ------------------------------------------------------------------------

{
  const gebruik = new Map() // actie -> Set van versies
  for (const [, tekst] of workflows) {
    for (const m of tekst.matchAll(/uses:\s*([\w.-]+\/[\w.-]+)@v?(\d+)/g)) {
      if (!gebruik.has(m[1])) gebruik.set(m[1], new Set())
      gebruik.get(m[1]).add(Number(m[2]))
    }
  }
  const regels = []
  const achter = []
  for (const [actie, versies] of [...gebruik].sort(([a], [b]) => a.localeCompare(b))) {
    const antwoord = await githubApi(`repos/${actie}/releases/latest`)
    if (!antwoord.ok) throw new Error(`nieuwste release van ${actie}: HTTP ${antwoord.status}`)
    const nieuwste = major((await antwoord.json()).tag_name)
    const oud = [...versies].filter((v) => v < nieuwste)
    if (oud.length > 0) achter.push(`| ${actie} | v${oud.join(', v')} | v${nieuwste} |`)
  }
  if (achter.length === 0) {
    regels.push(`Alle ${gebruik.size} actions draaien op hun nieuwste major.`)
  } else {
    bevindingen += achter.length
    regels.push('| Action | Nu | Nieuwste |', '| --- | --- | --- |', ...achter)
  }
  secties.push(['GitHub Actions', regels])
}

// --- Rapport ----------------------------------------------------------------------------------

console.log(`# Onderhoudsrapport ${vandaag.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}\n`)
console.log(
  bevindingen === 0
    ? 'Niets te doen: alles is bij.\n'
    : 'Wat er te doen is. Kies zelf wat in de volgende versie meegaat. Updates zonder iets nieuws voor de bezoeker worden een PATCH.\n',
)
for (const [titel, regels] of secties) {
  console.log(`## ${titel}\n`)
  console.log(regels.join('\n').trimEnd() + '\n')
}

process.exit(bevindingen === 0 ? 0 : 2)
