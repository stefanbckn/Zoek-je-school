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
#### Dieplink naar de kaart van openrouteservice (geen API-gebruik)

Naast de API-call is er dezelfde goedkope weg als bij Transitous: **linken naar
`maps.openrouteservice.org` met de route al ingevuld.** Geen key, geen quota — wie de link volgt,
doet zelf de call. Geïmplementeerd als `orsKaartUrl()` in `src/lib/fietsroute.ts`.

```
https://maps.openrouteservice.org/#/directions/<vanNaam>/<naarNaam>/data/
  {"coordinates":"<lon,lat>;<lon,lat>","options":{"profile":"cycling-regular","preference":"recommended"}}
```

Live nagespeeld op 28/08/2026 (Antwerpen-Centraal → Wilrijk, en Antwerpen-Centraal → Onyx): de
kaart berekent de rit, zet het profiel op de fiets en toont naam, afstand en tijd in de zijbalk.
Punten om niet in te lopen:

- **Het is een hash-route met een JSON-blok erin**, geen gewone querystring. Query-parameters op
  het pad (`?a=…&b=1`, zoals oudere forumposts tonen) worden **stil genegeerd** — geverifieerd:
  de app laadt dan gewoon de wereldkaart. Encodeer ook de namen: die staan in het pad, en een
  schoolnaam met een schuine streep zou de route anders in stukken hakken.
- **`coordinates` is `lon,lat`** — omgekeerd van de rest van deze app — en de punten scheiden
  met een puntkomma.
- **`"zoom"` in het optieblok doet niets merkbaars**, en een `/@lon,lat,zoom`-achtervoegsel
  evenmin. Beide geprobeerd. De kaart opent op straatniveau en zoomt pas na tien tot dertig
  seconden uit naar de volledige route (één keer wél gezien, één keer niet binnen 40 s). De
  bezoeker kan zelf op de "volledige route"-knop rechtsboven klikken. Dat is de bekende
  ruwe kant van deze link; de berekende route zelf klopt wel.
- De verplichte HeiGIT-vermelding blijft in de UI staan; alleen de link op het woord
  "openrouteservice" is uit het detailpaneel gehaald (die staat in de footer). De vermelding
  zelf is contractueel, de link erin niet.

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
- **Wél nuttig voor v0.7:** `GET /haltes/indebuurt/{lat,lng}` geeft haltes in de buurt van
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

#### Dieplink naar de Transitous-webplanner (geen API-gebruik)

Naast de API is er een veel goedkopere weg: **rechtstreeks naar hun webplanner linken met de
route al ingevuld.** De zoekwidget op `transitous.org` bouwt deze URL — afgeleid uit hun
`widget.js` en daarna live nagespeeld (28/08/2026), niet gegokt:

```
https://api.transitous.org?fromPlace=<lat,lon>&toPlace=<lat,lon>
    &fromName=<label>&toName=<label>&time=<YYYY-MM-DDTHH:mm>&arriveBy=true
```

`api.transitous.org` serveert op de root de MOTIS-webinterface (de API zelf zit onder `/api/`).
Getest met Antwerpen-Centraal → Wilrijk: toont de reisopties, neemt de namen over in de
invoervelden en zet de knop correct op "Arrival".

**Geïmplementeerd** in `transitousPlannerUrl()` in `src/lib/ov.ts`, getoond in `DetailPanel`
als "Bekijk de rit stap voor stap" naast het API-resultaat. Twee dingen daarbij: het paneel geeft
dezelfde `aankomst` mee aan de link als aan de API-call (anders opent de planner op een ander
moment dan wat er op het scherm staat), en de tijd gaat er in **lokale tijd** als
`YYYY-MM-DDTHH:mm` in — `toISOString()` zou er in de zomer 06:30 van maken. Live nagekeken:
de planner neemt namen, tijd en "Arrival" correct over. De verplichte attributielink naar
`transitous.org/sources/` staat in de footer; die is uit het paneel verdwenen omdat de dieplink
daar nu staat.

**Waarom dit belangrijk is: een hyperlink is géén API-gebruik.** Het gebruiksbeleid van
Transitous (open source, niet commercieel, User-Agent, attributie) gaat over hun API. Wie
doorlinkt, doet zelf geen enkele call. **Deze dieplink kan dus nú al**, zonder dat de repo
publiek is en zonder LICENSE — in tegenstelling tot de API-route hieronder.

