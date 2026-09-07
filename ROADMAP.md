# Roadmap — Zoek je school

Wat er nog komt. Wat er al is, staat in [CHANGELOG.md](./CHANGELOG.md); de projectconventies in
[CLAUDE.md](./CLAUDE.md) en `.claude/rules/`, en het bronnenonderzoek per thema in
[docs/onderzoek/](./docs/onderzoek/).

**Wat hier hoort, en wat niet.** Dit bestand houdt de **volgorde** bij van wat er nog niet is,
en het onderzoek naar wat nog niet af is. Wat af is, wordt hier leeggehaald in plaats van te
blijven staan.

| Waar | Wat |
| --- | --- |
| Hier | De volgorde, plus het onderzoek naar wat nog niet af is |
| [docs/onderzoek/](./docs/onderzoek/) | Afgerond of doodgelopen bronnenonderzoek, per thema |
| `.claude/rules/` | Regels die vastliggen en niet omgekeerd mogen worden |
| [CHANGELOG.md](./CHANGELOG.md) | Wat een bezoeker gemerkt heeft |
| [GitHub Issues](https://github.com/stefanbckn/Zoek-je-school/issues) | Wat kapot is |

Zo staat elk stuk op één plaats. Bij de opruimronde van 03/09/2026 zijn de secties over 0.2.0,
0.2.1, 0.3.0, 0.11.0 en 0.12.0 op die manier verdeeld; ze stonden hier grotendeels dubbel, en de
sectie over 0.2.0 beschreef de netfilter nog met de achterhaalde waarde "Stedelijk". Later die
dag zijn ook het afgeronde onderzoek naar aanmelden, ScholenKompas, de GOK-routes en de
De Lijn-API naar `docs/onderzoek/` verhuisd.

**Versienummers staan hier niet bij wat er nog moet komen — bewust.** Een nummer krijgt een
thema pas op het moment dat het af is en naar `main` gaat. Zo kan elk stuk los uitgebracht
worden zonder dat alles eronder verschuift, en klopt SemVer vanzelf: nieuwe functionaliteit is
een MINOR, ook als het maar één filter is. Deze tabel houdt dus de **volgorde** bij, niet de
nummering. De regels voor het nummeren zelf staan in de skill `release`
(`.claude/skills/release/SKILL.md`).

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
| **0.10.0** | GOK-leerlingenkenmerken | Vier leerlingenkenmerken per school in het detailpaneel (opleiding moeder, schooltoeslag, thuistaal, buurt) én als rijen met balkje in de vergelijkingstabel, met schooljaar, teldatum en de kadering dat het indicatieve achtergrondcijfers zijn · automatisch opgehaald uit de AgODi-xlsx, join op 266 van de 272 scholen |
| **0.9.0** | Uitleg- en helppaneel | Paneel "Hoe werkt deze site?" in de kop met uitleg bij zoeken, filteren, één adres bekijken en vergelijken, plus een blok over wat de site niet toont (deelbaar via `?help=1`) |
| **0.11.0** | Markers clusteren | Nabije adressen op de kaart samengevoegd tot één bol met het aantal erin, die bij klikken en inzoomen uit elkaar valt · vanaf zoom 16 staan alle markers los |
| **0.12.0** | Heel Vlaanderen en Brussel | Alle 2145 vestigingen op 1075 adressen in één keer geladen in plaats van enkel provincie Antwerpen · filter op provincie · gemeentefilter met zoekveld, resultaataantallen en enkel gemeenten die nog resultaten hebben |
| **1.0.0** | De matrix | Alle 572 studierichtingen als raster van studiedomein × finaliteit per graad, in een paneel achter "Alle richtingen" (`?matrix=1`) · teller per richting binnen de gekozen gemeente of straal, ook wanneer die nul is · klikken filtert de lijst op die richting en graad · filter op studiedomein in de filterkolom |
## Nog te doen

In volgorde. Het bovenste is het eerstvolgende; het nummer wordt bij de merge toegekend.

| # | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| 1 | Lijst en kaart naast elkaar | Op desktop vanaf 1280 px drie kolommen: filters 268 vast, lijst flexibel, kaart 470 vast en sticky. Lijst en kaart delen dezelfde hover-toestand, zodat een speld en zijn resultaatkaart samen oplichten. De Lijst/Kaart-schakelaar blijft alleen onder 900 px, waar de kaartkolom wegvalt | **Klaar om te bouwen, geen bron nodig.** Beschreven in de designgids bij de visuele identiteit, maar bewust apart gehouden: dit is gedrag, geen opmaak. Vandaag is `weergave` in `src/App.tsx` een strikte keuze tussen lijst en kaart op elke breedte; er komt gedeelde hover-state bij, de schakelaar wordt afhankelijk van de breedte, en de kaart laadt op desktop altijd mee |
| 2 | Weet je het nog niet? | Voor ouders die nog geen richting in gedachten hebben: uitleg bij wat 1A is (basisvorming plus differentiatie), hoe aanmelden en inschrijven in het 1e jaar verloopt, en links naar de interesse- en studievaardigheidstests van Onderwijskiezer | **Klaar om te bouwen, geen bron meer nodig.** De officiële uitleg over de eerste graad én over aanmelden en inschrijven staat op vlaanderen.be, opgehaald en nagelezen op 07/09/2026. Onderwijskiezer blijft enkel nog nodig voor de twee tests, zie hieronder |
| 3 | Wat volgt er na deze richting? | Bij het aanbod van de 2e graad tonen waar die richting op dit adres naartoe loopt in de 3e graad, en zichtbaar maken wanneer ze hier doodloopt | **Deels klaar om te bouwen, deels bron nodig.** Wat op dit adres zelf doorloopt is een feit uit onze eigen data en kan meteen. De officiële doorstroommatrix (welke richting waar logisch op volgt, ook buiten dit adres) staat niet in het API-portaal en is nog niet gevonden, zie hieronder |
| 4 | Dropouts + doorstroom hoger onderwijs | Vroegtijdige schoolverlaters en rechtstreekse doorstroom naar het hoger onderwijs, per school | **Bron gevonden, data afgesloten.** Staat per school in ScholenKompas, maar daar is download uitgezet (`allowDataAccess: false`); niet in Dataloep (enkel Vlaams + gemeente) en niet in het API-portaal. Volgende stap is de cijfers opvragen onder het recht op hergebruik, zie [docs/onderzoek/scholenkompas.md](./docs/onderzoek/scholenkompas.md) |
| 5 | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie [docs/onderzoek/openbaar-vervoer.md](./docs/onderzoek/openbaar-vervoer.md)). Rest nog te onderzoeken |
| 6 | Kwaliteitsbewaking | CI-workflow bij elke push/PR, tests op de pure functies, schemavalidatie op de API-responses | **Klaar om te bouwen, geen bron nodig.** Niet zichtbaar voor een bezoeker, dus los in te schuiven tussen twee features door. Workflow lokaal doorgemeten, zie hieronder |
| — | Aanmelden | Aanmeldsysteem per school tonen en linken | **Bewust zonder plaats in de volgorde.** Er is geen centrale bron; dit wordt handmatige curatie per regio, zie [docs/onderzoek/aanmelden.md](./docs/onderzoek/aanmelden.md) |

