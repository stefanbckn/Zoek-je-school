/**
 * De HTML van één stadspagina. Staat los van de generator zodat de berekening en de tekst
 * niet door elkaar lopen.
 *
 * Vorm en footer zijn overgenomen van uitleg/index.html: dezelfde stylesheet, dezelfde
 * broodkruimels en dezelfde verplichte regels onderaan (broncodelink voor AGPL artikel 13,
 * contactadres als voorwaarde van Transitous). Wijzigt die footer daar, pas hem hier mee aan.
 *
 * Het thema-script en Simple Analytics worden door de plugin `gedeeldeScripts` in
 * vite.config.ts geïnjecteerd, net als bij de andere pagina's. Niet hier bijzetten.
 */
import { huisnummerLabel } from '../src/lib/adres.ts'
import type { Campus, DatasetMeta } from '../src/types.ts'
import type { Profiel } from './genereer-gemeentepaginas.ts'
import type { Stad } from './steden.ts'

const SITE = 'https://zoekjeschool.be'

export function pagina(stad: Stad, p: Profiel, meta: DatasetMeta): string {
  const url = `${SITE}/gemeente/${stad.slug}/`
  const titel = `Middelbare scholen in ${stad.naam}`
  const omschrijving =
    `${p.aantalScholen} middelbare scholen op ${p.adressen.length} adressen in ${stad.naam}. ` +
    'Bekijk hun studierichtingen, hun net en wat er in de buurt ligt.'

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#0B5C6E" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(titel)} | Zoek je school</title>
    <meta name="description" content="${esc(omschrijving)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Zoek je school" />
    <meta property="og:locale" content="nl_BE" />
    <meta property="og:title" content="${esc(titel)}" />
    <meta property="og:description" content="${esc(omschrijving)}" />
    <meta property="og:image" content="${SITE}/og-image-1200x630.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="zoekjeschool.be: welke scholen liggen bij jou in de buurt?" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">
${json({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Zoek je school', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: titel, item: url },
  ],
})}
    </script>
    <link rel="stylesheet" href="../../src/index.css" />
  </head>
  <body>
    <div class="mx-auto max-w-3xl px-4 py-10">
      <p class="text-sm">
        <a href="../../" class="inline-flex min-h-11 items-center text-accent underline underline-offset-2">
          &larr; Terug naar de zoeker
        </a>
      </p>

      <article class="mt-4">
        <h1 class="text-2xl font-semibold">${esc(titel)}</h1>
        <p class="mt-3">
          In ${esc(stad.naam)} ${p.aantalScholen === 1 ? 'is er' : 'zijn er'}
          <strong>${p.aantalScholen} ${woord(p.aantalScholen, 'school', 'scholen')}</strong>
          voor voltijds gewoon secundair onderwijs, verdeeld over
          <strong>${p.adressen.length} ${woord(p.adressen.length, 'adres', 'adressen')}</strong>.
          Samen richten ze ${p.aantalRichtingen} verschillende studierichtingen in.
        </p>
        ${deelgemeenten(stad, p)}
        <p class="mt-3 text-sm">
          <a href="${zoeker(p.gemeenteNamen)}" class="inline-flex min-h-11 items-center text-accent underline underline-offset-2">
            Open ${esc(stad.naam)} in de zoeker en filter verder &rarr;
          </a>
        </p>

        ${domeinen(stad, p)}
        ${ontbrekend(stad, p)}
        ${kaart(stad, p)}
        ${adressen(stad, p)}
        ${netten(p)}
        ${bijzonderheden(stad, p)}
        ${buurt(stad, p)}

        <h2 class="mt-8 text-lg font-semibold">Waar deze cijfers vandaan komen</h2>
        <p class="mt-2 text-sm text-zacht">
          Alle gegevens op deze pagina komen uit de open data van Onderwijs en Vorming, opgehaald
          op ${esc(datum(meta.opgehaaldOp))}${schooljaar(meta.schooljaarAanbod)}. De officiële
          fiche gaat voor.
        </p>
      </article>

      <p class="mt-6 text-sm">
        <a href="../../uitleg/" class="inline-flex min-h-11 items-center text-accent underline underline-offset-2">
          Wat betekenen 1A, 1B, doorstroom en arbeidsmarkt? &rarr;
        </a>
      </p>

      <!-- Beknopte footer, zelfde inhoud als uitleg/index.html. De broncodelink is de "way to
           get the source" die artikel 13 van de AGPL vraagt en het contactadres is de
           voorwaarde van Transitous; die twee horen op elke pagina. Zie CLAUDE.md. -->
      <footer class="mt-10 border-t border-rand pt-4 text-xs text-zacht">
        <p>
          Geen officiële bron: de fiche van Onderwijs en Vorming gaat altijd voor. Gegevens over
          scholen en studieaanbod komen van
          <a href="https://www.vlaanderen.be/onderwijs-en-vorming" target="_blank" rel="noreferrer" class="underline"
            >Onderwijs en Vorming</a
          >.
        </p>
        <p class="mt-1">
          Vragen of een fout gezien?
          <a href="mailto:info@zoekjeschool.be" class="underline">info@zoekjeschool.be</a> ·
          <a href="https://github.com/stefanbckn/Zoek-je-school" target="_blank" rel="noreferrer" class="underline"
            >Broncode</a
          >
          onder AGPL-3.0 · © 2026 Stefan Bocken
        </p>
      </footer>
    </div>
  </body>
