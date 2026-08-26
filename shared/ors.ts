/**
 * Gedeelde OpenRouteService-logica voor de server-side proxy.
 *
 * Draait NOOIT in de browser: de ORS-key mag volgens hun eigen documentatie niet client-side
 * gebruikt worden ("an API key must not be used client-side in an application"). Deze module
 * wordt gebruikt door de Netlify Function én door de dev-middleware in vite.config.ts, zodat
 * lokaal en in productie exact dezelfde validatie en aanroep gelden.
 */

const ORS_URL = 'https://api.heigit.org/openrouteservice/v2/directions/cycling-regular/json'

/**
 * Ruime bounding box rond België. Het endpoint staat publiek open, dus zonder deze check zou
 * iedereen het als gratis wereldwijde routeplanner kunnen misbruiken en ons quotum opsouperen.
 */
const BBOX = { latMin: 49.0, latMax: 52.0, lonMin: 2.0, lonMax: 7.0 }

export interface Punt {
  lat: number
  lon: number
}

export interface Fietsroute {
  afstandKm: number
  duurMin: number
}

/** Parseert "lat,lon" en weigert alles buiten de bounding box of niet-numeriek. */
export function parsePunt(raw: string | null): Punt | null {
  if (!raw) return null
  const delen = raw.split(',')
  if (delen.length !== 2) return null
  const lat = Number(delen[0])
  const lon = Number(delen[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < BBOX.latMin || lat > BBOX.latMax) return null
  if (lon < BBOX.lonMin || lon > BBOX.lonMax) return null
  return { lat, lon }
}

/**
 * Vraagt één fietsroute op. Geeft bewust alleen afstand en duur terug — niet de volledige
 * geometrie — zodat het endpoint weinig waard is voor wie het zou willen misbruiken.
 */
export async function haalFietsroute(van: Punt, naar: Punt, apiKey: string): Promise<Fietsroute> {
  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-type': 'application/json' },
    body: JSON.stringify({
      coordinates: [
        [van.lon, van.lat],
        [naar.lon, naar.lat],
      ],
    }),
  })
  if (!res.ok) {
    throw new Error(`ORS gaf HTTP ${res.status}`)
  }
  const data = (await res.json()) as {
    routes?: { summary?: { distance: number; duration: number } }[]
  }
  const summary = data.routes?.[0]?.summary
  if (!summary) {
    throw new Error('ORS gaf geen route terug')
  }
  return { afstandKm: summary.distance / 1000, duurMin: summary.duration / 60 }
}
