---
paths:
  - "src/components/**"
  - "src/App.tsx"
  - "src/main.tsx"
  - "src/index.css"
  - "src/lib/useSearchState.ts"
  - "src/lib/thema.ts"
  - "public/*.js"
---

# Frontend — kleur, toegankelijkheid, state en print

Waarom het palet is wat het is:
[docs/onderzoek/kleur-en-kaart.md](../../docs/onderzoek/kleur-en-kaart.md).

## Kleur en thema

- **Geen harde Tailwind-kleuren** (`slate-500` en co) in componenten. Gebruik de tokens:
  `bg-kaart`, `text-inkt`, `text-zacht`, `border-rand`, `bg-accent`. Ze staan als
  CSS-variabelen in `src/index.css` en werken via `@theme inline`, dat de utility letterlijk
  `var(--c-kaart)` laat uitschrijven. ⚠️ **Zonder `inline` vriest Tailwind de waarde in op
  buildtijd en schakelt het thema niet mee.**
- **Wijzig je kleuren, draai `node scripts/kleurcheck.mjs`.** Contrast (WCAG AA) plus
  protanopie, deuteranopie en tritanopie. Meten, niet schatten.
- **Vorm draagt het onderscheid tussen de families.** Net = gevulde chip. Finaliteit = gevulde
  chip mét rand en vormteken (▲ doorstroom, ◆ dubbel, ■ arbeidsmarkt). De tekens staan
  `aria-hidden`: de tekst ernaast zegt het al.
- **Themaschakelaar heeft drie standen**, niet twee (`ThemaToggle.tsx` + `lib/thema.ts`): geen
  attribuut betekent "volg het systeem". De keuze staat in `localStorage`, in een try/catch
  omdat privémodus dat kan blokkeren.
- **Anti-flits: `public/thema.js` zet het attribuut synchroon vóór React mount.** Bewust een
  apart bestand en géén inline `<script>`: de CSP staat alleen `script-src 'self'` toe, en dat
  houden we zo.
- Kleur is nergens de enige drager van informatie (WCAG 1.4.1): kaartmarkers zijn allemaal
  identiek en elke chip heeft een tekstlabel.

## Wat wél en niet in de URL staat

Filterstatus leeft in de querystring, zonder router (`useSearchState.ts`). **Vermijd
react-router**: dat lost hier niets op en breekt deep-linking onnodig.

| In de URL | Niet in de URL |
| --- | --- |
| Alle filters: `net`, `gemeenten`, `provincie`, naam, straal, `zonderaanbod`, `domein`, `rcode`+`rgraad` | De vergelijk-selectie |
| De open stand van de panelen: `?over=1`, `?help=1`, `?matrix=1` | Hoeveel items de lijst toont |
| Welke graad de matrix toont | |

De regel erachter: **de querystring beschrijft wát er gezocht wordt.** Een shortlist of een
scrollpositie hoort daar niet bij.

⚠️ `over` en `help` leven daarom **in `SearchState`**, niet in een losse `useState`: `update()`
herschrijft de volledige querystring, dus een parameter erbuiten valt bij de eerstvolgende
filterwijziging weg.

⚠️ **URL-migratie.** Links van vóór de netsplitsing dragen `?net=Officieel gesubsidieerd`.
`NET_MIGRATIE` in `useSearchState.ts` vertaalt die naar Provinciaal + Gemeentelijk. Zonder die
vertaling gaf elke oude link een lege pagina. **Splits je ooit nog een filterwaarde, doe daar
dan hetzelfde.**

## Filters

- **De filterpijplijn in `App.tsx` heeft een vaste volgorde.** De gemeentefilter staat als
  **laatste**: de aantallen per gemeente worden berekend op de lijst mét alle andere filters maar
  **zónder de gemeentefilter zelf**, want anders zet één aangevinkte gemeente alle andere op 0.
  `verborgenZonderAanbod` wordt daarentegen wél ná de gemeentefilter geteld, anders telt het
  adressen mee die de bezoeker toch niet zou zien.
- **Aangevinkte waarden blijven altijd in de lijst staan**, bovenaan, ook als ze op 0 vallen of
  niet op de zoekterm matchen. Anders zie je een lege pagina zonder vinkje om weer uit te zetten.
  Geldt voor netten én gemeenten.
