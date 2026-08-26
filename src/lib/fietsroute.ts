// Roept onze EIGEN server-side proxy aan (Netlify Function op /api/fietsroute), niet
// OpenRouteService rechtstreeks. Reden: de ORS-key mag volgens hun documentatie niet
// client-side gebruikt worden. De key zit dus in de serveromgeving en komt nooit in deze
// bundle terecht. Bijkomend voordeel: same-origin, dus geen CORS-kwestie. Zie CLAUDE.md.
const PROXY_URL = `${import.meta.env.BASE_URL}api/fietsroute`

export interface Fietsroute {
  afstandKm: number
  duurMin: number
}

export type FietsrouteResultaat =
  | { status: 'ok'; route: Fietsroute }
  /** Route-service niet geconfigureerd (geen key op de server) of endpoint niet beschikbaar. */
  | { status: 'geen-key' }
  /** Call gefaald: quota/rate limit bereikt, serverfout of netwerkfout. */
  | { status: 'onbeschikbaar' }

const cache = new Map<string, FietsrouteResultaat>()

export async function berekenFietsroute(
  van: { lat: number; lon: number },
  naar: { lat: number; lon: number },
): Promise<FietsrouteResultaat> {
  const key = `${van.lat},${van.lon}-${naar.lat},${naar.lon}`
  const cached = cache.get(key)
  if (cached) return cached

  const url =
    `${PROXY_URL}?van=${van.lat},${van.lon}&naar=${naar.lat},${naar.lon}`

  let resultaat: FietsrouteResultaat
  try {
    const res = await fetch(url)
    if (res.ok) {
      const route = (await res.json()) as Fietsroute
      resultaat =
        Number.isFinite(route.afstandKm) && Number.isFinite(route.duurMin)
          ? { status: 'ok', route }
          : { status: 'onbeschikbaar' }
    } else if (res.status === 503 || res.status === 404) {
      // 503 = server heeft geen key ingesteld; 404 = functie draait niet (bv. plain `npm run dev`
      // zonder de dev-middleware). In beide gevallen is dit een configuratiezaak, geen storing:
      // stil niets tonen in plaats van de bezoeker met een foutmelding opzadelen.
      resultaat = { status: 'geen-key' }
    } else {
      resultaat = { status: 'onbeschikbaar' }
    }
  } catch {
    resultaat = { status: 'onbeschikbaar' }
  }

  cache.set(key, resultaat)
  return resultaat
}
