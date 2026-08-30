# Roadmap — Zoek je school

Wat er nog komt. Wat er al is, staat in [CHANGELOG.md](./CHANGELOG.md); de projectconventies
en de geverifieerde databronnen staan in [CLAUDE.md](./CLAUDE.md).

**Versienummers staan hier niet bij wat er nog moet komen — bewust.** Een nummer krijgt een
thema pas op het moment dat het af is en naar `main` gaat. Zo kan elk stuk los uitgebracht
worden zonder dat alles eronder verschuift, en klopt SemVer vanzelf: nieuwe functionaliteit is
een MINOR, ook als het maar één filter is. Deze tabel houdt dus de **volgorde** bij, niet de
nummering. Zie [Versienummering in CLAUDE.md](./CLAUDE.md#versienummering-semver).

(Deze nummering verving eerder al de oorspronkelijke backlog-nummering uit de opzet; de oude
v0.2 "Reizen" is deels opgeleverd als 0.1.1. Dat vooraf nummeren is nu helemaal losgelaten.)

## Uitgebracht

Wat er per versie veranderd is, staat in [CHANGELOG.md](./CHANGELOG.md) — niet hier.

| Versie | Thema | Inhoud |
| --- | --- | --- |
| **0.1.0** | Basis | Vestigingen → campussen, afstand (hemelsbreed), filters (net/gemeente/naam), kaart, detailpaneel, URL-state, mobiel |
| **0.1.1** | Fiets | Fietsafstand/-tijd per school in detailpaneel (OpenRouteService via api.heigit.org) |
| **0.2.0** | API Onderwijs Vlaanderen | Schooldata via API · studieaanbod + finaliteit per vestiging · net-onderscheid via soort_bestuur. Infodagen geschrapt: geen bron |
| **0.2.1** | UI-verbeteringen | Actieve filters onder de zoekbalk + reset · kleurenpalet herzien (kleurenblindheid) · thema's/dark mode |
| **0.3.0** | Openbaar vervoer + pagineren | AGPL-3.0-licentie · reistijd met bus/trein via Transitous · contactgegevens in de footer · lijst pagineren |
| **0.4.0** | Dieplinks + opgeruimd detailpaneel | Link naar de rit in de Transitous-planner en naar de fietsroute op de ORS-kaart · adres en contactgegevens bovenaan het detailpaneel, reisinfo apart onder "Hoe geraak je er?" |
| **0.5.0** | Lege adressen wegfilteren | Adressen zonder studieaanbod standaard verborgen, met teller boven de lijst en een vinkje in de filterkolom om ze terug te tonen |
| **0.6.0** | Campussen vergelijken | 2–4 adressen naast elkaar in één tabel (afstand, scholen, aanbod per graad, contact), aan te vinken vanaf de resultatenkaarten en afdrukbaar naar papier of PDF |
| **0.7.0** | UI-details | "Hemelsbreed" heet "in vogelvlucht" op alle plaatsen · versienummer met changelog-link onderaan in de footer |
| **0.8.0** | Disclaimer + over deze site | Paneel "Over deze site" met herkomst, bewerkingen, privacy en disclaimer (deelbaar via `?over=1`), te openen vanuit de kop én de footer · korte disclaimerregel altijd zichtbaar in de footer |

## Nog te doen

In volgorde. Het bovenste is het eerstvolgende; het nummer wordt bij de merge toegekend.

| # | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| 1 | GOK-indicatoren | 4 leerlingenkenmerken per school, met kaderende uitleg | **Klaar om te bouwen.** Downloadbare xlsx bij AgODi, join geverifieerd op 269/272 scholen. Per school, niet per vestiging — zie hieronder. De vergelijkingstabel uit 0.6.0 is de plek waar ze thuishoren |
| 2 | Doorlichting | Link naar het doorlichtingsverslag + datum, per school | **Bron niet geverifieerd.** Nooit als score tonen, zie hieronder. Eerst uitzoeken of de verslagen per schoolnummer op te halen zijn — kan alsnog afvallen |
| 3 | Kostprijs | Maximumfactuur, materiaalkost bij start (boeken, laptop, kaften) | Geen centrale bron; deels handmatig per school |
| 4 | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie Databronnen in [CLAUDE.md](./CLAUDE.md)). Rest nog te onderzoeken |
| 5 | Uitleg- en helppaneel | Paneel "Hoe werkt deze site?" met een korte uitleg van zoeken, filteren en vergelijken, zelf te openen vanuit de kop | **Klaar om te bouwen.** Geen bron nodig, puur frontend. Zelf te openen, nooit vanzelf: zie hieronder |
| — | Aanmelden | Aanmeldsysteem per school tonen en linken | **Bewust zonder plaats in de volgorde.** Er is geen centrale bron; dit wordt handmatige curatie per regio, zie hieronder |