- **De gemeentelijst toont enkel gemeenten die in de huidige resultaten voorkomen**, met het
  aantal erachter, plus een zoekveldje. 245 gemeenten als vinkje aanbieden maakt van een filter
  een zoekopdracht op zich.
- **Brussel staat achteraan in `PROVINCIE_OPTIONS`**, niet alfabetisch tussen Antwerpen en
  Limburg: het is een gewest, geen provincie.
- **Adressen zonder studieaanbod worden verborgen, nooit stil weggelaten.** Standaard aan
  (`?zonderaanbod=1`), met altijd een teller erbij: boven de lijst met een knop "Toon ze toch",
  en een vinkje in de filterkolom. Leeg betekent hier: géén enkele school op dat adres heeft een
  richting.

## Lijst en kaart

- `ResultList.tsx` toont **25 adressen per lading met een "Toon meer"-knop**, geen genummerde
  pagina's: de lijst staat op afstand gesorteerd, en een knop houdt de scrollpositie intact.
  De teller reset bij elke filterwijziging. Het resultaataantal bovenaan blijft het **totaal**.
- **De kaart pagineert niet mee.** Daar is het volledige beeld het punt. Clusteren is de manier
  waarop de kaart met veel resultaten omgaat.
- **Een cluster is geen campus.** De campus-samenvoeging is het datamodel; een cluster is puur
  visueel en hangt van het zoomniveau af. Laat een cluster dus nooit iets over "een school"
  zeggen, en bouw er geen filter of teller op.
- **Vanaf zoom 16 staan de markers los** (`disableClusteringAtZoom`). Meerdere scholen op één
  adres zijn al één marker met een popup eronder.
- **`MarkerCluster.Default.css` wordt bewust NIET geïmporteerd**, alleen `MarkerCluster.css`
  voor de positionering en de uitklap-animatie. Die standaardstijl brengt een eigen
  groen/geel/rood-schaal mee die naast ons palet valt en suggereert dat een groot cluster erger
  is dan een klein.
- ⚠️ **De klasse staat als `.leaflet-marker-icon.cluster-bol` in de CSS.** Leaflet zet
  `display: block` op `.leaflet-marker-icon`, even specifiek als een kale `.cluster-bol`. Met
  één klasse beslist de bundelvolgorde of het cijfer gecentreerd staat; doorgemeten, dan stond
  het linksboven.
- Toegankelijkheid van de bol: Leaflet zet zelf `tabindex="0"` en `role="button"`. De naam komt
  uit de inhoud: het zichtbare cijfer staat `aria-hidden` en ernaast staat een `sr-only`-zin.
  Een `aria-label` op het buitenste element kan niet, want `iconCreateFunction` levert enkel de
  inhoud, niet de wikkel.
- `import 'leaflet.markercluster'` in `MapView.tsx` staat er **voor TypeScript**, niet voor de
  runtime. `types` in `tsconfig.app.json` staat op `["vite/client"]`, dus zonder die regel kent
  `L` het type `MarkerCluster` niet.
- `DATA_MIDDEN` is het midden van de databounds, geen gekozen stad. Alleen zichtbaar vóór
  `FitBounds` de resultaten inpast en bij nul resultaten.

## Vergelijken

- **Maximum 4 adressen.** Bij vijf kolommen wordt een kolom smaller dan een schoolnaam.
- **Op mobiel bestaat de functie wél**, met een zijwaarts scrollende tabel en een vastgezette
  kenmerkkolom. De kolombreedtes zijn zo gezet dat de volgende kolom net aankijkt; dat is de
  aanzet om te scrollen.
- **Exporteren gebeurt als afdruk**, niet als link of CSV. Zo gekozen door de gebruiker.

## Print

- `VergelijkPanel` staat in `App.tsx` bewust **buiten** de app-wrapper in de JSX. Die wrapper
  krijgt `print:hidden` zodra het venster open staat, zodat er enkel een tabel op papier komt.
  Zet je het venster erin, dan verdwijnt het mee.
