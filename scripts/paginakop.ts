/**
 * De kopbalk voor de statische pagina's: /uitleg/, /uitleg/inschrijven/ en de stadspagina's.
 *
 * Waarom hier en niet als React-component: die pagina's zijn statische HTML en moeten leesbaar
 * en indexeerbaar blijven zonder JavaScript. Deze functie levert dezelfde balk als `<header>`
 * in App.tsx, maar met links in plaats van knoppen.
 *
 * Dat kan omdat de drie panelen van de zoeker elk al een eigen URL hebben (`?matrix=1`,
 * `?help=1`, `?over=1`, zie useSearchState.ts). Een klik hier opent dus de zoeker mét dat
 * paneel open, in plaats van een paneel dat op een statische pagina niet bestaat.
 *
 * **Eén ding is bewust anders dan op de zoeker: het woordmerk is hier geen `<h1>`.** Daar is
 * het de enige kop van de pagina; hier heeft elke pagina haar eigen h1 ("Middelbare scholen in
 * Mechelen"). Twee h1's zouden een zoekmachine laten raden welke van de twee de pagina
 * beschrijft.
 *
 * Wijzigt de balk in App.tsx, pas hem hier dan mee aan. De klassen zijn letterlijk overgenomen.
 */

/** Welke ingang de huidige pagina is, zodat die `aria-current` krijgt. */
export type KopIngang = 'uitleg' | null

export function paginakop(huidige: KopIngang = null): string {
  return `    <header class="flex items-center justify-between gap-4 bg-kop px-4 py-3 text-kop-inkt sm:px-7 sm:py-3.5">
      <a href="/" class="flex items-center gap-3 rounded-lg">
        ${beeldmerk()}
        <span class="flex min-w-0 flex-col">
          <span class="text-xl font-extrabold leading-tight tracking-tight">
            zoekjeschool<span class="text-signaal">.be</span>
          </span>
          <span class="hidden text-sm text-wrap text-kop-inkt/90 sm:block">
            Middelbare scholen in Vlaanderen en Brussel
          </span>
        </span>
      </a>
      <!-- Twee keer dezelfde ingangen, net als in App.tsx: een rij vanaf een tablet en een
           uitklapmenu daaronder. Op een telefoon zakten vier knoppen naar vier rijen en werd
           de balk een blok van 330 px hoog.

           Bewust <details> en geen script: het openen en sluiten, de rol voor schermlezers en
           de bediening met het toetsenbord zitten al in het element zelf. Zo werkt het menu
           ook zonder JavaScript, en dat is de hele reden dat deze pagina's statisch zijn. -->
      <div class="hidden min-w-0 flex-wrap items-center justify-end gap-3 md:flex">
${ingangen(huidige)}
      </div>
      <details class="relative md:hidden">
        <summary class="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-kop-inkt/30 [&::-webkit-details-marker]:hidden">
          <span class="sr-only">Menu</span>
          <!-- Drie getekende lijnen en niet het teken ☰: dat zit niet in het Latijnse subset
               van Plus Jakarta Sans dat we laden. Zie App.tsx. -->
          <svg aria-hidden="true" focusable="false" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M1 1h16M1 7h16M1 13h16" />
          </svg>
        </summary>
        <div class="absolute right-0 z-30 mt-2 flex w-64 flex-col items-stretch gap-2 rounded-xl border border-kop-inkt/25 bg-kop p-3 shadow-lg">
${ingangen(huidige)}
        </div>
      </details>
    </header>`
}

/** De vier ingangen plus de themaknop, gedeeld door de rij en het uitklapmenu. */
function ingangen(huidige: KopIngang): string {
  return [
    ingang('/?matrix=1', 'Alle richtingen', false),
    ingang('/?help=1', 'Hoe werkt deze site?', false),
    ingang('/uitleg/', 'Uitleg voor ouders', huidige === 'uitleg'),
    ingang('/?over=1', 'Over deze site', false),
    themaknop(),
  ].join('\n')
}

function ingang(href: string, label: string, actief: boolean): string {
  return `        <a href="${href}"${actief ? ' aria-current="page"' : ''} class="rounded-lg border border-kop-inkt/30 px-2.5 py-1.5 text-xs font-semibold text-kop-inkt transition-colors hover:bg-kop-inkt/15${
    actief ? ' bg-kop-inkt/15' : ''
  }">${label}</a>`
}

/**
 * De themaknop. De opmaak is overgenomen van ThemaToggle.tsx; public/thema-knop.js zet de
 * actieve stand en bewaart de keuze. De twee klassenreeksen staan als data-attribuut op de
 * groep, zodat het script ze niet nog eens hoeft te kennen: één plaats om aan te passen.
 */
function themaknop(): string {
  const actief = 'bg-kop-inkt text-kop font-semibold'
  const inactief = 'text-kop-inkt/80 hover:bg-kop-inkt/15 hover:text-kop-inkt'
  const opties: [string, string, string][] = [
    ['licht', 'Licht', 'Altijd lichte weergave'],
    ['systeem', 'Systeem', 'Volg de instelling van je toestel'],
    ['donker', 'Donker', 'Altijd donkere weergave'],
  ]
  return `        <div
          role="radiogroup"
          aria-label="Weergave"
          data-themaknop
          data-actief="${actief}"
          data-inactief="${inactief}"
          class="flex shrink-0 items-center gap-0.5 rounded-full border border-kop-inkt/25 bg-kop-inkt/10 p-[3px] text-xs"
        >
${opties
  .map(
    ([waarde, label, titel]) =>
      `          <button type="button" role="radio" aria-checked="false" title="${titel}" data-thema="${waarde}" class="rounded-full px-2.5 py-1 transition-colors ${inactief}">${label}</button>`,
  )
  .join('\n')}
        </div>`
}

/**
 * Het beeldmerk op 34 px, dus het detailniveau "twee" uit Beeldmerk.tsx: twee ramen, klok,
 * deur. Letterlijk dezelfde geometrie; `ondergrond` is de kopkleur.
 */
function beeldmerk(): string {
  const ondergrond = 'var(--c-kop)'
  return `<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="shrink-0">
          <path d="M25 21h14v-8.5a1.5 1.5 0 00-1.5-1.5h-11A1.5 1.5 0 0025 12.5z" fill="currentColor" />
          <rect x="7" y="21" width="50" height="4.6" rx="1.3" fill="currentColor" />
          <rect x="10" y="25.6" width="44" height="26.4" rx="1.4" fill="currentColor" />
          <circle cx="32" cy="16.2" r="3.8" fill="var(--c-signaal)" />
          <rect x="15" y="31" width="9" height="9" rx="1" fill="${ondergrond}" />
          <rect x="40" y="31" width="9" height="9" rx="1" fill="${ondergrond}" />
          <path d="M27 52v-9a5 5 0 0110 0v9z" fill="${ondergrond}" />
        </svg>`
}

/**
 * De broodkruimel die de terugweg vervangt. Zegt waar je zit én hoe je terug naar de zoeker
 * gaat, in plaats van enkel dat laatste. Sluit aan bij de BreadcrumbList-data die al in elke
 * statische pagina staat voor Google.
 */
export function broodkruimel(titel: string): string {
  return `      <nav class="text-sm text-zacht" aria-label="Kruimelpad">
        <a href="/" class="text-accent underline underline-offset-2">Zoek je school</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>${titel}</span>
      </nav>`
}
