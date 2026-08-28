// Reistijd met het openbaar vervoer, via Transitous — een gratis community-instantie van MOTIS
// die de GTFS- en GTFS-RT-feeds van De Lijn, NMBS en MIVB al inleest. Geen key, geen account.
//
// Bewust RECHTSTREEKS vanuit de browser, niet via een Netlify Function zoals de fietsroute.
// Daar was de reden een geheime key; die is hier niet. Proxyen zou hier zelfs schadelijk zijn:
// Transitous herkent browsergebruikers aan de Referer-header, en die verdwijnt zodra onze eigen
// server de call doorzet. Zie CLAUDE.md.
//
// De Lijn heeft zelf géén routeplanner-API (die is uit hun v1 verdwenen) — niet opnieuw gaan
// zoeken.
const API_URL = 'https://api.transitous.org/api/v1/plan'

export interface OvReis {
  duurMin: number
  overstappen: number
  /**
   * Lijnnummers van de rit-delen, in volgorde. Bv. ['A3', '51'].
   *
   * Bewust zónder vervoermiddel erbij ("bus 51", "trein S1"). De `mode` in de feed is daarvoor
   * niet betrouwbaar genoeg: geverifieerd dat de S-treinen van NMBS binnenkomen als `METRO`, en
   * Antwerpen heeft geen metro. Een fout vervoermiddel op het scherm is erger dan geen.
   */
  lijnen: string[]
  /** Totale wandeltijd binnen de reis (naar de halte, overstappen, en van de halte). */
  wandelMin: number
  /** Moment waarvoor gepland is — de dienstregeling verschilt per dag. */
  vertrek: Date
  aankomst: Date
}

export type OvReisResultaat =
  | { status: 'ok'; reis: OvReis }
  /**
   * Geen enkele rit met bus of trein, maar wel een wandelroute. Dat is bij korte afstanden de
   * normale uitkomst, niet een fout: MOTIS geeft dan een lege `itineraries` en zet de
   * wandelroute in `direct`. Geverifieerd op een rit van 400 m. Als "geen verbinding" tonen zou
   * onzin zijn — de school is gewoon te dichtbij om de bus voor te nemen.
   */
  | { status: 'te-voet'; wandelMin: number }
  /** De dienst antwoordde, maar vond geen rit én geen wandelroute. */
  | { status: 'geen-verbinding' }
  /** Call gefaald: storing, rate limit of netwerkfout. */
  | { status: 'onbeschikbaar' }

interface TransitousLeg {
  mode: string
  duration: number
  routeShortName?: string | null
}

interface TransitousItinerary {
  duration: number
  transfers: number
  startTime: string
  endTime: string
  legs: TransitousLeg[]
}

const cache = new Map<string, OvReisResultaat>()

/**
 * Het moment waarop de reis aan moet komen: 8u30 op de eerstvolgende weekdag. Een schoolrit
 * vroeg in de ochtend heeft een heel andere dienstregeling dan het moment waarop iemand toevallig
 * zit te zoeken — een zaterdagavond geeft een misleidend beeld.
 *
 * Vakantieperiodes vangt dit niet op: in juli krijg je de vakantiedienstregeling. Daarom toont de
 * UI de datum waarvoor gerekend is, in plaats van de reistijd als een vaststaand gegeven te
 * presenteren.
 */
export function volgendeSchooldagOchtend(nu = new Date()): Date {
  const doel = new Date(nu)
  doel.setHours(8, 30, 0, 0)
  // Is die 8u30 al voorbij, dan mikken we op de volgende dag. Daarna doorschuiven tot het een
  // weekdag is (getDay: 0 = zondag, 6 = zaterdag).
  if (doel <= nu) doel.setDate(doel.getDate() + 1)
  while (doel.getDay() === 0 || doel.getDay() === 6) doel.setDate(doel.getDate() + 1)
  return doel
}

