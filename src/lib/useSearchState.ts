import { useCallback, useState } from 'react'
import { FINALITEIT_OPTIONS, type FinaliteitKeuze } from './aanbod'
import { DOMEIN_RIJEN } from './domein'
import { MATRIX_GRADEN, type MatrixGraad } from './matrix'
import { NET_OPTIONS } from './net'
import { PROVINCIE_OPTIONS } from './provincie'
import type { Net, Provincie } from '../types'

export interface SearchState {
  lat: number | null
  lon: number | null
  label: string | null
  /** Straal in km, of null voor "alles". */
  straalKm: number | null
  /** Leeg = alle netten. */
  netten: Net[]
  /** Leeg = heel Vlaanderen en Brussel. */
  provincies: Provincie[]
  /** Leeg = alle gemeenten. */
  gemeenten: string[]
  tekst: string
  /** Leeg = alle finaliteiten. */
  finaliteiten: FinaliteitKeuze[]
  /** Vrije tekst om op de naam van een studierichting te zoeken. Leeg = geen filter. */
  richting: string
  /**
   * Codes van studiedomeinen (`Richting.domeinCode`). Leeg = alle domeinen.
   *
   * Enkel de rijen van de matrix zijn geldig: de acht inhoudelijke domeinen plus
   * domeinoverschrijdend. '10' (eerste graad) hoort daar niet bij, want dat is geen keuze die
   * een ouder maakt.
   */
  domeinen: string[]
  /**
   * Eén exacte studierichting, aangeklikt in de matrix: de code uit
   * `Richting.studierichtingCode` plus de graad waarin ze aangeklikt is.
   *
   * Dit staat naast `richting` en vervangt het niet: dat veld is wat iemand intikt, dit is wat
   * de matrix aanklikt. Een code matcht altijd exact, ook bij namen als "Grafische technieken
   * (domein STEM)" waar een tekstzoektocht te veel of te weinig oplevert.
   *
   * ⚠️ **De graad hoort erbij.** Dezelfde code bestaat in de tweede én de derde graad
   * ("Onthaal en recreatie" op 17 respectievelijk 14 adressen). Filteren op de code alleen
   * gaf 18 resultaten terwijl de aangeklikte cel er 14 beloofde. Laat die twee dus samen
   * reizen, ook in de URL.
   */
  richtingCode: string | null
  richtingGraad: string | null
  /**
   * Adressen zonder enig studieaanbod meetonen. Standaard `false`: dat zijn meestal
   * administratief geregistreerde adressen zonder les, en voor wie een school zoekt is dat ruis.
   * Bewust een zichtbaar vinkje en geen stille weglating — een school waarvan het aanbod om een
   * andere reden ontbreekt, zou anders spoorloos verdwijnen.
   */
  toonZonderAanbod: boolean
  /**
   * Staat "Over deze site" open. Bewust wél in de URL, in tegenstelling tot de
   * vergelijkselectie: een shortlist is een tussenstap in iemands zoektocht, maar "waar komt
   * deze informatie vandaan" is precies het soort ding dat je doorstuurt. Het staat hier in
   * SearchState en niet in een losse useState, omdat `update()` de volledige querystring
   * herschrijft — een parameter erbuiten zou bij de eerstvolgende filterwijziging wegvallen.
   */
  over: boolean
  /**
   * Staat "Hoe werkt deze site?" open. Zelfde redenering als `over`: in de URL, zodat je de
   * uitleg kan doorsturen aan wie met de site worstelt, en in SearchState omdat `update()` de
   * volledige querystring herschrijft.
   *
   * Het paneel gaat nooit vanzelf open, ook niet bij een eerste bezoek: de site houdt niets
   * bij over wie er langskomt, dus een eerste bezoek is niet van een tiende te onderscheiden.
   */
  help: boolean
  /**
   * Staat de matrix open. Zelfde redenering als `over` en `help`: in de URL zodat je hem kan
   * doorsturen, en in SearchState omdat `update()` de volledige querystring herschrijft.
   */
  matrix: boolean
}

const DEFAULT_STATE: SearchState = {
  lat: null,
  lon: null,
  label: null,
  straalKm: 10,
  netten: [],
  provincies: [],
  gemeenten: [],
  tekst: '',
  finaliteiten: [],
  richting: '',
  domeinen: [],
  richtingCode: null,
  richtingGraad: null,
  toonZonderAanbod: false,
  over: false,
  help: false,
  matrix: false,
}

function parseList(raw: string | null): string[] {
  return raw ? raw.split(',').filter(Boolean) : []
}

/**
 * Tot v0.2 had de netfilter één categorie 'Officieel gesubsidieerd'; die is opgesplitst in
 * 'Provinciaal' en 'Gemeentelijk'. Links die voordien gedeeld zijn dragen de oude waarde nog.
 * Zonder deze vertaling geeft zo'n link 0 resultaten zonder zichtbaar vinkje — de gebruiker
 * ziet een lege pagina en begrijpt niet waarom. Vertalen naar beide opvolgers houdt de
 * betekenis van die links exact intact.
 */
const NET_MIGRATIE: Record<string, Net[]> = {
  'Officieel gesubsidieerd': ['Provinciaal', 'Gemeentelijk'],
}

