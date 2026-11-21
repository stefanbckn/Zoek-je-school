/**
 * Gedeelde OpenRouteService-logica voor de server-side proxy.
 *
 * Draait NOOIT in de browser: de ORS-key mag volgens hun eigen documentatie niet client-side
 * gebruikt worden ("an API key must not be used client-side in an application"). Deze module
 * wordt gebruikt door de Netlify Function én door de dev-middleware in vite.config.ts, zodat
 * lokaal en in productie exact dezelfde validatie en aanroep gelden.
 */

/**
 * Het geojson-endpoint, niet `/json`: dat geeft het traject als gecodeerde polyline, dit als
 * gewone lijst van [lon, lat]-punten. Afstand en duur zijn bij allebei dezelfde. Live
 * nagekeken op 21/11/2026.
 */
const ORS_URL = 'https://api.heigit.org/openrouteservice/v2/directions/cycling-regular/geojson'

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
  /** Het traject als [lat, lon]-punten, in de volgorde van Leaflet en de rest van de app. */
  traject: [number, number][]
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
 * Vraagt één fietsroute op, met het traject erbij voor de kaart in de fiche.
 *
 * Het traject maakt het endpoint wat waardevoller voor wie het zou willen misbruiken: het wordt
 * zo een fietsplanner voor België. Sinds 2.16.0 bewust aanvaard, omdat de dieplink naar de kaart
 * van HeiGIT niet meer werkt en de route anders nergens te zien is. De bounding box blijft, en
 * `geometry_simplify` houdt het antwoord klein (Antwerpen-Centraal naar Wilrijk: 150 punten in
 * plaats van 239, zelfde afstand en duur).
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
      geometry_simplify: true,
    }),
  })
  if (!res.ok) {
    throw new Error(`ORS gaf HTTP ${res.status}`)
  }
  return leesRoute(await res.json())
}

/** Afgerond op 5 decimalen, ongeveer een meter: preciezer zie je op de kaart niet. */
const rond = (n: number) => Math.round(n * 1e5) / 1e5

/**
 * Haalt afstand, duur en traject uit het geojson-antwoord van ORS. Apart van de fetch, zodat
 * het te testen is zonder key.
 */
export function leesRoute(data: unknown): Fietsroute {
  const feature = (
    data as {
      features?: {
        geometry?: { coordinates?: unknown }
        properties?: { summary?: { distance?: unknown; duration?: unknown } }
      }[]
    }
  )?.features?.[0]
  const summary = feature?.properties?.summary
  const coordinaten = feature?.geometry?.coordinates
  if (
    !summary ||
    typeof summary.distance !== 'number' ||
    typeof summary.duration !== 'number' ||
    !Array.isArray(coordinaten)
  ) {
    throw new Error('ORS gaf geen route terug')
  }
  // ORS geeft [lon, lat] (en soms een hoogte als derde getal); omdraaien naar [lat, lon].
  const traject = coordinaten
    .filter(
      (p): p is number[] =>
        Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
    )
    .map((p): [number, number] => [rond(p[1]), rond(p[0])])
  return { afstandKm: summary.distance / 1000, duurMin: summary.duration / 60, traject }
}
