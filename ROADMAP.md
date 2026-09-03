# Roadmap — Zoek je school

Wat er nog komt. Wat er al is, staat in [CHANGELOG.md](./CHANGELOG.md); de projectconventies
en de geverifieerde databronnen staan in [CLAUDE.md](./CLAUDE.md).

**Wat hier hoort, en wat niet.** Dit bestand houdt de volgorde bij en het bronnenonderzoek voor
wat er nog niet is: welke bron geverifieerd is, welke afviel en waarom, en wat er nog uitgezocht
moet worden. Wat af is, wordt hier leeggehaald in plaats van te blijven staan. Regels die
vastliggen en niet omgekeerd mogen worden gaan naar [CLAUDE.md](./CLAUDE.md), wat een bezoeker
merkt gaat naar [CHANGELOG.md](./CHANGELOG.md), en wat kapot is staat als
[GitHub Issue](https://github.com/stefanbckn/Zoek-je-school/issues). Zo staat elk stuk op één
plaats. Bij de opruimronde van 03/09/2026 zijn de secties over 0.2.0, 0.2.1, 0.3.0, 0.11.0 en
0.12.0 op die manier verdeeld; ze stonden hier grotendeels dubbel, en de sectie over 0.2.0
beschreef de netfilter nog met de achterhaalde waarde "Stedelijk".

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
| **0.10.0** | GOK-leerlingenkenmerken | Vier leerlingenkenmerken per school in het detailpaneel (opleiding moeder, schooltoeslag, thuistaal, buurt) én als rijen met balkje in de vergelijkingstabel, met schooljaar, teldatum en de kadering dat het indicatieve achtergrondcijfers zijn · automatisch opgehaald uit de AgODi-xlsx, join op 266 van de 272 scholen |
| **0.9.0** | Uitleg- en helppaneel | Paneel "Hoe werkt deze site?" in de kop met uitleg bij zoeken, filteren, één adres bekijken en vergelijken, plus een blok over wat de site niet toont (deelbaar via `?help=1`) |
| **0.11.0** | Markers clusteren | Nabije adressen op de kaart samengevoegd tot één bol met het aantal erin, die bij klikken en inzoomen uit elkaar valt · vanaf zoom 16 staan alle markers los |
| **0.12.0** | Heel Vlaanderen en Brussel | Alle 2145 vestigingen op 1075 adressen in één keer geladen in plaats van enkel provincie Antwerpen · filter op provincie · gemeentefilter met zoekveld, resultaataantallen en enkel gemeenten die nog resultaten hebben |

## Nog te doen

In volgorde. Het bovenste is het eerstvolgende; het nummer wordt bij de merge toegekend.

| # | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| 1 | Wat volgt er na deze richting? | Bij het aanbod van de 2e graad tonen waar die richting op dit adres naartoe loopt in de 3e graad, en zichtbaar maken wanneer ze hier doodloopt | **Deels klaar om te bouwen, deels bron nodig.** Wat op dit adres zelf doorloopt is een feit uit onze eigen data en kan meteen. De officiële doorstroommatrix (welke richting waar logisch op volgt, ook buiten dit adres) staat niet in het API-portaal en is nog niet gevonden, zie hieronder |
| 2 | Dropouts + doorstroom hoger onderwijs | Vroegtijdige schoolverlaters en rechtstreekse doorstroom naar het hoger onderwijs, per school | **Bron gevonden, data afgesloten.** Staat per school in ScholenKompas, maar daar is download uitgezet (`allowDataAccess: false`); niet in Dataloep (enkel Vlaams + gemeente) en niet in het API-portaal. Volgende stap is de cijfers opvragen onder het recht op hergebruik — zie hieronder |
| 3 | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie Databronnen in [CLAUDE.md](./CLAUDE.md)). Rest nog te onderzoeken |
| 4 | Kwaliteitsbewaking | CI-workflow bij elke push/PR, tests op de pure functies, schemavalidatie op de API-responses | **Klaar om te bouwen, geen bron nodig.** Niet zichtbaar voor een bezoeker, dus los in te schuiven tussen twee features door. Workflow lokaal doorgemeten, zie hieronder |
| — | Aanmelden | Aanmeldsysteem per school tonen en linken | **Bewust zonder plaats in de volgorde.** Er is geen centrale bron; dit wordt handmatige curatie per regio, zie hieronder |

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
- **Filteren op studiegebied.** Het veld zit in de data (`administratievegroep_studiegebied`) en
  in het model, maar er is geen filter op. Let op: het is `null` bij eerste graad, OKAN en HBO5.
- **Naamgenoten in de naamfilter.** Sinds 0.12.0 zoekt de naamfilter in heel Vlaanderen, dus
  dezelfde schoolnaam komt vaker meerdere keren terug. Als dat in de praktijk stoort, is de
  oplossing de gemeente in het resultaat prominenter maken, niet de filter aanpassen.

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
werkt: stuk 1 kwam uit als 0.5.0, stuk 3 als 0.6.0 en stuk 2 als 0.10.0. Stuk 4 is geschrapt.
Hieronder in volgorde van zekerheid:

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
   detailpaneel onder het studieaanbod, en als vier rijen in de vergelijkingstabel, met daar
   dezelfde balkjes op een vaste breedte zodat ongelijke kolommen de vergelijking niet
   vertekenen. Wat daarbij vastligt, staat in [CLAUDE.md](./CLAUDE.md).
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
4. ~~**Link naar het doorlichtingsverslag.**~~ **Geschrapt op 03/09/2026**, zie "Bewust
   geschrapt" onderaan.

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
- **Studiegebied is `null` bij een deel van de richtingen** (eerste graad, OKAN, HBO5). Die
  vallen buiten deze weergave, ze horen er niet in geforceerd te worden.

