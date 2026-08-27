# Zoek je school — projectconventies

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in provincie Antwerpen.
Volledig client-side (Vite + React + TypeScript + Tailwind v4), geen backend, geen database.
Data wordt op build-time opgehaald via de API's van Onderwijs en Vorming en weggeschreven als
statische JSON — de app doet nooit live calls naar overheidsbronnen voor de scholendata
(CORS/betrouwbaarheid/API-key). De enige live calls vanuit de browser zijn de Geolocation API
(eigen adres zoeken) en onze eigen Netlify Function voor de fietsroute, zie hieronder.

## Databronnen

### Scholen, vestigingsplaatsen en studieaanbod (build-time, via scripts/fetch-data.ts)

Alles komt uit de API's van het **API-portaal Onderwijs en Vorming**
(`https://onderwijs-api-portaal.vlaanderen.be/documentatie/instellingsgegevens`). Eén API-key
geeft toegang tot alle producten hieronder — geverifieerd, geen aparte aanvraag per product nodig.

| Product | Endpoint | Wat we ermee doen |
| --- | --- | --- |
| Instellingslocatie v1 | `.../instellingsgegevens/instellingslocatie/v1/instellingslocatie` | Adres + **WGS84-coördinaten** per vestigingsplaats. Basis van de dataset. |
| Instellingen v2 | `.../instellingsgegevens/instelling/v2/instelling` | Naam, net, levensbeschouwing, contact, erkenning, scholengemeenschap, bestuur per school. |
| Onderwijsaanbod SO v2 | `.../onderwijsaanbod_so/v2/ingerichteadministratievegroep` | Kóppeling school+vestiging ↔ richting. Bevat géén inhoudelijke velden. |
| Onderwijsaanbod SO v2 | `.../onderwijsaanbod_so/v2/administratievegroep` | Catalogus van richtingen: **finaliteit**, graad, onderwijsvorm, studiegebied, duaal. |
| Codelijst v1 | `.../codelijst/v1/codelijst/{lijst}` | Decodeert codes (o.a. `soort_bestuur`, `net`). Eenmalig geraadpleegd, niet in het script. |

**Scope-filter:** vestigingsplaatsen met `filter_instellingslocatie_hoofdstructuur=311`
(gewoon voltijds secundair onderwijs), daarna client-side gefilterd op
`instellingslocatie_provincie === 'Provincie Antwerpen'` — de API heeft géén provinciefilter
(`filter_instellingslocatie_provincie` geeft HTTP 400). Levert 559 vestigingen / 303 campussen.

**Coördinaten:** `gps_breedtegraad` / `gps_lengtegraad` staan rechtstreeks in de API, in WGS84.
De Lambert72-conversie en de `proj4`-dependency zijn daarmee verdwenen. 4 vestigingen hebben
geen coördinaten en krijgen `lat/lon = null`.

#### API-conventies (geverifieerd, hier ingelopen valkuilen)

- **Auth:** header `x-api-key: <key>`. Kan ook als `?apikey=`, maar niet doen — dan staat de key
  in serverlogs.
- **Paginatie is `page=`, niet `number=`.** `number=` wordt *stil genegeerd* en geeft dan
  eindeloos pagina 1 terug, zonder foutmelding. Ik ben daar in ingelopen: 16 "pagina's" bleken
  16× dezelfde data. `size=5000` werkt.
- Onbekende **`filter_*`-params geven wél netjes HTTP 400** met `Attribuut niet toegestaan`.
  Andere onbekende params worden stil genegeerd. Gebruik dus altijd het `filter_`-prefix, dan
  merk je een typefout meteen.
- Respons-envelop: `{ meta: { total_elements, total_pages, number, last, ... }, content: [...] }`.
  De `links`-array is altijd leeg — niet op vertrouwen voor paginatie.

#### Wat er NIET in zit

- **Infodagen/infomomenten.** De volledige catalogus is nagekeken: geen enkel product bevat ze.
  onderwijskiezer.be heeft ze wel maar is juridisch uitgesloten (zie onder).
- **Aanmelden.** Geen veld voor. Daarvoor blijven we doorlinken naar de officiële fiche
  (`data-onderwijs.vlaanderen.be/onderwijsaanbod/instelling?sn=<schoolnummer>`).

#### Bewust niet gebruikt

- **Inschrijvingsaantal SO** (`.../inschrijvingsaantal_so/v1/inschrijvingsaantal`) werkt op
  dezelfde key en geeft leerlingenaantallen per richting per school (incl. man/vrouw). Bewust
  níét opgenomen — beslist door de gebruiker. Reden om het niet stilletjes toe te voegen: de
  cijfers lopen achter op het aanbod (aanbod schooljaar 2026, aantallen schooljaar 2024), en
  leerlingenaantallen nodigen uit tot een populariteitsranglijst die deze site niet wil zijn.
- **Directeursnaam** (`instelling_directeur`) — persoonsgegeven, en voor een zoeksite overbodig
  naast telefoon en website. Beslist door de gebruiker.

### Campus-groepering (belangrijk datamodel-detail)

De brondata bevat regelmatig **meerdere apart geregistreerde scholen (elk een eigen `schoolnummer`)
op exact hetzelfde fysieke adres** — niet zomaar interne vestigingsplaats-varianten van één school,
maar echt losse legale entiteiten die een campus delen (bv. "Sint-Gabriëlcollege" +
"Sint-Gabriëlcollege - Middenschool 1/2/3" zijn 4 verschillende schoolnummers op 2 gedeelde adressen).
Geverifieerd op de API-dataset: 386 van de 559 vestigingen (69%) delen een adres met minstens 1
andere school — 130 van de 303 adressen; sommige adressen hebben tot 11 verschillende scholen. Dit als losse kaartjes tonen is verwarrend — expliciet
zo beslist door de gebruiker.

- `scripts/fetch-data.ts` groepeert daarom op `postcode|straat|huisnummer` (busnummer genegeerd in
  de groepeersleutel — een andere ingang van hetzelfde gebouw is nog steeds dezelfde campus) tot een
  `Campus`, met een `scholen: SchoolOpCampus[]`-array erin. Dit is de eenheid die de app toont, niet
  de individuele school. `public/data/vestigingen.json` bevat dus `Campus[]`, geen platte lijst meer.
