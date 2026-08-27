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

### Net-onderscheid Provinciaal/Stedelijk — geïntegreerd sinds v0.2

- `instelling_net` heeft maar 3 bruikbare categorieën (Gemeenschapsonderwijs / Vrij
  gesubsidieerd / Officieel gesubsidieerd) en kan Provinciaal niet van Stedelijk scheiden.
- **`instelling_soort_bestuur` staat NIET op de school** maar op het **bestuur**, dat zelf een
  instelling is (`instelling_type` = 300). Ophalen: `instelling_bestuur.instellingsnummer` van
  de school, dan die instelling opvragen. In het script halen we alle besturen in één
  gepagineerde call op (`filter_instelling_type=300`, 928 records) en joinen lokaal — niet
  928 losse detailcalls.
- Codelijst `soort_bestuur` geverifieerd opgehaald: `1` GO!, `2` Vrij, `3` Provincie,
  `4` Gemeente, `5` OCMW, `6` Intercommunale, `7` Vlaamse Gemeenschap,
  `8` Vlaamse autonome hogeschool, `9` Andere.
- Verdeling in onze dataset (per vestiging): Vrij 376, GO! 102, Gemeente 63, Provincie 18.
  "Stedelijk" = `Gemeente` (bv. AGB Stedelijk Onderwijs Antwerpen).
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
| **v0.3** | GOK-indicatoren | OKI + 4 leerlingenkenmerken per campus, als context in detailpaneel | Bron gevonden en geverifieerd — **key niet nodig** |
| **v0.4** | Aanmelden | Aanmeldsysteem tonen/linken (bv. meldjeaan.be) | **Nog te onderzoeken** — bron onbekend |
| **v0.5** | Kostprijs | Maximumfactuur, materiaalkost bij start (boeken, laptop, kaften) | Geen centrale bron; deels handmatig per school |
| **v0.6** | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Bronnen nog te onderzoeken |
| **v0.7** | Vergelijken | 2–4 campussen naast elkaar in vergelijkingstabel + exporteerbare shortlist | Puur frontend, geen externe bron nodig |
| **Geparkeerd** | Openbaar vervoer | Reistijd met de bus | De Lijn heeft geen publieke routeplanner-API; een eigen mini-planner wordt een ruwe schatting, een echte planner (OpenTripPlanner) vereist een backend — botst met "geen backend" |

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
