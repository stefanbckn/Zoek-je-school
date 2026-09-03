# Openbaar vervoer — waarom Transitous, en niet De Lijn

De reistijd met bus en trein komt van **Transitous**. De code en de valkuilen staan in
`src/lib/ov.ts` en `.claude/rules/reistijd.md`; dit bestand is het onderzoek erachter.

## De Lijn heeft geen routeplanner-API (onderzocht 27/08/2026)

Portaal: `https://data.delijn.be` (Azure API Management). Account aanmaken, op een product
intekenen, key. **Geen goedkeuring nodig** (`approvalRequired: false`, uitgelezen via hun eigen
`/developer/products`-endpoint). Licentie: **Gratis Open Data Licentie Vlaanderen v1.0**,
hergebruik mag, ook commercieel, mits bronvermelding. Limieten: 864.000 calls/dag en
6.000/minuut per product.

Alle endpoints hieronder zijn geverifieerd door ze effectief aan te roepen zonder key:
**401 = bestaat en vraagt een key, 404 = bestaat niet.**

| Product | Basis-URL | Inhoud |
| --- | --- | --- |
| Open Data V1 Core | `https://api.delijn.be/DLKernOpenData/api/v1/...` | 47 operaties: haltes, lijnen, dienstregelingen, real-time doorkomsten, omleidingen, storingen |
| Open Data V1 Search | `https://api.delijn.be/DLZoekOpenData/v1/zoek/{haltes,lijnrichtingen}/{term}` | 2 operaties |
| GTFS Static | `https://api.delijn.be/gtfs/static/v3/gtfs_transit.zip` | volledige dienstregeling, dagelijks ververst |
| GTFS Realtime | `https://api.delijn.be/gtfs/v3/realtime` | protobuf, elke minuut |
| NeTEx / BLTAC | `https://api.delijn.be/netex/v1/file` · `https://api.delijn.be/bltac/v1/file` | dezelfde dienstregeling, andere formaten |

⚠️ **Let op de versie in het pad, die staat per API ergens anders.** GTFS Static is
`/gtfs/static/v3/...` maar GTFS Realtime is `/gtfs/v3/realtime`. Beide andere volgordes geven 404.

- **Er is GEEN routeplanner-API (meer).** Er bestond een `/routeplan/{van}/{naar}` in v1: oude
  blogposts, de Apiary-docs en zelfs zoekresultaten verwijzen er nog naar. Die operatie staat
  **niet** meer in de API. De volledige operatielijst telt 47 items zonder routeplan, en elke
  padvariant geeft 404 terwijl `/haltes` op dezelfde basis netjes 401 geeft. Niet opnieuw gaan
  zoeken, en niet gokken dat het "vast wel ergens" zit.
- **Wél nuttig voor het roadmapthema "Praktisch":** `GET /haltes/indebuurt/{lat,lng}` geeft
  haltes in de buurt van coördinaten, van álle vervoersmaatschappijen. Dat dekt "afstand tot
  halte" zonder dat we zelf GTFS moeten verwerken.
- De GTFS-feeds lopen ook via de Belgische NAP-proxy
  (`api-management-opendata-production.azure-api.net/api/gtfs/feed/delijn/...`, header
  `bmc-partner-key`). Die route is CC-BY-4.0. Voor ons geen voordeel: gebruik gewoon
  `api.delijn.be` met een eigen key.

## Hoe Google Maps en Apple Maps aan deze data komen

Allebei hetzelfde patroon, en het is niet wat je zou verwachten: **de vervoersmaatschappij
levert GTFS, de kaartaanbieder routeert zelf.** Niemand roept de routeplanner van De Lijn aan.

- **Google**: het vervoersbedrijf dient de GTFS-zip in via het Transit Partner-dashboard
  (`support.google.com/transitpartners/answer/1111481`), Google valideert en neemt op; GTFS-RT
  komt daar los bij. De routeberekening draait volledig bij Google.
- **Apple**: geen publiek portaal, contracten per vervoersmaatschappij. De Lijn staat letterlijk
  in Apples attributielijst (`gspe21-ssl.ls.apple.com/html/attribution-325.html`) als
  "De Lijn — reused under license".

Conclusie voor ons: een reistijd berekenen betekent GTFS plus een routeringsmotor. Zelf een
motor draaien botst met "geen backend". Vandaar de derde weg.

## Transitous — gratis OV-routering die De Lijn al dekt

`https://api.transitous.org` is een community-instantie van **MOTIS** die de GTFS- én
GTFS-RT-feeds van De Lijn al inleest (staat in `feeds/be.json` van
`public-transport/transitous` op GitHub, samen met NMBS en MIVB). Geen key, geen registratie.

