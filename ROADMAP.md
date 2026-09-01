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
| **0.10.0** | GOK-leerlingenkenmerken | Vier leerlingenkenmerken per school in het detailpaneel (opleiding moeder, schooltoeslag, thuistaal, buurt) én als rijen in de vergelijkingstabel, met schooljaar, teldatum en de kadering dat het indicatieve achtergrondcijfers zijn · automatisch opgehaald uit de AgODi-xlsx, join op 266 van de 272 scholen |
| **0.9.0** | Uitleg- en helppaneel | Paneel "Hoe werkt deze site?" in de kop met uitleg bij zoeken, filteren, één adres bekijken en vergelijken, plus een blok over wat de site niet toont (deelbaar via `?help=1`) |

## Nog te doen

In volgorde. Het bovenste is het eerstvolgende; het nummer wordt bij de merge toegekend.

| # | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| 1 | Dropouts + doorstroom hoger onderwijs | Vroegtijdige schoolverlaters en rechtstreekse doorstroom naar het hoger onderwijs, per school | **Bron gevonden, ontsluiting niet geverifieerd.** Staat in ScholenKompas (publiek, per school); niet in Dataloep (enkel Vlaams + gemeente) en niet in het API-portaal. Eerst uitzoeken of het in bulk of via een dieplink kan — zie hieronder |
| 2 | Doorlichting | Link naar het doorlichtingsverslag + datum, per school | **Bron niet geverifieerd.** Nooit als score tonen, zie hieronder. Eerst uitzoeken of de verslagen per schoolnummer op te halen zijn — kan alsnog afvallen |
| 3 | Kostprijs | Maximumfactuur, materiaalkost bij start (boeken, laptop, kaften) | Geen centrale bron; deels handmatig per school |
| 4 | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie Databronnen in [CLAUDE.md](./CLAUDE.md)). Rest nog te onderzoeken |
| 5 | Markers clusteren op de kaart | Nabije adressen samengevoegd tot één bol met het aantal erin, die bij inzoomen weer uit elkaar valt | **Klaar om te bouwen, keuze van bibliotheek nog te verifiëren.** Geen bron nodig, puur frontend. **Voorwaarde voor 6**, dus niet doorschuiven. Zie hieronder |
| 6 | Andere provincies | Heel Vlaanderen doorzoekbaar, met Antwerpen als standaard en een provinciekeuze die de rest bijlaadt | **Geblokkeerd door 5, geen bron nodig.** De data wordt al opgehaald en daarna weggegooid, dus het werk zit in de UI. Clustering moet er eerst zijn: 303 markers is nu al te druk. Zie hieronder |
| 7 | Kwaliteitsbewaking | CI-workflow bij elke push/PR, tests op de pure functies, schemavalidatie op de API-responses | **Klaar om te bouwen, geen bron nodig.** Niet zichtbaar voor een bezoeker, dus los in te schuiven tussen twee features door. Workflow lokaal doorgemeten, zie hieronder |
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

## Markers clusteren: de kaart begint te druk (gemeld 31/08/2026)

Zonder filters staan er 303 adressen op de kaart, en bij het openen zoomt `FitBounds` uit naar de
hele provincie. Wat je dan ziet is een blauwe soep waarin niets meer los te onderscheiden valt.
Gemeld door een gebruiker tijdens een UX-test: de kaart is in het begin te druk, en een groepering
met het aantal erin zou helpen, waarbij de losse markers bij inzoomen tevoorschijn komen.

Waarom dit past bij wat er al vastligt: de kaart mag bewust níét pagineren (zie 0.3.0 hierboven),
want daar is het volledige beeld het punt. Clusteren haalt niets weg. Het aantal in de bol is zelf
informatie voor een ouder ("hier zitten er elf bij elkaar"), en dat is precies het cijfer dat nu
onleesbaar in de overlap verdwijnt.

Aandachtspunten voor wie dit bouwt:

- **Een cluster is geen campus.** De campus-samenvoeging op `postcode|straat|huisnummer` is het
  datamodel (zie CLAUDE.md); een cluster is puur visueel en hangt van het zoomniveau af. Laat een
  cluster dus nooit iets over "een school" zeggen, en bouw er geen filter of teller op. Het aantal
  boven de lijst blijft het aantal campussen.
- **Op maximale zoom moeten de markers los staan.** Meerdere scholen op één adres zijn al één
  marker met een popup eronder; een cluster die daar overheen blijft liggen verbergt dat.
- **De bibliotheekkeuze is nog niet geverifieerd.** `leaflet.markercluster` is de standaard, maar
  de React-wrapper daarrond moet met `react-leaflet` v5 en React 19 overweg kunnen. Eerst
  controleren, niet aannemen. Lukt dat niet, dan is `markercluster` rechtstreeks op de
  Leaflet-instantie aansturen (via `useMap()`) het alternatief, zoals `FitBounds` nu al doet.
- **Toetsenbord en schermlezer meenemen.** Een clusterbol is een klikbaar element; die moet met
  Tab te bereiken zijn en een leesbaar label dragen ("11 adressen, open om te spreiden").
- Let op de laadtijd van de extra CSS en op het thema: de standaardstijl van markercluster brengt
  een eigen kleurenset mee die naast het palet uit 0.2.1 valt. Doormeten met
  `node scripts/kleurcheck.mjs` als er kleur bij komt.

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

## Andere provincies: de data ligt er al

Vandaag toont de site enkel provincie Antwerpen. Dat is geen beperking van de bron: `fetch-data.ts`
haalt in dezelfde call **alle 2145 vestigingen** van Vlaanderen en Brussel op en gooit er 1586 weg
met één regel (`instellingslocatie_provincie === PROVINCIE`). Er is dus geen extra endpoint, geen
extra key en geen extra API-call nodig. Geverifieerd op de huidige dataset, 01/09/2026.

**Zo gekozen (door de gebruiker): één JSON per provincie, Antwerpen als standaard, de rest wordt
pas ingeladen wanneer de bezoeker van provincie wisselt.** Niet één groot bestand voor heel
Vlaanderen. Reden: `vestigingen.json` is nu 3,2 MB (138 KB gzipped) voor 559 vestigingen; heel
Vlaanderen wordt daar ruwweg 3,8 keer zo groot, dus ~12 MB en ~530 KB over de lijn. Dat zou
iedereen laten betalen voor data die de meeste bezoekers nooit bekijken, terwijl `useVestigingen.ts`
alles bij het openen van de pagina ophaalt.

Aandachtspunten voor wie dit bouwt:

- ⚠️ **De markerclustering (punt 5 hierboven) moet eerst af zijn.** Dat is een voorwaarde, geen
  voorkeursvolgorde, zo beslist door de gebruiker op 01/09/2026. Bij 303 adressen is de
  uitgezoomde kaart al gemeld als te druk; die melding is de reden dat punt 5 bestaat. Per
  provincie blijft het even druk als vandaag, maar de bezoeker kan straks wél uitzoomen over
  provinciegrenzen heen en een brede straal kiezen, en dan valt de kaart om. Begin dus niet aan
  de provincies zolang de clustering niet in `main` zit.
- **De gemeentefilter schaalt niet mee.** Die vult zich uit de data (`gemeenteOpties` in
  `App.tsx`) en gaat van ongeveer 70 naar 300 gemeenten in een lijst met `max-h-48`. Er moet een
  zoekveldje in, of de lijst volgt de gekozen provincie.
- **Brussel zit in die 2145.** Het Brussels Hoofdstedelijk Gewest is geen provincie. Beslis
  expliciet of het een eigen keuze wordt of wegvalt, en gok niet dat het provincieveld het voor
  je oplost.