Aandachtspunten:
- Zet `arriveBy=true` met een **aankomsttijd op een schooldag** (bv. 08:15 op de eerstvolgende
  weekdag). "Nu vertrekken" is voor een ouder die schoolvervoer bekijkt zinloos. Bereken die
  datum, hardcode ze niet — een vaste datum veroudert stil.
- Werkt alleen als de gebruiker z'n eigen adres heeft ingevuld, net als de fietsroute.
- Dit is de MOTIS-webinterface, geen product-URL met stabiliteitsgarantie. Verandert ze, dan is
  het gevolg een dode link, geen kapotte app — dat is precies waarom deze weg zo goedkoop is.
- Raakt de CSP niet: een link is geen `connect-src`.

**De voorwaarden** (`transitous.org/api`) — toegang mag als het project open source is, niet
commercieel, licht voor hun infrastructuur, en zich aan het gebruiksbeleid houdt:

1. **Open source, gepubliceerd onder een open-source licentie**, en niet-commercieel.
   Prototypen mag zonder. ✅ Licentie geregeld in v0.3: `LICENSE` bevat de letterlijke
   AGPL-3.0-tekst van gnu.org. ⚠️ **Nog open: de repo publiek zetten.**
   `github.com/stefanbckn/Zoek-je-school` gaf op 27/08/2026 nog HTTP 404 zonder login. Zonder
   dat is er geen publieke broncode en is de voorwaarde niet vervuld. Doet de eigenaar zelf.
   Let ook op de niet-commerciële eis: een donatieknop is verdedigbaar, advertenties of een
   betaalmuur zouden deze API-toegang kosten.
2. **Contact opnemen vóór gebruik van zware endpoints**, via hun Matrix-kanaal
   `#transitous:matrix.spline.de`. ⚠️ **Correctie op een eerdere versie van dit bestand**, die
   hier "geen harde verplichting vooraf" van maakte. De voorwaarden zeggen letterlijk *"contact
   us before using any potentially resource-intensive API endpoints (such as routing,
   isochrones)"* — en routing is precies wat wij doen. Herlezen op 27/08/2026. Nog te doen door
   de eigenaar; kan niet vanuit deze repo.
3. **Contactgegevens meesturen.** Een `User-Agent` met naam, versie en contactadres.
   ⚠️ **Dat kan hier niet** — een browser laat `User-Agent` niet overschrijven, en `fetch`
   weigert die header stil. Transitous voorziet dat expliciet: draait de app in de browser, dan
   volstaat de `Referer`-header, **op voorwaarde dat er contactgegevens op de site staan.**
   ✅ Sinds v0.3 staat `info@bckn.be` in de footer — die regel is dus een voorwaarde, geen
   opsmuk. Onze `Referrer-Policy: strict-origin-when-cross-origin` stuurt bij een cross-origin
   call enkel de origin mee — genoeg om de site te identificeren, dus dat hoeft niet losser
   gezet te worden.
4. **Attributie**: zichtbare link naar `https://transitous.org/sources/`, plus de
   OpenStreetMap-attributie (`openstreetmap.org/copyright`) — die laatste staat er al voor de
   kaartlaag, maar geldt dan ook voor de routes.
5. **Showcase** (optioneel): de app mag toegevoegd worden aan de Transitous-website.

Best effort, geen SLA. `connect-src` in `netlify.toml` heeft `https://api.transitous.org`
erbij gekregen. Roep het rechtstreeks vanuit de browser aan — niet via een Netlify Function zoals
bij de fietsroute, want daar was de reden een geheime key, en die is hier niet; proxyen zou net
de `Referer` wegnemen waarmee zij ons herkennen.

**Implementatie: `src/lib/ov.ts`, opgeleverd in v0.3.** Wat daar geverifieerd is:

- `arriveBy=true` bij de `time`-parameter maakt er een gewenste **aankomsttijd** van. We mikken
  op 8u30 op de eerstvolgende weekdag: een zoekopdracht op zondagavond mag geen zondagse
  dienstregeling tonen. Vakantiedienstregelingen vangt dat niet op — daarom staat de datum
  waarvoor gerekend is in de UI, naast het resultaat.
- **Bij korte afstanden is `itineraries` leeg en staat er enkel een wandelroute in `direct`.**
  Geverifieerd op een rit van 400 m. Dat is geen fout: de app toont dan "te voet sneller", niet
  "geen verbinding". Wie dat onderscheid niet maakt, meldt bij elke school in de buurt ten
  onrechte dat er geen bus rijdt.
