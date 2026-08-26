# Zoek je school — projectconventies

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in provincie Antwerpen.
Volledig client-side (Vite + React + TypeScript + Tailwind v4), geen backend, geen database.
Data wordt op build-time opgehaald en weggeschreven als statische JSON — de app doet nooit live
calls naar overheidsbronnen voor de scholendata (CORS/betrouwbaarheid). De enige live calls vanuit
de browser zijn de Geolocation API (eigen adres zoeken) en OpenRouteService (fietsafstand/-tijd in
het detailpaneel), zie hieronder.

## Databronnen

### Scholen en vestigingsplaatsen (build-time, via scripts/fetch-data.ts)

- Scholen (hoofdzetels): `https://data-onderwijs.vlaanderen.be/onderwijsaanbod/csv.ashx?s=01&n=2&hz=true&hs=311`
- Vestigingsplaatsen: `https://data-onderwijs.vlaanderen.be/onderwijsaanbod/csv.ashx?s=01&n=2&hs=311`
- Bron: Vlaams Ministerie van Onderwijs en Vorming, data-onderwijs.vlaanderen.be/onderwijsaanbod/lijsten
- Formaat: UTF-8 met BOM, `;`-gescheiden, quotes, **CR-only regeleindes** (geen `\n` — split expliciet op `\r`)
- We gebruiken alleen `vestigingen.csv` (de scholen-CSV dient enkel ter controle/kruisreferentie).
  Filter: `provincie === 'Antwerpen'` en `soort instelling === 'Onderwijsinstelling'`.
- `lx`/`ly` zijn Lambert72 (EPSG:31370) → omgezet naar WGS84 via `proj4`.
- **Niet aanwezig in deze bron, dus niet in de app:** studierichtingen/aanbod per graad (zie hieronder),
  en of een school met "aanmelden" werkt (dat veld bestaat niet in deze CSV — daarvoor linken we door
  naar de officiële fiche).
- Volledige kolombeschrijving en welke velden bruikbaar zijn: zie de verificatie in de projectgeschiedenis
  (git log van de eerste commits) — kort samengevat: `begindatum`/`einddatum`/`crab-code`/`crab-huisnr`/
  `VWO-vestigingsplaatscode`/`fax` zijn genegeerd (niet discriminerend of niet relevant voor SO).

### Campus-groepering (belangrijk datamodel-detail)

De brondata bevat regelmatig **meerdere apart geregistreerde scholen (elk een eigen `schoolnummer`)
op exact hetzelfde fysieke adres** — niet zomaar interne vestigingsplaats-varianten van één school,
maar echt losse legale entiteiten die een campus delen (bv. "Sint-Gabriëlcollege" +
"Sint-Gabriëlcollege - Middenschool 1/2/3" zijn 4 verschillende schoolnummers op 2 gedeelde adressen).
Geverifieerd: 386 van de 562 scholen (69%) delen een adres met minstens 1 andere school; sommige
adressen hebben tot 11 verschillende scholen. Dit als losse kaartjes tonen is verwarrend — expliciet
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
- Toekomstig werk (afgesproken met de gebruiker): zodra het studieaanbod gekoppeld is, worden
  finaliteiten/richtingen **per adres/campus** samengevoegd getoond (een andere campus met andere
  richtingen blijft wél apart) — dat past bovenop deze structuur, `SchoolOpCampus.richtingen` is de
  plek waar dat per school binnenkomt.

### Studieaanbod (richtingen) — NIET geïntegreerd in v0.1

- API: `Onderwijsaanbod SO 2.6` op `https://onderwijs.api.vlaanderen.be/instellingsgegevens/onderwijsaanbod_so/v2`
  (endpoints `/ingerichtehoofdstructuur`, `/ingerichteadministratievegroep`)
- Vereist een API-key (`401 Unauthorized` zonder key). Key wordt zelf aangevraagd via
  `https://onderwijs-api-portaal.vlaanderen.be/contact/aanvraag-apikey` — dit is bewust niet
  geautomatiseerd (formulier vraagt persoonsgegevens).