Live geverifieerd op 27/08/2026, Antwerpen-Centraal naar Wilrijk:

```
GET https://api.transitous.org/api/v1/plan
      ?fromPlace=51.2172,4.4212&toPlace=51.1802,4.4025&time=2026-08-28T07:30:00Z
```

Geeft 4 reisopties terug met wandeldelen, overstappen en lijnnummers, onder andere bus 17 in 34
minuten. Respons: `itineraries[].duration` (seconden), `.transfers`, en `.legs[]` met `mode`,
`routeShortName`, `agencyName`, `from.name`/`to.name`.

### De voorwaarden (transitous.org/api)

Toegang mag als het project open source is, niet commercieel, licht voor hun infrastructuur, en
zich aan het gebruiksbeleid houdt.

1. **Open source, gepubliceerd onder een open-source licentie**, en niet-commercieel.
   Prototypen mag zonder. ✅ Licentie geregeld in v0.3: `LICENSE` bevat de letterlijke
   AGPL-3.0-tekst van gnu.org. ✅ **De repo staat publiek.** Geverifieerd op 30/08/2026:
   `github.com/stefanbckn/Zoek-je-school` geeft HTTP 200 zonder login en de GitHub-API meldt
   `private: false`. Een eerdere notitie van 27/08/2026 sprak nog over een 404; die was
   verouderd. Deze voorwaarde is vervuld.
   Let op de niet-commerciële eis: een donatieknop is verdedigbaar, advertenties of een
   betaalmuur zouden deze API-toegang kosten.
2. **Contact opnemen vóór gebruik van zware endpoints**, via hun Matrix-kanaal
   `#transitous:matrix.spline.de`. De voorwaarden zeggen letterlijk *"contact us before using
   any potentially resource-intensive API endpoints (such as routing, isochrones)"*, en routing
   is precies wat wij doen. ✅ **Gebeurd op 27/08/2026**: de eigenaar heeft Transitous via dat
   kanaal gecontacteerd. Niet opnieuw als openstaand punt opvoeren.
3. **Contactgegevens meesturen.** Een `User-Agent` met naam, versie en contactadres.
   ⚠️ **Dat kan hier niet**: een browser laat `User-Agent` niet overschrijven, en `fetch`
   weigert die header stil. Transitous voorziet dat expliciet: draait de app in de browser, dan
   volstaat de `Referer`-header, **op voorwaarde dat er contactgegevens op de site staan.**
   ✅ Sinds v0.3 staat `info@bckn.be` in de footer. Die regel is dus een voorwaarde, geen opsmuk.
   Onze `Referrer-Policy: strict-origin-when-cross-origin` stuurt bij een cross-origin call
   enkel de origin mee, genoeg om de site te identificeren; dat hoeft niet losser gezet te
   worden.
4. **Attributie**: zichtbare link naar `https://transitous.org/sources/`, plus de
   OpenStreetMap-attributie (`openstreetmap.org/copyright`).
5. **Showcase** (optioneel): de app mag toegevoegd worden aan de Transitous-website.

Best effort, geen SLA. Roep het **rechtstreeks vanuit de browser** aan, niet via een Netlify
Function zoals bij de fietsroute: daar was de reden een geheime key, en die is hier niet.
Proxyen zou net de `Referer` wegnemen waarmee zij ons herkennen.

### De dieplink is géén API-gebruik

De zoekwidget op `transitous.org` bouwt deze URL. Afgeleid uit hun `widget.js` en daarna live
nagespeeld (28/08/2026), niet gegokt:

```
https://api.transitous.org?fromPlace=<lat,lon>&toPlace=<lat,lon>
    &fromName=<label>&toName=<label>&time=<YYYY-MM-DDTHH:mm>&arriveBy=true
```

`api.transitous.org` serveert op de root de MOTIS-webinterface; de API zelf zit onder `/api/`.
Getest met Antwerpen-Centraal naar Wilrijk: toont de reisopties, neemt de namen over in de
invoervelden en zet de knop correct op "Arrival".

**Waarom dit belangrijk is: een hyperlink is geen API-gebruik.** Het gebruiksbeleid hierboven
gaat over hun API. Wie doorlinkt, doet zelf geen enkele call. Deze weg kan dus altijd, ook
zonder publieke repo en zonder LICENSE. Verandert de webinterface, dan is het gevolg een dode
link, geen kapotte app.

## Als Transitous ooit afvalt

Dan blijft zelf MOTIS of OpenTripPlanner draaien over, en dán botst het alsnog op "geen
backend".
