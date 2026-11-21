import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Het speldje van een school, op de hoofdkaart en op de kaart van de fietsroute.
 *
 * Vite bundelt de marker-afbeeldingen niet automatisch mee onder hun verwachte pad; dit is de
 * gedocumenteerde workaround voor react-leaflet + Vite.
 */
export const schoolIcoon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
