// Roept onze EIGEN server-side proxy aan (Netlify Function op /api/fietsroute), niet
// OpenRouteService rechtstreeks. Reden: de ORS-key mag volgens hun documentatie niet
// client-side gebruikt worden. De key zit dus in de serveromgeving en komt nooit in deze
// bundle terecht. Bijkomend voordeel: same-origin, dus geen CORS-kwestie. Zie .claude/rules/reistijd.md.
const PROXY_URL = `${import.meta.env.BASE_URL}api/fietsroute`

export interface Fietsroute {
  afstandKm: number
  duurMin: number
  /** Het traject als [lat, lon]-punten, voor de kaart in het venster "Bekijk de fietsroute". */
  traject: [number, number][]
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
          ? { status: 'ok', route: { ...route, traject: geldigTraject(route.traject) } }
          : { status: 'onbeschikbaar' }
    } else if (res.status === 503 || res.status === 404) {
      // 503 = server heeft geen key ingesteld; 404 = functie draait niet (bv. plain `npm run dev`
      // zonder de dev-middleware). In beide gevallen is dit een configuratiezaak, geen storing:
      // stil niets tonen in plaats van de bezoeker met een foutmelding opzadelen.
      // Wél een console-waarschuwing: anders verdwijnt de fietsregel spoorloos en is er geen
      // enkel spoor om op te debuggen — precies wat bij de eerste deploy misging.
      console.warn(
        `[fietsroute] ${PROXY_URL} gaf HTTP ${res.status}. ` +
          `Controleer of de env var ORS_API_KEY in Netlify is ingesteld met scope "Functions", ` +
          `voor de juiste deploy context, en of er daarna opnieuw gedeployed is.`,
      )
      resultaat = { status: 'geen-key' }
    } else {
      resultaat = { status: 'onbeschikbaar' }
    }
  } catch {
    resultaat = { status: 'onbeschikbaar' }
  }

  // 'onbeschikbaar' is een tijdelijke toestand (quota, storing, netwerk) en de UI zegt "probeer
  // later opnieuw". In de cache zou dat een leugen worden: de rest van de sessie kwam er dan
  // geen nieuwe poging meer. Enkel wat bij een nieuwe call hetzelfde zou opleveren, blijft staan.
  if (resultaat.status !== 'onbeschikbaar') cache.set(key, resultaat)
  return resultaat
}

/**
 * Het traject, of een lege lijst als het ontbreekt. Een antwoord van vóór 2.16.0 kan nog een dag
 * in de browsercache zitten (`max-age` van een dag) en heeft enkel afstand en duur. Die blijven
 * dan gewoon zichtbaar; enkel de link naar de kaart valt weg.
 */
function geldigTraject(traject: unknown): [number, number][] {
  if (!Array.isArray(traject) || traject.length < 2) return []
  const geldig = traject.every(
    (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  )
  return geldig ? (traject as [number, number][]) : []
}
