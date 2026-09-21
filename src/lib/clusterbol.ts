import L from 'leaflet'

/**
 * Eén clusterbol, gedeeld door de kaart in de zoeker (MapView.tsx) en die op een stadspagina
 * (gemeentekaart.ts). Het getal erin is puur visueel: een cluster is géén campus en zegt niets
 * over scholen, alleen hoeveel adressen er op dit zoomniveau samenvallen.
 *
 * Het uiterlijk zit in `.cluster-bol` in src/index.css, bewust niet in
 * MarkerCluster.Default.css: die brengt een groen/geel/rood-schaal mee die naast het palet
 * valt en suggereert dat een groot cluster "erger" is dan een klein.
 */
export function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
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

/**
 * Vanaf dit zoomniveau staan alle markers los. Een cluster dat op straatniveau blijft liggen,
 * verbergt precies wat je dan wil zien: één adres kan meerdere scholen dragen.
 */
export const LOS_VANAF_ZOOM = 16