- `Campus` draagt adres/coördinaten/afstand (gedeeld voor alle scholen erop); `SchoolOpCampus` draagt
  naam/net/contactgegevens/erkenning (per school verschillend).
- UI: `ResultCard` toont bij 1 school op een adres de klassieke kaart; bij >1 school een adres-kaart
  met de scholen als losse, individueel klikbare rijen erin. `DetailPanel` toont altijd één specifieke
  school (`campus` + `school` samen als props), met een melding welke andere scholen hetzelfde adres
  delen.
- **Sinds v0.2 opgeleverd:** finaliteiten/richtingen worden **per adres/campus** samengevoegd
  getoond én gefilterd (een andere campus met ander aanbod blijft wél apart). `campusAanbod()` in
  `src/lib/aanbod.ts` doet die samenvoeging; `SchoolOpCampus.richtingen` is waar het per school
  binnenkomt. `DetailPanel` toont nog steeds één specifieke school, maar het aanbodblok erin geldt
  voor het hele adres — dat staat er ook expliciet bij als er meerdere scholen zijn.

### Studieaanbod (richtingen) — geïntegreerd sinds v0.2

- Het aanbod komt uit **twee** endpoints die je moet joinen op `administratievegroep_code`:
  - `/ingerichteadministratievegroep` — welke school+vestiging richt welke richting in. Velden:
    `instelling_nummer`, `instellingslocatie_vestigingsnummer`, `administratievegroep_code`,
    `administratievegroep_omschrijving`, `schooljaar`, `inschrijvingen`, `financierbaar`,
    begin-/einddatum. **Meer niet.**
  - `/administratievegroep` — de catalogus, met de inhoudelijke velden:
    `administratievegroep_finaliteit`, `_graad`, `_leerjaar`, `_onderwijsvorm`, `_studiegebied`,
    `_studierichting`, `_duaal`, `_modulair`, `_niche`, `_stem_categorie`, `_gemoderniseerd`.
- ⚠️ **Eerdere versie van dit bestand beweerde dat finaliteit in `/ingerichteadministratievegroep`
  zit. Dat klopt niet** — dat endpoint heeft 11 velden en geen enkel inhoudelijk veld. Wie enkel
  daar kijkt, concludeert ten onrechte dat finaliteit niet bestaat in de API.
- **Finaliteit is officieel beschikbaar, niet afgeleid.** Codes: `DO` Doorstroomfinaliteit,
  `DU` Dubbele finaliteit, `A` Arbeidsmarktfinaliteit, `E` NVT (eerste graad),
  `7E` n.v.t. (7e leerjaar). Dekking geverifieerd: 758/758 richtingcodes in ons aanbod staan in
  de catalogus; 2909 van 3021 catalogusrecords hebben een finaliteit. De 12 richtingen in onze
  data zonder finaliteit zijn HBO5 (9), eerste graad (2) en OKAN (1) — terecht leeg.
- **Niet zelf finaliteit afleiden uit ASO/TSO/BSO/KSO.** De omschrijving draagt nog de oude
  onderwijsvorm-labels, maar de mapping onderwijsvorm → finaliteit is niet 1-op-1. Gebruik het
  veld. `onderwijsvorm` bewaren we apart omdat ouders die termen nog kennen.
- Richtingen zitten per **vestiging** in het model (`SchoolOpCampus.richtingen`), niet per school:
  een school met meerdere campussen kan per campus een ander aanbod hebben.

### Net-onderscheid — opgeleverd in v0.2

- `instelling_net` heeft maar 3 bruikbare categorieën en kan Provinciaal niet van Gemeentelijk
  scheiden. **`instelling_soort_bestuur` staat NIET op de school** maar op het **bestuur**, dat
  zelf een instelling is (`instelling_type` = 300). Het script haalt alle besturen in één
  gepagineerde call op (`filter_instelling_type=300`, 928 records) en joint lokaal — niet
  928 losse detailcalls.
- Codelijst `soort_bestuur` geverifieerd: `1` GO!, `2` Vrij, `3` Provincie, `4` Gemeente,
  `5` OCMW, `6` Intercommunale, `7` Vlaamse Gemeenschap, `8` Vlaamse autonome hogeschool,
  `9` Andere.
- `Net` in `src/types.ts` heeft nu 6 waarden: GO! / Provinciaal / Gemeentelijk /
  Officieel gesubsidieerd / Vrij gesubsidieerd / Onafhankelijk. Verdeling per vestiging:
  Vrij 375, GO! 102, Gemeentelijk 63, Provinciaal 18, Onafhankelijk 1.
- **"Gemeentelijk", niet "Stedelijk"** — de eerdere roadmap noemde het stedelijk, maar van de 63
  gemeentelijke vestigingen liggen er 13 in Brasschaat, Duffel, Kalmthout, Nijlen en Zandhoven.
  Dat zijn geen steden.
- **'Officieel gesubsidieerd' blijft als terugval bestaan** voor officiële scholen met een bestuur
  dat noch provincie noch gemeente is (OCMW, intercommunale). Die komen in provincie Antwerpen
  momenteel niet voor. Niet gokken dat zo'n school gemeentelijk is.
- De filter toont enkel netten die in de dataset voorkomen (plus een net dat aangevinkt staat maar
  ontbreekt — anders zie je 0 resultaten zonder vinkje om uit te zetten). Zie `netOpties` in
  `App.tsx`.
- ⚠️ **URL-migratie.** Links van vóór deze splitsing dragen `?net=Officieel gesubsidieerd`.
  `NET_MIGRATIE` in `useSearchState.ts` vertaalt die naar Provinciaal + Gemeentelijk, zodat zo'n
  gedeelde link exact dezelfde 67 campussen blijft tonen. Zonder die vertaling gaf elke oude link
  een lege pagina. **Splits je ooit nog een filterwaarde, doe daar dan hetzelfde.**
- De oude tekst-heuristiek op de bestuursnaam is definitief van tafel — niet meer gebruiken.

### API-key

