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
 * Geen clustering zoals in MapView.tsx: daar gaat het over 1075 adressen, hier over enkele
 * tientallen. Een cluster zou hier alleen maar verbergen.
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

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

  const punten: L.LatLngExpression[] = []
  for (const a of adressen) {
    punten.push([a.lat, a.lon])
    L.marker([a.lat, a.lon], { icon: icoon, title: `${a.adres}, ${a.plaats}` })
      .addTo(kaart)
      .bindPopup(popup(a))
  }
  kaart.fitBounds(L.latLngBounds(punten), { padding: [30, 30], maxZoom: 15 })
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