Uit de parkeerstand gehaald: **reistijd met de bus** stond geparkeerd en is in 0.3.0 uitgebracht
via Transitous. De Lijn zelf heeft nog steeds geen routeplanner-API — niet opnieuw gaan zoeken.

## 0.2.0 — stand van zaken

**Datalaag opgeleverd**: `fetch-data.ts` draait volledig op de API's, met studieaanbod,
finaliteit en soort_bestuur in de dataset. Zie de databronnen-sectie in [CLAUDE.md](./CLAUDE.md) voor de details.

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
onderwijskiezer.be heeft ze wel maar is juridisch uitgesloten (zie [CLAUDE.md](./CLAUDE.md)). Dit item schuift
door tot er een bron gevonden is — niet inplannen op hoop.

## 0.2.1 — UI-verbeteringen

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

## 0.3.0 — lijstweergave pagineren (uitgebracht)

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

## Uitleg- en helppaneel: alleen als de bezoeker erop klikt

Een paneel in de stijl van "Over deze site" (0.8.0), maar dan over het gebruik: waar je je adres
invult, wat de straal doet, wat "in vogelvlucht" betekent, hoe je op finaliteit filtert, en hoe je
twee tot vier adressen naast elkaar zet en afdrukt.

**Het gaat nooit vanzelf open, ook niet bij een eerste bezoek.** De site zet geen cookies en houdt
niets bij over wie er langskomt, en dat blijft zo. Zonder die opslag valt een eerste bezoek niet te
onderscheiden van een tiende, dus elke poging tot "toon dit één keer" wordt ofwel een venster dat
elke keer opnieuw in de weg staat, ofwel opslag die we net niet willen. De knop staat dus gewoon
zichtbaar in de kop, naast "Over deze site", en de bezoeker beslist.

Aandachtspunten voor wie dit bouwt:

- **Volg de aanpak van `OverPanel.tsx`.** Zelfde soort venster, zelfde sluitgedrag (Escape), en de
  open stand in de URL zoals `?over=1` daar. Dat betekent ook: die parameter hoort in `SearchState`
  te leven en niet in een losse `useState`, want `update()` herschrijft de volledige querystring.
- **`localStorage` is hier geen uitweg**, ook al gebruikt de themaschakelaar het al. Onthouden dat
  iemand het paneel gezien heeft, is precies het bijhouden van bezoekgedrag dat we niet doen.
- Schrijf het vanuit wat een ouder wil bereiken ("scholen op fietsafstand vergelijken"), niet als
  rondleiding langs de knoppen.

## Doorlichting: wel linken, nooit scoren

Tonen wat de onderwijsinspectie over een school zegt. Stond eerst helemaal buiten de planning,
sinds 28/08/2026 staat het in de volgorde hierboven — beslist door de gebruiker.

⚠️ **Het uitzoekwerk onderaan deze sectie is nog niet gedaan.** Er is geen geverifieerde bron:
of de verslagen per `schoolnummer` op te halen zijn, is nooit nagekeken. Blijkt dat niet te
kunnen, dan valt dit onderdeel terug op handwerk per school en gaat het uit de volgorde —
de andere onderdelen hangen er niet van af.

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

## Aanmelden: geen centrale bron (onderzocht 27/08/2026)

Er is **geen register, dataset of API** die scholen aan een aanmeldsysteem koppelt. Nagekeken:
de API-catalogus van het onderwijsportaal bevat geen aanmelden-product (zie [CLAUDE.md](./CLAUDE.md)), en er
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