- Env var `ONDERWIJS_API_KEY`, gelezen via `process.loadEnvFile()` (Node 21+, geen `dotenv`).
  Het script laadt **`.env` én `.env.local`**, in die volgorde, en overleeft een ontbrekend
  bestand (in CI komt de key uit de omgeving). Lokaal staat de key in `.env.local`.
- **Bewust geen `VITE_`-prefix**: de key wordt alleen door het build-time Node-script gebruikt,
  nooit door client-code. Een `VITE_`-prefix zou Vite de key in de publieke JS-bundle bakken.
  Enkel de opgehaalde data (niet de key) komt in `public/data/*.json`, en die data is publiek.
- Key aanvragen: `https://onderwijs-api-portaal.vlaanderen.be/contact/aanvraag-apikey`.

### Geolocatie eigen adres (live browser call)

- Autocomplete: `GET https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=...`
- Coördinaten: `GET https://geo.api.vlaanderen.be/geolocation/v4/Location?q=...`
- Documentatie zegt "CORS is not supported", maar in de praktijk stuurt de API
  `access-control-allow-origin: *` mee — geverifieerd, werkt gewoon vanuit de browser.
- Geen API-key nodig.
- Deelgemeenten (Borsbeek, Vremde, Deurne, ...) hebben geen eigen punt in deze bron — zie de hint
  onder de zoekbalk in `SearchBar.tsx`. Straatnaam-zoeken is wel altijd correct.

### Fietsafstand/-tijd in het detailpaneel (live browser call)

- `src/lib/fietsroute.ts`. Endpoint: `POST https://api.heigit.org/openrouteservice/v2/directions/cycling-regular/json`.
- **Belangrijk — gebruik `api.heigit.org`, NIET `api.openrouteservice.org`.** Beide draaien
  dezelfde openrouteservice-backend, maar `api.openrouteservice.org` stuurt CORS-headers enkel op
  de OPTIONS-preflight, niet op de echte respons → de browser blokkeert dan alsnog elke call. Dit
  is een bekend, jarenlang terugkerend probleem (zie ask.openrouteservice.org), geen toevalstreffer.
  `api.heigit.org/openrouteservice/...` geeft `access-control-allow-origin: *` wél op de echte
  respons — live geverifieerd met een werkende key, dus dit is de te gebruiken URL.
- Auth: header `Authorization: <key>` (de ruwe key, geen `Bearer`-prefix).
- Request-body: `{"coordinates": [[lon,lat],[lon,lat]]}` (let op: lon eerst, niet lat).
- Response: `routes[0].summary.distance` (meter) en `routes[0].summary.duration` (seconden).
- Request/response-vorm geverifieerd via de officiële `openrouteservice-js`-clientlibrary
  (GIScience/openrouteservice-js op GitHub, `src/OrsBase.js`/`src/OrsUtil.js` + de daar getoetste
  integratietests) — niet gegokt.
- Gratis tier: **2000 calls/dag, 40/minuut** (geverifieerd op de prijzenpagina van het HeiGIT-
  account). Er bestaat een gratis "Collaborative"-tier (10.000/dag) voor onderwijs/overheid/non-
  profit — de moeite waard om voor dit project aan te vragen via het dashboard.
- ⚠️ **De key mag NIET client-side gebruikt worden.** De officiële ORS-documentatie
  (`giscience.github.io/openrouteservice/frequently-asked-questions.html`) is expliciet:
  *"every HeiGIT API key belongs to one person"* en *"an API key must not be used client-side in an
  application: Inspecting the requests sent by the application would 'leak' the API key"*.
  Hun aanbevolen oplossing is server-side proxyen: de client stuurt een request zónder key naar je
  eigen server, die de call met key doorzet.
- **Domeinrestrictie bestaat niet** bij HeiGIT — nagekeken in het dashboard en in de docs. Dat is
  dus géén beschikbare mitigatie (eerder in dit project ten onrechte als oplossing voorgesteld).
- **Huidige stand (v0.1): de opzet voldoet hier NIET aan.** `VITE_ORS_API_KEY` heeft een
  `VITE_`-prefix en belandt dus in de publieke bundle; geverifieerd dat de key daaruit te halen is
  en vanaf een willekeurig ander domein werkt. **Op te lossen door de call naar een Netlify Function
  te verplaatsen** (key in de server-side env, browser praat met ons eigen endpoint). Dat lost
  meteen ook de CORS-kwestie op, want dan is het same-origin.
- **Attributie is verplicht en staat in de UI** — `Footer.tsx` (altijd, ook als `meta.json`
  ontbreekt) en nogmaals in `DetailPanel.tsx` naast het routeresultaat, omdat dat paneel als
  modaal venster over de footer ligt. De HeiGIT-voorwaarden eisen de vermelding
  "© openrouteservice by HeiGIT | Data from OpenStreetMap" letterlijk, en hun routeresultaten
  staan onder **CC-BY-SA 4.0**. Weghalen mag dus niet, ook niet "even voor de opmaak".
  Geverifieerd in de ToS op `account.heigit.org/info/tos` (27/08/2026); diezelfde ToS bevat
  géén non-commerciële beperking, dus een donatieknop op de site raakt dit niet.
- Account/key aanvragen via `https://account.heigit.org` (self-service signup).
- Wordt enkel aangeroepen voor de **geselecteerde** school in het detailpaneel (niet voor elke
  kaart in de resultatenlijst) — anders is de gratis quota in enkele zoekopdrachten op.
- In-memory cache per `(van, naar)`-paar in `fietsroute.ts` om herhaalde calls binnen dezelfde
  sessie te vermijden.
- Geen key ingesteld → `berekenFietsroute` geeft stil `null` terug, geen fetch-poging, geen crash.

### Openbaar vervoer — De Lijn (onderzocht 27/08/2026, nog niet in gebruik)

Portaal: `https://data.delijn.be` (Azure API Management). Account aanmaken → op een product
intekenen → key. **Geen goedkeuring nodig** (`approvalRequired: false`, uitgelezen via hun eigen
`/developer/products`-endpoint). Licentie: **Gratis Open Data Licentie Vlaanderen v1.0** —
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

