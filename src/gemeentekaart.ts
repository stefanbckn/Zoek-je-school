/**
 * De kaart op een stadspagina (`/gemeente/<slug>/`).
 *
 * Losse Leaflet, géén React: die pagina's zijn statische HTML en moeten leesbaar blijven
 * zonder JavaScript. De adreslijst staat dus volledig in de HTML; deze kaart komt er bovenop
 * en is nooit de enige weg naar een adres.
 *
 * De markers komen uit een `<script type="application/json">`-blok dat
 * scripts/gemeentepagina-html.ts meeschrijft. Dat blok wordt niet uitgevoerd, dus de CSP
 * (`script-src 'self'`) blijft ongemoeid, en de tiles komen van dezelfde OSM-server als de
 * zoeker, die al in `img-src` staat.
 *
 * Clustert net als de kaart in de zoeker, en met dezelfde bollen. Dat is niet omdat het er
 * veel zijn, maar omdat een stad haar deelgemeenten meetelt: Brugge loopt door tot Zeebrugge,
 * vijftien kilometer noordelijker. Zonder cluster past de kaart zich op die spreiding in en
 * verdwijnt het centrum in een hoopje spelden. Nu zie je eerst de hele stad, klik je de bol
 * van het centrum aan en zoomt hij in.
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// Alleen de basisstijl van markercluster, níét MarkerCluster.Default.css. Het waarom staat bij
// clusterIcon in src/lib/clusterbol.ts.
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { LOS_VANAF_ZOOM, clusterIcon } from './lib/clusterbol'

interface KaartSchool {
  naam: string
  net: string
  href: string
}

interface KaartAdres {
  lat: number
  lon: number
  adres: string
  plaats: string
  scholen: KaartSchool[]
}

// Zelfde workaround als in MapView.tsx: Vite bundelt de marker-afbeeldingen niet automatisch
// mee onder het pad dat Leaflet verwacht.
const icoon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function start(): void {
  const doel = document.getElementById('kaart')
  const data = document.getElementById('kaartdata')
  if (doel === null || data === null) return

  let adressen: KaartAdres[]
  try {
    adressen = JSON.parse(data.textContent ?? '[]') as KaartAdres[]
  } catch {
    // Onleesbare data: laat de lege container weg in plaats van een half kapotte kaart te tonen.
    doel.remove()
    return
  }
  if (adressen.length === 0) {
    doel.remove()
    return
  }

  const kaart = L.map(doel, {
    // De kaart staat midden in een lange leespagina. Met scrollWheelZoom aan kaapt ze het
    // scrollen van de pagina zodra de muis erover komt; de knoppen +/- blijven wel werken.
    scrollWheelZoom: false,
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers',
    maxZoom: 19,
  }).addTo(kaart)

  const groep = L.markerClusterGroup({
    iconCreateFunction: clusterIcon,
    disableClusteringAtZoom: LOS_VANAF_ZOOM,
    maxClusterRadius: 50,
    // De omtrekpolygoon bij hover tekent een vlak over de kaart dat niets toevoegt zolang
    // klikken al inzoomt. Zelfde keuze als in MapView.tsx.
    showCoverageOnHover: false,
  })
  const punten: L.LatLngExpression[] = []
  for (const a of adressen) {
    punten.push([a.lat, a.lon])
    groep.addLayer(
      L.marker([a.lat, a.lon], { icon: icoon, title: `${a.adres}, ${a.plaats}` }).bindPopup(popup(a)),
    )
  }
  kaart.addLayer(groep)
  // Géén maxZoom hier: bij een stad die in één straat past, mag hij gerust ver inzoomen. De
  // spreiding van een stad als Brugge vangt het cluster op, niet een zoomgrens.
  kaart.fitBounds(L.latLngBounds(punten), { padding: [30, 30] })
}

function popup(a: KaartAdres): string {
  const regels = a.scholen
    .map(
      (s) =>
        `<li><a href="${esc(s.href)}">${esc(s.naam)}</a> <span class="text-zacht">· ${esc(s.net)}</span></li>`,
    )
    .join('')
  return `<p class="font-medium">${esc(a.adres)}</p><p class="text-zacht">${esc(a.plaats)}</p><ul class="mt-1 space-y-1">${regels}</ul>`
}

function esc(waarde: string): string {
  return waarde
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

start()