- **`mode` is niet betrouwbaar genoeg om er een vervoermiddel bij te schrijven.** De S-treinen
  van NMBS komen binnen als `METRO`, en Antwerpen heeft geen metro. Daarom toont de UI enkel het
  lijnnummer ("lijnen A3, 51") en geen "bus"/"trein" ervoor. Niet "verbeteren" zonder de feed
  opnieuw na te kijken.
- Net als de fietsroute enkel voor de **geselecteerde** school in het detailpaneel, met een
  in-memory cache per `(van, naar, aankomstmoment)`. Voor elke kaart in de lijst routeren is
  precies de belasting waar Transitous voor waarschuwt.

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
  elk met `Richting[]`. Lege placeholders (`kostprijs`, `vervoer`) blijven staan voor v0.6/v0.7.
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
v0.2 (Reizen) is deels al opgeleverd — fietsafstand/-tijd zit in 0.1.1 — en de resterende oude
backlog-items zijn doorgeschoven naar 0.6.0–0.8.0.

Alles staat op drie posities (MAJOR.MINOR.PATCH), gelijk aan `package.json` en de git tags. Wat
er per uitgebrachte versie veranderd is, staat in [CHANGELOG.md](./CHANGELOG.md) — niet hier.
Deze tabel gaat over wat er nog komt; de changelog over wat er al is.

| Versie | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| **0.1.0** | Basis | Vestigingen → campussen, afstand (hemelsbreed), filters (net/gemeente/naam), kaart, detailpaneel, URL-state, mobiel | **Opgeleverd** |
| **0.1.1** | Fiets | Fietsafstand/-tijd per school in detailpaneel (OpenRouteService via api.heigit.org) | **Opgeleverd** |
| **0.2.0** | API Onderwijs Vlaanderen | Schooldata via API · studieaanbod + finaliteit per vestiging · net-onderscheid via soort_bestuur | **Datalaag opgeleverd**; UI nog te doen. Infodagen geschrapt: geen bron. |
| **0.2.1** | UI-verbeteringen | Actieve filters zichtbaar onder de zoekbalk + reset · kleurenpalet herzien (kleurenblindheid) · thema's/dark mode | **Opgeleverd**, zie hieronder |
| **0.3.0** | Openbaar vervoer + pagineren | AGPL-3.0-licentie · reistijd met bus/trein via Transitous · contactgegevens in de footer · lijst pagineren | **Uitgebracht** op 27/08/2026, tag `v0.3.0`. Repo is publiek en Transitous is verwittigd en akkoord |
| **0.4.0** | Dieplinks + opgeruimd detailpaneel | Link naar de rit in de Transitous-planner en naar de fietsroute op de ORS-kaart · adres en contactgegevens bovenaan het detailpaneel, reisinfo apart onder "Hoe geraak je er?" | **Klaar**, in review op branch `v0.4.0-dieplinks-en-detailpaneel` |
| **0.5.0** | GOK-indicatoren | 4 leerlingenkenmerken per school, met kaderende uitleg | **Klaar om te bouwen.** Downloadbare xlsx bij AgODi, join geverifieerd op 269/272 scholen. Per school, niet per vestiging — zie hieronder |
| **0.6.0** | Kostprijs | Maximumfactuur, materiaalkost bij start (boeken, laptop, kaften) | Geen centrale bron; deels handmatig per school |
| **0.7.0** | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie Databronnen). Rest nog te onderzoeken |
| **0.8.0** | Vergelijken | 2–4 campussen naast elkaar in vergelijkingstabel + exporteerbare shortlist | Puur frontend, geen externe bron nodig |
| **Geen nummer** | Aanmelden | Aanmeldsysteem per school tonen en linken | **Bewust zonder versienummer.** Er is geen centrale bron; dit wordt handmatige curatie per regio, zie hieronder. Een nummer zou een planning suggereren die er niet is |
| **Geen nummer** | Doorlichting | Link naar het doorlichtingsverslag + datum, per school | **Idee, niet ingepland.** Nooit als score tonen, zie hieronder. Eerst uit te zoeken of de verslagen per schoolnummer op te halen zijn |
| ~~Geparkeerd~~ | Openbaar vervoer | Reistijd met de bus | **Uit de parkeerstand gehaald en uitgebracht in 0.3.0** via Transitous. De Lijn zelf heeft nog steeds geen routeplanner-API — niet opnieuw gaan zoeken |

### 0.2.0 — stand van zaken

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

### 0.2.1 — UI-verbeteringen

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

