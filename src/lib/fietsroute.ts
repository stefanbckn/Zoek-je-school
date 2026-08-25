// OpenRouteService Directions API via het HeiGIT-gateway-domein (api.heigit.org), NIET
// api.openrouteservice.org — dat laatste geeft geen CORS-headers op de echte respons (enkel
// op de preflight), waardoor de browser elke call blokkeert. Geverifieerd met een echte key:
// api.heigit.org/openrouteservice/v2/... geeft wél `access-control-allow-origin: *` op de
// werkelijke 200-respons. Request/response-vorm bevestigd via een live testcall. Zie CLAUDE.md.
const ORS_URL = 'https://api.heigit.org/openrouteservice/v2/directions/cycling-regular/json'
const API_KEY = import.meta.env.VITE_ORS_API_KEY as string | undefined

export interface Fietsroute {
  afstandKm: number
  duurMin: number
}

interface OrsResponse {
  routes: { summary: { distance: number; duration: number } }[]
}

const cache = new Map<string, Fietsroute | null>()

export async function berekenFietsroute(
  van: { lat: number; lon: number },
  naar: { lat: number; lon: number },
): Promise<Fietsroute | null> {
  if (!API_KEY) return null

  const key = `${van.lat},${van.lon}-${naar.lat},${naar.lon}`
  if (cache.has(key)) return cache.get(key)!

  try {
    const res = await fetch(ORS_URL, {
      method: 'POST',
      headers: {
        Authorization: API_KEY,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [van.lon, van.lat],
          [naar.lon, naar.lat],
        ],
      }),
    })
    if (!res.ok) {
      cache.set(key, null)
      return null
    }
    const data: OrsResponse = await res.json()
    const summary = data.routes[0]?.summary
    if (!summary) {
      cache.set(key, null)
      return null
    }
    const route: Fietsroute = {
      afstandKm: summary.distance / 1000,
      duurMin: summary.duration / 60,
    }
    cache.set(key, route)
    return route
  } catch {
    cache.set(key, null)
    return null
  }
}