- Het `@media print`-blok onderaan `src/index.css` zet het palet terug naar het **lichte**
  palet, **niet naar zwart-wit**. De kleuren dragen betekenis, en wie zwart-wit wil heeft die
  keuze al in het printvenster van de browser.
- ⚠️ Het blok somt **alle** themaselectors op. Dat is nodig: het donkere palet staat op
  `:root:not([data-theme="light"])`, specifieker dan een kale `:root`, en media queries
  veranderen niets aan specificiteit. Zonder die selector erbij drukt iemand in donkere modus
  wit op wit af.
- **Het past op A4 omdat het print-blok een `@page`-marge (10 mm) zet en de kolommen daar hun
  `min-width` verliezen.** Op het scherm dragen die een vaste breedte voor het zijwaarts
  scrollen; op papier bestaat er geen scrollgebied. `table-layout: fixed` verdeelt de ruimte;
  haal je dat weg, dan loopt de tabel over de bladrand.
- **`@page`-marge alleen is niet genoeg.** Chrome negeert ze bij "Marges: Geen". Daarom staat er
  náást `@page { margin: 10mm }` ook 5 mm eigen padding op `.vergelijk-afdruk`, die de
  `print:p-0` uit de JSX overschrijft.
- Chips dragen een `chip`-klasse (`NET_CHIP` in `net.ts`, `FINALITEIT_CHIP` in `aanbod.ts`). In
  print worden ze kleiner en `inline-block`: zonder dat sneed de tekstafbreking "Gemeentelijk"
  middenin over twee regels.
- Chips dragen `print-color-adjust: exact`, zodat hun vulling ook afgedrukt wordt als
  "Achtergrondbeelden" uitstaat. **Bewust alleen op de chips**, niet op de hele pagina, anders
  kost een afdruk nodeloos veel inkt. Hetzelfde geldt voor `KenmerkBalkje`.
- ⚠️ **De baan van `KenmerkBalkje` heeft een vaste breedte in de vergelijkingstabel** (`w-28`),
  niet de celbreedte. De kolommen daar zijn niet even breed, dus een baan die meeloopt met de
  cel tekent 66,7% in een smalle kolom kórter dan 57,7% in een brede.

## De panelen

- **`OverPanel`** beantwoordt "kan ik dit vertrouwen": herkomst, bewerkingen, disclaimer,
  privacy. De **korte disclaimerregel staat in de footer zelf**, niet enkel achter de link: wie
  nooit doorklikt moet toch gezien hebben dat dit geen officiële bron is.
- **`MatrixPanel`** is het enige paneel dat iets aan de resultaten dóét in plaats van uit te
  leggen; daarom staat de knop vooraan in de kop. Twee dingen liggen er vast. Het raster is
  **altijd volledig**: een richting die hier nergens bestaat, staat gedimd op 0 en valt niet
  weg, want dat ze ontbreekt is de informatie. En de tellers rekenen op `matrixCampussen` uit
  `App.tsx`: alle filters **behalve de aanbodfilters zelf**, anders zet één aangeklikte richting
  elke andere cel op 0. Zelfde redenering als bij de tellingen per gemeente.
- **`HelpPanel`** beantwoordt "hoe krijg ik hieruit wat ik zoek". De bronnen staan hier bewust
  niet nog eens; er is één link naar `OverPanel`, die in dezelfde `update()` het ene sluit en het
  andere opent. De volgorde van de filters in die tekst is die van wat het meest oplevert, met
  studierichting eerst. Niet omgooien naar de volgorde van het scherm.
- **`HelpPanel` gaat nooit vanzelf open, ook niet bij een eerste bezoek.** De site bewaart niets
  over wie er langskomt, dus een eerste bezoek is niet van een tiende te onderscheiden.
  `localStorage` is hier géén uitweg, ook al gebruikt de themaschakelaar het.
- **De contactregel en de broncodelink blijven in de footer** en verhuizen niet naar een paneel:
  het zijn een Transitous- respectievelijk AGPL-vereiste.
- **Het versienummer in de footer komt uit `package.json`** via `__APP_VERSION__` (een `define`
  in `vite.config.ts`, gedeclareerd in `src/globals.d.ts`). Niet vervangen door een
  hardgecodeerde string.
