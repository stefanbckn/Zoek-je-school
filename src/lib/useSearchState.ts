import { useCallback, useState } from 'react'
import { FINALITEIT_OPTIONS, type FinaliteitKeuze } from './aanbod'
import { NET_OPTIONS } from './net'
import type { Net } from '../types'

export interface SearchState {
  lat: number | null
  lon: number | null
  label: string | null
  /** Straal in km, of null voor "alles". */
  straalKm: number | null
  /** Leeg = alle netten. */
  netten: Net[]
  /** Leeg = alle gemeenten. */
  gemeenten: string[]
  tekst: string
  /** Leeg = alle finaliteiten. */
  finaliteiten: FinaliteitKeuze[]
  /** Vrije tekst om op studierichting/studiegebied te zoeken. Leeg = geen filter. */
  richting: string
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
}

const DEFAULT_STATE: SearchState = {
  lat: null,
  lon: null,
  label: null,
  straalKm: 10,
  netten: [],
  gemeenten: [],
  tekst: '',
  finaliteiten: [],
  richting: '',
  toonZonderAanbod: false,
  over: false,
  help: false,
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
    gemeenten: parseList(params.get('gemeenten')),
    tekst: params.get('q') ?? '',
    // Zelfde reden als bij netten: een onbekende waarde uit een bewerkte URL mag geen
    // filter opleveren die nooit matcht en dus 0 resultaten zonder uitleg geeft.
    finaliteiten: parseList(params.get('finaliteit')).filter((f): f is FinaliteitKeuze =>
      (FINALITEIT_OPTIONS as readonly string[]).includes(f),
    ),
    richting: params.get('richting') ?? '',
    // Alleen de expliciete '1' zet dit aan. Elke andere waarde (leeg, 'true', onzin uit een
    // bewerkte URL) valt terug op de standaard, net als bij de andere parameters hierboven.
    toonZonderAanbod: params.get('zonderaanbod') === '1',
    over: params.get('over') === '1',
    help: params.get('help') === '1',
  }
}

function toSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.lat !== null) params.set('lat', String(state.lat))
  if (state.lon !== null) params.set('lon', String(state.lon))
  if (state.label) params.set('label', state.label)
  params.set('straal', state.straalKm === null ? 'alles' : String(state.straalKm))
  if (state.netten.length > 0) params.set('net', state.netten.join(','))
  if (state.gemeenten.length > 0) params.set('gemeenten', state.gemeenten.join(','))
  if (state.tekst) params.set('q', state.tekst)
  if (state.finaliteiten.length > 0) params.set('finaliteit', state.finaliteiten.join(','))
  if (state.richting) params.set('richting', state.richting)
  if (state.toonZonderAanbod) params.set('zonderaanbod', '1')
  if (state.over) params.set('over', '1')
  if (state.help) params.set('help', '1')
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