Uit de parkeerstand gehaald: **reistijd met de bus** stond geparkeerd en is in 0.3.0 uitgebracht
via Transitous. De Lijn zelf heeft nog steeds geen routeplanner-API — niet opnieuw gaan zoeken.

## Kleine open punten

Losse wensen, te klein voor een eigen regel in de tabel hierboven. Ze zijn hier bewaard omdat ze
anders begraven bleven in secties over versies die al uit zijn.

- **Filterkolom sticky met één scrollgebied (desktop).** Nu is het het slechtste van twee
  werelden: de `<aside>` scrollt weg bij lange resultatenlijsten, terwijl de gemeentelijst erin
  wél een eigen scrollbalk heeft (`max-h-48 overflow-auto`). Doe het als één scrollgebied: aside
  sticky met eigen overflow én die `max-h-48` weghalen. Enkel desktop. Stond open sinds 0.2.1;
  het pagineren van 0.3.0 maakte het minder nijpend maar loste het niet op.
- ~~**Filteren op studiegebied.**~~ Geschrapt op 03/09/2026. Het veld bestaat, maar is in de
  bron zelf zo goed als leeg (8 van de 1160 records). De bruikbare indeling is `domein`, niet
  `studiegebied`; zie [docs/onderzoek/matrix-studiedomein.md](./docs/onderzoek/matrix-studiedomein.md).