## Vergelijken en duiden — vier stukken, los uit te brengen

Samen helpen ze een ouder kiezen tussen scholen die op afstand en aanbod al door de filter zijn
geraakt. Ze hangen niet van elkaar af, dus elk stuk gaat als eigen MINOR naar `main` zodra het
werkt: stuk 1 kwam uit als 0.5.0, stuk 3 als 0.6.0. Stuk 2 en 4 staan nog open. Hieronder in
volgorde van zekerheid:

1. ~~**Vestigingen zonder studieaanbod wegfilteren.**~~ **Uitgebracht in 0.5.0.** Geverifieerd
   op de huidige dataset:
   **50 van de 303 campussen** hebben geen enkele richting, en **152 van de 559 vestigingen**.
   Dat is meestal een administratief geregistreerd adres — vaak het instellingsadres dat als
   aparte vestiging in de bron staat (bv. Panorama op Bredastraat 35, terwijl het lesgeven op
   Quellinstraat 31 gebeurt; zie de waarschuwing bij de GOK-join verderop). Voor een ouder is
   dat ruis.
   - **Zo gebouwd: standaard verbergen, met een zichtbaar vinkje om ze terug te tonen** en het
     aantal verborgen adressen erbij — zowel boven de lijst (met knop "Toon ze toch") als in de
     filterkolom. Stil weglaten mag niet — een school waarvan het aanbod om een andere reden
     ontbreekt, verdwijnt dan spoorloos.
   - Filterstatus staat in de URL (`?zonderaanbod=1`), zoals alle andere filters
     (`useSearchState.ts`). Het filter wordt als láátste toegepast, ná alle andere: alleen zo
     telt de teller wat door dít filter wegvalt en niet wat een ander filter al wegnam.
   - Let op de campus-samenvoeging: leeg betekent hier *geen enkele school op dat adres* heeft
     een richting. Eén school met aanbod houdt het hele adres zichtbaar.
2. **GOK-leerlingenkenmerken**, per school. Bron en join geverifieerd — zie hieronder.
3. ~~**Campussen vergelijken**~~ **Uitgebracht in 0.6.0**, vóór de GOK-cijfers in plaats van
   erna — die passen er later gewoon als extra rij bij. Wat er gebouwd is: 2 tot 4 adressen
   naast elkaar in één tabel (`VergelijkPanel.tsx`), aan te vinken vanaf de resultatenkaarten,
   met een balk onderaan die de selectie toont. Keuzes die daarbij gemaakt zijn:
   - **De shortlist is exporteerbaar als afdruk**, niet als link of CSV — zo gekozen door de
     gebruiker. Op papier valt de rest van de app weg (`print:hidden` op de app-wrapper, het
     venster staat er bewust búiten in de JSX) en gaat het palet naar zwart-op-wit. ⚠️ Dat
     laatste vergt dat het print-blok in `index.css` álle themaselectors opsomt: het donkere
     palet zit op `:root:not([data-theme="light"])` en dat is specifieker dan een kale `:root`.
     Zonder die selector erbij drukt een donkere-modus-bezoeker wit op wit af — dat is
     doorgemeten, niet ingeschat.
   - **De selectie zit níét in de URL**, in tegenstelling tot de filters. De querystring
     beschrijft wát er gezocht wordt; een shortlist is een tussenstap, zoals hoever iemand
     gescrold heeft.
   - **Op mobiel bestaat de functie wél**, met een zijwaarts scrollende tabel en een
     vastgezette kenmerkkolom. De kolombreedtes zijn zo gezet dat de volgende kolom net
     aankijkt — dat is de aanzet om te scrollen.
   - **Maximum 4.** Bij vijf kolommen wordt een kolom smaller dan een schoolnaam.
4. **Link naar het doorlichtingsverslag.** Zie de sectie hierboven — vorm ligt vast, bron nog
   niet geverifieerd. Dit is het enige onderdeel dat kan afvallen.

## GOK-indicatoren: er is wél een downloadbaar bestand (27/08/2026)

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

## GOK-indicatoren — Dataloep-route (per vestigingsplaats, handmatig)

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