⚠️ **Let op de versie in het pad — die staat per API ergens anders.** GTFS Static is
`/gtfs/static/v3/...` maar GTFS Realtime is `/gtfs/v3/realtime`. Beide andere volgordes geven 404.

- **Er is GEEN routeplanner-API (meer).** Er bestond een `/routeplan/{van}/{naar}` in v1 — oude
  blogposts, de Apiary-docs en zelfs zoekresultaten verwijzen er nog naar. Die operatie staat
  **niet** meer in de API: de volledige operatielijst telt 47 items zonder routeplan, en elke
  padvariant geeft 404 terwijl `/haltes` op dezelfde basis netjes 401 geeft. Niet opnieuw gaan
  zoeken, en niet gokken dat het "vast wel ergens" zit.
- **Wél nuttig voor v0.6:** `GET /haltes/indebuurt/{lat,lng}` geeft haltes in de buurt van
  coördinaten, van álle vervoersmaatschappijen. Dat dekt "afstand tot halte" zonder dat we zelf
  GTFS moeten verwerken.
- De GTFS-feeds lopen ook via de Belgische NAP-proxy
  (`api-management-opendata-production.azure-api.net/api/gtfs/feed/delijn/...`, header
  `bmc-partner-key`). Die route is CC-BY-4.0. Voor ons geen voordeel — gebruik gewoon
  `api.delijn.be` met een eigen key.

#### Hoe Google Maps en Apple Maps aan deze data komen

Allebei hetzelfde patroon, en het is niet wat je zou verwachten: **de vervoersmaatschappij levert
GTFS, de kaartaanbieder routeert zelf.** Niemand roept de routeplanner van De Lijn aan.

- **Google**: het vervoersbedrijf dient de GTFS-zip in via het Transit Partner-dashboard
  (`support.google.com/transitpartners/answer/1111481`), Google valideert en neemt op; GTFS-RT
  komt daar los bij. De routeberekening draait volledig bij Google.
- **Apple**: geen publiek portaal, contracten per vervoersmaatschappij. De Lijn staat letterlijk
  in Apples attributielijst (`gspe21-ssl.ls.apple.com/html/attribution-325.html`) als
  "De Lijn — reused under license".

Conclusie voor ons: een reistijd berekenen betekent GTFS + een routeringsmotor. Zelf een motor
draaien botst met "geen backend" — vandaar de derde weg hieronder.

#### Transitous — gratis OV-routering die De Lijn al dekt

`https://api.transitous.org` is een community-instantie van **MOTIS** die de GTFS- én
GTFS-RT-feeds van De Lijn al inleest (staat in `feeds/be.json` van `public-transport/transitous`
op GitHub, samen met NMBS en MIVB). Geen key, geen registratie.

Live geverifieerd op 27/08/2026, Antwerpen-Centraal → Wilrijk:

```
GET https://api.transitous.org/api/v1/plan
      ?fromPlace=51.2172,4.4212&toPlace=51.1802,4.4025&time=2026-08-28T07:30:00Z
```

Geeft 4 reisopties terug met wandeldelen, overstappen en lijnnummers — o.a. bus 17 in 34 minuten.
Respons: `itineraries[].duration` (seconden), `.transfers`, en `.legs[]` met `mode`,
`routeShortName`, `agencyName`, `from.name`/`to.name`.

**De voorwaarden** (`transitous.org/api`) — toegang mag als het project open source is, niet
commercieel, licht voor hun infrastructuur, en zich aan het gebruiksbeleid houdt:

1. **Open source, gepubliceerd onder een open-source licentie.** Prototypen mag zonder.
   ⚠️ **Dit is de enige echte openstaande blocker, en hij zit dubbel.** Ten eerste is de repo
   niet publiek: `github.com/stefanbckn/Zoek-je-school` geeft HTTP 404 zonder login (geverifieerd
   27/08/2026). Ten tweede staat er geen `LICENSE`-bestand in, en zonder licentie is code strikt
   genomen "alle rechten voorbehouden" — dus ook een publieke repo is dan niet open source.
   Beide moeten geregeld zijn vóór we de API in productie gebruiken.
2. **Contact bij twijfel over de belasting** (dure requests, veel gebruikers), via hun
   Matrix-kanaal `#transitous:matrix.spline.de`. Dus geen harde verplichting vooraf — maar
   routing is nu net het type request dat ze als zwaar benoemen, en ze horen sowieso graag
   waarvoor de API gebruikt wordt. Bijkomend voordeel: dan kunnen ze ons waarschuwen bij
   breaking changes.
3. **Contactgegevens meesturen.** Een `User-Agent` met naam, versie en contactadres.
   ⚠️ **Dat kan hier niet** — een browser laat `User-Agent` niet overschrijven, en `fetch`
   weigert die header stil. Transitous voorziet dat expliciet: draait de app in de browser, dan
   volstaat de `Referer`-header, **op voorwaarde dat er contactgegevens op de site staan.**
   Die staan er nu niet. Onze `Referrer-Policy: strict-origin-when-cross-origin` stuurt bij een
   cross-origin call enkel de origin mee — genoeg om de site te identificeren, dus dat hoeft
   niet losser gezet te worden.
4. **Attributie**: zichtbare link naar `https://transitous.org/sources/`, plus de
   OpenStreetMap-attributie (`openstreetmap.org/copyright`) — die laatste staat er al voor de
   kaartlaag, maar geldt dan ook voor de routes.
5. **Showcase** (optioneel): de app mag toegevoegd worden aan de Transitous-website.

Best effort, geen SLA. Praktisch gevolg voor de implementatie: `connect-src` in `netlify.toml`
moet `https://api.transitous.org` erbij krijgen. Roep het rechtstreeks vanuit de browser aan —
niet via een Netlify Function zoals bij de fietsroute, want daar was de reden een geheime key, en
die is hier niet; proxyen zou net de `Referer` wegnemen waarmee zij ons herkennen.

Valt Transitous alsnog af, dan blijft zelf MOTIS of OpenTripPlanner draaien over — en dán botst
het alsnog op "geen backend".

## Regel: nooit gokken

Verzin nooit een API-endpoint, veldnaam of URL. Alles in dit bestand is geverifieerd door de
response effectief op te halen. Als iets niet meer werkt of een veld niet blijkt te bestaan: zeg dat
expliciet en stel een alternatief voor — verzin geen vervanging.

