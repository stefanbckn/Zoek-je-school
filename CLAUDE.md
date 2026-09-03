# Zoek je school — projectconventies

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in Vlaanderen en Brussel.
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
(gewoon voltijds secundair onderwijs). **Sinds 0.12.0 gaat alles mee wat die filter teruggeeft**:
2151 vestigingsplaatsen in heel Vlaanderen en Brussel, waarvan er 2145 een bijhorende instelling
hebben, samen 1075 campussen. Tot dan werd er client-side op `instellingslocatie_provincie ===
'Provincie Antwerpen'` gefilterd en ging ruim driekwart meteen weg.

**Brussel hoort erbij en vraagt geen extra filter.** De bron is de API van de Vlaamse
onderwijsadministratie, dus er zit per definitie enkel onderwijs van de Vlaamse Gemeenschap in;
de 80 Brusselse vestigingen zijn de Nederlandstalige scholen. Franstalige scholen komen er niet
in voor. Verdeling geverifieerd op 02/09/2026: Oost-Vlaanderen 569, Antwerpen 560,
West-Vlaanderen 461, Limburg 277, Vlaams-Brabant 204, Brussel 80.

De API heeft géén provinciefilter (`filter_instellingslocatie_provincie` geeft HTTP 400); het
provincieveld staat wel op elke vestigingsplaats en wordt in `Campus.provincie` bewaard, met
ingekorte labels ('Antwerpen', 'Brussel') omdat ze in de filterkolom en in de URL staan. Een
onbekende provinciewaarde is een **harde fout** in `fetch-data.ts`, geen stille overslag: dan is
de bron veranderd en horen er geen adressen ongemerkt te verdwijnen.

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
- **`instelling_naam_volledig` bevat soms het instellingsnummer**, bijvoorbeeld "Hast Katholiek
  Onderwijs Hasselt 039107". Dat is geen fout van ons: bij 25 van de 1182 SO-instellingen zit
  het nummer letterlijk in dat veld (geteld 02/09/2026), want het is de manier waarop de bron
  gelijknamige scholen uit elkaar houdt — 39107 en 39115 heten allebei "Hast Katholiek Onderwijs
  Hasselt". Niet wegpoetsen met een regex: dan zijn die twee op het scherm niet meer te
  onderscheiden.
