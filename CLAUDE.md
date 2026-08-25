# Zoek je school — projectconventies

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in provincie Antwerpen.
Volledig client-side (Vite + React + TypeScript + Tailwind v4), geen backend, geen database.
Data wordt op build-time opgehaald en weggeschreven als statische JSON — de app doet nooit live
calls naar overheidsbronnen voor de scholendata (CORS/betrouwbaarheid). De enige live call vanuit
de browser is de Geolocation API voor het zoeken op eigen locatie (zie hieronder).

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

### Geolocatie eigen adres (live browser call, enige live call in de app)

- Autocomplete: `GET https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=...`
- Coördinaten: `GET https://geo.api.vlaanderen.be/geolocation/v4/Location?q=...`
- Documentatie zegt "CORS is not supported", maar in de praktijk stuurt de API
  `access-control-allow-origin: *` mee — geverifieerd, werkt gewoon vanuit de browser.
- Geen API-key nodig.

## Regel: nooit gokken

Verzin nooit een API-endpoint, veldnaam of URL. Alles in dit bestand is geverifieerd door de
response effectief op te halen. Als iets niet meer werkt of een veld niet blijkt te bestaan: zeg dat
expliciet en stel een alternatief voor — verzin geen vervanging.

## Architectuur

- `scripts/fetch-data.ts` — Node-script (draai met `npm run fetch-data`), schrijft
  `public/data/vestigingen.json` + `public/data/meta.json` (ophaaldatum, bronvermelding, aantallen).
  `public/data/*.json` is gegenereerd en **niet** in git (zie .gitignore) — CI/deploy moet
  `npm run fetch-data && npm run build` draaien, nooit enkel `npm run build`.
- `src/types.ts` — het `Vestiging`-datamodel, inclusief lege placeholders (`richtingen`, `kostprijs`,
  `vervoer`) voor latere versies zodat de structuur niet moet herbouwd worden.
- `src/lib/` — pure functies: haversine-afstand, net-labels, URL-state hook.
- `src/components/` — UI-componenten, geen state-logica die ook elders nodig is.
- Filterstatus leeft in de URL-querystring (geen router nodig, single-page app — vermijd
  react-router, dat lost hier niets op en breekt GitHub Pages deep-linking onnodig).
- Afstand is altijd hemelsbrede afstand (haversine); benoem dat expliciet in de UI, nooit als
  "reisafstand" framen.

## Workflow

- Kleine stappen, één git commit per afgeronde stap.
- Voor elke stap: `npm run fetch-data && npm run build` moet slagen zonder handmatige tussenstap.
- Sanity check bij elke wijziging aan filtering/afstand: zoek "Borsbeek" → Sint-Gabriëlcollege
  Boechout, Regina Pacisinstituut Hove en OLVE Edegem moeten alle drie in de eerste resultaten staan.
- Geen enkele hardgecodeerde schoolnaam of richting in de code — alles komt uit de gegenereerde data.

## Node-versie

Systeem-`node` op deze machine is een oude v12 (`/usr/local/bin/node`). Gebruik de Homebrew-node
(v25) via `/usr/local/opt/node/bin` op PATH, anders faalt Vite/tsx.
