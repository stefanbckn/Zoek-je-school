import type { Campus, Richting, Studierichting } from '../types'

/**
 * Eén gekozen studierichting: de code uit `Richting.studierichtingCode` plus de graad waarin
 * ze gekozen is. Dezelfde sleutel als in de catalogus (`richtingen.json`).
 *
 * ⚠️ **De graad hoort erbij.** Dezelfde code bestaat in de tweede én de derde graad
 * ("Onthaal en recreatie" op 17 respectievelijk 14 adressen). Filteren op de code alleen gaf
 * 18 resultaten terwijl de aangeklikte matrixcel er 14 beloofde. `graad: null` betekent "elke
 * graad" en komt enkel voor bij een oude link met een `rcode` zonder `rgraad`.
 */
export interface RichtingKeuze {
  code: string
  graad: string | null
}

export function keuzeSleutel(keuze: RichtingKeuze): string {
  return `${keuze.code}|${keuze.graad ?? ''}`
}

export function isGekozen(keuzes: RichtingKeuze[], keuze: RichtingKeuze): boolean {
  const sleutel = keuzeSleutel(keuze)
  return keuzes.some((k) => keuzeSleutel(k) === sleutel)
}

/** Voegt toe wat er nog niet in zit, in de volgorde waarin het binnenkomt. */
export function voegKeuzesToe(keuzes: RichtingKeuze[], erbij: RichtingKeuze[]): RichtingKeuze[] {
  const resultaat = [...keuzes]
  for (const k of erbij) {
    if (!isGekozen(resultaat, k)) resultaat.push(k)
  }
  return resultaat
}

export function wisselKeuze(keuzes: RichtingKeuze[], keuze: RichtingKeuze): RichtingKeuze[] {
  const sleutel = keuzeSleutel(keuze)
  return isGekozen(keuzes, keuze)
    ? keuzes.filter((k) => keuzeSleutel(k) !== sleutel)
    : [...keuzes, keuze]
}

/**
 * De naam van een keuze voor op een chip. De graad staat erbij omdat dezelfde richting in de
 * tweede en de derde graad bestaat, en de chips anders twee verschillende filters even noemen.
 */
export function keuzeLabel(keuze: RichtingKeuze, namen: Map<string, string>): string {
  const naam = namen.get(keuze.code) ?? keuze.code
  return keuze.graad ? `${naam} (${keuze.graad.toLowerCase()})` : naam
}

/**
 * Past deze richting op minstens één keuze? OF tussen de keuzes: wie "Sport" en "Latijn"
 * kiest, wil elk adres zien dat een van de twee aanbiedt.
 */
export function richtingInKeuzes(richting: Richting, keuzes: RichtingKeuze[]): boolean {
  return keuzes.some(
    (k) =>
      richting.studierichtingCode === k.code && (k.graad === null || richting.graad === k.graad),
  )
}

/**
 * Welke van de gekozen richtingen dit adres aanbiedt, in de volgorde waarin ze gekozen zijn.
 *
 * De filter is een OF, dus een adres in de lijst heeft er minstens één. Zonder deze lijst
 * leest een ouder die "Sport" en "Latijn" koos de resultaten makkelijk als scholen die ze
 * allebei hebben. Bewust geen EN-filter: een school met enkel sport kan net de juiste zijn.
 */
export function keuzesOpCampus(campus: Campus, keuzes: RichtingKeuze[]): RichtingKeuze[] {
  return keuzes.filter((k) =>
    campus.scholen.some((s) => s.richtingen.some((r) => richtingInKeuzes(r, [k]))),
  )
}

/**
 * De keuzes uit de URL. `rcode` en `rgraad` zijn twee lijsten die per positie bij elkaar
 * horen; een lege plek in `rgraad` is "elke graad". Zo blijven links van vóór 2.14.0, met één
 * `rcode` en één `rgraad`, precies hetzelfde betekenen.
 *
 * De code wordt hier niet tegen de catalogus gecontroleerd: die is hier niet beschikbaar. Een
 * onbestaande code geeft 0 resultaten, maar de chip erboven blijft zichtbaar en wegklikbaar.
 */
export function parseRichtingKeuzes(rcode: string | null, rgraad: string | null): RichtingKeuze[] {
  if (!rcode) return []
  const codes = rcode.split(',')
  const graden = rgraad ? rgraad.split(',') : []
  const keuzes = codes
    .map((code, i) => ({ code: code.trim(), graad: graden[i]?.trim() || null }))
    .filter((k) => k.code !== '')
  return voegKeuzesToe([], keuzes)
}

export function richtingKeuzesNaarUrl(
  keuzes: RichtingKeuze[],
): { rcode: string; rgraad: string } | null {
  if (keuzes.length === 0) return null
  return {
    rcode: keuzes.map((k) => k.code).join(','),
    rgraad: keuzes.map((k) => k.graad ?? '').join(','),
  }
}

/** Kleine letters en zonder accenten, zodat "commerciele" ook "Commerciële" vindt. */
export function normaliseer(tekst: string): string {
  return tekst
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * De richtingen uit de catalogus waarvan de naam de zoekterm bevat. Volgorde: eerst namen die
 * ermee beginnen, dan namen waarin een woord ermee begint, dan de rest. Zo staat "Sport" boven
 * "Topsport". Binnen elke groep eerst de richtingen die in het gekozen gebied bestaan.
 *
 * Gewoon een stukje van de naam, geen woordgrens: wie "sport" typt, wil "Topsport" zien. De
 * prijs is dat "Bestuurder interne transportmiddelen" ook verschijnt, onderaan.
 */
export function zoekRichtingen(
  catalogus: Studierichting[],
  zoekterm: string,
  tellingen: Map<string, number>,
): Studierichting[] {
  const term = normaliseer(zoekterm.trim())
  if (!term) return []

  const gevonden: { richting: Studierichting; groep: number; hier: number }[] = []
  for (const richting of catalogus) {
    const naam = normaliseer(richting.naam)
    const plek = naam.indexOf(term)
    if (plek < 0) continue
    const groep = plek === 0 ? 0 : new RegExp(`(^|[^a-z0-9])${escape(term)}`).test(naam) ? 1 : 2
    gevonden.push({ richting, groep, hier: aantalHier(tellingen, richting) })
  }

  return gevonden
    .sort(
      (a, b) =>
        a.groep - b.groep ||
        Number(b.hier > 0) - Number(a.hier > 0) ||
        a.richting.naam.localeCompare(b.richting.naam, 'nl') ||
        graadVolgorde(a.richting.graad) - graadVolgorde(b.richting.graad),
    )
    .map((g) => g.richting)
}

/** Sleutel zoals `telPerRichting()` in matrix.ts hem gebruikt. */
export function aantalHier(tellingen: Map<string, number>, richting: Studierichting): number {
  return tellingen.get(`${richting.code}|${richting.graad}`) ?? 0
}

function graadVolgorde(graad: string | null): number {
  if (graad === 'Eerste graad') return 1
  if (graad === 'Tweede graad') return 2
  if (graad === 'Derde graad') return 3
  return 4
}

function escape(tekst: string): string {
  return tekst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