**2. De officiële doorstroommatrix. Bron nog niet gevonden.**

Om te kunnen zeggen wat er ná een richting komt, ook buiten dit adres, is de officiële structuur
van de matrix secundair onderwijs nodig: welke richtingen van de derde graad op welke richting
van de tweede graad aansluiten. Wat we daarover weten:

- **Het API-portaal heeft er geen veld voor.** `/administratievegroep` levert per richting
  finaliteit, graad, leerjaar, onderwijsvorm, studiegebied, studierichting, duaal, modulair,
  niche, stem-categorie en gemoderniseerd (opsomming in [CLAUDE.md](./CLAUDE.md)). Geen enkel
  veld verwijst naar een voorafgaande of volgende richting. Dat is de veldenlijst van v0.2 en is
  voor dit doel nog niet opnieuw nagekeken, maar reken er niet op dat het er stilletjes bij is
  gekomen.
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

**De data is niet te downloaden (uitgezocht 02/09/2026).** Dit is nagekeken, niet ingeschat:

1. **De uitgever heeft data-download uitgezet.** De werkmap-metadata van Tableau Public
   (`https://public.tableau.com/profile/api/single_workbook/ScholenKompasSecundair`) geeft
   `"allowDataAccess": false`. Dat is de instelling achter "Download workbook or data"; die
   staat dus bewust af. De `.csv`-suffix op de view geeft 404, net als `.twb` en `.twbx`.
2. **Er staat geen bestand op het documentenportaal.** Bij de GOK-kenmerken bestond er wél een
   publieke xlsx; hier linkt de ScholenKompas-pagina enkel naar de technische fiche, verder niets.
3. **Het vizql-protocol scrapen doen we niet.** Dat stond hier al voor Dataloep (fragiel,
   niet-ondersteund) en hier komt er een tweede reden bij: het omzeilt een instelling die de
   uitgever expliciet heeft uitgezet.
**Blijft dus over, in deze volgorde:**

1. **De cijfers opvragen bij Onderwijs en Vorming.** Het Bestuursdecreet geeft een algemeen
   **recht op hergebruik van bestuursdocumenten**, en datasets vallen daar uitdrukkelijk onder.
   Belangrijk detail: een aanvraag moet over een **bestaand** document gaan — je kan een bestuur
   niet vragen iets nieuws samen te stellen. Dat zit hier goed, want de dataset achter het
   dashboard bestaat al. Vergoedingen zijn beperkt tot marginale kopieerkosten, en er zijn drie
   modellicenties (CC0, vrij hergebruik, hergebruik tegen betaling). Er is bovendien een
   precedent bij dezelfde afdeling: de GOK-leerlingenkenmerken staan al als open xlsx online.
   Kanaal: het contactformulier op de ScholenKompas-pagina, of 1700 (keuze 2, Onderwijs).
   Vraag concreet om de onderliggende cijfers **per instellingsnummer**, als xlsx of csv, onder
   een modellicentie.
2. **Ondertussen dieplinken.** Een knop "Bekijk deze school in ScholenKompas" naast de link naar
   de officiële fiche. Dan hoeven we niets over te nemen en blijft de kadering van de bron
   staan. Nog uit te testen: of Tableau Public een URL-parameter aanvaardt die meteen de juiste
   school opent. Het instellingsnummer zit in hun bron (sectie 2.1 van de fiche), maar de naam
   van de parameter is nog niet nagekeken. **Niet gokken — uittesten.**
3. **Zelf cijfers overnemen kan pas na 1.** Zonder expliciete licentie is doorlinken het enige
   dat sowieso mag.

**Kadering, als het er komt.** Katholiek Onderwijs waarschuwt bij ScholenKompas expliciet voor
strategisch gedrag om indicatoren te beïnvloeden, schoolkeuze die te sterk op cijfers steunt, en
toenemende segregatie. ScholenKompas zelf maakt daarom géén ranglijsten en toont de resultaten
van de Vlaamse toetsen niet. Dezelfde lijn als bij de GOK-cijfers hierboven: context tonen, met
uitleg, nooit als score.

## GOK-indicatoren: de xlsx-route (onderzocht 27/08/2026, gebouwd in 0.10.0)

Opgeleverd in 0.10.0. **De werking, de valkuilen en de afspraken staan in
[CLAUDE.md](./CLAUDE.md)** onder "GOK-leerlingenkenmerken"; die zijn hier niet herhaald. Wat
hier blijft staan, is waarom deze route gekozen is boven de Dataloep-route hieronder.

**Gevonden via** `onderwijsstatistieken.depuydt.eu` (Dieter Depuydt), die dezelfde cijfers toont
en in zijn FAQ schrijft dat alles uit publieke AgODi-publicaties komt. Zijn percentages zijn
exact gereproduceerd uit de xlsx (Sint-Jan Berchmanscollege Brussel: 14,7 / 65,6 / 24,2 / 62,3),
dus dat is zijn bron en onze kolominterpretatie klopt.

**De afweging:** automatisch en per school (de xlsx), of handwerk en per vestigingsplaats
(Tableau/Dataloep). Het is de xlsx geworden. Per vestigingsplaats bestaat het wél, maar enkel
handmatig; die weg staat hieronder beschreven voor als we ze ooit nodig hebben.

**Zijdelings genoteerd:** de AgODi-pagina `cijfermateriaal-leerlingenkenmerken` was op
27-28/08/2026 zelf niet bereikbaar (`www.agodi.be` geeft een DNS-fout, de redirect naar
`paddlecms.net` loopt in een time-out). Het documentenportaal werkt wél, en dat is wat het
script gebruikt.

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