- **Naamgenoten in de naamfilter.** Sinds 0.12.0 zoekt de naamfilter in heel Vlaanderen, dus
  dezelfde schoolnaam komt vaker meerdere keren terug. Als dat in de praktijk stoort, is de
  oplossing de gemeente in het resultaat prominenter maken, niet de filter aanpassen.

## Weet je het nog niet? (bronnen nagekeken 07/09/2026)

Niet elke ouder komt hier met een richting in gedachten. Wie dat wel heeft, bedienen we al; wie
nog niets weet, krijgt vandaag niets. Drie stukken. Sinds 07/09/2026 heeft elk ervan een
bron; er is niets meer dat dit tegenhoudt.

**1. Links naar Onderwijskiezer. Nagekeken, meteen te zetten.** Enkel de twee tests zijn nog
onmisbaar; voor de uitleg zelf hebben we sinds 07/09/2026 een eigen bron.

- **I-Like Basic**, <https://www.onderwijskiezer.be/ilike_basic/> Interessetest voor het zesde
  leerjaar: 54 activiteiten scoren van 1 tot 7, met foto's erbij, resultaat als grafiek over acht
  interessegebieden.
- **I-Study Basic**, <https://www.onderwijskiezer.be/istudy_basic/> Vragenlijst over motivatie en
  studiemethode, ook voor het zesde leerjaar.
- **De eerste graad**, <https://www.onderwijskiezer.be/v2/secundair/sec_1graad.php> Hier staat de
  verdeling letterlijk: basisvorming van minstens 27 uur en een keuzegedeelte van 5 uur. Bewust
  deze overzichtspagina en niet de detailpagina van 1A
  (`sec_detail_1graad.php?detail=10003`): daar staat die verdeling niet bij, alleen "minimaal 32
  lesuren per week".
- **Inschrijven in het 1e jaar**,
  <https://www.onderwijskiezer.be/v2/download/Inschrijven-in-het-1e-jaar-secundair-onderwijs.pdf>
  Eén blad dat de procedure uittekent: 1A of 1B naargelang het getuigschrift basisonderwijs,
  aanmelden, scholen in voorkeursvolgorde zetten, en dan een plaats of een wachtlijst. Gemaakt in
  Canva op 31/03/2026 door Pascale Van Camp. Let op: dit is de algemene procedure, **geen bron per
  school**, dus het verandert niets aan de rij "Aanmelden" hieronder. **Als bron vervallen op
  07/09/2026:** dezelfde procedure staat op vlaanderen.be en die mogen we wél navertellen, zie
  stuk 3 hieronder. Linken naar dit blad mag nog, nodig is het niet meer.

⚠️ **Enkel linken, niets overnemen.** Onderwijskiezer verbiedt kopiëren en herdistribueren.
Dezelfde reden waarom de doorstroommatrix hieronder afvalt. Schrijf er dus een eigen zin bij die
zegt waarom je erheen stuurt, en neem geen tekst, vraagpakket of blad over.

**Waar de grens ligt, als we het inschrijvingsblad ooit zelf namaken** (besproken 06/09/2026).
Beschermd is hun uitwerking: de tekst zoals zij ze schreven, de volgorde en groepering van de
blokjes, het ontwerp. Niet beschermd is het feit eronder, en dat 1A hoort bij een getuigschrift
basisonderwijs staat gewoon in de regelgeving. Een eigen versie mag dus, op twee voorwaarden:

- **Vertrek van de officiële inschrijvingsregels, niet van hun blad.** Herschrijven wat je van
  hen aan het overtypen bent, blijft een bewerking van hun werk. Het blad is hoogstens het bewijs
  dat ouders met die vraag zitten.
- **Bronvermelding lost niets op.** Attributie maakt een kopie niet legaal. Linken mag altijd,
  kopiëren nooit, ook niet met een naamsvermelding erbij.