## Architectuur

- `scripts/fetch-data.ts` — Node-script (draai met `npm run fetch-data`), haalt 5 gepagineerde
  API-calls op, joint ze, en schrijft `public/data/vestigingen.json` + `public/data/meta.json`
  (ophaaldatum, bronvermelding, schooljaar van het aanbod, aantallen).
- **`public/data/*.json` staat bewust WEL in git** (~4 MB), en is sinds v0.2 de *primaire* bron
  voor de build: `npm run build` leest die JSON, de API wordt niet tijdens elke deploy bevraagd.
  Verversen is een aparte, periodieke stap (zie Workflow).
- Faalt het ophalen tóch (API plat, key verlopen), dan valt het script terug op de gecommitte
  dataset met een luide waarschuwing; ligt er géén dataset, dan faalt het hard.
- **Historische noot:** tot v0.1 kwam de data uit de CSV's van `data-onderwijs.vlaanderen.be`.
  Die faalden op Netlify met `ECONNRESET` tijdens de TLS-handshake (oorzaak nooit bevestigd —
  geen algemene datacenter-blokkade, dat is getest en weerlegd). Dat probleem is met de overstap
  naar de API weg, maar de fallback-logica is blijven staan omdat ze nu de API dekt.
- `src/types.ts` — het datamodel: `Campus` (adres, coördinaten) met `SchoolOpCampus[]` erin,
  elk met `Richting[]`. Lege placeholders (`kostprijs`, `vervoer`) blijven staan voor v0.5/v0.6.
- `src/lib/` — pure functies: haversine-afstand, net-labels, URL-state hook.
- `src/components/` — UI-componenten, geen state-logica die ook elders nodig is.
- Filterstatus leeft in de URL-querystring (geen router nodig, single-page app — vermijd
  react-router, dat lost hier niets op en breekt deep-linking onnodig).
- Afstand is altijd hemelsbrede afstand (haversine); benoem dat expliciet in de UI, nooit als
  "reisafstand" framen.
- `proj4` is **verwijderd** als dependency: de API levert WGS84 rechtstreeks, er is geen
  Lambert72-conversie meer nodig.

## Roadmap

Let op: deze nummering **vervangt** de oorspronkelijke backlog-nummering uit de opzet. De oude
v0.2 (Reizen) is deels al opgeleverd — fietsafstand/-tijd zit in v0.1 — en de resterende oude
backlog-items zijn doorgeschoven naar v0.5–v0.7.

| Versie | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| **v0.1** | Basis | Vestigingen → campussen, afstand (hemelsbreed), filters (net/gemeente/naam), kaart, detailpaneel, URL-state, mobiel | **Opgeleverd** |
| **v0.1.x** | Fiets | Fietsafstand/-tijd per school in detailpaneel (OpenRouteService via api.heigit.org) | **Opgeleverd** |
| **v0.2** | API Onderwijs Vlaanderen | Schooldata via API · studieaanbod + finaliteit per vestiging · net-onderscheid via soort_bestuur | **Datalaag opgeleverd**; UI nog te doen. Infodagen geschrapt: geen bron. |
| **v0.2.1** | UI-verbeteringen | Actieve filters zichtbaar onder de zoekbalk + reset · kleurenpalet herzien (kleurenblindheid) · thema's/dark mode | **Ingepland**, zie hieronder |
| **v0.3** | GOK-indicatoren + aanmelden | OKI + 4 leerlingenkenmerken per campus · aanmeldsysteem per school tonen/linken · **lijst pagineren** | OKI-bron geverifieerd. Aanmelden: **geen centrale bron**, zie hieronder. Pagineren: puur frontend, zie hieronder |
| **v0.5** | Kostprijs | Maximumfactuur, materiaalkost bij start (boeken, laptop, kaften) | Geen centrale bron; deels handmatig per school |
| **v0.6** | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie Databronnen). Rest nog te onderzoeken |
| **v0.7** | Vergelijken | 2–4 campussen naast elkaar in vergelijkingstabel + exporteerbare shortlist | Puur frontend, geen externe bron nodig |
| **Geparkeerd** | Openbaar vervoer | Reistijd met de bus | De Lijn heeft inderdaad geen routeplanner-API (die is verdwenen uit v1). **Maar er is een weg: Transitous** — gratis MOTIS-instantie die De Lijn al dekt, geen key, geen backend nodig. Blocker is niet technisch maar de licentievoorwaarde: repo moet publiek én open source zijn — zie de sectie Openbaar vervoer hierboven |

### v0.2 — stand van zaken

**Datalaag opgeleverd**: `fetch-data.ts` draait volledig op de API's, met studieaanbod,
finaliteit en soort_bestuur in de dataset. Zie de databronnen-sectie hierboven voor de details.

**UI opgeleverd**: studieaanbod in `DetailPanel` (per graad gegroepeerd, met finaliteit-chips),
finaliteit-badges en richtingaantal in `ResultCard`, en filters op finaliteit + vrije tekst op
studierichting in `FilterPanel`. URL-state uitgebreid met `finaliteit=` en `richting=`.

Twee keuzes daarin, bewust:
- **Aanbod wordt op adresniveau samengevoegd**, niet per school — ook in de filters. Scholen die
  een campus delen vullen elkaars aanbod aan; wie op "Latijn" zoekt wil dat adres zien, ook als
  de richting bij de buurschool op hetzelfde adres hoort. Zie `campusAanbod()` in `src/lib/aanbod.ts`.
- **Richtingen worden ontdubbeld tot één regel per graad.** De bron noemt elk leerjaar apart
  ("1e leerjaar in de 2e graad Latijn ASO" én "2e leerjaar in de 2e graad Latijn ASO"); dat
  voorvoegsel wordt weggehaald en de dubbels vallen samen. Bij Sint-Gabriëlcollege: 55 ruwe
  richtingen over 4 scholen → 24 regels. Matcht het voorvoegselpatroon niet (eerste graad, 7e
  leerjaar, HBO5, OKAN), dan blijft de naam onaangeroerd.

