// Geolocation API van Digitaal Vlaanderen. Geverifieerd endpoint + response-vorm
// (zie CLAUDE.md) — geen key nodig, CORS werkt in de praktijk ondanks de docs.
const BASE_URL = 'https://geo.api.vlaanderen.be/geolocation/v4'

export interface LocatieSuggestie {
  tekst: string
}

export interface GevondenLocatie {
  label: string
  lat: number
  lon: number
}

interface SuggestionResponse {
  SuggestionResult: string[]
}

interface LocationResponse {
  LocationResult: {
    FormattedAddress: string
    Location: { Lat_WGS84: number; Lon_WGS84: number }
  }[]
}

export async function suggestLocaties(query: string): Promise<LocatieSuggestie[]> {
  if (!query.trim()) return []
  const res = await fetch(`${BASE_URL}/Suggestion?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Suggesties ophalen mislukt.')
  const data: SuggestionResponse = await res.json()
  return data.SuggestionResult.map((tekst) => ({ tekst }))
}

export async function zoekLocatie(query: string): Promise<GevondenLocatie | null> {
  if (!query.trim()) return null
  const res = await fetch(`${BASE_URL}/Location?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Locatie zoeken mislukt.')
  const data: LocationResponse = await res.json()
  const eerste = data.LocationResult[0]
  if (!eerste) return null
  return {
    label: eerste.FormattedAddress,
    lat: eerste.Location.Lat_WGS84,
    lon: eerste.Location.Lon_WGS84,
  }
}