**2. Eigen uitleg over 1A op de site. Bron gevonden op 07/09/2026.**

Beter dan doorlinken is het in één alinea zelf zeggen: in 1A ligt het grootste stuk van de week
vast en kiest de school de rest in. Dat verklaart meteen waarom twee scholen met "1A" in het
aanbod toch niet hetzelfde aanbieden, en dat is precies de verwarring waar een ouder mee zit.

De bron is de structuurpagina van Onderwijs en Vorming, opgehaald en nagelezen op 07/09/2026:
<https://www.vlaanderen.be/onderwijs-en-vorming/wegwijs-in-de-onderwijsniveaus/wegwijs-in-het-gewoon-secundair-onderwijs/structuur-van-het-voltijds-gewoon-secundair-onderwijs>

Wat er letterlijk staat: eerste leerjaar minstens 27 uur basisvorming (de eindtermen) en minstens
5 uur differentiatie, met 1A voor wie het getuigschrift basisonderwijs heeft en 1B voor wie het
niet heeft; tweede leerjaar A minstens 25 uur basisvorming, 2 uur differentiatie en 5 uur
basisoptie; tweede leerjaar B minstens 20 uur basisvorming, 2 uur remediëring en verdieping en
10 uur basisoptie, met maximaal 3 te combineren basisopties. Ook de drie finaliteiten en de acht
studiedomeinen staan er.

Twee dingen die bij het schrijven niet mogen verwateren:

- **De officiële term is "differentiatie", niet "keuzegedeelte".** Dat laatste komt uit
  Onderwijskiezer en is dus precies de bron die we niet overnemen. Gebruik de woorden van
  vlaanderen.be.
- **De pagina zet die 27 plus 5 onder "1ste leerjaar", niet onder 1A alleen.** Schrijf wat er
  staat en denk 1B er niet stilzwijgend uit.

Hiermee vervalt het oude spoor naar de Codex Secundair Onderwijs en de omzendbrieven op `edulex`:
niet meer nodig. De twee pagina's die dit vroeger zeiden ("Van 29 studiegebieden naar 8
studiedomeinen" en "Krachtlijnen van modernisering secundair onderwijs") geven nog steeds een 301
naar de portaalhomepage; daar niet opnieuw naar zoeken.

**3. Hoe aanmelden en inschrijven verloopt. Bron gevonden op 07/09/2026.**

Dit is het stuk waarvoor eerder naar het pdf-blad van Onderwijskiezer gekeken werd. Dat is niet
langer nodig: dezelfde procedure staat op vlaanderen.be, vrij na te vertellen in eigen woorden en
vrij te linken. Drie pagina's, alle drie opgehaald op 07/09/2026:

- **Aanmelden**,
  <https://www.vlaanderen.be/onderwijs-en-vorming/inschrijving-en-toelating-in-onderwijs/basis-en-secundair-onderwijs/gewoon-onderwijs/aanmelden>
  Niet elke school werkt met aanmelden, en scholen kiezen zelf of en met wie ze daarvoor
  samenwerken. Ouders zetten hun scholen in voorkeursvolgorde. Bij toewijzing volgt een ticket,
  bij weigering een weigeringsdocument met de plaats op de wachtlijst, en die wachtlijstorde
  respecteert de school tot de 5de schooldag van oktober. Vanaf het 2de jaar secundair moet je
  nooit aanmelden.
- **Voorrang en ordening**,
  <https://www.vlaanderen.be/onderwijs-en-vorming/inschrijving-en-toelating-in-onderwijs/basis-en-secundair-onderwijs/gewoon-onderwijs/voorrang-en-ordening>
  Hoe scholen rangschikken. Enkel als link vastgesteld, de inhoud is nog niet nagelezen.
- **Wanneer inschrijven**,
  <https://www.vlaanderen.be/onderwijs-en-vorming/inschrijving-en-toelating-in-onderwijs/basis-en-secundair-onderwijs/gewoon-onderwijs/wanneer-inschrijven>
  De periodes per schooljaar. Voor 2027-2028: aanmelden van 23/03/2027 tot en met 16/04/2027,
  resultaat uiterlijk 11/05/2027, inschrijven met ticket van 12/05 tot 01/06/2027 en zonder ticket
  vanaf 12/05/2027. Scholen zonder aanmelding starten op diezelfde 12/05/2027 en weigeren voor
  1A/1B niemand wegens plaatsgebrek. De data voor 2028-2029 staan er ook al bij.