- **De provinciekeuze hoort in de URL**, zoals alle filters, dus in `SearchState`
  (`useSearchState.ts`). Een gedeelde link naar een school in Gent moet in Gent openen.
  Let op de laadvolgorde: de provincie bepaalt welk JSON-bestand er gehaald wordt, dus dat moet
  vóór de eerste render van de resultatenlijst vastliggen.
- **Kies de provincie bij het invullen van een adres, niet enkel via een keuzelijst.** Wie zijn
  adres in Sint-Niklaas invult, hoort niet eerst nog eens handmatig Oost-Vlaanderen te moeten
  aanklikken.
- **Grensgevallen bestaan.** Iemand in Rumst met een straal van 15 km hoort ook scholen in
  Mechelen te zien, maar niet die in Vlaams-Brabant, terwijl die soms dichterbij liggen dan een
  Antwerpse. Één provincie tegelijk laden is de eenvoudige weg; als de resultaten daardoor
  zichtbaar afgekapt worden aan de provinciegrens, zeg dat dan in de UI in plaats van het stil te
  laten.
- **Rond de kaart en de meta:** `MapView.tsx` centreert hardgecodeerd op Antwerpen
  (`ANTWERPEN_CENTRUM`), en `DatasetMeta` draagt de velden `aantalVestigingenAntwerpen` en
  `aantalCampussenAntwerpen`, die in de footer en in `OverPanel` gebruikt worden. Die worden
  per provincie, of ze verhuizen naar een structuur per provincie.
- **"provincie Antwerpen" staat op zes plaatsen als vaste tekst**: `App.tsx` (ondertitel),
  `index.html` (meta-description), `OverPanel.tsx`, `HelpPanel.tsx`, `Footer.tsx` en `types.ts`.
- **De omvangcontrole in `fetch-data.ts` vergelijkt met de vorige dataset.** Splits je in
  bestanden per provincie, dan moet die controle per provincie gebeuren, anders is ze bij de
  eerste run zinloos.

**Groeperen op bestuursniveau is hier geen alternatief voor** (gevraagd 01/09/2026). Het verliest
geen scholen: alle 559 vestigingen hebben een bekend bestuur (376 Vrij, 102 GO!, 63 Gemeente,
18 Provincie, 0 onbekend). Maar een bestuur kan scholen over verschillende gemeenten hebben, dus
kaartjes op bestuursniveau zetten campussen bij elkaar die tientallen kilometers uit elkaar
liggen. De adresgroepering bestaat net omdat scholen hetzelfde gebouw delen. Als filter of als
regel in het detailpaneel kan bestuur wel nuttig zijn; daarvoor moet `SchoolOpCampus` het
bestuursnummer en de naam gaan dragen, want vandaag staat er enkel `soortBestuur` (het type) in.

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
2. ~~**GOK-leerlingenkenmerken**, per school.~~ **Uitgebracht in 0.10.0.** Wat er gebouwd is:
   `scripts/leerlingenkenmerken.ts` haalt de xlsx op van het documentenportaal en
   `scripts/xlsx.ts` leest ze uit zonder dependency; de vier percentages staan in het
   detailpaneel onder het studieaanbod, en als vier rijen in de vergelijkingstabel — daar enkel
   als percentage, zonder balk, om er geen grafiek van te maken. Wat daarbij vastligt, staat in
   [CLAUDE.md](./CLAUDE.md).
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

## Dropouts en doorstroom naar het hoger onderwijs: ScholenKompas (onderzocht 01/09/2026)

Gevraagd: vier categorieën uit Notion, waarvan we er twee al hebben (thuistaal, schooltoeslag).
De twee andere — **dropouts** en **verder studeren in het hoger onderwijs** — bestaan wél per
school, maar niet in een bron die we vandaag kunnen automatiseren.

**Waar ze níét staan:**

- **Niet in het API-portaal.** De catalogus is bekend (zie [CLAUDE.md](./CLAUDE.md)); er is geen
  product met loopbaan- of doorstroomcijfers.