</html>
`
}

/**
 * De dataset noemt elke postcode apart, dus "Brugge" bevat ook Sint-Andries en Zeebrugge. Wie
 * die namen in de adreslijst ziet staan zonder uitleg, denkt dat de pagina te ver kijkt.
 */
function deelgemeenten(stad: Stad, p: Profiel): string {
  const andere = p.gemeenteNamen.filter((n) => n !== stad.naam)
  if (andere.length === 0) return ''
  return `
        <p class="mt-3">
          De hele gemeente telt mee, dus ook ${lijst(andere)}.
        </p>`
}

function domeinen(stad: Stad, p: Profiel): string {
  return `
        <h2 class="mt-8 text-lg font-semibold">Welke studiedomeinen vind je in ${esc(stad.naam)}?</h2>
        <p class="mt-2 text-sm text-zacht">
          Hier zie je de studiedomeinen en op hoeveel adressen je ze kan volgen. Klik een domein
          aan om die adressen in de zoeker te openen.
        </p>
        <ul class="mt-3 space-y-1">
${p.domeinen
  .map(
    (d) => `          <li>
            <a href="${zoeker(p.gemeenteNamen, { domein: d.code })}" class="text-accent underline underline-offset-2"
              >${esc(d.label)}</a
            >
            <span class="text-zacht">· ${d.adressen} ${woord(d.adressen, 'adres', 'adressen')}</span>
          </li>`,
  )
  .join('\n')}
        </ul>`
}

function ontbrekend(stad: Stad, p: Profiel): string {
  if (p.ontbrekend.length === 0) {
    return `
        <h2 class="mt-8 text-lg font-semibold">Wat vind je hier niet?</h2>
        <p class="mt-2">
          Niets: elk studiedomein is in ${esc(stad.naam)} te vinden. Dat is niet in elke stad zo,
          dus wie hier zoekt hoeft voor een domein niet verder te kijken.
        </p>`
  }
  return `
        <h2 class="mt-8 text-lg font-semibold">Wat vind je hier niet?</h2>
        <p class="mt-2">
          ${esc(stad.naam)} heeft geen aanbod in
          ${lijst(p.ontbrekend.map((o) => o.label))}. Waar dat wel kan, dichtst bij het midden van
          de stad gerekend in vogelvlucht:
        </p>
        <ul class="mt-3 space-y-1">
