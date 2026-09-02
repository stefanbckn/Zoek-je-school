import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// Alleen de basisstijl van markercluster (positionering en de uitklap-animatie), níét
// MarkerCluster.Default.css: die brengt een eigen groen/geel/rood-schaal mee die naast het
// palet van 0.2.1 valt, en die suggereert bovendien dat een groot cluster "erger" is dan een
// klein. De bollen krijgen hun uiterlijk in src/index.css.
import 'leaflet.markercluster/dist/MarkerCluster.css'
// De bibliotheek zelf wordt al door react-leaflet-cluster geladen; deze import staat er voor
// TypeScript. `types` in tsconfig.app.json staat op `["vite/client"]`, dus @types-pakketten
// komen niet vanzelf mee, en zonder deze regel kent `L` het type `MarkerCluster` niet.
import 'leaflet.markercluster'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import { huisnummerLabel } from '../lib/adres'

// Vite bundelt de marker-afbeeldingen niet automatisch mee onder hun verwachte pad;
// dit is de gedocumenteerde workaround voor react-leaflet + Vite.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const ANTWERPEN_CENTRUM: [number, number] = [51.2194, 4.4025]

// Vanaf dit zoomniveau staan alle markers los. Een cluster dat op straatniveau blijft liggen,
// verbergt precies wat je dan wil zien: één adres kan meerdere scholen dragen, en die staan
// in de popup onder de losse marker.
const LOS_VANAF_ZOOM = 16

interface MapViewProps {
  campussen: CampusMetAfstand[]
  onSelect: (campus: CampusMetAfstand, school: SchoolOpCampus) => void
}

type CampusMetLocatie = CampusMetAfstand & { lat: number; lon: number }

// Eén clusterbol. Het getal erin is puur visueel: een cluster is géén campus en zegt niets
// over scholen, alleen hoeveel adressen er op dit zoomniveau samenvallen.
function clusterIcon(cluster: L.MarkerCluster) {
  const aantal = cluster.getChildCount()
  const maat = aantal < 10 ? 'klein' : aantal < 50 ? 'midden' : 'groot'
  const diameter = aantal < 10 ? 36 : aantal < 50 ? 44 : 52
  return L.divIcon({
    // Leaflet zet zelf `tabindex="0"` en `role="button"` op de bol (nagekeken in de DOM), dus
    // hij is met Tab bereikbaar en wordt als knop aangekondigd. Wat er niet vanzelf komt, is een
    // toegankelijke naam: `aria-label` op het buitenste element kan niet, want
    // `iconCreateFunction` levert enkel de inhoud. Vandaar de verborgen zin ernaast.
    html:
      `<span aria-hidden="true">${aantal}</span>` +
      `<span class="sr-only">${aantal} adressen, open om te spreiden</span>`,
    className: `cluster-bol cluster-bol--${maat}`,
    iconSize: L.point(diameter, diameter),
  })
}

function FitBounds({ campussen }: { campussen: CampusMetLocatie[] }) {
  const map = useMap()
  useMemo(() => {
    if (campussen.length === 0) return
    const bounds = L.latLngBounds(campussen.map((c) => [c.lat, c.lon]))
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campussen])
  return null
}

export function MapView({ campussen, onSelect }: MapViewProps) {
  // Memoized op de `campussen`-referentie: anders levert elke render (bv. het openen
  // van het detailpaneel) een nieuwe array op en zoomt FitBounds telkens terug uit,
  // ook als de resultatenlijst zelf niet veranderd is.
  const metLocatie = useMemo(
    () => campussen.filter((c): c is CampusMetLocatie => c.lat !== null && c.lon !== null),
    [campussen],
  )

  return (
    <MapContainer
      center={ANTWERPEN_CENTRUM}
      zoom={10}
      className="absolute inset-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds campussen={metLocatie} />
      <MarkerClusterGroup
        iconCreateFunction={clusterIcon}
        disableClusteringAtZoom={LOS_VANAF_ZOOM}
        maxClusterRadius={50}
        // De omtrekpolygoon bij hover heeft z'n eigen kleur en tekent een vlak over de kaart
        // dat niets toevoegt zolang klikken al inzoomt.
        showCoverageOnHover={false}
      >
        {metLocatie.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lon]} icon={defaultIcon}>
            <Popup>
              <div className="text-sm">
                <p className="text-zacht">
                  {c.straat} {huisnummerLabel(c.huisnummer)}, {c.postcode} {c.gemeente}
                </p>
                <ul className="mt-1">
                  {c.scholen.map((school) => (
                    <li key={school.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(c, school)}
                        className="text-inkt underline"
                      >
                        {school.naam}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