**Nog te doen in de UI:**
- `soortBestuur` in de netfilter verwerken: GO! / Provinciaal / Stedelijk / Vrij.
  Let op: `Net` in `src/types.ts` is nog het oude 4-waarden-type dat `NET_STYLES`,
  `NET_OPTIONS` en de URL-state gebruiken. `soortBestuur` staat er los naast, precies om die
  UI niet te breken. Wie de filter uitbreidt, moet die drie plekken samen aanpassen.
- Eventueel filteren op studiegebied (zit in de data, nog niet in de UI).

**Infodagen: geen bron.** De volledige API-catalogus bevat geen infomomenten-product.
onderwijskiezer.be heeft ze wel maar is juridisch uitgesloten (zie hieronder). Dit item schuift
door tot er een bron gevonden is — niet inplannen op hoop.

### v0.2.1 — UI-verbeteringen

**Opgeleverd:**

1. **Actieve filters onder de zoekbalk** (`ActieveFilters.tsx`), elk apart wegklikbaar, met
   "Alles wissen" zodra er meer dan één actief is. Locatie en straal staan er bewust níét bij:
   die zijn al zichtbaar in de zoekbalk zelf.
2. **Kleurenpalet omgezet naar CSS-variabelen** in `src/index.css`, richting "fris & open".
   Alle harde Tailwind-kleuren (`slate-500` en co) zijn vervangen door tokens: `bg-kaart`,
   `text-inkt`, `text-zacht`, `border-rand`, `bg-accent`. Werkt via `@theme inline`, dat de
   utility letterlijk `var(--c-kaart)` laat uitschrijven — **zonder `inline` vriest Tailwind de
   waarde in op buildtijd en schakelt het thema niet mee.**
3. **Licht/donker/systeem-schakelaar** rechtsboven (`ThemaToggle.tsx` + `lib/thema.ts`).
   Drie standen, niet twee: geen attribuut = volg het systeem. Keuze in `localStorage`, in een
   try/catch omdat privémodus dat kan blokkeren.

**Kleurenblindheid — meten, niet schatten.** Er is een controlescript: `node scripts/kleurcheck.mjs`.
Dat berekent contrast (WCAG AA) én simuleert protanopie, deuteranopie en tritanopie, en meet dan
hoe ver de kleuren binnen één categorie uit elkaar liggen. **Wijzig je kleuren, draai dit script.**