${p.ontbrekend
  .map((o) => {
    if (o.dichtstbij === null) {
      return `          <li>${esc(o.label)}: <span class="text-zacht">nergens anders in de dataset gevonden</span></li>`
    }
    return `          <li>
            ${esc(o.label)}:
            <a href="${zoeker([o.dichtstbij.gemeente], { domein: o.code })}" class="text-accent underline underline-offset-2"
              >${esc(o.dichtstbij.gemeente)}</a
            >
            <span class="text-zacht">· ${km(o.dichtstbij.km)} in vogelvlucht</span>
          </li>`
  })
  .join('\n')}
        </ul>`
}

function adressen(stad: Stad, p: Profiel): string {
  return `
        <h2 class="mt-8 text-lg font-semibold">De scholen in ${esc(stad.naam)}, per adres</h2>
        <p class="mt-2 text-sm text-zacht">
          Op alfabetische volgorde van de straatnaam. Meerdere scholen op één adres komt vaak
          voor: ze delen dan een campus. Een school met meer dan één adres in de stad staat er
          ook meer dan één keer.
        </p>
        <ul class="mt-3 space-y-4">
${p.adressen
  .map(
    (c) => `          <li>
            <p class="font-medium">${esc(adresRegel(c))}</p>
            <p class="text-sm text-zacht">${esc(c.postcode)} ${esc(c.gemeente)}</p>
            <ul class="mt-1 space-y-1 text-sm">
${(p.regelsPerAdres.get(c.id) ?? [])
  .map(
    (s) => `              <li>
                <a href="${zoeker(p.gemeenteNamen, { q: s.naam })}" class="text-accent underline underline-offset-2"
                  >${esc(s.naam)}</a
                >
                <span class="text-zacht">· ${esc(s.net)}</span>
              </li>`,
  )
  .join('\n')}
            </ul>
          </li>`,
  )
  .join('\n')}
        </ul>`
}

/**
 * De kaart zelf staat in src/gemeentekaart.ts; hier komt enkel de container, de data en het
 * scripttag. Het JSON-blok wordt niet uitgevoerd, dus de CSP blijft ongemoeid. `</` moet er
 * wel uit: anders sluit een schoolnaam met die tekens het script vroegtijdig af.
 */
function kaart(stad: Stad, p: Profiel): string {
  const punten = p.adressen
    .filter((c) => c.lat !== null && c.lon !== null)
    .map((c) => ({
      lat: c.lat as number,
      lon: c.lon as number,
      adres: adresRegel(c),
      plaats: `${c.postcode} ${c.gemeente}`,
      scholen: (p.regelsPerAdres.get(c.id) ?? []).map((s) => ({
        naam: s.naam,
        net: s.net,
        href: zoeker(p.gemeenteNamen, { q: s.naam }),
      })),
    }))
  if (punten.length === 0) return ''

  const zonderLocatie = p.adressen.length - punten.length
  return `
        <h2 class="mt-8 text-lg font-semibold">${esc(stad.naam)} op de kaart</h2>
        <p class="mt-2 text-sm text-zacht">
          Elke speld is één adres; klik erop voor de scholen die er staan. Liggen er meerdere
          dicht bij elkaar, dan zie je eerst een bol met hun aantal. Klik die aan om in te
          zoomen.${
            zonderLocatie > 0
              ? ` ${zonderLocatie} ${woord(zonderLocatie, 'adres staat', 'adressen staan')} er niet op: de bron geeft er geen coördinaten voor.`
              : ''
          }
          De volledige lijst staat eronder.
        </p>
        <div id="kaart" class="mt-3 h-96 w-full rounded-lg border border-rand" role="application" aria-label="Kaart met de adressen in ${esc(stad.naam)}"></div>
        <script type="application/json" id="kaartdata">${JSON.stringify(punten).replace(/</g, '\\u003c')}</script>
        <script type="module" src="../../src/gemeentekaart.ts"></script>`
}

/** Straat plus huisnummer zoals het hoort: de bron schrijft `46_A`, een mens leest `46A`. */
function adresRegel(c: Campus): string {
  return `${c.straat} ${huisnummerLabel(c.huisnummer)}`
}

function netten(p: Profiel): string {
  return `
        <h2 class="mt-8 text-lg font-semibold">Welke netten zijn er?</h2>
        <ul class="mt-3 space-y-1">
