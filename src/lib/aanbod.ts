import type { Campus, Finaliteit, Richting } from '../types'

/** De finaliteiten waarop gefilterd kan worden. `null` (eerste graad, 7e leerjaar, HBO5,
 *  OKAN) is geen keuze — dat is "niet van toepassing", geen categorie. */
export const FINALITEIT_OPTIONS = ['Doorstroom', 'Dubbel', 'Arbeidsmarkt'] as const

export type FinaliteitKeuze = (typeof FINALITEIT_OPTIONS)[number]

export const FINALITEIT_STYLES: Record<FinaliteitKeuze, string> = {
  Doorstroom: 'bg-indigo-100 text-indigo-800',
  Dubbel: 'bg-teal-100 text-teal-800',
  Arbeidsmarkt: 'bg-orange-100 text-orange-800',
}

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
 * geregistreerde scholen delen vaak één gebouw (zie CLAUDE.md), en wie een school zoekt wil
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