Waarom het bestaat: het eerste finaliteitspalet (blauw #0b4a7d / pruim #7a2665 / bruin #7d4700)
zag er prima uit en haalde overal AA, maar de eerste twee vielen bij protanopie praktisch samen —
afstand 12. Dat werd pas zichtbaar door te meten. De gebruiker meldde bovendien dat de drie ook
met normaal zicht moeilijk te scheiden waren, omdat een omlijnde chip te weinig kleuroppervlak
heeft. Beide klachten hadden dezelfde oorzaak.

Het huidige systeem:

- **Vorm draagt het onderscheid tussen de twee families.** Net = gevulde chip. Finaliteit =
  gevulde chip mét rand en vormteken (▲ doorstroom, ◆ dubbel, ■ arbeidsmarkt). De tekens staan
  `aria-hidden`, want de tekst ernaast zegt het al.
- **Het kleurbudget gaat naar finaliteit**, want daar wordt op gescand en gefilterd. Blauw /
  groenblauw / oranje, minimaal 49 kleurafstand in licht en 31 in donker, over alle vier de
  zichtsituaties.
- **De netkleuren blijven ondersteunend.** Bij protanopie liggen GO! en Gemeentelijk dicht bij
  elkaar (afstand 12 licht, 8 donker) en dat is aanvaard: elke net-chip draagt zijn naam voluit.
  Zeven categorieën allemaal CVD-veilig kleuren kán niet — het beste palet dat ik voor vier
  netten vond haalde maar 20. Vandaar de keuze om er niet meer kleur in te steken.
- Let op bij het bijstellen van netkleuren: het oranje van Provinciaal ligt op afstand 4 van het
  finaliteitsoranje van Arbeidsmarkt. Ze zijn uit elkaar te houden door rand en vormteken, maar
  maak het verschil niet nóg kleiner.
- Kaartmarkers zijn allemaal identiek en elke chip heeft een tekstlabel, dus kleur is nergens de
  enige drager van informatie (WCAG 1.4.1).

**Anti-flits:** `public/thema.js` zet het attribuut synchroon vóór React mount. Bewust een
apart bestand en géén inline `<script>` — de CSP in `netlify.toml` staat alleen `script-src
'self'` toe, en dat houden we zo.

**Twee dingen die onderweg gerepareerd zijn:**
- `DetailPanel` sloot niet met Escape. Een modaal venster hoort dat te doen; zonder die
  afhandeling raak je het met het toetsenbord alleen kwijt door naar de sluitknop te tabben.
- De driestandenknop viel op 375px buiten het scherm ("Donker" was onzichtbaar). De header
  breekt nu af (`flex-wrap`) zodat de knop op een eigen regel zakt.

**Bewust uitgesteld:** de sticky filterkolom met eigen scrollgebied. Blijft op de wenslijst
staan — zie het punt hieronder, dat is nog steeds geldig.

**Nog te doen:** filterkolom sticky met één scrollgebied (desktop). Nu is het het slechtste van
twee werelden: de `<aside>` scrollt weg bij 303 resultaten, terwijl de gemeentelijst erin wél
een eigen scrollbalk heeft (`max-h-48 overflow-auto`, 50 gemeenten). Doe het als één
scrollgebied: aside sticky met eigen overflow én die `max-h-48` weghalen. Enkel desktop.

**Fonts:** de app gebruikt bewust de systeemletter (Tailwind's `font-sans`). Geen webfont =
geen extra download, geen layout-verschuiving bij het laden, en niets dat de CSP of de privacy
raakt. Wil je later meer karakter, doe dat dan met één webfont voor koppen alleen, niet voor
lopende tekst.

### v0.3 — lijstweergave pagineren

Zonder filters staan er 303 adressen in de lijst, allemaal tegelijk in de DOM. Doorscrollen naar
beneden duurt onnodig lang, en dat is precies het scenario van iemand die nog geen idee heeft
waarop te filteren. Puur frontend, geen bron nodig.

Uitgangspunten voor wie dit bouwt:

- **De kaartweergave paginéért niet mee.** Daar is het volledige beeld net het punt; markers
  verbergen omdat ze op "pagina 2" staan maakt de kaart onbruikbaar. Alleen `ResultList` knipt.
- **Doe het met een "Toon meer"-knop, niet met genummerde pagina's.** De lijst staat op afstand
  gesorteerd, dus wat bovenaan staat is wat telt; iemand bladert niet doelgericht naar pagina 7.
  Een knop houdt bovendien de scrollpositie intact, en dat is op mobiel het verschil.
- **Zet het aantal getoonde items NIET in de URL.** De querystring beschrijft nu wát er gezocht
  wordt; hoe ver iemand had gescrold hoort daar niet bij en maakt een gedeelde link alleen maar
  vreemder. Gewone `useState` volstaat.
- **Reset de teller bij elke filterwijziging**, anders zit je na het aanvinken van één gemeente
  nog steeds naar 60 items te kijken terwijl er 4 resultaten zijn.
- Het resultaataantal bovenaan blijft het **totaal** tonen, niet het aantal zichtbare kaartjes.
  Dat cijfer is de feedback op je filters.
- Let op de samenhang met het openstaande punt uit v0.2.1 (sticky filterkolom met één
  scrollgebied). Een kortere lijst maakt dat minder nijpend, maar lost het niet op: de
  gemeentelijst heeft nog steeds z'n eigen scrollbalk binnen een meescrollende kolom.

### v0.3 — aanmelden: geen centrale bron (onderzocht 27/08/2026)

Er is **geen register, dataset of API** die scholen aan een aanmeldsysteem koppelt. Nagekeken:
de API-catalogus van het onderwijsportaal bevat geen aanmelden-product (zie hierboven), en er
bestaat geen centrale lijst van aanmeldingsinitiatieven.

Het landschap is versnipperd over minstens vier sporen:
- `aanmelden.vlaanderen` — het gratis platform van de Vlaamse overheid, met een aparte instantie
  per regio (bv. `zuiderkempenso.aanmelden.vlaanderen`). Secundair kreeg toegang in februari 2026.
- `meldjeaansecundair.antwerpen.be` — stad Antwerpen draait een eigen systeem.
- `aanmelden.school` — private aanbieder, gebruikt in een aantal regio's, met een eigen pagina
  "deelnemende scholen".
- Centraal Aanmeldingsregister van V-ICT-OR.

**Gevolg voor de aanpak:** dit wordt handmatige curatie per gemeente/regio, net als de
OKI-cijfers — een klein, gecommit bestand dat gemeente of schoolnummer koppelt aan de naam en
URL van het aanmeldsysteem, dat `fetch-data.ts` erbij joint. Niet scrapen: de deelnemerslijsten
staan op sites met eigen voorwaarden, en ze wijzigen per schooljaar.

**Let op bij het tonen:** aanmeldperiodes zijn kort en jaargebonden (voor 2026-2027 liep het van
31 maart tot 24 april 2026). Toon dus nooit een harde datum uit een gecommit bestand zonder
jaartal erbij, en link naar de bron in plaats van de procedure over te nemen — anders staat er
volgend jaar verouderde informatie die ouders een inschrijving kan kosten.

### v0.3 — bron geverifieerd, geen API-key nodig

- Bron: **Dataloep Leerlingenkenmerken Secundair**, op de Tableau Server van de overheid:
  `https://onderwijs-tableau.vlaanderen.be/t/EXTERN/views/DataloepLeerlingenkenmerkenSecundair/SOCijfersperschooljaar`
  Publiek, geen login.
- Zet in het dashboard de uitsplitsing **"instelling | vestigingsplaats adres"**. Rijen zien er dan
  zo uit: `28514 - Provinciaal Instituut PIVA | Antwerpen, Desguinlei 244` met Gemiddelde OKI +
  de 4 kenmerken in %.
- **Join werkt**: op `(schoolnummer, "straat huisnummer")` tegen ons campusmodel. Getest op 4 rijen,
  4/4 match.
- **Export**: raw "Data"-download is door de publisher bewust uitgeschakeld; **"Kruistabel → CSV"**
  is wél toegestaan (werkblad `SO | CIJF | Leerlingenkenmerken %`). Dat is de sanctioned route.
- **Niet automatiseerbaar via URL**: de `.csv`-suffix (gedocumenteerde Tableau-feature) werkt op
  werkbladen maar geeft leeg terug op dashboards, en parameterstate overleeft geen anonieme sessie.
  Tableau's interne `vizql`-protocol scrapen: **niet doen**, fragiel en niet-ondersteund.
- **Aanpak**: het is een Vlaamse Openbare Statistiek met jaarlijkse publicatiekalender → één keer
  per jaar handmatig exporteren (filter Provincie = Antwerpen), als statisch CSV in de repo
  committen, en `fetch-data.ts` laten joinen.
- **Framing**: OKI is een kansarmoede-indicator, geen kwaliteitsoordeel. Katholiek Onderwijs
  waarschuwt expliciet voor schoolkeuze te sterk op deze cijfers baseren en voor toenemende
  segregatie. Toon het als context over de leerlingenpopulatie, met uitleg — nooit als kaal cijfer
  of ranglijst.

### Juridisch uitgesloten als bron

`onderwijskiezer.be` (CLB) heeft studieaanbod mét finaliteit én infomomenten, maar de algemene
voorwaarden verbieden kopiëren, reproduceren en herdistribueren van hun materiaal. Enkel naar
linken mag. Niet als databron gebruiken.

## Workflow

- Kleine stappen, één git commit per afgeronde stap.
- Voor elke stap: `npm run build` moet slagen. `npm run fetch-data` vereist een API-key en
  hoort **niet** bij elke build — zie hieronder.
- **Data verversen is een aparte, periodieke stap.** `npm run fetch-data` draait niet meer mee in
  de Netlify-build: het schoolaanbod verandert praktisch één keer per schooljaar, dus elke deploy
  de API bevragen is verspilling en maakt builds afhankelijk van een externe dienst.

  Twee manieren, allebei dezelfde code:

  | Manier | Commando | Wanneer |
  | --- | --- | --- |
  | Lokaal | `npm run fetch-data` (key uit `.env.local`), dan `public/data/*.json` mee committen | Tussendoor, of om te testen |
  | Automatisch | GitHub Action `.github/workflows/ververs-scholendata.yml` | Per kwartaal, of handmatig via "Run workflow" |

  De Action commit **niet** rechtstreeks naar `main` maar opent een PR op branch
  `data/ververs-<datum>`. Netlify deployt enkel vanaf `main`, dus er gaat niets live zonder dat
  er iemand naar gekeken heeft. De PR-beschrijving bevat de tellingen uit het script — dat is de
  zinvolle review, want de diff zelf is tienduizenden regels.

  Vereist de repo-secret `ONDERWIJS_API_KEY` (Settings → Secrets and variables → Actions).

- **Omvangcontrole.** `fetch-data.ts` weigert weg te schrijven als het aantal vestigingen meer dan
  15% kleiner is dan in de gecommitte dataset, en eindigt met exitcode 1. Dat vangnet bestaat
  omdat het script ook ongesuperviseerd draait: een gewijzigde filterparam of een halve storing
  mag niet stilzwijgend over goede data heen gecommit worden. Groei is nooit verdacht, enkel
  krimp. Is de krimp terecht (scholen sluiten), draai dan `npm run fetch-data -- --force`.
  Geverifieerd dat de controle afgaat én dat `--force` hem overslaat.
- **Let op bij shell-stappen in de Action:** de default shell in GitHub Actions is `bash -e`
  *zonder* `pipefail`. In een stap met een pipe (`... | tee`) telt dan de exitcode van het
  láátste commando, waardoor een gefaalde fetch als geslaagd doorgaat. De workflow zet daarom
  expliciet `defaults.run.shell: bash` (= `bash -eo pipefail`). Geverifieerd in de GitHub-docs.
- Geen enkele hardgecodeerde schoolnaam of richting in de code — alles komt uit de gegenereerde data.

### Samenwerking / git

- **Nooit pushen zonder expliciet akkoord op dat moment.** Committen mag vrij; de gebruiker pusht
  zelf of geeft er per keer toestemming voor. Eén akkoord geldt niet voor volgende pushes.
- **[BUGS.md](./BUGS.md) hoort op `main` te staan**, niet op een branch. Het is de lijst van wat
  er open staat, dus hij moet kloppen voor wie ook maar naar `main` kijkt. Zou elke fix-branch
  z'n eigen `BUGS.md` aanmaken, dan krijg je bij twee gelijktijdige bugs twee losse lijstjes en
  een merge-conflict. `gh` is niet ingelogd, dus GitHub Issues zijn geen optie; dit bestand is
  de lijst. De README toont daarnaast een korte opsomming met één regel per bug; **houd die
  twee gelijk** — voeg je een bug toe of los je er een op, pas dan allebei aan. Bewust maar één
  regel in de README: hoe minder er dubbel staat, hoe minder er uit elkaar loopt.
- **Een bug melden gaat dus rechtstreeks naar `main`** (of via een piepkleine PR), los van de
  oplossing. Noteer: wat er gebeurt, op welk toestel/browser, wat de oorzaak lijkt, en wat er
  nog geverifieerd moet worden.
- **Een bug oplossen gaat op een `fix/`-branch**: naamgeving `fix/<kort-onderwerp>`, bijvoorbeeld
  `fix/ios-zoom-invoervelden`, afgetakt van een **verse** `main` (`git fetch` eerst — dat is hier
  al een keer misgegaan). Die PR bevat de oplossing én haalt de regel uit `BUGS.md` weg. De
  git-geschiedenis bewaart de bug, de lijst toont alleen wat nog open staat.
- **Begin elke nieuwe versie op een eigen branch, meteen bij de eerste commit.** Niet op `main`
  werken en achteraf verplaatsen. Naamgeving: `v0.3-gok-indicatoren`, `v0.4-aanmelden`, ...
  (versienummer uit de roadmap + kort thema). Doe dit vóór de eerste wijziging — vraag het niet
  telkens opnieuw, het is de standaard. Alleen losse fixes buiten een versie mogen rechtstreeks
  op `main`.
- De gebruiker werkt met feature branches + pull requests op GitHub
  (`git@github.com:stefanbckn/Zoek-je-school.git`, SSH — de HTTPS-remote heeft geen credentials).
  Netlify deployt enkel vanaf `main`, dus werk op een branch gaat niet live tot de PR gemerged is.
- `gh` CLI staat geïnstalleerd maar is **niet ingelogd** (vereist interactieve browser-login).
  PR's aanmaken doet de gebruiker zelf, of via een voorgevulde compare-link.

## Lokaal draaien en preview

- **De dev-server start je zelf**: `npm run dev` (poort via `process.env.PORT`, standaard 5173).
  Dat werkt gewoon.
- **`.claude/launch.json` is bewust attach-only** (enkel een `url`, geen `runtimeExecutable`).
  Laat je de preview-tool de server zélf spawnen, dan botst dat op deze machine op een
  sandbox-`EPERM` — eerst bij `process.cwd()` (`uv_cwd`), en met een absoluut pad bij het lezen
  van `node_modules/vite/bin/vite.js`. Vastgesteld op 25/08/2026 (commit `8702c91`) en op
  27/08/2026 opnieuw, nadat de config terug op spawnen was gezet.
- **Zet er dus geen `runtimeExecutable`/`runtimeArgs` in.** Dit is al twee keer opnieuw
  uitgevonden. Werkwijze: `npm run dev` in een aparte shell, daarna koppelt de preview aan
  `http://localhost:5173` vast.
- Dit zegt niets over de app zelf — die draait lokaal prima, en de UI van v0.2 is er in de
  browser mee geverifieerd.

## Node-versie

Systeem-`node` op deze machine is een oude v12 (`/usr/local/bin/node`). Gebruik de Homebrew-node
(v25) via `/usr/local/opt/node/bin` op PATH, anders faalt Vite/tsx.