- **Niet in de AgODi-xlsx** die we in 0.10.0 gebruiken. Die bevat enkel de vier
  GOK-leerlingenkenmerken.
- **Vroegtijdig schoolverlaten staat in Dataloep enkel op Vlaams niveau en per stad/gemeente**,
  niet per school. Herhaald bevestigd op de pagina's van Onderwijs en Vorming, en zichtbaar in de
  leeswijzer bij die cijfers: de uitsplitsingen zijn uitstroompositie, loopbaantypologie, schoolse
  achterstand, leeftijd, graad/leerjaar, studiegebied, nationaliteit, provincie en centrumsteden —
  **instelling staat er niet tussen.** Niet opnieuw gaan zoeken in Dataloep zelf.

**Waar ze wél staan: ScholenKompas.** Een publiek dashboard van Onderwijs en Vorming met
cijfers per school, voor alle 706 scholen gewoon secundair onderwijs in Vlaanderen. Geen login.

```
https://www.vlaanderen.be/onderwijs-en-vorming/scholenkompas
→ https://public.tableau.com/views/ScholenKompasSecundair/Landingspagina
```

Let op: dit staat op **Tableau Public**, niet op de Tableau-server van de overheid waar Dataloep
draait. Andere host, andere mogelijkheden — dat is nog niet uitgezocht.

Uit de technische fiche (`data-onderwijs.vlaanderen.be/documenten/bestanden/
technische-fiche-scholenkompas.pdf`), letterlijk nagelezen:

- **3.4 Vroegtijdige schoolverlaters**, op basis van administratieve data. In de toepassing zijn
  de 2de en 3de graad samengenomen.
- **3.11 Rechtstreekse doorstroom van het secundair naar het hoger onderwijs**: hoeveel procent
  van de leerlingen zich na hun diploma rechtstreeks inschrijft, opgesplitst naar professionele
  bachelor, academische bachelor en graduaat. Daarbovenop **studierendement** (welk aandeel van
  de opgenomen studiepunten ze in het eerste jaar behalen) en **studiesucces** vier jaar na het
  secundair: wie een studiebewijs haalde, wie nog studeert, en wie stopte zonder diploma. Dat
  laatste is een tweede soort drop-out — die van het hoger onderwijs, niet van de school zelf.
  **Twee verschillende dingen, niet door elkaar halen in de UI.**
- Verder nog: oriënteringsattesten (A/B/C), schoolse vordering en zittenblijven, ongewettigde
  afwezigheden, nationaliteit, personeelscijfers, en dezelfde vier leerlingenkenmerken die we al
  hebben.
- **Rapportageniveau is de 'unit'** (alle vestigingsplaatsen van een school samen), niet de
  vestigingsplaats. Leerlingencijfers worden per vestigingsplaats verzameld maar per unit
  getoond; personeelscijfers gaan soms over een nog hoger niveau ('complex'). Dat sluit aan bij
  hoe wij de leerlingenkenmerken al tonen: per school, niet per adres.
- **Privacydrempels**: cijfers verdwijnen als de groep te klein is (bv. minder dan 5 uitgereikte
  attesten). Reken dus op gaten, net als de `(*)` in Dataloep.

**Wat nog uitgezocht moet worden vóór dit gebouwd kan worden:**

1. **Kan je er in bulk aan?** Het dashboard toont één school per keer, na een zoekopdracht. Een
   kruistabel-export per school zou 706 keer handwerk zijn — onbruikbaar. Of Tableau Public een
   werkblad met álle scholen bevat, of een download toestaat, is **niet geverifieerd**. Een
   poging om de werkmap als `.twb`/`.twbx` te downloaden gaf 404.