function parseNetten(raw: string | null): Net[] {
  const netten = new Set<Net>()
  for (const waarde of parseList(raw)) {
    const opvolgers = NET_MIGRATIE[waarde]
    if (opvolgers) {
      for (const n of opvolgers) netten.add(n)
    } else if ((NET_OPTIONS as string[]).includes(waarde)) {
      // Onbekende netten wegfilteren i.p.v. blind casten: anders levert ?net=onzin een
      // filter op die nooit matcht, en dus 0 resultaten zonder uitleg.
      netten.add(waarde as Net)
    }
  }
  return [...netten]
}

/**
 * De URL is deelbaar en dus door de gebruiker bewerkbaar. Alles wat eruit komt is onbetrouwbaar:
 * een afgekapte link, een typfout of een geplakte URL mag nooit een lege of kapotte pagina geven.
 * Ongeldige waarden vallen daarom terug op "niet ingevuld", niet op NaN.
 */
function parseCoordinaat(raw: string | null, max: number): number | null {
  if (raw === null) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || Math.abs(n) > max) return null
  return n
}

function parseStraal(raw: string | null): number | null {
  if (raw === null) return DEFAULT_STATE.straalKm
  if (raw === 'alles') return null
  const n = Number(raw)
  // Niet-numeriek of onzinnig (0, negatief) → terug naar de standaardstraal, niet naar NaN:
  // met NaN zou élke school uit de straalfilter vallen en kreeg je 0 resultaten.
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_STATE.straalKm
  return n
}

function parseState(search: string): SearchState {
  const params = new URLSearchParams(search)
  const lat = parseCoordinaat(params.get('lat'), 90)
  const lon = parseCoordinaat(params.get('lon'), 180)
  // Een half koppel coördinaten is onbruikbaar: alleen beide of geen van beide.
  const heeftLocatie = lat !== null && lon !== null
  return {
    lat: heeftLocatie ? lat : null,
    lon: heeftLocatie ? lon : null,
    label: heeftLocatie ? params.get('label') : null,
    straalKm: parseStraal(params.get('straal')),
    netten: parseNetten(params.get('net')),
    // Zelfde reden als bij netten: een onbekende waarde uit een bewerkte URL zou een filter
    // opleveren die nooit matcht, en dus 0 resultaten zonder zichtbaar vinkje.
    provincies: parseList(params.get('provincie')).filter((p): p is Provincie =>
      (PROVINCIE_OPTIONS as readonly string[]).includes(p),
    ),
    gemeenten: parseList(params.get('gemeenten')),
    tekst: params.get('q') ?? '',
    // Zelfde reden als bij netten: een onbekende waarde uit een bewerkte URL mag geen
    // filter opleveren die nooit matcht en dus 0 resultaten zonder uitleg geeft.
    finaliteiten: parseList(params.get('finaliteit')).filter((f): f is FinaliteitKeuze =>
      (FINALITEIT_OPTIONS as readonly string[]).includes(f),
    ),
    richting: params.get('richting') ?? '',
    // Zelfde reden als bij netten: een onbekende domeincode uit een bewerkte URL zou een
    // filter opleveren die nooit matcht.
    domeinen: parseList(params.get('domein')).filter((d) => DOMEIN_RIJEN.includes(d)),
    // De code wordt hier NIET gevalideerd: de geldige lijst zit in richtingen.json en die is
    // hier niet beschikbaar. Een onbestaande code geeft 0 resultaten, maar de chip erboven
    // blijft zichtbaar en wegklikbaar — zie ActieveFilters.
    richtingCode: params.get('rcode'),
    // Een onbekende graad valt terug op "geen graadbeperking" in plaats van op 0 resultaten.
    richtingGraad: MATRIX_GRADEN.includes(params.get('rgraad') as MatrixGraad)
      ? params.get('rgraad')
      : null,
    // Alleen de expliciete '1' zet dit aan. Elke andere waarde (leeg, 'true', onzin uit een
    // bewerkte URL) valt terug op de standaard, net als bij de andere parameters hierboven.
    toonZonderAanbod: params.get('zonderaanbod') === '1',
    over: params.get('over') === '1',
    help: params.get('help') === '1',
    matrix: params.get('matrix') === '1',
  }
}

function toSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.lat !== null) params.set('lat', String(state.lat))
  if (state.lon !== null) params.set('lon', String(state.lon))
  if (state.label) params.set('label', state.label)
  params.set('straal', state.straalKm === null ? 'alles' : String(state.straalKm))
  if (state.netten.length > 0) params.set('net', state.netten.join(','))
  if (state.provincies.length > 0) params.set('provincie', state.provincies.join(','))
  if (state.gemeenten.length > 0) params.set('gemeenten', state.gemeenten.join(','))
  if (state.tekst) params.set('q', state.tekst)
  if (state.finaliteiten.length > 0) params.set('finaliteit', state.finaliteiten.join(','))
  if (state.richting) params.set('richting', state.richting)
  if (state.domeinen.length > 0) params.set('domein', state.domeinen.join(','))
  if (state.richtingCode) params.set('rcode', state.richtingCode)
  if (state.richtingGraad) params.set('rgraad', state.richtingGraad)
  if (state.toonZonderAanbod) params.set('zonderaanbod', '1')
  if (state.over) params.set('over', '1')
  if (state.help) params.set('help', '1')
  if (state.matrix) params.set('matrix', '1')
  return params
}

export function useSearchState() {
  const [state, setState] = useState<SearchState>(() => parseState(window.location.search))

  const update = useCallback((patch: Partial<SearchState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      const params = toSearchParams(next)
      const url = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState(null, '', url)
      return next
    })
  }, [])

  return { state, update }
}