⚠️ **Zet die data niet op de site.** Ze verschuiven elk schooljaar, en dan staat er stil iets
fout op een site zonder backend. Beschrijf de volgorde van de stappen en link voor de data door
naar "Wanneer inschrijven". Om dezelfde reden maken we het blad van Onderwijskiezer ook visueel
niet na.

⚠️ **De hergebruikvoorwaarden van vlaanderen.be zijn niet geverifieerd.** Op geen van de vier
opgehaalde pagina's stond een licentie- of copyrightnotitie. Voor dit plan maakt dat niet uit: we
schrijven de feiten in eigen woorden en linken naar de bron, zoals bij de GOK-cijfers. Wil je
letterlijk citeren, zoek het dan eerst uit.

Dit verandert niets aan de rij "Aanmelden" in de tabel hierboven. Welk systeem een concrete school
gebruikt, staat nergens centraal, en de aanmeldpagina zegt dat zelf: scholen mogen kiezen of en
met wie ze samenwerken.

## Vorm: waar deze drie stukken landen (beslist 07/09/2026)

De oudere notitie zei "hoort in het helppaneel `?help=1`". **Dat is achterhaald.** Het helppaneel
gaat over de bediening van de zoeker, en deze uitleg gaat over het onderwijs zelf en over een
procedure. Verdeel niet op onderwerp maar op de vraag die de ouder stelt:

| Waar | De vraag van de ouder | Kenmerk |
| --- | --- | --- |
| `/uitleg/` | "Wat betekent dat woord?" | Tijdloos, geen data, gaat over het systeem |
| `?help=1` | "Hoe gebruik ik deze zoeker?" | Gaat over ons product |
| `?over=1` | "Waar komt dit vandaan?" | Herkomst, privacy, disclaimer |
| `/uitleg/inschrijven/` (nieuw) | "Wat moet ik doen, en wanneer?" | Procedure, tijdgebonden, verwijst door |

**1A, 1B, 2A en 2B gaan naar `/uitleg/`**, in de bestaande sectie "De graden". Die zegt vandaag
over de eerste graad zo goed als niets, terwijl "1A" letterlijk op de resultaatkaartjes staat.
Zet het vóór de sectie over finaliteit: eerst waar je nu staat, dan pas de keuze.

**Aanmelden en inschrijven krijgt een eigen pagina** en gaat er niet bij op `/uitleg/`. De
premisse daar is woordenschat zodat de filters ergens op slaan, en een procedure met jaarlijkse
data breekt dat. `/uitleg/` heeft vandaag nul onderhoud en dat moet zo blijven.

**De twee tests van Onderwijskiezer horen bij de procedurepagina**, niet bij de termen. I-Like en
I-Study zijn voor het zesde leerjaar, hetzelfde moment als aanmelden, en het is geen
woordverklaring. Bovenaan die pagina als blokje "nog geen idee?", vóór de stappen.

**De schakelaar tussen de twee: twee links die eruitzien als knoppen, geen JavaScript.** Beide
pagina's krijgen bovenaan dezelfde schakelaar, met de actieve knop opgevuld, zoals de
Lijst/Kaart-schakelaar in de zoeker. Voor de bezoeker is dat niet te onderscheiden van een echte
toggle: het zijn statische bestanden met een stylesheet die al in de cache zit.

- Met JS zou het in een apart bestand naast `thema.js` moeten, want de CSP staat enkel
  `script-src 'self'` toe. Werkbaar, maar het is onderhoud voor iets dat een link gratis doet.
- Elke helft krijgt zo een eigen `title`, `description`, canonical en socialkaart. Bij één pagina
  moet je twee onderwerpen in één omschrijving persen.
- Een ouder kan de inschrijvingshelft rechtstreeks doorsturen, en die landt meteen goed, ook
  zonder JS.
