import { useCallback, useState } from 'react'

export interface SearchState {
  lat: number | null
  lon: number | null
  label: string | null
  /** Straal in km, of null voor "alles". */
  straalKm: number | null
}

const DEFAULT_STATE: SearchState = {
  lat: null,
  lon: null,
  label: null,
  straalKm: 10,
}

function parseState(search: string): SearchState {
  const params = new URLSearchParams(search)
  const lat = params.get('lat')
  const lon = params.get('lon')
  const straal = params.get('straal')
  return {
    lat: lat !== null ? Number(lat) : null,
    lon: lon !== null ? Number(lon) : null,
    label: params.get('label'),
    straalKm: straal !== null ? (straal === 'alles' ? null : Number(straal)) : DEFAULT_STATE.straalKm,
  }
}

function toSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.lat !== null) params.set('lat', String(state.lat))
  if (state.lon !== null) params.set('lon', String(state.lon))
  if (state.label) params.set('label', state.label)
  params.set('straal', state.straalKm === null ? 'alles' : String(state.straalKm))
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
