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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * Waar de kaart staat vóór `FitBounds` de resultaten inpast, en bij nul resultaten. Het midden
 * van de databounds (lat 50,72 tot 51,47 en lon 2,59 tot 5,79, gemeten op de volledige dataset
 * op 02/09/2026), niet een gekozen stad: elke stad hier neerzetten is een keuze die niets
 * oplevert en die veroudert zodra de dataset verschuift.
 */
const DATA_MIDDEN: [number, number] = [51.09, 4.19]

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

// Op een Mac is ⌘ de toets die hier voor de hand ligt; ctrl doet daar de systeemzoom. Elders is
// het net ctrl. Eén keer bepalen volstaat: het toetsenbord wisselt niet tijdens een bezoek.
const ZOOMTOETS =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'ctrl'

/**
 * Het muiswiel stuurt standaard de zoom van Leaflet, en dan zit je op een laptop vast: boven de
 * kaart scrolt de pagina niet meer verder. Dit laat het wiel met rust tenzij ctrl of ⌘ ingedrukt
 * is, zoals de meeste kaarten in een lange pagina het doen.
 *
 * De listener hangt op de óuder van de kaart en niet op de kaart zelf. Leaflet luistert op zijn
 * eigen container; een listener op datzelfde element loopt in volgorde van registratie en niet
 * per se eerst. Vanaf de ouder is het altijd de capture-fase, en dan komt het wiel-event nooit
 * bij Leaflet aan. `preventDefault` blijft achterwege, dus de pagina scrolt gewoon door.
 *
 * Met ctrl of ⌘ erbij laten we het event ongemoeid en zoomt Leaflet zoals altijd, inclusief het
 * knijpgebaar op een trackpad — dat komt in de browser binnen als een wiel-event met ctrlKey.
 */
function WielAlleenMetToets({ onGeblokkeerd }: { onGeblokkeerd: () => void }) {
  const map = useMap()

  useEffect(() => {
    const ouder = map.getContainer().parentElement
    if (!ouder) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return
      e.stopPropagation()
      onGeblokkeerd()
    }

    ouder.addEventListener('wheel', onWheel, { capture: true })
    return () => ouder.removeEventListener('wheel', onWheel, { capture: true })
  }, [map, onGeblokkeerd])

  return null
}

/**
 * Leaflet meet zijn container één keer bij het opzetten en daarna enkel nog bij een
 * venster-resize. Sinds de kaarthoogte gemeten wordt (zie `useKaartHoogte`) verandert die
 * container ook zónder resize, en dan blijft Leaflet met de oude hoogte rekenen: tegels boven
 * een gebied dat er niet meer is, en een muispositie die niet klopt met wat je aanwijst.
 * Nagemeten: zonder dit hield `map.getSize()` 1305px vast terwijl de kaart al 524px was.
 */
function VolgtGrootte() {
  const map = useMap()

  useEffect(() => {
    const waarnemer = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    waarnemer.observe(map.getContainer())
    return () => waarnemer.disconnect()
  }, [map])

  return null
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

  // De hint verschijnt pas wanneer iemand het wiel gebruikt en er niets gebeurt. Hem permanent
  // tonen zou een balk over de kaart leggen voor een probleem dat de meeste bezoekers niet hebben.
  const [hint, setHint] = useState(false)
  const hintTimer = useRef<number | undefined>(undefined)
  const toonHint = useCallback(() => {
    setHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setHint(false), 1500)
  }, [])
  useEffect(() => () => window.clearTimeout(hintTimer.current), [])

  return (
    <MapContainer
      center={DATA_MIDDEN}
      zoom={8}
      className="absolute inset-0"
      scrollWheelZoom
    >
      <VolgtGrootte />
      <WielAlleenMetToets onGeblokkeerd={toonHint} />
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
      {/* Boven de kaartlagen (Leaflet gebruikt tot z-index 800) en klikdoorlatend, anders vangt
          de hint zelf het volgende gebaar op. `aria-hidden`: wie met het toetsenbord werkt,
          gebruikt de +- en --knoppen van Leaflet en heeft niets aan een tip over het wiel. */}
      {hint && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center"
        >
          <p className="rounded-md bg-black/70 px-4 py-2 text-sm text-white">
            Gebruik {ZOOMTOETS} + scrollen om te zoomen
          </p>
        </div>
      )}
    </MapContainer>
  )
}