- `/uitleg/` blijft bestaan als adres. Het staat al in het helppaneel en is mogelijk geïndexeerd.
- De prijs is een kop en een footer in twee bestanden. Dat is vandaag al zo tussen `index.html`
  en `uitleg/index.html`, dus het is geen nieuw soort onderhoud.

⚠️ **Maak er een `<nav>` van met `aria-current="page"` op de actieve knop, en gebruik géén
`role="tablist"`.** Die rol belooft aan een schermlezer dat er panelen wisselen zonder navigatie,
en dat klopt hier niet.

**Labels.** De knop in de kop wordt `Uitleg voor ouders ↗` in plaats van
`Wat betekenen de termen?`, want hij dekt nu twee dingen. De schakelaar krijgt `De termen` en
`Aanmelden en inschrijven`. De `h1` per pagina blijft "Het secundair onderwijs uitgelegd" en
wordt "Aanmelden en inschrijven". De bullet "Aanmelden en inschrijven" in het helppaneel loopt
vandaag dood en wordt een link naar de nieuwe pagina.

**Twee losse MINOR's.** De termen op `/uitleg/` en de inschrijvingspagina zijn apart uit te
brengen; de schakelaar komt er pas bij als de tweede pagina bestaat.

## Wat volgt er na deze richting? (nog niet onderzocht)

De vraag die een ouder bij de tweede graad eigenlijk stelt, is niet "wat kan mijn kind hier
kiezen" maar "waar loopt dat op uit". Een richting kiezen in het derde jaar is in de praktijk
al half kiezen wat het vijfde en zesde jaar worden. De site toont dat vandaag nergens: het
aanbod staat per graad gegroepeerd, zonder enig verband tussen die groepen.

Er zitten twee dingen in, met een heel verschillende zekerheid. Niet door elkaar halen.

**1. Wat loopt er door op dít adres? Feit, en nu al te bouwen.**

We hebben per adres alle richtingen met `graad`, `studiegebied` en `finaliteit` (zie
`Richting` in `src/types.ts`). Daarmee is te tonen welke richtingen van de tweede graad hier
een voortzetting hebben in de derde, en welke niet. Dat laatste is het waardevolste stuk: kiest
je kind hier iets waarvan de derde graad op dit adres niet bestaat, dan verandert het na twee
jaar van school. Dat is een harde, controleerbare uitspraak over onze eigen dataset, geen
inschatting over het onderwijssysteem.

Aandachtspunten:

- **Op adresniveau, net als de rest van het aanbod.** `campusAanbod()` in
  `src/lib/aanbod.ts` voegt de scholen op één adres al samen; een buurschool op dezelfde
  campus die de derde graad wél inricht, telt dus mee. Dat is hier terecht, maar het moet er
  wel bij staan wanneer het om een andere school gaat.
