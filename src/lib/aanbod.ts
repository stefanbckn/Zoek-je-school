import type { Campus, Finaliteit, Richting } from '../types'

/** De finaliteiten waarop gefilterd kan worden. `null` (eerste graad, 7e leerjaar, HBO5,
 *  OKAN) is geen keuze — dat is "niet van toepassing", geen categorie. */
export const FINALITEIT_OPTIONS = ['Doorstroom', 'Dubbel', 'Arbeidsmarkt'] as const

export type FinaliteitKeuze = (typeof FINALITEIT_OPTIONS)[number]

export const FINALITEIT_STYLES: Record<FinaliteitKeuze, string> = {
  Doorstroom: 'bg-fin-door-bg text-fin-door',
  Dubbel: 'bg-fin-dubbel-bg text-fin-dubbel',
  Arbeidsmarkt: 'bg-fin-arbeid-bg text-fin-arbeid',
}

/**
 * Vormteken per finaliteit. Draagt de betekenis ook zonder kleur — belangrijk voor wie
 * kleurenblind is, en het is bovendien een geheugensteun: ▲ verder studeren, ◆ allebei,
 * ■ aan het werk. De tekens staan `aria-hidden`, want de tekst ernaast zegt het al.
 */
export const FINALITEIT_TEKEN: Record<FinaliteitKeuze, string> = {
  Doorstroom: '▲',
  Dubbel: '◆',
  Arbeidsmarkt: '■',
}

/** Gedeelde vormgeving van een finaliteit-chip: omlijnd, in de kleur van de finaliteit. */
export const FINALITEIT_CHIP =
  'chip inline-flex items-center gap-1 rounded-lg border-[1.5px] border-current px-1.5 py-0.5 text-xs font-medium'

/** Volgorde waarin graden getoond worden. Wat hier niet in staat, komt achteraan. */
const GRAAD_VOLGORDE = [
  'Eerste graad',
  'Tweede graad',
  'Derde graad',
  'Hoger beroepsonderwijs',
  'Onthaalklas anderstalige nieuwkomers',
]

/**
 * De brondata noemt richtingen voluit per leerjaar: "1e leerjaar in de 2e graad Latijn ASO"
 * én "2e leerjaar in de 2e graad Latijn ASO". Voor wie een school zoekt is dat dezelfde
 * richting, en de graad staat toch al boven de groep. Deze functie haalt dat voorvoegsel weg.
 *
 * Matcht het patroon niet — eerste graad ("1ste leerjaar A"), 7e leerjaren, HBO5, OKAN — dan
 * blijft de naam onaangeroerd. Die lezen als losse naam prima. Geverifieerd tegen de dataset:
 * 589 van de 744 unieke richtingen matchen, de rest is bewust ongewijzigd.
 */
const LEERJAAR_PREFIX = /^\d+(?:e|ste|de) leerjaar in de \d+(?:e|ste|de) graad\s+/

export function korteNaam(naam: string): string {
  return naam.replace(LEERJAAR_PREFIX, '')
}

/**
 * Het studieaanbod van een heel adres: alle scholen op de campus samen. Meerdere apart
 * geregistreerde scholen delen vaak één gebouw (zie .claude/rules/datamodel.md), en wie een school zoekt wil
 * weten wat je op dát adres kan studeren — niet welke juridische entiteit wat inricht.
 *
 * Ontdubbeld op (korte naam, graad, finaliteit): de leerjaren van dezelfde richting en
 * dezelfde richting bij twee scholen op het adres vallen zo samen tot één regel.
 */