### 0.3.0 — lijstweergave pagineren (uitgebracht)

**Uitgebracht in 0.3.0** in `ResultList.tsx`: 25 adressen per lading, "Toon meer"-knop, teller reset bij
elke filterwijziging. De uitgangspunten hieronder zijn dus beschrijvend geworden, geen plan meer.

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

### Doorlichting: wel linken, nooit scoren (idee, 27/08/2026)

Idee van de gebruiker: tonen wat de onderwijsinspectie over een school zegt. Geparkeerd zonder
versienummer — er is geen haast, en er is eerst uitzoekwerk nodig.

**De vorm ligt wél al vast, en dat is het belangrijkste deel.** Geen cijfer, geen samenvatting,
geen ranglijst: enkel een link naar het verslag met de datum erbij ("doorgelicht in maart 2024 —
lees het verslag"). Drie redenen, alle drie door de gebruiker aangebracht of onderschreven:

- **Niet elke school heeft een verslag.** In een lijst met scores belanden die scholen onderaan
  zonder dat er iets over hen gezegd is. Dat is de slechtst mogelijke uitkomst: afwezigheid van
  informatie leest als een slecht rapport.
- **Eén punt doet een school onrecht.** Zelfde bezwaar als bij OKI, dat hier ook al bewust als
  context met uitleg staat en niet als kwaliteitsoordeel.
- **De verslagen dateren van verschillende jaren.** Een doorlichting van vorig jaar naast een van
  zes jaar geleden vergelijkt geen twee scholen maar twee momenten. Zet de datum er dus altijd
  bij, ook als er ooit meer dan een link getoond zou worden.

**Nog uit te zoeken, vóór dit ingepland kan worden:**

- Zijn de verslagen per `schoolnummer` op te halen, of enkel via een zoekformulier? Zonder
  koppeling op schoolnummer valt dit terug op handwerk, net als aanmelden.
- Staat er een datum en een stabiele URL per verslag?
- Wat zeggen de gebruiksvoorwaarden over linken en over het overnemen van tekst? Linken zal wel
  mogen; overnemen is sowieso niet de bedoeling, zie de vorm hierboven.

Niets hiervan is nagekeken — dit is een genoteerd idee, geen geverifieerde bron. Wie eraan begint,
begint bij die drie vragen.

### Aanmelden: geen centrale bron (onderzocht 27/08/2026)

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

### 0.5.0 — GOK-indicatoren: er is wél een downloadbaar bestand (27/08/2026)

**Dit vervangt de Tableau-route hieronder als eerste keuze.** AgODi publiceert de
leerlingenkenmerken per school als gewone xlsx op het documentenportaal. Geen Tableau, geen
handmatige kruistabel, geen key — `fetch-data.ts` kan het rechtstreeks ophalen.

Gevonden via `onderwijsstatistieken.depuydt.eu` (Dieter Depuydt), die dezelfde cijfers toont en
in zijn FAQ schrijft dat alles uit publieke AgODi-publicaties komt. Zijn percentages zijn
**exact gereproduceerd** uit het bestand hieronder (Sint-Jan Berchmanscollege Brussel: 14,7 /
65,6 / 24,2 / 62,3) — dus dit is zijn bron, en onze kolominterpretatie klopt.

```
https://data-onderwijs.vlaanderen.be/documenten/bestanden/
  Publicaties_Leerlingenkenmerken_Overzicht_2024-2025_so.xlsx
```

- **Meest recente schooljaar is 2024-2025** (getest: 2025-2026 geeft 404). Eén werkblad,
  1002 datarijen, alle Vlaamse SO-instellingen.
- ⚠️ **De bestandsnaam is niet voorspelbaar.** 2021-2022 en 2022-2023 heten `..._so_1.xlsx`,
  2023-2024 en 2024-2025 heten `..._so.xlsx` — en bij de pdf's is het net omgekeerd. Elk jaar
  het patroon hardcoden en verhogen gaat dus stuk. Haal de link op van de AgODi-pagina
  `cijfermateriaal-leerlingenkenmerken`, of controleer beide varianten met een HEAD-request.
  (Die AgODi-pagina was op 27-28/08/2026 zelf niet bereikbaar: `www.agodi.be` geeft een DNS-fout
  en de redirect naar `paddlecms.net` loopt in een time-out. Het documentenportaal werkt wél.)
- **Kolommen:** Provincie · Postnr · Gemeente · Instelling (= schoolnummer) · Naam instelling ·
  Straat · Huisnr · Teldatum · Aantal lln · en dan vier tellingen: indicator "opleiding moeder",
  "schooltoelage", "thuistaal", "buurt".
- **Het zijn absolute aantallen, geen percentages** — en er staan halven in (733,5), doordat
  leerlingen in co-ouderschap half meetellen. Percentage = teller / aantal lln.
- **Teldatum is 1 februari van het jaar ervóór** (bestand 2024-2025 telt op 01/02/2024). Het
  bestand heet niet voor niets "voorschot werkingstoelagen": dit is de financieringsteling.
- **OKI staat er niet als kolom in.** De definitie (som van de risicokenmerken per leerling,
  gedeeld door het aantal leerlingen) komt neer op `(4 tellingen opgeteld) / aantal lln`.
  ⚠️ Dat is een **afleiding, geen gepubliceerd cijfer** — vóór we het als "OKI" labelen, één
  school naast de gepubliceerde "Gemiddelde OKI" in Dataloep leggen. Zolang dat niet gebeurd is:
  toon de vier percentages, niet een zelfberekende OKI.

**Join tegen onze dataset, geverifieerd op het bestand 2024-2025:**

- Op `schoolnummer`: **269 van onze 272 scholen matchen.** De drie die ontbreken zijn Arkades
  (Herentals, onafhankelijk — krijgt geen werkingstoelagen, dus terecht afwezig) en Mariagaarde
  secundair I en II (Malle, recent gesplitst; nog niet in de telling van feb 2024).
- ⚠️ **Het adres in dit bestand is dat van de instelling, niet van de vestigingsplaats.** Bij
  86 van de 269 gematchte scholen wijkt het af van het campusadres dat wij tonen (bv. Panorama
  staat er met Bredastraat 35, wij tonen Quellinstraat 31). **Join dus op schoolnummer, nooit op
  adres**, en hang het cijfer aan `SchoolOpCampus`, niet aan `Campus`.
- **Gevolg voor de UI: dit is per school, niet per campus.** Een school met drie campussen heeft
  één cijfer voor alle drie. Dat is een wezenlijk verschil met het studieaanbod, dat we juist wél
  per adres samenvoegen — hier mag dat niet, want optellen over scholen die een adres delen zou
  een gemiddelde over andere leerlingenpopulaties maken. Zet het er in de UI expliciet bij.

**Per vestigingsplaats bestaat het wél, maar enkel handmatig** — dat is de Dataloep-route
hieronder. Afweging: automatisch en per school (dit bestand), of handwerk en per vestiging
(Tableau). Voor v0.5 is dit bestand de betere ruil.

### 0.5.0 — Dataloep-route (per vestigingsplaats, handmatig)

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

#### Doodlopende sporen (opnieuw nagekeken 27/08/2026)

Bij het voorbereiden van v0.3 is nog eens gezocht naar een bron die wél automatiseerbaar is.
Die is er niet. Wat gecontroleerd is, zodat niemand het een derde keer doet:

- **De site is verhuisd.** `onderwijs.vlaanderen.be/nl/onderwijsstatistieken/...` geeft nu 301
  naar `vlaanderen.be`, en die datapagina somt Dataloep, het statistisch jaarboek en het
  API-portaal op — géén downloadbaar leerlingenkenmerken-bestand. Oude links naar
  statistiekpagina's landen op een algemene pagina, dus een dode link betekent hier niet dat de
  data weg is.
- **`agodi.be` bestaat niet meer als host** (DNS-fout op `www.agodi.be`; `agodi.be` redirect naar
  een `paddlecms.net`-adres dat time-outt). Zoekresultaten verwijzen er nog naar.
- **provincies.incijfers.be** (Swing/ABF, het platform achter "Provincies in cijfers") heeft wél
  een OData-service op `/viewerservices/odata/` — maar die geeft anoniem
  `401 {"error":{"message":"Guest user group not found, No access!"}}`. Geen open API dus. De
  databank zelf zit bovendien op gemeenteniveau, niet per vestigingsplaats.
- Het **Tableau-dashboard staat er nog** en laadt (geverifieerd vandaag). De handmatige
  kruistabel-export blijft de route.

### Juridisch uitgesloten als bron

`onderwijskiezer.be` (CLB) heeft studieaanbod mét finaliteit én infomomenten, maar de algemene
voorwaarden verbieden kopiëren, reproduceren en herdistribueren van hun materiaal. Enkel naar
linken mag. Niet als databron gebruiken.

## Licentie

De code staat sinds v0.3 onder **AGPL-3.0**, met de letterlijke tekst van gnu.org in `LICENSE`.
Twee dingen die daaruit volgen en die je niet per ongeluk mag ongedaan maken:

- **De broncodelink in de footer is een licentievereiste**, geen extraatje. Artikel 13 van de
  AGPL vraagt dat een webapp z'n gebruikers een weg naar de bron biedt.
- **De contactregel in de footer is een Transitous-vereiste.** Zie de sectie Openbaar vervoer.

De data in `public/data/` valt niet onder de AGPL: die blijft van Onderwijs en Vorming. Het
API-portaal publiceert geen expliciete hergebruikslicentie bij deze producten (nagekeken
27/08/2026) — niet gokken dat het open data is, en bij twijfel navragen bij het portaal.

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

### Versienummering (SemVer)

Het project gebruikt **MAJOR.MINOR.PATCH**. Drie plaatsen moeten samen kloppen:

- **`package.json`** draagt de huidige versie. Staat sinds de merge van 0.3.0 op `0.3.0`. Zet
  het nummer in de versie-branch zelf, niet achteraf op `main` — dan komt de bump mee in de PR
  die de functionaliteit brengt.
- **Een git tag per release**, `v<versie>` (bv. `v0.3.0`), gezet op `main` *nadat* de PR gemerged
  is. Nooit taggen op een branch die nog niet gemerged is — die commit ligt na de merge niet meer
  in de geschiedenis van `main`, dus de tag wijst dan naar een losse commit.
- **De branchnaam** draagt het versienummer: `v0.4.0-aanmelden` voor een roadmapversie. Losse
  bugfixronden buiten een versie blijven `fix/<kort-onderwerp>`; die krijgen hun nummer pas
  wanneer ze in een release meegaan.

**Release notes horen in [CHANGELOG.md](./CHANGELOG.md)**, niet in de roadmaptabel en niet enkel
op GitHub. Werkwijze:

1. Tijdens het werk vult de versie-branch de kop **Niet uitgebracht** aan, in dezelfde PR als de
   wijziging zelf. Zo is de tekst reviewbaar vóór de merge, in plaats van achteraf uit commits
   gereconstrueerd te worden.
2. Bij de merge wordt die kop het versienummer met datum, en `package.json` gaat mee omhoog.
3. Ná de merge: de tag zetten, en dezelfde tekst als GitHub Release bij die tag plakken. Het
   bestand is de bron, de Release is de kopie.

Schrijf de notes vanuit wat een bezoeker merkt ("je ziet nu de reistijd met bus of trein"), niet
als opsomming van commits — die staat al in git. Wat er niet werkt of niet meegenomen is, hoort er
ook in: een changelog die enkel goed nieuws bevat, wordt niet gelezen.

Wat welk cijfer verhoogt: MINOR bij een nieuwe roadmapversie (nieuwe functionaliteit), PATCH bij
bugfixes en tekstcorrecties zonder gedragswijziging. MAJOR blijft 0 zolang de site niet publiek
aangekondigd is.

**Wat wanneer live gaat.** De volledige gang: branch → PR → merge in `main` → Netlify deployt
automatisch → tag zetten → GitHub Release aanmaken. Twee dingen die daarbij verwarren:

- **Een tag of een release deployt niets.** Netlify luistert enkel naar pushes op `main`, en de
  enige workflow in `.github/workflows/` is de kwartaalverversing van de scholendata. De site
  staat dus al live vóór de tag bestaat; taggen en releasen zijn boekhouding. Rustig een dag
  later doen mag.
- **Een push met enkel `.md`-wijzigingen bouwt niet.** De `ignore`-regel in `netlify.toml`
  annuleert de build als er buiten de documentatie niets veranderde. Terecht — er valt dan niets
  te deployen. Komt een échte wijziging ooit niet live, kijk daar dan eerst.

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
- **Vraag eerst of het een MAJOR, MINOR of PATCH wordt, vóór je een branch aanmaakt.** Ook bij
  een kleine vraag die niet in de roadmap staat: het versienummer bepaalt de branchnaam, en
  achteraf hernoemen is rommelig. Niet zelf inschatten — de gebruiker beslist dat.
- **Begin elke nieuwe versie op een eigen branch, meteen bij de eerste commit.** Niet op `main`
  werken en achteraf verplaatsen. Naamgeving: `v0.4.0-gok-indicatoren` — het volledige
  versienummer plus een kort thema. Alleen losse fixes buiten een versie mogen rechtstreeks
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