- **De koppeling zelf blijft een afleiding**, ook al zijn de velden een feit. Studiegebied plus
  finaliteit zeggen dat twee richtingen bij elkaar in de buurt liggen, niet dat de ene officieel
  op de andere volgt. Formuleer dus wat we écht weten ("in hetzelfde studiegebied biedt dit
  adres in de derde graad ..."), nooit "dit is de logische vervolgrichting".
- **Groepeer op `domein`, niet op studiegebied.** Studiegebied is in de bron zo goed als leeg;
  domein zit er wel op, behalve bij eerste graad, OKAN en HBO5. Die vallen buiten deze
  weergave, ze horen er niet in geforceerd te worden. Zie
  [docs/onderzoek/matrix-studiedomein.md](./docs/onderzoek/matrix-studiedomein.md).

**2. De officiële doorstroommatrix. Bron nog niet gevonden.**

Om te kunnen zeggen wat er ná een richting komt, ook buiten dit adres, is de officiële structuur
van de matrix secundair onderwijs nodig: welke richtingen van de derde graad op welke richting
van de tweede graad aansluiten. Wat we daarover weten:

- **Het API-portaal heeft er geen veld voor.** `/administratievegroep` levert per richting
  finaliteit, graad, leerjaar, onderwijsvorm, studiegebied, studierichting, duaal, modulair,
  niche, stem-categorie en gemoderniseerd (opsomming in
  [docs/onderzoek/databronnen.md](./docs/onderzoek/databronnen.md)). Geen enkel
  veld verwijst naar een voorafgaande of volgende richting. **Opnieuw nagekeken op een live
  respons op 03/09/2026** (bij het onderzoek naar studiedomein): nog steeds geen doorstroomveld.
- **Eén nieuw spoor, niet geverifieerd:** elk catalogusrecord draagt een
  `structuuronderdeel.structuuronderdeel_nummer`, en het API design document verwijst voor de
  details naar een aparte **Structuuronderdelen API**. Of die op ons portaal beschikbaar is en of
  ze toelatingsvoorwaarden of doorstroom bevat, is niet nagekeken. Dat is het eerste wat je moet
  proberen als je hier terugkomt.
- **onderwijskiezer.be heeft dit wél en valt af.** Daar staat per richting waar ze naartoe leidt,
  maar hun voorwaarden verbieden kopiëren en herdistribueren. Alleen naar linken mag. Zelfde
  verhaal als bij de infomomenten.
- **Nog uit te zoeken, in deze volgorde:** of de matrix als bestand op het documentenportaal van
  Onderwijs en Vorming staat (daar stond de GOK-xlsx ook, dus het is geen gek idee), en of de
  toelatingsvoorwaarden per administratieve groep ergens machineleesbaar zijn. Niets hiervan is
  geverifieerd. Ga niet bouwen op een gereconstrueerde matrix: fout doorverwijzen is hier erger
  dan niets tonen.

**Vorm, als stuk 1 er komt.** Een regel of blokje bij het aanbod in `DetailPanel`, niet een
apart paneel, en zeker geen pijlendiagram: het gaat om een handvol richtingen per adres. In de
vergelijkingstabel hoort het voorlopig niet thuis, daar staat het aanbod al per graad.

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
dekkingsgraad streven, wel de handvol beslissingen vastpinnen die in `.claude/rules/` al een eigen
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

## Bewust geschrapt

Ideeën die uit de volgorde gehaald zijn, met de reden erbij. Ze staan hier zodat ze niet over een
half jaar opnieuw als goed idee binnenkomen en het uitzoekwerk overgedaan wordt.

**Doorlichting** (geschrapt 03/09/2026, beslist door de gebruiker). Was: een link naar het
doorlichtingsverslag met de datum erbij, per school. **De reden om het te laten: het staat al op
de officiële fiche waar we per school naar doorlinken.** Twee keer naar hetzelfde verslag linken
voegt niets toe, en het bespaart ons een bron die nooit geverifieerd is (of de verslagen per
`schoolnummer` op te halen zijn, was nog open).

Wat het waard is om te bewaren voor als er ooit iets in deze hoek terugkomt: **nooit als score
tonen.** Niet elke school heeft een verslag, en in een lijst met cijfers belanden die scholen
onderaan zonder dat er iets over hen gezegd is; afwezigheid van informatie leest dan als een
slecht rapport. Eén punt doet een school bovendien onrecht, en verslagen van verschillende jaren
naast elkaar vergelijken twee momenten in plaats van twee scholen. Dezelfde lijn als bij de
GOK-cijfers: context met uitleg, geen kwaliteitsoordeel.

**Kostprijs** (geschrapt 03/09/2026, beslist door de gebruiker). Was: maximumfactuur en
materiaalkost bij de start (boeken, laptop, kaften). **De reden om het te laten: er is geen
centrale bron en het is te schoolafhankelijk.** Het zou neerkomen op de informatie per school
opzoeken en met de hand bijhouden, voor een cijfer dat per richting en per leerjaar verschilt en
elk jaar verandert. Dat is precies het soort onderhoud dat een statische site zonder backend niet
kan dragen.

⚠️ **Gevolg in de code:** `SchoolOpCampus.kostprijs` in `src/types.ts` is een placeholder die op
`null` staat en die nu geen bestemming meer heeft. Het veld wordt door `fetch-data.ts`
weggeschreven en staat dus ook in `public/data/vestigingen.json`. Weghalen kan, maar vraagt een
verse dataset; het is geen opruiming die tussendoor moet.
