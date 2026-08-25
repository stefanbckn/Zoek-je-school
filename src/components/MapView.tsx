import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { VestigingMetAfstand } from '../types'

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
  vestigingen: VestigingMetAfstand[]
  onSelect: (vestiging: VestigingMetAfstand) => void
}

type VestigingMetLocatie = VestigingMetAfstand & { lat: number; lon: number }

function FitBounds({ vestigingen }: { vestigingen: VestigingMetLocatie[] }) {
  const map = useMap()
  useMemo(() => {
    if (vestigingen.length === 0) return
    const bounds = L.latLngBounds(vestigingen.map((v) => [v.lat, v.lon]))
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vestigingen])
  return null
}

export function MapView({ vestigingen, onSelect }: MapViewProps) {
  // Memoized op de `vestigingen`-referentie: anders levert elke render (bv. het
  // openen van het detailpaneel) een nieuwe array op en zoomt FitBounds telkens
  // terug uit, ook als de resultatenlijst zelf niet veranderd is.
  const metLocatie = useMemo(
    () => vestigingen.filter((v): v is VestigingMetLocatie => v.lat !== null && v.lon !== null),
    [vestigingen],
  )

  return (
    <MapContainer
      center={ANTWERPEN_CENTRUM}
      zoom={10}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds vestigingen={metLocatie} />
      {metLocatie.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lon]} icon={defaultIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{v.naam}</p>
              <p className="text-slate-500">
                {v.straat} {v.huisnummer}, {v.postcode} {v.gemeente}
              </p>
              <button
                type="button"
                onClick={() => onSelect(v)}
                className="mt-2 text-slate-900 underline"
              >
                Details bekijken
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
