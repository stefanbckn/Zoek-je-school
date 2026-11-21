# Fietsroute — openrouteservice / HeiGIT

De fietsafstand en -tijd in het detailpaneel komen van **openrouteservice**, via onze eigen
Netlify Function. De praktische regels staan in `.claude/rules/reistijd.md`; dit is het
onderzoek en de voorwaarden.

## De key mag niet client-side

De officiële ORS-documentatie
(`giscience.github.io/openrouteservice/frequently-asked-questions.html`) is expliciet:
*"every HeiGIT API key belongs to one person"* en *"an API key must not be used client-side in
an application: Inspecting the requests sent by the application would 'leak' the API key"*.
Hun aanbevolen oplossing is server-side proxyen.

**Domeinrestrictie bestaat niet** bij HeiGIT. Nagekeken in het dashboard en in de docs. Dat is
dus géén beschikbare mitigatie; eerder in dit project is ze ten onrechte als oplossing
voorgesteld.

**Opgelost.** In v0.1 stond de key nog met een `VITE_`-prefix in de publieke bundle, en dat was
verifieerbaar lek. Vandaag draait de call via `netlify/functions/fietsroute.mts` met
`shared/ors.ts`: de browser praat met ons eigen endpoint zonder key, de key staat in de
server-side omgeving (`ORS_API_KEY`, zonder `VITE_`). Dat lost meteen ook de CORS-kwestie op,
want het is dan same-origin.

## Quota en account

- Account en key via `https://account.heigit.org` (self-service signup).
- Gratis tier: **2000 calls/dag, 40/minuut**, geverifieerd op de prijzenpagina van het
  HeiGIT-account.
- Er bestaat een gratis **"Collaborative"-tier (10.000/dag)** voor onderwijs, overheid en
  non-profit. **Dit project zit op dat plan** (bevestigd door de gebruiker op 22/09/2026).

## Attributie is contractueel

De HeiGIT-voorwaarden eisen de vermelding "© openrouteservice by HeiGIT | Data from
OpenStreetMap" **letterlijk**, en hun routeresultaten staan onder **CC-BY-SA 4.0**. Weghalen
mag dus niet, ook niet "even voor de opmaak". Geverifieerd in de ToS op
`account.heigit.org/info/tos` (27/08/2026).

Diezelfde ToS bevat **géén non-commerciële beperking**, dus een donatieknop op de site raakt
dit niet. (Bij Transitous ligt dat anders, zie [openbaar-vervoer.md](./openbaar-vervoer.md).)

De vermelding staat in `Footer.tsx` en nogmaals in `DetailPanel.tsx`, omdat dat paneel als
modaal venster over de footer ligt. De **link** op het woord "openrouteservice" is uit het
paneel gehaald en staat enkel in de footer: de vermelding is contractueel, de link erin niet.

## De route op een kaart tonen

### Tot 2.15.0: een dieplink naar maps.openrouteservice.org

De fiche linkte naar de kaart van openrouteservice, met de route al ingevuld via een hash-route
met een JSON-blok (`#/directions/<van>/<naar>/data/{"coordinates":"lon,lat;lon,lat",...}`).
Geen key, geen quotum: wie de link volgde, deed zelf de call. Live nagespeeld op 28/08/2026.

### Waarom dat niet meer kan

Op 1/10/2026 zette HeiGIT een nieuwe kaart online op `routing.heigit.org`, gebouwd op
Masterportal. `maps.openrouteservice.org` en `classic-maps.openrouteservice.org` gingen dicht
na 2/11/2026; het eerste adres stuurt nu door naar `routing.heigit.org/ors/`, dat de hash-route
negeert en een lege kaart van Europa toont.

**Een vervangende dieplink bestaat niet.** HeiGIT bevestigt dat op hun forum: start- en
eindpunt in de URL moet in Masterportal zelf gebouwd worden, en ze verwachten dat niet snel.

- [New Web Client - Shutting down old clients](https://ask.openrouteservice.org/t/new-web-client-shutting-down-old-clients/8072)
- [Route parameters with the new routing.heigit.org](https://ask.openrouteservice.org/t/route-parameters-with-the-new-routing-heigit-org/8073)

Zelf nagekeken op 21/11/2026 in hun code (mastercode v3.26.0): via `?MENU=` gaan enkel
instellingen zoals het profiel mee, en ook de deelbare toestand van hun kaart bevat geen punten.
De instellingen worden wel vrij ruw overgenomen, dus punten "binnensmokkelen" zou misschien
lukken. Bewust niet gedaan: dat is een achterpoort die bij hun volgende update stil breekt.

### Sinds 2.16.0: hun route op onze eigen kaart

De proxy vraagt nu het **geojson-endpoint** op in plaats van `/json`. Dat geeft het traject als
gewone lijst van `[lon, lat]`-punten in `features[0].geometry.coordinates`; `/json` geeft het
als gecodeerde polyline. Afstand en duur staan in `features[0].properties.summary` en zijn bij
beide endpoints dezelfde. Met `geometry_simplify: true` in de body blijven er voor
Antwerpen-Centraal naar Wilrijk 150 punten over in plaats van 239, met dezelfde afstand en
duur. Alles live nagekeken op 21/11/2026.

De fiche toont een knop "Bekijk de fietsroute" die een venster opent met dat traject op een
Leaflet-kaart (`FietsrouteVenster.tsx`). Het traject komt uit dezelfde call als de km en
minuten, dus het venster kost geen extra call naar HeiGIT.

Bewust bij HeiGIT gebleven, niet overgestapt op een andere routeplanner met een werkende
dieplink (bijvoorbeeld die van openstreetmap.org): dan rekent de kaart met een andere planner
dan de km en minuten in de fiche, en hangt de site van twee diensten af voor één route.

**Het endpoint is daardoor iets meer waard voor misbruik**: met het traject erbij is het een
fietsplanner voor België op ons quotum. Afgewogen en aanvaard (issue #83); de bounding box
blijft, en een vereenvoudigd traject houdt het antwoord klein.

Komt een dieplink in de nieuwe kaart van HeiGIT ooit terug, dan kan de link er opnieuw bij. Op
het forumdraadje hierboven staat een +1 met onze toepassing.