2. **Kan je per school dieplinken?** Zo ja, dan is er ook zonder eigen cijfers een goedkope
   winst: een knop "Bekijk deze school in ScholenKompas" naast de bestaande link naar de
   officiële fiche. Het instellingsnummer zit in de bron (sectie 2.1 van de fiche), maar de
   naam van de URL-parameter is nog niet nagekeken. **Niet gokken — uittesten.**
3. **Hergebruiksvoorwaarden.** Zoals bij de rest van dit portaal is er geen expliciete
   open-datalicentie gevonden. Doorlinken kan altijd; overnemen niet zomaar.

**Kadering, als het er komt.** Katholiek Onderwijs waarschuwt bij ScholenKompas expliciet voor
strategisch gedrag om indicatoren te beïnvloeden, schoolkeuze die te sterk op cijfers steunt, en
toenemende segregatie. ScholenKompas zelf maakt daarom géén ranglijsten en toont de resultaten
van de Vlaamse toetsen niet. Dezelfde lijn als bij de GOK-cijfers hierboven: context tonen, met
uitleg, nooit als score.

## GOK-indicatoren: er is wél een downloadbaar bestand (27/08/2026, gebouwd in 0.10.0)

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

- Op `schoolnummer`: **266 van onze 272 scholen matchen** (bij het bouwen op 01/09/2026; de
  eerste verkenning telde er 269, de dataset is sindsdien gegroeid). De zes die ontbreken zijn
  Arkades (Herentals) en Safe college (Mechelen) — allebei onafhankelijk, dus zonder
  werkingstoelagen en terecht afwezig — plus Mariagaarde secundair I en II (Westmalle) en
  Heilig Hart - Bovenbouw 2 en Middenschool 2 (Heist-op-den-Berg), die recent zijn gesplitst en
  nog niet in de telling van februari 2024 zaten.
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

## Kwaliteitsbewaking: CI, tests en schemavalidatie (besproken 01/09/2026)

Eén thema, want de losse stukken hangen samen: zonder CI draait er niets automatisch, en zonder
tests bewaakt die CI niets dat de build niet al bewaakt. Niet gebouwd, wel doorgemeten.

**De aanleiding.** `scripts/kleurcheck.mjs` is vandaag de enige echte controle in het project
(contrast en kleurafstand, ook gesimuleerd voor kleurenblindheid) en die draait alleen wanneer
iemand eraan denkt. Netlify draait hem nooit. Precies het soort fout dat hij vangt, ziet er op je
eigen scherm prima uit.

### Stap 1: een CI-workflow bij elke push en PR

Onderstaande versie is lokaal doorgemeten: `oxlint`, `tsc -b`, `tsc --noEmit -p tsconfig.app.json`
en `node scripts/kleurcheck.mjs` geven alle vier exitcode 0 op de huidige `main`.

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npx oxlint --deny-warnings
      - run: npm run build
      - run: node scripts/kleurcheck.mjs
