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

export type FietsrouteResultaat =
  | { status: 'ok'; route: Fietsroute }
  /** Geen key geconfigureerd — is een deploy-instelling, niet iets om de bezoeker mee te confronteren. */
  | { status: 'geen-key' }
  /** Call gefaald: quota/rate limit bereikt, serverfout of netwerkfout. Verzamel dit in één
   * "even niet beschikbaar"-status — de precieze oorzaak doet er voor de bezoeker niet toe. */
  | { status: 'onbeschikbaar' }

interface OrsResponse {
  routes: { summary: { distance: number; duration: number } }[]
}

const cache = new Map<string, FietsrouteResultaat>()

export async function berekenFietsroute(
  van: { lat: number; lon: number },
  naar: { lat: number; lon: number },
): Promise<FietsrouteResultaat> {
  if (!API_KEY) return { status: 'geen-key' }

  const key = `${van.lat},${van.lon}-${naar.lat},${naar.lon}`
  const cached = cache.get(key)
  if (cached) return cached

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
      // Inclusief 429 (rate limit/quota bereikt) — geen retry-storm, wel cachen zodat we
      // niet blijven aankloppen zolang de bezoeker op dezelfde pagina blijft.
      const resultaat: FietsrouteResultaat = { status: 'onbeschikbaar' }
      cache.set(key, resultaat)
      return resultaat
    }
    const data: OrsResponse = await res.json()
    const summary = data.routes[0]?.summary
    if (!summary) {
      const resultaat: FietsrouteResultaat = { status: 'onbeschikbaar' }
      cache.set(key, resultaat)
      return resultaat
    }
    const resultaat: FietsrouteResultaat = {
      status: 'ok',
      route: { afstandKm: summary.distance / 1000, duurMin: summary.duration / 60 },
    }
    cache.set(key, resultaat)
    return resultaat
  } catch {
    const resultaat: FietsrouteResultaat = { status: 'onbeschikbaar' }
    cache.set(key, resultaat)
    return resultaat
  }
}