export async function berekenOvReis(
  van: { lat: number; lon: number },
  naar: { lat: number; lon: number },
  aankomst = volgendeSchooldagOchtend(),
): Promise<OvReisResultaat> {
  const key = `${van.lat},${van.lon}-${naar.lat},${naar.lon}-${aankomst.toISOString()}`
  const cached = cache.get(key)
  if (cached) return cached

  // arriveBy=true → de opgegeven tijd is de gewenste aankomst, niet het vertrek. Geverifieerd:
  // de teruggegeven ritten eindigen vóór dat moment.
  const url =
    `${API_URL}?fromPlace=${van.lat},${van.lon}&toPlace=${naar.lat},${naar.lon}` +
    `&time=${encodeURIComponent(aankomst.toISOString())}&arriveBy=true&numItineraries=1`

  let resultaat: OvReisResultaat
  try {
    const res = await fetch(url)
    if (!res.ok) {
      resultaat = { status: 'onbeschikbaar' }
    } else {
      const data = (await res.json()) as {
        itineraries?: TransitousItinerary[]
        direct?: TransitousItinerary[]
      }
      const rit = data.itineraries?.[0]
      const teVoet = data.direct?.[0]
      if (rit) {
        resultaat = { status: 'ok', reis: naarOvReis(rit) }
      } else if (teVoet) {
        resultaat = { status: 'te-voet', wandelMin: Math.round(teVoet.duration / 60) }
      } else {
        resultaat = { status: 'geen-verbinding' }
      }
    }
  } catch {
    resultaat = { status: 'onbeschikbaar' }
  }

  cache.set(key, resultaat)
  return resultaat
}

function naarOvReis(rit: TransitousItinerary): OvReis {
  const ritDelen = rit.legs.filter((l) => l.mode !== 'WALK')
  const wandelSeconden = rit.legs
    .filter((l) => l.mode === 'WALK')
    .reduce((som, l) => som + l.duration, 0)

  return {
    duurMin: Math.round(rit.duration / 60),
    overstappen: rit.transfers,
    // Een lijn zonder nummer (komt voor bij sommige feeds) laten we weg in plaats van "null" of
    // een lege chip te tonen.
    lijnen: ritDelen.map((l) => l.routeShortName).filter((n): n is string => Boolean(n)),
    wandelMin: Math.round(wandelSeconden / 60),
    vertrek: new Date(rit.startTime),
    aankomst: new Date(rit.endTime),
  }
}

/**
 * Dieplink naar de webplanner van Transitous, met de route al ingevuld.
 *
 * Dit is géén API-gebruik: `api.transitous.org` serveert op de root de MOTIS-webinterface (de
 * API zelf zit onder `/api/`). Wie de link volgt, doet zelf een call — wij niet. De URL-vorm is
 * afgeleid uit hun `widget.js` en daarna live nagespeeld (28/08/2026), zie CLAUDE.md.
 *
 * Bewust dezelfde `aankomst` als de API-call meegeven: anders opent de link op "nu vertrekken"
 * en ziet de gebruiker andere reistijden dan wat er op het scherm staat.
 */
export function transitousPlannerUrl(
  van: { lat: number; lon: number },
  naar: { lat: number; lon: number },
  namen: { van: string; naar: string },
  aankomst = volgendeSchooldagOchtend(),
): string {
  const params = new URLSearchParams({
    fromPlace: `${van.lat},${van.lon}`,
    toPlace: `${naar.lat},${naar.lon}`,
    fromName: namen.van,
    toName: namen.naar,
    time: lokaleTijdstempel(aankomst),
    arriveBy: 'true',
  })
  return `https://api.transitous.org?${params.toString()}`
}

/**
 * `YYYY-MM-DDTHH:mm` in lokale tijd — het formaat dat de webplanner in z'n URL gebruikt.
 * Niet `toISOString()`: dat zet om naar UTC, en dan opent de planner in de zomer op 6u30.
 */
function lokaleTijdstempel(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