```

Vier dingen die vastliggen, elk omdat een voor de hand liggende variant stilzwijgend fout gaat:

- **Node 22, niet 24.** `netlify.toml` zet `NODE_VERSION = "22"` en `ververs-scholendata.yml`
  gebruikt 22. Loopt CI op een andere major, dan kan CI groen zijn terwijl de deploy breekt.
- **Geen losse typecheck-stap.** `npm run build` doet `tsc -b`, en dat dekt zowel
  `tsconfig.app.json` als `tsconfig.node.json`, dus ook `scripts/`, `netlify/`, `shared/` en
  `vite.config.ts`. Een stap `tsc --noEmit -p tsconfig.app.json` ervoor dekt alleen `src` en voegt
  dus niets toe. Als losse `typecheck`-npm-script voor lokale snelle feedback is het wel zinvol;
  maak er dan `tsc -b --force` van.
- **`--deny-warnings` bij oxlint.** `react/only-export-components` staat in `.oxlintrc.json` op
  `warn`; zonder die vlag passeren waarschuwingen stil en is de lintstap half decoratief.
- **`permissions` en `concurrency`.** Minimale tokenrechten, en achterhaalde runs op dezelfde PR
  worden geannuleerd.

Kleine noot bij de versies: `actions/checkout` en `actions/setup-node` staan intussen op **v7**
(nagekeken via de GitHub-API op 01/09/2026), de bestaande data-workflow op v5. Kies één lijn voor
beide workflows in plaats van ze uit elkaar te laten lopen.

⚠️ **Nog te controleren in de Netlify-UI:** staan deploy previews aan? Zo ja, dan bouwt Netlify je
PR-branches al en is de buildstap in CI deels dubbel. Ze blijft dan nog steeds nuttig als snelle
faalmelding en omdat ze los staat van de `ignore`-regel in `netlify.toml`.

### Stap 2: tests, maar alleen op wat al eens misging

Er zijn vandaag nul tests: geen vitest, geen testbestand, geen `test`-script. Niet naar
dekkingsgraad streven, wel de handvol beslissingen vastpinnen die in CLAUDE.md al een eigen
waarschuwing hebben. Vijf kandidaten, allemaal pure functies zonder DOM:

- **`NET_MIGRATIE`** in `useSearchState.ts`: een oude link met `?net=Officieel gesubsidieerd` moet
  Provinciaal plus Gemeentelijk opleveren. Breekt dat, dan geeft een gedeelde link een lege
  pagina, zonder foutmelding.
- **`volgendeSchooldagOchtend()`** in `ov.ts`: datumlogica rond weekend en zomertijd, plus de
  lokale-tijd-val waar `toISOString()` er 06:30 van maakt.
- **`transitousPlannerUrl()`** en **`orsKaartUrl()`**: encodering van namen met een schuine streep,
  en de omgekeerde `lon,lat`-volgorde.
- **`campusAanbod()`** in `aanbod.ts`: aanbod per adres samenvoegen zonder duplicaten.
- De groepeersleutel **`postcode|straat|huisnummer`** in `fetch-data.ts`, met busnummer genegeerd.

Schatting: een uurtje met vitest, zo'n twintig assertions. Pas hierna bewaakt CI iets dat de
build niet al bewaakt.

### Stap 3: schemavalidatie op de API-responses (valibot)

Alleen in `scripts/fetch-data.ts`, want daar zit de enige echt onbetrouwbare grens. Hernoemt
Onderwijs en Vorming een veld, dan schrijft het script nu stil `null` weg; de omvangcontrole van
15% vangt alleen krimp, niet stille verarming. Een schema per endpoint maakt daar een luide fout
van.

**Niet client-side gebruiken.** `public/data/vestigingen.json` maakt je eigen script; die 4 MB
opnieuw valideren in de browser kost bundle en parsetijd voor nul winst. Valibot is boven zod de
juiste keuze vanwege tree-shaking, al speelt dat in een buildscript niet eens. Laatste versie op
npm: 1.4.2 (nagekeken 01/09/2026).

### Wat er bewust NIET in zit

- **Geen CI-badge in de README, zolang er geen tests zijn.** Een badge zou dan zeggen "de build
  slaagt", en dat weet je al: Netlify bouwt elke push op `main`. Bovendien is het publiek
  beperkt; de repo staat publiek omdat de AGPL en Transitous dat vragen, niet omdat er
  bijdragers langskomen. Na stap 2 is de badge wel iets waard.
- **CodeQL: mag, maar verwacht er weinig van.** Dit is een client-side app zonder database of
  authenticatie; het enige serverpad is de ORS-proxy. Via *default setup* (Settings → Code
  security) kost het bijna niets en is er geen workflowbestand te onderhouden. **Dependabot
  levert hier meer op**, want het risico zit in dependencies. ⚠️ Niet geverifieerd: default setup
  zet géén workflowbestand in de repo, en de badge-URL verwijst naar een workflowbestand. Wil je
  per se een CodeQL-badge, dan moet je waarschijnlijk de advanced variant nemen.