${p.netten
  .map(
    (n) =>
      `          <li>${esc(n.net)} <span class="text-zacht">· ${n.scholen} ${woord(n.scholen, 'school', 'scholen')}</span></li>`,
  )
  .join('\n')}
        </ul>`
}

function bijzonderheden(stad: Stad, p: Profiel): string {
  const regels: string[] = []
  if (p.okanAdressen > 0) {
    regels.push(
      `Er is een onthaaljaar voor anderstalige nieuwkomers (OKAN) op ${p.okanAdressen} ${woord(p.okanAdressen, 'adres', 'adressen')}.`,
    )
  } else {
    regels.push('Er is geen onthaaljaar voor anderstalige nieuwkomers (OKAN).')
  }
  if (p.duaalRichtingen > 0) {
    regels.push(
      `${p.duaalRichtingen} ${woord(p.duaalRichtingen, 'studierichting', 'studierichtingen')} ${woord(p.duaalRichtingen, 'wordt', 'worden')} duaal aangeboden: leren op school en op de werkvloer.`,
    )
  } else {
    regels.push('Er is geen duaal aanbod: leren op de werkvloer kan hier niet.')
  }
  return `
        <h2 class="mt-8 text-lg font-semibold">Verder in ${esc(stad.naam)}</h2>
        <ul class="mt-3 list-disc space-y-1 pl-5">
${regels.map((r) => `          <li>${r}</li>`).join('\n')}
        </ul>`
}

function buurt(stad: Stad, p: Profiel): string {
  if (p.buurgemeenten.length === 0) {
    return `
        <h2 class="mt-8 text-lg font-semibold">In de buurt</h2>
        <p class="mt-2">
          Binnen tien kilometer van ${esc(stad.naam)} ligt geen andere gemeente met een middelbare
          school in de dataset.
        </p>`
  }
  return `
        <h2 class="mt-8 text-lg font-semibold">In de buurt van ${esc(stad.naam)}</h2>
        <p class="mt-2 text-sm text-zacht">
          Gemeenten met middelbare scholen binnen tien kilometer, in vogelvlucht gerekend vanaf
          het midden van de stad. Een gemeentegrens zegt weinig over hoe ver fietsen het is.
        </p>
        <ul class="mt-3 space-y-1">
${p.buurgemeenten
  .map(
    (b) => `          <li>
            <a href="${zoeker([b.gemeente])}" class="text-accent underline underline-offset-2"
              >${esc(b.gemeente)}</a
            >
            <span class="text-zacht">· ${b.adressen} ${woord(b.adressen, 'adres', 'adressen')} · ${km(b.km)}</span>
          </li>`,
  )
  .join('\n')}
        </ul>`
}

/** Dieplink naar de zoeker. `straal=alles` want zonder vertrekpunt heeft een straal geen zin. */
function zoeker(namen: string[], extra: { domein?: string; q?: string } = {}): string {
  const params = new URLSearchParams()
  // De zoeker filtert op de plaatsnaam uit `gemeente`, niet op niscode. Voor een stad met
  // deelgemeenten zijn dat er dus meerdere.
  params.set('gemeenten', namen.join(','))
  params.set('straal', 'alles')
  if (extra.domein) params.set('domein', extra.domein)
  if (extra.q) params.set('q', extra.q)
  return `../../?${params.toString()}`
}

/** Leeg als de bron geen schooljaar meegaf: liever niets dan een verzonnen jaartal. */
function schooljaar(jaar: number | null): string {
  return jaar === null ? '' : ` voor het schooljaar ${jaar}-${jaar + 1}`
}

function woord(n: number, enkelvoud: string, meervoud: string): string {
  return n === 1 ? enkelvoud : meervoud
}

function lijst(items: string[]): string {
  const veilig = items.map(esc)
  if (veilig.length === 1) return veilig[0]
  return `${veilig.slice(0, -1).join(', ')} en ${veilig[veilig.length - 1]}`
}

function km(n: number): string {
  return `${n.toFixed(1).replace('.', ',')} km`
}

function datum(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function json(waarde: unknown): string {
  return JSON.stringify(waarde, null, 2)
    .split('\n')
    .map((r) => `      ${r}`)
    .join('\n')
}

function esc(waarde: string): string {
  return waarde
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
