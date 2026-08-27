import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { CampusMetAfstand, SchoolOpCampus } from '../types'

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

interface MapViewProps {
  campussen: CampusMetAfstand[]
  onSelect: (campus: CampusMetAfstand, school: SchoolOpCampus) => void
}

type CampusMetLocatie = CampusMetAfstand & { lat: number; lon: number }

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
      {metLocatie.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lon]} icon={defaultIcon}>
          <Popup>
            <div className="text-sm">
              <p className="text-zacht">
                {c.straat} {c.huisnummer}, {c.postcode} {c.gemeente}
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
    </MapContainer>
  )
}
