import { haalFietsroute, parsePunt } from '../../shared/ors.js'

/**
 * Server-side proxy naar OpenRouteService.
 *
 * Bestaat omdat de ORS-key niet client-side gebruikt mág worden (zie shared/ors.ts en .claude/rules/reistijd.md).
 * De browser roept dit endpoint aan zonder key; de key blijft in de server-side omgeving.
 *
 * Let op: dit endpoint is publiek bereikbaar — dat kan niet anders, de site is publiek. De
 * beperkingen hieronder maken misbruik onaantrekkelijk in plaats van onmogelijk:
 *  - alleen GET
 *  - coördinaten moeten binnen de bounding box rond België vallen
 *  - alleen het fietsprofiel, hardcoded (geen vrije profielkeuze door de aanroeper)
 *  - antwoord bevat enkel afstand + duur, geen route-geometrie
 *  - geen CORS-header, dus andere websites kunnen het niet vanuit de browser aanroepen
 *  - resultaten worden een dag gecachet op de CDN, wat ORS-quota spaart
 */

function json(body: unknown, status: number, cacheSeconds = 0): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    // Bewust GEEN Access-Control-Allow-Origin: enkel onze eigen pagina (same-origin) mag dit
    // vanuit de browser aanroepen.
    'X-Content-Type-Options': 'nosniff',
  }
  headers['Cache-Control'] =
    cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : 'no-store'
  return new Response(JSON.stringify(body), { status, headers })
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return json({ fout: 'Alleen GET toegestaan.' }, 405)
  }

  const params = new URL(req.url).searchParams
  const van = parsePunt(params.get('van'))
  const naar = parsePunt(params.get('naar'))
  if (!van || !naar) {
    return json(
      { fout: 'Ongeldige of ontbrekende coördinaten. Verwacht: ?van=lat,lon&naar=lat,lon' },
      400,
    )
  }

  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) {
    // Ontbrekende serverconfiguratie — log het, maar lek niets naar de client.
    console.error('ORS_API_KEY ontbreekt in de omgeving van de Netlify Function.')
    return json({ fout: 'Route-service niet geconfigureerd.' }, 503)
  }

  try {
    const route = await haalFietsroute(van, naar, apiKey)
    // Een dag cachen: dezelfde twee punten geven altijd dezelfde route.
    return json(route, 200, 86400)
  } catch (err) {
    console.error('Fietsroute ophalen mislukt:', err)
    return json({ fout: 'Route momenteel niet beschikbaar.' }, 502)
  }
}

export const config = { path: '/api/fietsroute' }