- Zodra de key er is: uitbreiden in `scripts/fetch-data.ts`, richtingendata toevoegen aan
  `Vestiging.richtingen` (nu altijd `null`), en de placeholder-filtersectie in `FilterPanel` activeren.
- Auth (geverifieerd via de OpenAPI-spec op het portaal): header `x-api-key: <key>` óf query-param
  `?apikey=<key>`.
- **Key-beheer:** env var `ONDERWIJS_API_KEY`, gelezen via `process.loadEnvFile()` (Node 21+, geen
  `dotenv`-dependency nodig) in `scripts/fetch-data.ts`. Lokaal in `.env` (gitignored, zie
  `.env.example` voor het te volgen formaat). Op Netlify: zet dezelfde variabele in
  Site settings → Environment variables — Netlify injecteert die enkel in de build-omgeving.
  **Bewust geen `VITE_`-prefix**: de key wordt alleen door het build-time Node-script gebruikt
  (`fetch-data.ts`, draait vóór `vite build`), nooit door client-code. Een `VITE_`-prefix zou Vite
  de key laten inbakken in de publieke JS-bundle, zichtbaar voor iedereen via view-source — precies
  wat we willen vermijden op een statische site zonder backend. Enkel de opgehaalde richtingendata
  zelf (niet de key) komt terecht in `public/data/*.json`, en dat is bedoeld — die data is publiek.
- Mogelijk is de aangevraagde key enkel gekoppeld aan het "Onderwijsaanbod SO"-API-product; de
  "Instelling"- en "Codelijst"-API's (nodig voor het net-onderscheid, zie hieronder) zijn aparte
  producten op hetzelfde portaal en vragen mogelijk een aparte aanvraag/koppeling.

### Net-onderscheid Provinciaal/Stedelijk binnen "Officieel gesubsidieerd" — NIET geïntegreerd

Gewenst: onderscheid GO! / Officieel gesubsidieerd Provinciaal / Officieel gesubsidieerd Stedelijk /
Vrij gesubsidieerd (huidige `net` in de CSV heeft maar 3 categorieën + leeg).