export function campusAanbod(campus: Campus): Richting[] {
  const perSleutel = new Map<string, Richting>()
  for (const school of campus.scholen) {
    for (const richting of school.richtingen) {
      const naam = korteNaam(richting.naam)
      const sleutel = `${naam}|${richting.graad}|${richting.finaliteit}`
      const bestaand = perSleutel.get(sleutel)
      if (bestaand) {
        // Kan één van de leerjaren nog ingeschreven worden, dan geldt dat voor de regel.
        if (richting.inschrijvingenOpen) bestaand.inschrijvingenOpen = true
        continue
      }
      perSleutel.set(sleutel, { ...richting, naam })
    }
  }
  return [...perSleutel.values()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

export interface GraadGroep {
  graad: string
  richtingen: Richting[]
}

export function groepeerPerGraad(richtingen: Richting[]): GraadGroep[] {
  const perGraad = new Map<string, Richting[]>()
  for (const r of richtingen) {
    const graad = r.graad ?? 'Overige'
    const lijst = perGraad.get(graad) ?? []
    lijst.push(r)
    perGraad.set(graad, lijst)
  }
  return [...perGraad.entries()]
    .map(([graad, lijst]) => ({ graad, richtingen: lijst }))
    .sort((a, b) => {
      const ia = GRAAD_VOLGORDE.indexOf(a.graad)
      const ib = GRAAD_VOLGORDE.indexOf(b.graad)
      return (ia === -1 ? GRAAD_VOLGORDE.length : ia) - (ib === -1 ? GRAAD_VOLGORDE.length : ib)
    })
}

/**
 * Zet een verzameling graadnamen in de vaste volgorde van `GRAAD_VOLGORDE`. Nodig voor de
 * vergelijkingstabel: daar staan meerdere campussen naast elkaar en moet elke rij dezelfde
 * graad zijn, ook als één van die campussen bijvoorbeeld geen eerste graad heeft.
 * Onbekende graden komen achteraan, alfabetisch, zodat de volgorde stabiel blijft.
 */
export function sorteerGraden(graden: Iterable<string>): string[] {
  return [...new Set(graden)].sort((a, b) => {
    const ia = GRAAD_VOLGORDE.indexOf(a)
    const ib = GRAAD_VOLGORDE.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'nl')
    return (ia === -1 ? GRAAD_VOLGORDE.length : ia) - (ib === -1 ? GRAAD_VOLGORDE.length : ib)
  })
}

/** Welke finaliteiten komen op dit adres voor? Voor de badges in de resultatenlijst. */
export function finaliteitenVan(richtingen: Richting[]): FinaliteitKeuze[] {
  const gevonden = new Set<Finaliteit>(richtingen.map((r) => r.finaliteit))
  return FINALITEIT_OPTIONS.filter((f) => gevonden.has(f))
}

/** Matcht een richting op vrije tekst? Zoekt in de naam en het studiegebied. */
export function richtingMatcht(richting: Richting, zoekterm: string): boolean {
  const term = zoekterm.trim().toLowerCase()
  if (!term) return true
  return (
    richting.naam.toLowerCase().includes(term) ||
    (richting.studiegebied?.toLowerCase().includes(term) ?? false)
  )
}

/**
 * Heeft dit adres studieaanbod? Leeg betekent hier: géén enkele school op de campus heeft een
 * richting geregistreerd. Eén school met aanbod houdt het hele adres zichtbaar — dezelfde
 * adresniveau-logica als de aanbodfilters, zie .claude/rules/datamodel.md.
 *
 * Zo'n leeg adres is meestal administratief: het instellingsadres staat als aparte vestiging in
 * de bron terwijl het lesgeven elders gebeurt (Panorama staat op Bredastraat 35, de lessen zijn
 * op Quellinstraat 31). Op de dataset van augustus 2026: 50 van de 303 campussen.
 */
export function heeftAanbod(campus: Campus): boolean {
  return campus.scholen.some((s) => s.richtingen.length > 0)
}

/**
 * Dezelfde campus, maar zonder de scholen die geen enkele richting inrichten. Nodig omdat de
 * filter "adressen zonder studieaanbod" op adresniveau werkt: staat er op één adres één school
 * met aanbod, dan blijft het adres terecht staan, maar de lege buren liftten tot v0.12.2 mee.
 * Wie zo'n rij aanklikte, las het aanbod van de buurschool (`campusAanbod` telt per adres) en
 * vond op de officiële fiche niets terug — zie issue #23.
 *
 * Een verborgen rij is per definitie leeg, dus er verdwijnt geen enkele richting van het
 * scherm. Roep dit enkel aan op een campus die zelf aanbod heeft (`heeftAanbod`), anders houd
 * je een campus zonder scholen over.
 */
export function scholenMetAanbod<T extends Campus>(campus: T): T {
  return { ...campus, scholen: campus.scholen.filter((s) => s.richtingen.length > 0) }
}

/**
 * De verborgen aantallen als één leesbare woordgroep: "3 adressen en 12 scholen". `enkelvoud`
 * zegt of het werkwoord erna enkelvoud moet zijn, want dat verschilt per zin ("valt nu weg",
 * "is verborgen"). Null als er niets verborgen is.
 *
 * Twee getallen omdat de schakelaar twee dingen verbergt: hele adressen zonder aanbod, en losse
 * schoolrijen zonder aanbod op een adres dat blijft staan. Alleen de adressen tellen zou een
 * cijfer opleveren dat stil blijft staan terwijl er wél iets verdwijnt.
 */
export function verborgenOmschrijving(
  adressen: number,
  scholen: number,
): { tekst: string; enkelvoud: boolean } | null {
  const delen: string[] = []
  if (adressen > 0) delen.push(`${adressen} ${adressen === 1 ? 'adres' : 'adressen'}`)
  if (scholen > 0) delen.push(`${scholen} ${scholen === 1 ? 'school' : 'scholen'}`)
  if (delen.length === 0) return null
  return {
    tekst: delen.join(' en '),
    enkelvoud: delen.length === 1 && (adressen === 1 || scholen === 1),
  }
}
