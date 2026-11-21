import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { Fietsroute } from '../lib/fietsroute'
import { schoolIcoon } from '../lib/kaarticoon'
import { useDialoogFocus } from '../lib/useDialoogFocus'

interface FietsrouteVensterProps {
  open: boolean
  onClose: () => void
  route: Fietsroute
  schoolNaam: string
  /** Het adres dat de ouder ingaf, of null als we het niet als tekst kennen. */
  vertrekLabel: string | null
}

/**
 * "Bekijk de fietsroute": de route van HeiGIT op een kaart, groter dan in de fiche past.
 *
 * Bestaat sinds 2.16.0. Daarvoor linkte de fiche naar de kaart van openrouteservice zelf, maar
 * die nieuwe kaart (routing.heigit.org) neemt geen start- en eindpunt uit een link. Het traject
 * komt uit dezelfde call als de km en minuten in de fiche, dus dit venster kost geen extra
 * call naar HeiGIT. Enkel de kaarttegels laden, en pas wanneer iemand het venster opent.
 *
 * **Via een portal in de body**, niet in de fiche. De focusval van de fiche luistert op Tab
 * binnen zijn eigen venster; stond dit venster daarin, dan vochten de twee vallen om dezelfde
 * toets.
 *
 * **Escape sluit enkel dit venster.** De fiche luistert ook op Escape, op `document`. Dit
 * venster luistert in de capture-fase op `window`, dus vóór de fiche, en houdt de toets daar
 * tegen. Zonder dat sloot één Escape allebei.
 *
 * **Slepen en het muiswiel mogen hier gewoon.** In de fiche zou de kaart het scrollen van de
 * pagina kapen; dit venster scrollt niet, dus dat probleem bestaat hier niet.
 */
export function FietsrouteVenster({
  open,
  onClose,
  route,
  schoolNaam,
  vertrekLabel,
}: FietsrouteVensterProps) {
  const vensterRef = useDialoogFocus<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    function opToets(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', opToets, true)
    return () => window.removeEventListener('keydown', opToets, true)
  }, [open, onClose])

  const grenzen = useMemo(() => L.latLngBounds(route.traject), [route.traject])

  if (!open) return null

  const start = route.traject[0]
  const einde = route.traject[route.traject.length - 1]

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-dvh w-full flex-col bg-kaart shadow-xl focus:outline-none sm:h-[80vh] sm:max-w-5xl sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
        ref={vensterRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fietsroute-titel"
      >
        <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3 sm:px-6">
          <div>
            <h2 id="fietsroute-titel" className="text-lg font-semibold text-inkt">
              Fietsroute naar {schoolNaam}
            </h2>
            <p className="text-sm text-zacht">
              {route.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km ·{' '}
              {Math.round(route.duurMin)} min
              {vertrekLabel && <> vanaf {vertrekLabel}</>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center text-zacht hover:text-inkt"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div className="relative min-h-0 flex-1 border-y border-rand">
          <MapContainer
            bounds={grenzen}
            boundsOptions={{ padding: [32, 32] }}
            className="absolute inset-0"
          >
            <PastRouteIn grenzen={grenzen} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Twee lijnen op elkaar: een brede witte rand onder de gekleurde lijn houdt de
                route zichtbaar boven drukke of donkere tegels. */}
            <Polyline positions={route.traject} pathOptions={{ className: 'fietsroute-rand' }} />
            <Polyline positions={route.traject} pathOptions={{ className: 'fietsroute-lijn' }} />
            <CircleMarker
              center={start}
              radius={7}
              pathOptions={{ className: 'fietsroute-start' }}
            />
            <Marker position={einde} icon={schoolIcoon} />
          </MapContainer>
        </div>

        <div className="px-4 py-2 text-xs text-zacht sm:px-6">
          <p>Het bolletje is je vertrekpunt, het speldje de school. Geen verkeersinschatting.</p>
          {/* Letterlijk dezelfde vermelding als in de fiche: contractueel, zie
              .claude/rules/reistijd.md. Dit venster ligt over de fiche heen. */}
          <p>Route © openrouteservice by HeiGIT, data van OpenStreetMap</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Past de hele route in beeld, ook wanneer het venster van grootte verandert: een telefoon die
 * draait, of een browservenster dat smaller wordt. Leaflet merkt dat zelf niet; met enkel
 * `invalidateSize` bleven het midden en de zoom staan en vielen begin en einde buiten beeld.
 * Nagekeken in de preview door van laptop- naar telefoonbreedte te gaan.
 */
function PastRouteIn({ grenzen }: { grenzen: L.LatLngBounds }) {
  const map = useMap()
  useEffect(() => {
    const waarnemer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
      map.fitBounds(grenzen, { padding: [32, 32], animate: false })
    })
    waarnemer.observe(map.getContainer())
    return () => waarnemer.disconnect()
  }, [map, grenzen])
  return null
}