- De CSV zelf heeft hiervoor geen apart veld — enkel de vrije-tekst `naam` van het schoolbestuur
  (via het `bestuur`-veld, join op `schoolnummer` in de Schoolbesturen-CSV
  `csv.ashx?s=03`) geeft een aanwijzing (bv. "Autonoom Provinciebedrijf Provinciaal Onderwijs
  Antwerpen" vs. "Autonoom Gemeentebedrijf Stedelijk Onderwijs Antwerpen"). Dat is een heuristiek
  op vrije tekst, geen betrouwbare structured data — bewust niet gebruikt.
- De **Instelling-API** (`onderwijs.api.vlaanderen.be/instellingsgegevens/instelling/v1`, zelfde
  soort key als hierboven) heeft wél een schoon veld: `instelling_soort_bestuur`
  (`CodeOmschrijving`, filterbaar via `filter_instelling_soort_bestuur` met codes 1–9). De exacte
  betekenis van die 9 codes is nog niet geverifieerd — vereist een werkende key plus de
  **Codelijst-API** om de codes te decoderen. Niet gokken welke code wat betekent; eerst opvragen.
- Zodra dit gebouwd wordt: `Vestiging.net` uitbreiden met de 2 extra categorieën, en de
  `filter_instelling_bestuur`-param gebruiken om per school het bestuur (en dus soort_bestuur) op
  te halen — niet de tekst-heuristiek.

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
- **Key-beheer:** env var `VITE_ORS_API_KEY` — WEL met `VITE_`-prefix, in tegenstelling tot de
  onderwijs-key hierboven. Dit is bewust: het is een live call vanuit de browser, afhankelijk van
  het adres dat de bezoeker net intikt, dus kan niet build-time voorberekend worden en de key kan
  sowieso niet volledig verborgen blijven. Beperk de key in het HeiGIT-dashboard tot ons eigen
  domein (referrer-restrictie) als mitigatie.
- Account/key aanvragen via `https://account.heigit.org` (self-service signup).
- Wordt enkel aangeroepen voor de **geselecteerde** school in het detailpaneel (niet voor elke
  kaart in de resultatenlijst) — anders is de gratis quota in enkele zoekopdrachten op.
- In-memory cache per `(van, naar)`-paar in `fietsroute.ts` om herhaalde calls binnen dezelfde
  sessie te vermijden.
- Geen key ingesteld → `berekenFietsroute` geeft stil `null` terug, geen fetch-poging, geen crash.

## Regel: nooit gokken

Verzin nooit een API-endpoint, veldnaam of URL. Alles in dit bestand is geverifieerd door de
response effectief op te halen. Als iets niet meer werkt of een veld niet blijkt te bestaan: zeg dat
expliciet en stel een alternatief voor — verzin geen vervanging.

## Architectuur

- `scripts/fetch-data.ts` — Node-script (draai met `npm run fetch-data`), schrijft
  `public/data/vestigingen.json` + `public/data/meta.json` (ophaaldatum, bronvermelding, aantallen).
- **`public/data/*.json` staat bewust WEL in git** (~400 kB), als fallback voor een falende fetch.

  Wat we **zeker weten**: de eerste Netlify-build faalde met `ECONNRESET` tijdens de TLS-handshake
  naar `data-onderwijs.vlaanderen.be` ("Client network socket disconnected before secure TLS
  connection was established"), binnen 1 seconde, dus nog vóór enige HTTP-header. Dezelfde call
  werkt wél vanaf een Belgisch residentieel IP (TLS 1.3, geldig GlobalSign-cert) én vanaf
  Anthropic's cloud-infrastructuur.

  Wat we **niet** weten: de precieze oorzaak. Het is dus **géén** algemene blokkade op
  datacenter-IP's — dat is getest en weerlegd. Overblijvende kandidaten: een IP-range- of
  geo-blokkade die specifiek Netlify's build-infra treft, of gewoon een tijdelijke storing (de
  originele code deed één poging zonder retry). **Niet als vaststaand feit behandelen.**
- `fetch-data.ts` doet daarom 3 pogingen met backoff en valt daarna terug op de gecommitte dataset:
  build gaat door, met een luide waarschuwing. Ligt er géén dataset, dan faalt het script wél hard.
- **Gevolg voor de werkwijze:** data verversen doe je **lokaal** (`npm run fetch-data`) en dan
  `public/data/*.json` mee committen. De footer toont de ophaaldatum uit `meta.json`, dus verouderde
  data is altijd zichtbaar voor de bezoeker — controleer die datum na een refresh.
- `src/types.ts` — het `Vestiging`-datamodel, inclusief lege placeholders (`richtingen`, `kostprijs`,
  `vervoer`) voor latere versies zodat de structuur niet moet herbouwd worden.
- `src/lib/` — pure functies: haversine-afstand, net-labels, URL-state hook.
- `src/components/` — UI-componenten, geen state-logica die ook elders nodig is.
- Filterstatus leeft in de URL-querystring (geen router nodig, single-page app — vermijd
  react-router, dat lost hier niets op en breekt GitHub Pages deep-linking onnodig).
- Afstand is altijd hemelsbrede afstand (haversine); benoem dat expliciet in de UI, nooit als
  "reisafstand" framen.

## Roadmap

Let op: deze nummering **vervangt** de oorspronkelijke backlog-nummering uit de opzet. De oude
v0.2 (Reizen) is deels al opgeleverd — fietsafstand/-tijd zit in v0.1 — en de resterende oude
backlog-items zijn doorgeschoven naar v0.5–v0.7.

| Versie | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| **v0.1** | Basis | Vestigingen → campussen, afstand (hemelsbreed), filters (net/gemeente/naam), kaart, detailpaneel, URL-state, mobiel | **Opgeleverd** |
| **v0.1.x** | Fiets | Fietsafstand/-tijd per school in detailpaneel (OpenRouteService via api.heigit.org) | **Opgeleverd** |
| **v0.2** | API Onderwijs Vlaanderen | Schooldata via API · studieaanbod + finaliteit per school · infodagen | **Wacht op API-key** (aangevraagd, kan dagen duren, niet gegarandeerd) |
| **v0.3** | GOK-indicatoren | OKI + 4 leerlingenkenmerken per campus, als context in detailpaneel | Bron gevonden en geverifieerd — **key niet nodig** |
| **v0.4** | Aanmelden | Aanmeldsysteem tonen/linken (bv. meldjeaan.be) | **Nog te onderzoeken** — bron onbekend |
| **v0.5** | Kostprijs | Maximumfactuur, materiaalkost bij start (boeken, laptop, kaften) | Geen centrale bron; deels handmatig per school |
| **v0.6** | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Bronnen nog te onderzoeken |
| **v0.7** | Vergelijken | 2–4 campussen naast elkaar in vergelijkingstabel + exporteerbare shortlist | Puur frontend, geen externe bron nodig |
| **Geparkeerd** | Openbaar vervoer | Reistijd met de bus | De Lijn heeft geen publieke routeplanner-API; een eigen mini-planner wordt een ruwe schatting, een echte planner (OpenTripPlanner) vereist een backend — botst met "geen backend" |

### v0.2 — wat al geverifieerd is

- **Studieaanbod + finaliteit**: `Onderwijsaanbod SO 2.6`, endpoints `/ingerichtehoofdstructuur` en
  `/ingerichteadministratievegroep`. Finaliteit zit **per richting**, niet per school — een campus met
  meerdere finaliteiten toont die dus vanzelf allemaal, zonder speciale logica.
- **Schooldata**: `Instelling`-API, met `instelling_soort_bestuur` (zie net-onderscheid hierboven).
- Beide zitten mogelijk in **aparte API-producten** — check bij ontvangst of de key ook op
  Instelling + Codelijst geldt, niet enkel op Onderwijsaanbod SO.
- **Infodagen: nog geen bron gevonden.** De API-catalogus van het portaal bevat géén
  infomomenten/infodagen-product (volledige catalogus nagekeken). onderwijskiezer.be heeft ze wel,
  maar is juridisch uitgesloten (zie hieronder). Eerst uitzoeken vóór inplannen.
- Richtingen worden per campus samengevoegd getoond (afgesproken); ze komen binnen op
  `SchoolOpCampus.richtingen`.

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
- Voor elke stap: `npm run fetch-data && npm run build` moet slagen zonder handmatige tussenstap.
- **Sanity check** bij elke wijziging aan filtering/afstand: zoek **"Boechout"** → Sint-Gabriëlcollege
  en Regina Pacisinstituut (Hove) moeten bij de eerste resultaten staan.
  De oorspronkelijke opzet vroeg deze check met "Borsbeek", maar **Borsbeek bestaat niet meer als
  gemeente** (fusie met Antwerpen, 1/1/2025): geen enkele school heeft nog `gemeente=Borsbeek`, en
  de geocoder valt terug op Antwerpen-centrum. Gebruik Boechout als gelijkwaardige vervanging.
- Geen enkele hardgecodeerde schoolnaam of richting in de code — alles komt uit de gegenereerde data.

### Samenwerking / git

- **Nooit pushen zonder expliciet akkoord op dat moment.** Committen mag vrij; de gebruiker pusht
  zelf of geeft er per keer toestemming voor. Eén akkoord geldt niet voor volgende pushes.
- De gebruiker werkt met feature branches + pull requests op GitHub
  (`git@github.com:stefanbckn/Zoek-je-school.git`, SSH — de HTTPS-remote heeft geen credentials).
  Netlify deployt enkel vanaf `main`, dus werk op een branch gaat niet live tot de PR gemerged is.
- `gh` CLI staat geïnstalleerd maar is **niet ingelogd** (vereist interactieve browser-login).
  PR's aanmaken doet de gebruiker zelf, of via een voorgevulde compare-link.

## Node-versie

Systeem-`node` op deze machine is een oude v12 (`/usr/local/bin/node`). Gebruik de Homebrew-node
(v25) via `/usr/local/opt/node/bin` op PATH, anders faalt Vite/tsx.