- **Een vestigingsplaats in `instellingslocatie` heeft niet noodzakelijk studieaanbod.** Van de
  2145 (school, vestiging)-paren in onze dataset hebben er 688 geen enkele richting. De fiche op
  data-onderwijs.vlaanderen.be staat standaard op "met studieaanbod" en toont zo'n adres dan
  niet, wat de indruk wekt dat ons adres verzonnen is. Zie de bug hierover in
  [issue #23](https://github.com/stefanbckn/Zoek-je-school/issues/23).

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

### Waarom één bestand voor heel Vlaanderen, en niet één per provincie

Bij het inplannen stond in de roadmap één JSON per provincie, met bijladen bij het wisselen.
**Dat is bij het bouwen omgedraaid, op basis van metingen** (02/09/2026):

- `vestigingen.json` is 12,2 MB ruw maar **192 KB over de lijn** (brotli). De schatting in de
  roadmap ging uit van ~530 KB en was te somber: de helft van het bestand zijn richtingen, en
  daarvan zijn er maar een fractie uniek, dus brotli vreet die herhaling op.
- Netlify serveert het met `cache-control: public,max-age=0,must-revalidate` plus ETag.
  Nagemeten met een conditionele request: **een herbezoek krijgt HTTP 304 en nul bytes.** Alleen
  het eerste bezoek betaalt, en pas na een verversing opnieuw. De site is een statische build;
  er wordt niets per bezoek gegenereerd.
- Daar staat tegenover dat een splitsing een hele categorie problemen meebrengt die nu niet
  bestaat: geen grensgevallen bij een straal die over een provinciegrens gaat, geen provincie
  die uit een ingevuld adres afgeleid moet worden, geen laadvolgorde waarin de provincie vóór
  de eerste render vast moet liggen, geen omvangcontrole per bestand, en geen melding in de UI
  dat resultaten aan een grens afgekapt zijn.

**Provincie is daardoor gewoon een filter geworden**, zoals gemeente en net, en straal werkt
vanzelf over grenzen heen. Wil je dit ooit toch splitsen, doe dat dan pas als het bestand echt
te zwaar wordt en meet opnieuw — niet op een schatting.

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
- **Groeperen op bestuursniveau is géén alternatief voor de adresgroepering** (gevraagd
  01/09/2026). Het verliest geen scholen, maar een bestuur kan scholen over verschillende
  gemeenten hebben, dus kaartjes op bestuursniveau zetten campussen bij elkaar die tientallen
  kilometers uit elkaar liggen. De adresgroepering bestaat net omdat scholen hetzelfde gebouw
  delen. Als filter of als regel in het detailpaneel kan bestuur wel nuttig zijn; daarvoor moet
  `SchoolOpCampus` het bestuursnummer en de naam gaan dragen, want vandaag staat er enkel
  `soortBestuur` (het type) in.
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
- **Richtingen worden ontdubbeld tot één regel per graad.** De bron noemt elk leerjaar apart
  ("1e leerjaar in de 2e graad Latijn ASO" én "2e leerjaar in de 2e graad Latijn ASO"); dat
  voorvoegsel wordt weggehaald en de dubbels vallen samen. Bij Sint-Gabriëlcollege: 55 ruwe
  richtingen over 4 scholen → 24 regels. Matcht het voorvoegselpatroon niet (eerste graad, 7e
  leerjaar, HBO5, OKAN), dan blijft de naam onaangeroerd.
- **`studiegebied` zit in de data maar niet in de UI.** Er is geen filter op. Zie de kleine open
  punten in [ROADMAP.md](./ROADMAP.md).

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

### GOK-leerlingenkenmerken (build-time, xlsx) — opgeleverd in v0.10

Vier leerlingenkenmerken per school, uit de AgODi-publicatie **"Overzicht leerlingkenmerken
secundair onderwijs voorschot werkingstoelagen"** op het documentenportaal. Opgehaald door
`scripts/leerlingenkenmerken.ts`, uitgelezen door `scripts/xlsx.ts`, gejoind in `fetch-data.ts`.

```
https://data-onderwijs.vlaanderen.be/documenten/bestanden/
  Publicaties_Leerlingenkenmerken_Overzicht_<jaar>-<jaar+1>_so.xlsx
```

- **Geen API-key, geen registratie.** Gewone HTTP GET, geverifieerd (HTTP 200).
- ⚠️ **De bestandsnaam is niet voorspelbaar.** 2021-2022 en 2022-2023 heten `..._so_1.xlsx`,
  2023-2024 en 2024-2025 heten `..._so.xlsx`. Het script probeert daarom **beide varianten,
  vier schooljaren terug, nieuwste eerst** en neemt de eerste die bestaat. Het jaartal ophogen
  in één vast patroon gaat stuk — niet "vereenvoudigen".
- **Het schooljaar komt uit de titelregel van het bestand zelf**, niet uit de URL die toevallig
  werkte. Idem de teldatum: die staat per rij als Excel-serieel getal in de kolom Teldatum.
- **Nieuwste publicatie is 2024-2025** (nagekeken 01/09/2026: 2025-2026 geeft 404, ook in
  Dataloep is 2024-2025 het laatste schooljaar). De cijfers lopen dus een schooljaar achter op
  het studieaanbod. Dat staat in de UI, en het is geen fout om "op te lossen".
- **Het zijn absolute aantallen, geen percentages**, met halven erin (733,5) doordat leerlingen
  in co-ouderschap half meetellen. Wij delen door `Aantal lln` en bewaren een fractie.
- **Teldatum is 1 februari van het jaar ervóór** (bestand 2024-2025 telt op 01/02/2024). Het is
  de financieringsteling, geen momentopname van het huidige schooljaar.
- **Kolomkoppen bevatten dubbele en harde spaties** (`Indicator         "opleiding moeder"`).
  Het script zoekt de kolommen genormaliseerd op inhoud, niet op vaste letters, en de kopregel
  wordt gezocht op de tekst "Provincie" — die staat pas rond rij 11, na een titel en lege rijen.
  Kolomvolgorde geverifieerd tegen een gepubliceerd percentage (Sint-Jan Berchmanscollege
  Brussel: 14,7 / 65,6 / 24,2 / 62,3), dus J=opleiding moeder, K=schooltoelage, L=thuistaal,
  M=buurt. Niet op volgorde vertrouwen zonder die controle: de koppen zijn de bron van waarheid.
- **Join op `schoolnummer`, nooit op adres.** Het adres in dit bestand is dat van de instelling
  en wijkt bij 86 van de gematchte scholen af van het campusadres dat wij tonen.
- **266 van de 272 scholen matchen** (01/09/2026). De rest: twee onafhankelijke scholen (geen
  werkingstoelagen) en vier recent gesplitste. Dat is verwacht, geen bug.
- **Het hangt aan `SchoolOpCampus`, niet aan `Campus`.** Anders dan het studieaanbod wordt dit
  **niet** per adres samengevoegd: optellen over scholen die een campus delen zou een gemiddelde
  over andere leerlingenpopulaties maken. De UI zegt er expliciet bij over welke school het gaat.
- **Geen zelfberekende OKI.** De som van de vier gedeeld door het leerlingenaantal benadert de
  gepubliceerde OKI, maar is een afleiding. Zolang die niet naast het officiële cijfer in
  Dataloep gelegd is: vier percentages tonen, geen samengesteld getal.
- **Framing ligt vast**: kansarmoede-indicatoren, geen kwaliteitsoordeel. De balkjes in het
  detailpaneel zijn neutraal grijs, bewust geen kleurschaal van groen naar rood, en onder het
  blok staat dat het indicatieve achtergrondcijfers zijn waarop je geen schoolkeuze baseert.
  Hetzelfde balkje staat in de vergelijkingstabel; een eerdere versie liet het daar weg om er
  geen grafiek van te maken, maar een percentage suggereert net zo goed een rangorde en snel
  naast elkaar leggen is precies waar die tabel voor bestaat. De labels en de volgorde staan één
  keer in `src/lib/leerlingenkenmerken.ts`, zodat beide plekken niet uiteenlopen.
- ⚠️ **De baan van het balkje heeft een vaste breedte in de vergelijkingstabel**
  (`KenmerkBalkje`, `w-28`), niet de celbreedte. De kolommen daar zijn niet even breed, dus een
  baan die meeloopt met de cel tekent 66,7% in een smalle kolom kórter dan 57,7% in een brede.
  Doorgemeten in de browser. Op papier maakt `table-layout: fixed` de kolommen wél gelijk;
  daar staat de baan op 60% van de cel. En net als bij de chips draagt het balkje
  `print-color-adjust: exact`, anders is het bij "Achtergrondbeelden uit" een lege streep.
- **Faalt het ophalen, dan is dat geen harde fout**: de dataset komt er zonder kenmerken uit
  (luide waarschuwing) en het blok valt weg in de app. Faalt het *lezen* van een gevonden
  bestand, dan stopt het script wél — dan is er iets aan de publicatie veranderd en moet er
  iemand kijken.
- **`scripts/xlsx.ts` is bewust een eigen mini-lezer** (zip + sharedStrings + één werkblad,
  geen dependency). Wat er niet in zit: formules, datumopmaak, meerdere werkbladen, zip64.
  Heb je dat nodig, neem dan een echte bibliotheek — niet dit uitbreiden.

De **Dataloep-route** (per vestigingsplaats, handmatige kruistabel-export uit Tableau) blijft
beschreven in [ROADMAP.md](./ROADMAP.md). Die is níét nodig voor de huidige functionaliteit;
ze is de weg als we het ooit per vestigingsplaats willen in plaats van per school.

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
   AGPL-3.0-tekst van gnu.org. ✅ **De repo staat publiek.** Geverifieerd op 30/08/2026:
   `github.com/stefanbckn/Zoek-je-school` geeft HTTP 200 zonder login en de GitHub-API meldt
   `private: false`. Een eerdere versie van dit bestand noteerde nog een 404 van 27/08/2026;
   die notitie was verouderd. Deze voorwaarde is dus vervuld.
   Let ook op de niet-commerciële eis: een donatieknop is verdedigbaar, advertenties of een
   betaalmuur zouden deze API-toegang kosten.
2. **Contact opnemen vóór gebruik van zware endpoints**, via hun Matrix-kanaal
   `#transitous:matrix.spline.de`. ⚠️ **Correctie op een eerdere versie van dit bestand**, die
   hier "geen harde verplichting vooraf" van maakte. De voorwaarden zeggen letterlijk *"contact
   us before using any potentially resource-intensive API endpoints (such as routing,
   isochrones)"* — en routing is precies wat wij doen. Herlezen op 27/08/2026.
   ✅ **Gebeurd op 27/08/2026**: de eigenaar heeft Transitous via dat kanaal gecontacteerd.
   Niet opnieuw als openstaand punt opvoeren.
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

### Juridisch uitgesloten als bron

`onderwijskiezer.be` (CLB) heeft studieaanbod mét finaliteit én infomomenten, maar de algemene
voorwaarden verbieden kopiëren, reproduceren en herdistribueren van hun materiaal. Enkel naar
linken mag. Niet als databron gebruiken.

## Regel: nooit gokken

Verzin nooit een API-endpoint, veldnaam of URL. Alles in dit bestand is geverifieerd door de
response effectief op te halen. Als iets niet meer werkt of een veld niet blijkt te bestaan: zeg dat
expliciet en stel een alternatief voor — verzin geen vervanging.

## Architectuur

- `scripts/fetch-data.ts` — Node-script (draai met `npm run fetch-data`), haalt 5 gepagineerde
  API-calls én de leerlingenkenmerken-xlsx op, joint ze, en schrijft
  `public/data/vestigingen.json` + `public/data/meta.json` (ophaaldatum, bronvermelding,
  schooljaar van het aanbod, aantallen, herkomst van de leerlingenkenmerken).
- `scripts/leerlingenkenmerken.ts` + `scripts/xlsx.ts` — de GOK-cijfers ophalen en uitlezen.
  Zie de sectie GOK-leerlingenkenmerken hierboven.
- **`public/data/*.json` staat bewust WEL in git** (~4 MB), en is sinds v0.2 de *primaire* bron
  voor de build: `npm run build` leest die JSON, de API wordt niet tijdens elke deploy bevraagd.
  Verversen is een aparte, periodieke stap (zie Workflow).
- Faalt het ophalen tóch (API plat, key verlopen), dan valt het script terug op de gecommitte
  dataset met een luide waarschuwing; ligt er géén dataset, dan faalt het hard.
- **Historische noot:** tot v0.1 kwam de data uit de CSV's van `data-onderwijs.vlaanderen.be`.
  Die faalden op Netlify met `ECONNRESET` tijdens de TLS-handshake (oorzaak nooit bevestigd —
  geen algemene datacenter-blokkade, dat is getest en weerlegd). Dat probleem is met de overstap
  naar de API weg, maar de fallback-logica is blijven staan omdat ze nu de API dekt.
- `src/types.ts` — het datamodel: `Campus` (adres, provincie, coördinaten) met `SchoolOpCampus[]` erin,
  elk met `Richting[]` en `Leerlingenkenmerken | null`. Er staan twee lege placeholders op
  `null`: `vervoer` voor het roadmapthema "Praktisch", en `kostprijs`, **dat sinds 03/09/2026
  geen bestemming meer heeft** omdat kostprijs uit de roadmap geschrapt is (zie "Bewust
  geschrapt" in [ROADMAP.md](./ROADMAP.md)). Weghalen kan, maar vraagt een verse dataset, want
  het veld staat ook in `public/data/vestigingen.json`.
- `src/lib/` — pure functies: haversine-afstand, net-labels, URL-state hook.
- `src/components/` — UI-componenten, geen state-logica die ook elders nodig is.
- Filterstatus leeft in de URL-querystring (geen router nodig, single-page app — vermijd
  react-router, dat lost hier niets op en breekt deep-linking onnodig).
- Afstand is altijd hemelsbrede afstand (haversine); benoem dat expliciet in de UI, nooit als
  "reisafstand" framen.
- **Afdrukken (sinds 0.6.0).** De vergelijkingstabel is afdrukbaar. Twee dingen die daarbij
  vastliggen en die je niet per ongeluk moet omkeren:
  - `VergelijkPanel` staat in `App.tsx` bewust **buiten** de app-wrapper in de JSX. Die wrapper
    krijgt `print:hidden` zodra het venster open staat, zodat er enkel een tabel op papier komt.
    Zet je het venster erin, dan verdwijnt het mee.
  - Het `@media print`-blok onderaan `src/index.css` zet het palet terug naar het **lichte**
    palet — niet naar zwart-wit. De kleuren dragen betekenis (net en finaliteit), en wie
    zwart-wit wil, heeft die keuze al in het printvenster van de browser; die daar nog eens
    overrulen maakt ze onbereikbaar. Beslist door de gebruiker op 30/08/2026, nadat een eerdere
    versie wél naar zwart-wit forceerde.
    Het blok somt **alle** themaselectors op. Dat is nodig: het donkere palet staat op
    `:root:not([data-theme="light"])`, en dat is specifieker dan een kale `:root` — media
    queries veranderen niets aan specificiteit. Zonder die selector erbij drukt iemand in
    donkere modus wit op wit af. Doorgemeten in de browser, niet ingeschat.
  - **Het past op A4 omdat het print-blok een `@page`-marge (10 mm) zet en de kolommen daar
    hun `min-width` verliezen.** Op het scherm dragen die een vaste breedte zodat je op een
    telefoon zijwaarts kan scrollen; op papier bestaat er geen scrollgebied, dus vier adressen
    naast elkaar werden 832 px breed terwijl er op een A4 met marge 718 px past. Doorgemeten in
    de browser. `table-layout: fixed` verdeelt de ruimte; haal je dat weg, dan loopt de tabel
    weer over de bladrand.
  - **`@page`-marge alleen is niet genoeg.** Chrome negeert ze zodra de bezoeker in het
    printvenster "Marges: Geen" kiest, en dan raken titel, tabelrand en voetnoot de papierrand.
    Daarom staat er náást `@page { margin: 10mm }` ook 5 mm eigen padding op `.vergelijk-afdruk`.
    Die overschrijft de `print:p-0` uit de JSX, die voor de schermopmaak wél nodig blijft.
  - Chips dragen daarom een `chip`-klasse (`NET_CHIP` in `net.ts`, `FINALITEIT_CHIP` in
    `aanbod.ts`). In print worden ze kleiner en `inline-block`: zonder dat sneed de tekstafbreking
    "Gemeentelijk" middenin over twee regels.
  - De chips dragen `print-color-adjust: exact`, zodat hun vulling ook afgedrukt wordt als
    "Achtergrondbeelden" in het printvenster uitstaat. Die schakelaar bestaat om inkt te sparen
    bij decoratieve vlakken; hier is de vulling de pilvorm die net en finaliteit herkenbaar
    maakt. **Bewust alleen op de chips**, niet op de hele pagina — anders gaat elke achtergrond
    mee en kost een afdruk nodeloos veel inkt. Zou een browser het toch negeren, dan blijft de
    gekleurde tekst over; die inkttinten halen op wit minstens 4,8:1 contrast, en de naam staat
    er voluit bij, dus er gaat geen betekenis verloren.
- **Provincie- en gemeentefilter (sinds 0.12.0).** Beide zijn gewone URL-filters
  (`?provincie=`, `?gemeenten=`). Drie dingen die vastliggen:
  - **De gemeentelijst toont enkel gemeenten die in de huidige resultaten voorkomen**, met het
    aantal adressen erachter, plus een zoekveldje. 245 gemeenten hebben minstens één school; die
    allemaal als vinkje aanbieden maakt van een filter een zoekopdracht op zich.
  - ⚠️ **De gemeentefilter staat als láátste in de filterpijplijn in `App.tsx`, en dat is geen
    toeval.** De tellingen worden berekend op de lijst mét alle andere filters maar zónder de
    gemeentefilter zelf, want anders zet één aangevinkte gemeente alle andere op 0 en is het
    cijfer waardeloos. Verplaats je die filter naar voren, dan klopt de teller niet meer.
    `verborgenZonderAanbod` wordt daarentegen wél ná de gemeentefilter geteld, anders telt het
    adressen mee die de bezoeker toch niet zou zien.
  - **Aangevinkte gemeenten blijven altijd in de lijst staan**, bovenaan, ook als ze op 0 vallen
    of niet op de zoekterm matchen. Anders zie je een lege pagina zonder vinkje om weer uit te
    zetten. Zelfde regel als bij de netten.
  - **Brussel staat achteraan in `PROVINCIE_OPTIONS`**, niet alfabetisch tussen Antwerpen en
    Limburg: het is een gewest, geen provincie, en die volgorde zou het omgekeerde suggereren.
  - `DATA_MIDDEN` in `MapView.tsx` is het midden van de databounds, geen gekozen stad. Het is
    alleen zichtbaar vóór `FitBounds` de resultaten inpast en bij nul resultaten.
- **Markers clusteren (sinds 0.11.0).** `MapView.tsx` hangt de markers in een
  `<MarkerClusterGroup>` van **`react-leaflet-cluster`** — het enige onderhouden pakket met
  `react-leaflet@^5` en `react@^19` in z'n peers (nagekeken in het npm-register, zie
  [ROADMAP.md](./ROADMAP.md)). Vier dingen die vastliggen:
  - **`MarkerCluster.Default.css` wordt bewust NIET geïmporteerd**, alleen `MarkerCluster.css`
    voor de positionering en de uitklap-animatie. Die standaardstijl brengt een eigen
    groen/geel/rood-schaal mee die naast het palet van 0.2.1 valt, en die suggereert dat een
    groot cluster erger is dan een klein. De bollen krijgen hun uiterlijk in `src/index.css`.
  - **De clusterkleur volgt bewust het thema niet.** `--c-cluster` staat alleen in `:root` en
    wordt niet herhaald in de donkere blokken. De tegellaag van OpenStreetMap is altijd licht
    (in donkere modus enkel gedempt), en de losse markers zijn in beide thema's hetzelfde blauwe
    speldje; een bol die naar de lichte accentkleur omslaat, zou op die lichte kaart net
    onleesbaar worden. De waarde is gelijk aan het lichte accent (#0b5c6e), witte tekst haalt
    daarop 7,58:1. Geen nieuwe kleur, dus `scripts/kleurcheck.mjs` hoefde er niet over.
  - ⚠️ **De klasse staat als `.leaflet-marker-icon.cluster-bol` in de CSS.** Leaflet zet
    `display: block` op `.leaflet-marker-icon`, even specifiek als een kale `.cluster-bol`, dus
    wie er één klasse van maakt laat het toeval van de bundelvolgorde beslissen of het cijfer
    gecentreerd staat. Doorgemeten in de browser: met één klasse stond het linksboven.
  - **Toegankelijkheid: Leaflet zet zelf `tabindex="0"` en `role="button"` op de bol** (nagekeken
    in de DOM), dus die is met Tab bereikbaar en wordt als knop aangekondigd. De naam komt uit de
    inhoud: het zichtbare cijfer staat `aria-hidden` en ernaast staat een `sr-only`-zin
    ("11 adressen, open om te spreiden"). Een `aria-label` op het buitenste element kan niet,
    want `iconCreateFunction` levert enkel de inhoud, niet de wikkel.
  - `import 'leaflet.markercluster'` in `MapView.tsx` staat er **voor TypeScript**, niet voor de
    runtime (react-leaflet-cluster laadt de bibliotheek zelf al). `types` in `tsconfig.app.json`
    staat op `["vite/client"]`, dus @types-pakketten komen niet vanzelf mee en zonder die regel
    kent `L` het type `MarkerCluster` niet.
  - **Een cluster is geen campus.** De campus-samenvoeging op `postcode|straat|huisnummer` is het
    datamodel; een cluster is puur visueel en hangt van het zoomniveau af. Laat een cluster dus
    nooit iets over "een school" zeggen, en bouw er geen filter of teller op. Het aantal boven de
    lijst blijft het aantal campussen.
  - **Vanaf zoom 16 staan de markers los** (`disableClusteringAtZoom`). Meerdere scholen op één
    adres zijn al één marker met een popup eronder; een cluster die daar overheen blijft liggen
    verbergt dat.
  - **Waarom `react-leaflet-cluster` en niet een van de andere twee** (nagekeken in het
    npm-register, 31/08/2026): versie 4.1.3 (31/03/2026) heeft `react-leaflet@^5`, `react@^19` en
    `leaflet.markercluster` in z'n peers en is de enige onderhouden stabiele release die met deze
    versies overweg kan. `react-leaflet-markercluster` 5.0.0-rc.0 kan het ook maar staat al sinds
    januari 2025 in rc; `@changey/react-leaflet-markercluster` zit nog op react-leaflet 4 en valt
    af. De terugvalweg (markercluster rechtstreeks op de Leaflet-instantie via `useMap()`, zoals
    `FitBounds` doet) was niet nodig.
- **Over deze site + disclaimer (sinds 0.8.0).** `OverPanel.tsx`, geopend vanuit de footer.
  Drie dingen die vastliggen:
  - **De korte disclaimerregel staat in de footer zelf**, niet enkel achter de link: wie nooit
    doorklikt moet toch gezien hebben dat dit geen officiële bron is. Beslist door de gebruiker.
  - **De contactregel en de broncodelink blijven in de footer** en verhuizen níét naar het
    paneel — ze zijn een Transitous- respectievelijk AGPL-vereiste, zie de sectie Licentie.
  - **De open stand staat wél in de URL (`?over=1`)**, in tegenstelling tot de vergelijk-
    selectie. Daarom leeft `over` in `SearchState` en niet in een losse `useState`: `update()`
    herschrijft de volledige querystring, dus een parameter erbuiten valt bij de eerstvolgende
    filterwijziging weg.
- **Hoe werkt deze site? (sinds 0.9.0).** `HelpPanel.tsx`, geopend met de knop in de kop naast
  "Over deze site". Drie dingen die vastliggen:
  - **Het gaat nooit vanzelf open, ook niet bij een eerste bezoek.** De site bewaart niets over
    wie er langskomt, dus een eerste bezoek is niet van een tiende te onderscheiden. Elke poging
    tot "toon dit één keer" wordt ofwel een venster dat elke keer in de weg staat, ofwel opslag
    die we net niet willen. `localStorage` is hier dus géén uitweg, ook al gebruikt de
    themaschakelaar het.
  - **Taakverdeling met `OverPanel`:** dat paneel beantwoordt "kan ik dit vertrouwen" (herkomst,
    bewerkingen, disclaimer, privacy), dit paneel "hoe krijg ik hieruit wat ik zoek". De bronnen
    staan hier bewust niet nog eens; er is één link naar het andere paneel, die in dezelfde
    `update()` het ene sluit en het andere opent.
  - **`?help=1` leeft in `SearchState`**, om dezelfde reden als `over`. Zie de vorige bullet.
  - De volgorde van de filters in de tekst is die van wat het meest oplevert, met studierichting
    eerst. Beslist door de gebruiker; niet omgooien naar de volgorde van het scherm.
- **Het versienummer in de footer komt uit `package.json`** via `__APP_VERSION__` (een `define`
  in `vite.config.ts`, gedeclareerd in `src/globals.d.ts`). Niet vervangen door een
  hardgecodeerde string — dan veroudert het stil bij de volgende release.
- `proj4` is **verwijderd** als dependency: de API levert WGS84 rechtstreeks, er is geen
  Lambert72-conversie meer nodig.

### Lijst pagineren (sinds 0.3.0)

`ResultList.tsx` toont 25 adressen per lading met een "Toon meer"-knop. Wat daarbij vastligt:

- **De kaartweergave paginéért niet mee.** Daar is het volledige beeld net het punt; markers
  verbergen omdat ze op "pagina 2" staan maakt de kaart onbruikbaar. Alleen `ResultList` knipt.
  Clusteren is daarom de manier waarop de kaart met veel resultaten omgaat, niet pagineren.
- **Een "Toon meer"-knop, geen genummerde pagina's.** De lijst staat op afstand gesorteerd, dus
  wat bovenaan staat is wat telt; iemand bladert niet doelgericht naar pagina 7. Een knop houdt
  bovendien de scrollpositie intact, en dat is op mobiel het verschil.
- **Het aantal getoonde items staat NIET in de URL.** De querystring beschrijft wát er gezocht
  wordt; hoe ver iemand had gescrold hoort daar niet bij en maakt een gedeelde link alleen maar
  vreemder. Gewone `useState` volstaat.
- **De teller reset bij elke filterwijziging**, anders zit je na het aanvinken van één gemeente
  nog steeds naar 60 items te kijken terwijl er 4 resultaten zijn.
- Het resultaataantal bovenaan blijft het **totaal** tonen, niet het aantal zichtbare kaartjes.
  Dat cijfer is de feedback op je filters.

### Kleur, thema en typografie (sinds 0.2.1)

- **Het palet zit als CSS-variabelen in `src/index.css`.** Geen harde Tailwind-kleuren
  (`slate-500` en co) in componenten, maar tokens: `bg-kaart`, `text-inkt`, `text-zacht`,
  `border-rand`, `bg-accent`. Dat werkt via `@theme inline`, dat de utility letterlijk
  `var(--c-kaart)` laat uitschrijven. ⚠️ **Zonder `inline` vriest Tailwind de waarde in op
  buildtijd en schakelt het thema niet mee.**
- **Wijzig je kleuren, draai `node scripts/kleurcheck.mjs`.** Dat berekent contrast (WCAG AA) én
  simuleert protanopie, deuteranopie en tritanopie, en meet hoe ver de kleuren binnen één
  categorie uit elkaar liggen. Meten, niet schatten: het eerste finaliteitspalet (blauw #0b4a7d /
  pruim #7a2665 / bruin #7d4700) haalde overal AA maar de eerste twee vielen bij protanopie
  praktisch samen, afstand 12. Dat werd pas zichtbaar door te meten.
- **Vorm draagt het onderscheid tussen de twee families.** Net = gevulde chip. Finaliteit =
  gevulde chip mét rand en vormteken (▲ doorstroom, ◆ dubbel, ■ arbeidsmarkt). De tekens staan
  `aria-hidden`, want de tekst ernaast zegt het al. Een omlijnde chip alleen bleek te weinig
  kleuroppervlak te hebben om de families uit elkaar te houden, ook met normaal zicht.
- **Het kleurbudget gaat naar finaliteit**, want daar wordt op gescand en gefilterd. Blauw /
  groenblauw / oranje, minimaal 49 kleurafstand in licht en 31 in donker, over alle vier de
  zichtsituaties.
- **De netkleuren blijven ondersteunend.** Bij protanopie liggen GO! en Gemeentelijk dicht bij
  elkaar (afstand 12 licht, 8 donker) en dat is aanvaard: elke net-chip draagt zijn naam voluit.
  Zeven categorieën allemaal CVD-veilig kleuren kán niet; het beste palet voor vier netten haalde
  maar 20. Vandaar de keuze om er niet meer kleur in te steken.
- Let op bij het bijstellen van netkleuren: het oranje van Provinciaal ligt op afstand 4 van het
  finaliteitsoranje van Arbeidsmarkt. Ze zijn uit elkaar te houden door rand en vormteken, maar
  maak het verschil niet nóg kleiner.
- Kaartmarkers zijn allemaal identiek en elke chip heeft een tekstlabel, dus kleur is nergens de
  enige drager van informatie (WCAG 1.4.1).
- **Themaschakelaar met drie standen**, niet twee (`ThemaToggle.tsx` + `lib/thema.ts`): geen
  attribuut = volg het systeem. Keuze in `localStorage`, in een try/catch omdat privémodus dat
  kan blokkeren.
- **Anti-flits: `public/thema.js` zet het attribuut synchroon vóór React mount.** Bewust een
  apart bestand en géén inline `<script>`, want de CSP in `netlify.toml` staat alleen
  `script-src 'self'` toe en dat houden we zo.
- **Bewust geen webfont.** De app gebruikt de systeemletter (Tailwinds `font-sans`): geen extra
  download, geen layout-verschuiving bij het laden, en niets dat de CSP of de privacy raakt. Wil
  je later meer karakter, doe dat dan met één webfont voor koppen alleen, niet voor lopende tekst.


## Roadmap

De roadmap staat in een apart bestand: **[ROADMAP.md](./ROADMAP.md)**. Daar staat per versie
wat er nog komt, welke bron er al geverifieerd is en welke beslissingen er onderweg genomen
zijn. Wat er al uitgebracht is, staat in [CHANGELOG.md](./CHANGELOG.md).

**Lees ROADMAP.md vóór je begint** wanneer: er een versienummer valt of een `v0.x.y`-branch,
er gevraagd wordt wat er nu aan de beurt is of wat er nog moet komen, er een functionaliteit besproken wordt die nog niet bestaat, of er een bron/API
onderzocht wordt voor een nieuwe functionaliteit. Bij werk aan bestaande code (bugfix, refactor,
tekstwijziging) hoeft het niet. **Wijzigt er iets aan de planning, werk dat daar bij, niet hier.**

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

Het project gebruikt **MAJOR.MINOR.PATCH**.

**Een nummer wordt toegekend bij de release, niet bij de planning.** [ROADMAP.md](./ROADMAP.md)
houdt de volgorde bij zonder cijfers; wat af is en naar `main` gaat, krijgt op dat moment het
volgende nummer. Zo kan één afgewerkte feature los uitkomen zonder dat de rest van de planning
moet verschuiven. Vooraf nummeren heeft hier al twee keer tot hernummeren geleid — niet opnieuw
doen. Het versienummer valt dus pas wanneer je de branch aanmaakt (die draagt het in de naam),
en dan nog steeds na de vraag aan de gebruiker of het MAJOR, MINOR of PATCH wordt.

**Eén feature = één MINOR.** Een thema dat uit meerdere losse stukken bestaat, wordt niet in één
grote branch verzameld: elk stuk gaat apart naar `main`, met eigen changelog-kop en eigen tag.
Een lang openstaande branch houdt werk onnodig van de site af — de merge is wat live gaat. Dat
betekent ook dat je nieuwe functionaliteit **nooit als PATCH** uitbrengt om "nog even bij het
oude thema te blijven": een filter erbij is een MINOR, hoe klein ook.

Drie plaatsen moeten samen kloppen:

- **`package.json`** draagt de huidige versie. Staat sinds de merge van 0.4.0 op `0.4.0`. Zet
  het nummer in de versie-branch zelf, niet achteraf op `main` — dan komt de bump mee in de PR
  die de functionaliteit brengt.
- **Een git tag per release**, `v<versie>` (bv. `v0.3.0`), gezet op `main` *nadat* de PR gemerged
  is. Nooit taggen op een branch die nog niet gemerged is — die commit ligt na de merge niet meer
  in de geschiedenis van `main`, dus de tag wijst dan naar een losse commit.
- **De branchnaam** draagt het versienummer: `v0.5.0-lege-vestigingen-filteren` voor een
  roadmapthema. Losse bugfixronden buiten een versie blijven `fix/<kort-onderwerp>`; die krijgen
  hun nummer pas wanneer ze in een release meegaan.

**Release notes horen in [CHANGELOG.md](./CHANGELOG.md)**, niet in de roadmaptabel en niet enkel
op GitHub. Werkwijze:

1. Tijdens het werk vult de versie-branch de kop **Niet uitgebracht** aan, in dezelfde PR als de
   wijziging zelf. Zo is de tekst reviewbaar vóór de merge, in plaats van achteraf uit commits
   gereconstrueerd te worden.
2. **Nog in dezelfde branch, vóór de merge:** die kop wordt het versienummer met datum, en
   `package.json` gaat mee omhoog. Allebei in de PR, niet achteraf op `main`. Anders draagt de
   Netlify-deploy die uit de merge volgt nog het vorige nummer, en bevat de commit waar de tag
   op komt te staan een changelog met "Niet uitgebracht" erin. Dat is bij 0.4.0 misgegaan: de
   correctie belandde ná de tag.
3. Ná de merge: de tag zetten, en dezelfde tekst als GitHub Release bij die tag plakken. Het
   bestand is de bron, de Release is de kopie.

Schrijf de notes vanuit wat een bezoeker merkt ("je ziet nu de reistijd met bus of trein"), niet
als opsomming van commits — die staat al in git. Wat er niet werkt of niet meegenomen is, hoort er
ook in: een changelog die enkel goed nieuws bevat, wordt niet gelezen.

Wat welk cijfer verhoogt: MINOR bij elke nieuwe functionaliteit die een bezoeker merkt, ook al
is het maar één filter; PATCH bij bugfixes en tekstcorrecties zonder gedragswijziging. MAJOR blijft 0 zolang de site niet publiek
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
- **Open bugs staan als GitHub Issues**, niet in een bestand in de repo. Tot 03/09/2026 was dat
  `BUGS.md`, omdat `gh` toen niet ingelogd was; dat is het intussen wel (account `stefanbckn`,
  scope `repo`), en daarmee verviel de enige reden voor dat bestand. De lijst opvragen doe je met
  `gh issue list`. Maak `BUGS.md` niet opnieuw aan: dan staat dezelfde bug op twee plaatsen en
  loopt er één achter.
- **Een bug melden is `gh issue create`**, met dezelfde inhoud als vroeger: wat er gebeurt, op
  welk toestel/browser, wat de oorzaak lijkt, en wat er nog geverifieerd moet worden. Vermeld ook
  wat al gemeten of nagekeken is, zodat niemand dat werk overdoet. Label `bug`.
- **De README somt de bugs niet meer op** maar linkt naar de issue-lijst. Dat was bewust: elke
  opsomming die je met de hand gelijk moet houden, loopt uit elkaar.
- **Een bug oplossen gaat op een `fix/`-branch**: naamgeving `fix/<kort-onderwerp>`, bijvoorbeeld
  `fix/ios-zoom-invoervelden`, afgetakt van een **verse** `main` (`git fetch` eerst — dat is hier
  al een keer misgegaan). **Zet `Fixes #<nummer>` in de PR-beschrijving**, dan sluit GitHub het
  issue bij de merge zelf. Sluit het niet handmatig vooraf: dan lijkt de bug opgelost terwijl de
  fix nog op een branch staat.
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
