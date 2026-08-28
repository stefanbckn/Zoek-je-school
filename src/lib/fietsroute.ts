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

  cache.set(key, resultaat)
  return resultaat
}

/**
 * Dieplink naar de kaart van openrouteservice (`maps.openrouteservice.org`), met déze fietsroute
 * al ingevuld. Zelfde redenering als bij de OV-planner: een hyperlink is geen API-gebruik, dus
 * hier komt geen key aan te pas en telt dit niet mee voor onze quota.
 *
 * De vorm is een hash-route met een JSON-blok erin, live nagespeeld op 28/08/2026 (Antwerpen-
 * Centraal → Wilrijk): de kaart berekent de rit, zet het profiel op de fiets en neemt de namen
 * over in de invoervelden. **Let op: `coordinates` is lon,lat — omgekeerd van de rest van deze
 * app.** Punten scheiden met `;`, en niet gokken op extra opties: `zoom` in dat blok heeft geen
 * merkbaar effect, de kaart zoomt zelf naar de route (dat duurt een seconde of tien).
 */
export function orsKaartUrl(
  van: { lat: number; lon: number },
  naar: { lat: number; lon: number },
  namen: { van: string; naar: string },
): string {
  const data = {
    coordinates: `${van.lon},${van.lat};${naar.lon},${naar.lat}`,
    options: { profile: 'cycling-regular', preference: 'recommended' },
  }
  // Ook de namen encoderen: ze zitten in het pad, en een schoolnaam met een schuine streep
  // erin zou de route anders in stukken hakken.
  return (
    'https://maps.openrouteservice.org/#/directions/' +
    `${encodeURIComponent(namen.van)}/${encodeURIComponent(namen.naar)}/data/` +
    encodeURIComponent(JSON.stringify(data))
  )
}
