# Wat er veranderde

Release notes per uitgebrachte versie, geschreven vanuit wat een bezoeker van de site merkt —
niet als lijst van commits, die staat al in de git-geschiedenis.

De nummering volgt MAJOR.MINOR.PATCH; zie de sectie Versienummering in [CLAUDE.md](./CLAUDE.md).
Elke uitgebrachte versie draagt op `main` de tag `v<versie>`.

---

## 1.1.0 — 4 september 2026

Een tweede pagina, en een reeks kleinere ingrepen zodat zoekmachines de site kunnen vinden. Aan
de zoeker zelf verandert niets.

**Nieuw**

- **Een pagina met uitleg bij het secundair onderwijs**, te vinden via "Wat betekenen de
  termen?" bovenaan, via de footer en onderaan "Hoe werkt deze site?". Wat de drie finaliteiten betekenen, welke acht studiedomeinen er zijn,
  wat duaal leren is en wat een net is. Die uitleg zat tot nu verspreid over het helppaneel en de
  filters; nu staat ze op één plaats, met een eigen adres waar je naartoe kan linken.
- Het helppaneel blijft wat het was: dat gaat over hoe je de zoeker gebruikt, en dat lees je
  liever zonder de zoeker te verlaten.

**Verbeterd**

- De site heeft een eigen adres: **zoekjeschool.be**. De oude netlify.app-URL blijft werken.
- De paginatitel zegt nu waar de site over gaat in plaats van enkel "Zoek je school", en een
  gedeelde link toont een deftig voorbeeld in chat-apps en op Mastodon of Bluesky.
- Een `robots.txt` en een `sitemap.xml` wijzen zoekmachines naar de juiste adressen, zodat elke
  gedeelde zoeklink niet als een aparte pagina in de resultaten belandt.

**Nog niet**

- Bij een gedeelde link ontbreekt voorlopig het voorbeeldbeeld: dat moet nog getekend worden.
- Hoger in de zoekresultaten komen duurt sowieso maanden. Een nieuw adres moet eerst opgepikt
  worden, en daar helpt geen enkele instelling aan.

---

## 1.0.0 — 3 september 2026

De eerste versie met een nummer dat niet meer met een nul begint, en meteen de grootste
toevoeging sinds de site heel Vlaanderen toont: je kan nu vertrekken van een studierichting in
plaats van van een adres.

**Nieuw**

- **"Alle richtingen" bovenaan opent de matrix.** Dat is de officiële indeling van het secundair
  onderwijs: acht studiedomeinen (STEM, sport, taal en cultuur, en zo verder) tegen drie
  finaliteiten (doorstroom, dubbel, arbeidsmarkt), apart voor de tweede en de derde graad. Alle
  572 studierichtingen staan erin.
- **Achter elke richting staat op hoeveel adressen ze te vinden is**, geteld binnen de gemeente,
  de straal of het net dat je al gekozen had. Klik erop en je krijgt precies die adressen in de
  lijst en op de kaart.
- **Een richting die hier nergens bestaat, verdwijnt niet maar staat op nul.** Dat is met opzet.
  Zien dat een richting bestaat maar niet in je buurt, is even bruikbaar als zien waar ze wel is.
- **Filteren op studiedomein**, ook rechtstreeks in de filterkolom naast finaliteit.
- **Zevende leerjaren staan per domein in een apart uitklapbaar blok.** Ze hebben wel een domein
  maar geen finaliteit, dus ze horen niet in een van de drie kolommen.

**Wat je moet weten**

- **De matrix zegt niet wat er ná een richting komt.** Welke richting van de derde graad op welke
  van de tweede volgt, staat in geen enkele bron die wij kunnen ophalen. Wij verzinnen ze niet.
- De indeling komt uit dezelfde officiële catalogus als het aanbod per school, niet van een
  andere site.
- Zeven richtingen vallen buiten de matrix omdat ze geen studiedomein hebben: het eerste leerjaar
  A en B, het onthaaljaar voor anderstalige nieuwkomers en de HBO5-verpleegkunde. Die blijven
  gewoon vindbaar via de zoekvelden.
- Een gedeelde link naar een aangeklikte richting draagt nu ook de graad. Dezelfde richtingnaam
  bestaat soms in de tweede en de derde graad, en zonder die graad kreeg je er te veel.

## 0.12.2 — 3 september 2026

**Opgelost**

- **Scholen zonder studieaanbod verdwijnen nu ook van een adres waar de buren wél lesgeven.** Op
  Guffenslaan 27 in Hasselt stond "Hast Katholiek Onderwijs Hasselt 039107" tussen de scholen,
  terwijl die daar dit schooljaar geen enkele richting inricht. Wie doorklikte, las het aanbod
  van de buurscholen en vond dat adres op de officiële fiche niet terug. Het vinkje "zonder
  studieaanbod" verborg tot nu enkel hele adressen; het geldt nu ook per school. Dat ruimt 404
  lege schoolrijen op, bovenop de 163 adressen die al wegvielen.

**Wat je moet weten**

- Er verdwijnt geen enkele richting van het scherm: een verborgen school is er per definitie een
  zonder aanbod. Wil je ze toch zien, dan zet je hetzelfde vinkje aan als voorheen, in de
  filterkolom onder "Zonder studieaanbod".
- De teller in die filterkolom telt nu allebei, bijvoorbeeld "1 adres en 2 scholen vallen nu
  weg". Vroeger bewoog dat cijfer niet wanneer er enkel een schoolrij wegviel.
- Eén school valt hierdoor helemaal weg zolang het vinkje uit staat: Safe college heeft op geen
  van haar adressen aanbod geregistreerd. Alle andere verborgen scholen blijven vindbaar op hun
  adressen waar ze wél lesgeven.

## 0.12.1 — 3 september 2026

**Opgelost**

- **De kaart is zo hoog als je scherm.** Hij was zo hoog als de filterkolom ernaast geworden: op
  een laptop liep hij ruim 700 pixels onder de rand van het venster door, en de onderkant
  bereiken kon niet, want scrollen boven de kaart zoomde. Nu scrol je er een stukje naartoe en
  vult de kaart je hele scherm.
- **Scrollen boven de kaart scrolt de pagina.** Het muiswiel zoomde in en uit, waardoor je boven
  de kaart vastzat. Inzoomen met het wiel gaat nog steeds, met ctrl of ⌘ erbij; de kaart zegt dat
  ook kort wanneer je scrolt.
- **Je kunt niet meer voorbij de voettekst scrollen.** Er zat ruim 2000 pixels lege ruimte onder
  de site, veroorzaakt door de verborgen teksten voor schermlezers in de gemeentenlijst.

**Wat je moet weten**

- De kaart begint onder de zoekbalk en is een volle schermhoogte hoog, dus je ziet hem pas
  helemaal nadat je een stukje gescrold hebt. Op een heel laag venster houdt hij een
  minimumhoogte van 400 pixels aan: een kaartstrook van honderd pixels is onbruikbaar.

---

## 0.12.0 — 2 september 2026

**Nieuw**

- **De site toont heel Vlaanderen en Brussel.** Waar er eerst enkel scholen in provincie
  Antwerpen stonden, zijn het er nu 2145 op 1075 adressen. De data werd al opgehaald en meteen
  weggegooid; dat gebeurt niet meer.
- **Brussel zit erbij**, met de 80 Nederlandstalige scholen van de Vlaamse Gemeenschap.
  Franstalige scholen staan niet in de bron en dus ook niet hier.
- **Filter op provincie**, met Brussel als aparte keuze onderaan de lijst. Het is een gewest,
  geen provincie, en het tussen Antwerpen en Limburg zetten zou iets anders suggereren.
- **De gemeentefilter is herbouwd.** Er zit een zoekveldje boven, de lijst toont enkel gemeenten
  waar na je andere filters nog iets staat, en achter elke gemeente staat hoeveel adressen je
  eraan overhoudt. Met 245 gemeenten was de oude lijst met vinkjes onwerkbaar geworden.
- **Je straal stopt niet aan een provinciegrens.** Wie in Rumst woont en 15 km instelt, ziet ook
  wat er in Vlaams-Brabant ligt.

**Wat je moet weten**

- **Antwerpen staat in de bron als districten.** Deurne, Berchem, Borgerhout en Wilrijk zijn
  aparte gemeenten in de filterlijst. Wie "Antwerpen" aanvinkt, krijgt Deurne er niet bij. Dat
  was al zo, maar het valt nu meer op.
- **De hele dataset wordt in één keer geladen**, ongeveer 190 KB. Bij een volgend bezoek haalt je
  browser hem niet opnieuw op zolang de gegevens niet veranderd zijn.
- **Zoeken op schoolnaam geeft vaker naamgenoten**, simpelweg omdat er nu vijf keer zoveel scholen
  in staan. Het adres onder de naam zegt welke je voor je hebt.

---

## 0.11.0 — 2 september 2026

**Nieuw**

- **De kaart is niet langer een blauwe soep.** Adressen die dicht bij elkaar liggen worden
  samengevoegd tot één bol met het aantal erin. Klik erop en de kaart zoomt in tot de bol uit
  elkaar valt; vanaf straatniveau staan alle speldjes weer los, met hun popup eronder. Zonder
  filters stonden er 303 speldjes over elkaar zodra de kaart uitzoomde naar de hele provincie.
- **Het aantal in de bol is zelf informatie.** "Hier zitten er elf bij elkaar" is precies wat
  eerder in de overlap verdween.
- **Ook met het toetsenbord.** Een bol is met Tab te bereiken, wordt als knop aangekondigd en
  leest voor als "11 adressen, open om te spreiden".

**Wat je moet weten**

- **Een bol is geen school en geen campus.** Het is een tijdelijke groepering die van het
  zoomniveau afhangt: zoom in en hij valt uit elkaar. Het resultaataantal boven de lijst blijft
  het aantal adressen tellen, niet het aantal bollen.
- **Er is niets verborgen.** De kaart toont nog steeds alle resultaten, ook die op "pagina 2"
  van de lijst staan. Clusteren stapelt op, het knipt niets weg.
- De bollen hebben in donkere modus dezelfde kleur als in lichte. De kaart zelf blijft ook in het
  donker een lichte kaart, en een lichtere bol zou daarop juist wegvallen.

---

## 0.10.0 — 1 september 2026

**Nieuw**

- **Vier leerlingenkenmerken per school, in het detailpaneel.** Onder het studieaanbod staat nu
  hoeveel procent van de leerlingen een moeder zonder diploma secundair onderwijs heeft, een
  schooltoeslag krijgt, thuis geen Nederlands spreekt, en in een buurt met veel schoolse
  vertraging woont. Met een balkje erbij, in neutraal grijs: het zijn geen punten en er is geen
  goede of slechte kant.
- **Er staat bij waar het vandaan komt en wat je ermee kan.** Elk kenmerk krijgt een zin uitleg,
  en onder het blok staat het schooljaar (2024-2025), de teldatum (1 februari 2024) en waarvoor
  die telling dient: de berekening van de werkingstoelagen. Uitdrukkelijk vermeld: het zijn
  indicatieve achtergrondcijfers over de leerlingengroep, ze zeggen niets over de kwaliteit van
  het onderwijs, en het is geen basis voor een schoolkeuze.
- **Ook in de vergelijkingstabel**, als vier extra rijen met hetzelfde percentage en balkje.
  Alle banen zijn daar even breed, ook als de ene kolom breder is dan de andere — anders zou een
  hoger percentage in een smalle kolom een korter balkje krijgen. Staan er meerdere scholen op
  een adres, dan krijgt elke school haar eigen regel in de cel, want anders dan de rest van de
  tabel gaan deze cijfers per school en niet per adres. Op de afdruk blijven de balkjes staan,
  ook als je "Achtergrondbeelden" uitzet.
- **"Over deze site" vermeldt de nieuwe bron**, met de link naar de publicatie zelf en met de
  kanttekening dat de percentages hier berekend zijn uit aantallen.

**Wat je moet weten bij deze cijfers**

- **Ze lopen een schooljaar achter op de rest van de site.** Het studieaanbod gaat over
  2026-2027, deze telling over 2024-2025. Dat is de meest recente publicatie die er is.
- **Ze gelden per school, niet per adres.** Anders dan het studieaanbod worden ze níét
  samengeteld over scholen die een campus delen: dat zou een gemiddelde over andere
  leerlingengroepen maken. Staan er meerdere scholen op een adres, dan zegt het paneel er
  expliciet bij over welke school het gaat.
- **266 van de 272 scholen hebben cijfers.** De zes andere staan niet in de publicatie omdat ze
  geen werkingstoelagen krijgen of pas onlangs zijn opgericht of gesplitst. Bij die scholen staat
  dat er met zoveel woorden, in plaats van dat het blok stil verdwijnt.

**Bewust niet gedaan**

- **Geen OKI-cijfer.** De gemiddelde onderwijskansarmoede-indicator is met deze vier tellingen
  na te rekenen, maar dat blijft een afleiding en geen gepubliceerd cijfer. Zolang die niet naast
  het officiële cijfer gelegd is, staan er vier percentages en geen samengesteld getal.

---

## 0.9.1 — 1 september 2026

**Opgelost**

- **Op een smalle telefoon paste de site niet meer op het scherm.** De rij knoppen bovenaan
  ("Hoe werkt deze site?", "Over deze site" en de keuze Licht/Systeem/Donker) bleef op één
  regel staan en stak buiten het scherm, waardoor je de hele pagina zijwaarts moest schuiven en
  "Donker" half wegviel. De knoppen zakken nu naar een tweede regel als ze niet passen. Op een
  scherm van 320 pixels breed was de pagina 464 pixels breed; dat is nu exact 320. Op een breed
  scherm verandert er niets aan de kop.

---

## 0.9.0 — 31 augustus 2026

**Nieuw**

- **"Hoe werkt deze site?".** Rechtsboven in de kop, naast "Over deze site", staat nu een
  venster met de uitleg bij het gebruik: waar je je adres invult en wat de straal doet, welke
  filters het snelst een korte lijst geven (studierichting eerst), dat een kaartje een adres is
  en geen school, en hoe je twee tot vier adressen naast elkaar zet en afdrukt. Het sluit met
  Escape of een klik ernaast, en de open stand staat in de link (`?help=1`), dus je kan de
  uitleg doorsturen aan wie ermee worstelt.
- **Een blok "Wat je hier niet vindt".** Infodagen, aanmelden en een oordeel over kwaliteit
  staan niet op deze site. Dat staat nu in de uitleg, met waar je het wel vindt, in plaats van
  dat je blijft zoeken naar iets dat er niet is.

**Niet veranderd**

- **Het venster gaat nooit vanzelf open**, ook niet bij een eerste bezoek. De site houdt niets
  bij over wie er langskomt, dus een eerste bezoek is niet van een tiende te onderscheiden.
  Onthouden dat je de uitleg al gezien hebt, zou net het bijhouden van bezoekgedrag zijn dat
  deze site niet doet. De knop staat daarom gewoon zichtbaar in de kop, en jij beslist.

---

## 0.8.0 — 30 augustus 2026

**Nieuw**

- **"Over deze site".** Rechtsboven in de kop, en ook onderaan, staat nu een venster met waar de informatie vandaan komt, wat
  deze site ermee doet (scholen per adres samenvoegen, richtingen per graad samenvatten,
  afstand in vogelvlucht), wat er met je gegevens gebeurt, en waarvoor je de site beter niet
  gebruikt. Het opent met de link in de footer en sluit met Escape of een klik ernaast.
  De open stand staat in de link (`?over=1`), dus je kan die tekst doorsturen.
- **Een disclaimer die altijd zichtbaar is.** Bovenaan de footer staat, ook zonder doorklikken:
  deze site is geen officiële bron, en de fiche van Onderwijs en Vorming gaat altijd voor.
  De volledige tekst — bewerkte en mogelijk verouderde gegevens, geen rechten te ontlenen, niet
  te gebruiken als brondata — staat in "Over deze site".

**Opgelost**

- **Knoppen tonen weer een handje.** De muisaanwijzer veranderde nergens in de app als je over
  een knop ging, waardoor niet duidelijk was dat er iets aan te klikken viel. Dat gold voor
  alle knoppen, niet enkel voor de nieuwe link.

**Niet veranderd**

- De contactgegevens en de link naar de broncode blijven in de footer staan en zijn niet naar
  het venster verhuisd. Ze zijn allebei een voorwaarde van de diensten en de licentie waar deze
  site op draait, en horen zichtbaar te zijn zonder dat je eerst iets moet openklikken.

---

## 0.7.0 — 30 augustus 2026

**Veranderd**

- **"Hemelsbreed" heet nu "in vogelvlucht".** Dezelfde afstand, duidelijker woord. Het staat op
  de resultatenkaart, in het detailpaneel, in de vergelijkingstabel en in de voetnoot eronder —
  overal aangepast. Het blijft de rechte lijn tussen twee punten, dus nog altijd geen
  reisafstand; daarvoor staan de fiets- en OV-tijden in het detailpaneel.
- **Het versienummer staat onderaan in de footer**, met een link naar deze pagina met
  wijzigingen. Zo weet je welke versie je voor je hebt wanneer je een fout meldt.

---

## 0.6.0 — 30 augustus 2026

**Nieuw**

- **Twee tot vier adressen naast elkaar vergelijken.** Onder elke kaart in de resultatenlijst
  staat "Vergelijk dit adres". Vink er twee tot vier aan en je krijgt ze naast elkaar in één
  tabel: afstand, welke scholen er staan met hun net, hoeveel richtingen er zijn, welke
  finaliteiten, het volledige aanbod per graad, en de contactgegevens met de link naar de
  officiële fiche. Een graad die één van de adressen niet aanbiedt, laat daar een streepje —
  zo zie je in één blik dat de ene school geen derde graad heeft.
- **De vergelijking kan je afdrukken** met de knop bovenaan, ook naar PDF. Op papier valt de
  rest van de site weg en blijft alleen de tabel over, in de lichte kleuren — ook als je de site
  in donkere modus gebruikt. Of je in kleur of in zwart-wit afdrukt, kies je gewoon in het
  printvenster van je browser; de gekleurde labels voor net en finaliteit houden hun vorm, ook
  als je achtergronden niet mee laat afdrukken. De tabel past op de breedte van een A4, ook met vier adressen
  naast elkaar; een lange lijst richtingen loopt door op een volgend blad, met de adressen
  opnieuw bovenaan.

**Details**

- Vergelijken werkt ook op een telefoon. De tabel past daar niet in de breedte, dus die scrolt
  zijwaarts terwijl de kolom met de kenmerken links blijft staan; er staat bij dat je moet
  scrollen. De functie weglaten op mobiel zou precies de bezoeker straffen die geen laptop bij
  de hand heeft.
- De vergelijking gaat over een adres, niet over één school. Op 130 van de 303 adressen staan
  meerdere apart geregistreerde scholen die samen één gebouw en één studieaanbod delen; die
  krijgen dus één kolom, met de scholen als rij erin.
- Je selectie blijft staan als je daarna de filters aanpast. Ze staat wel niet in de link: wie
  de vergelijking wil bewaren of doorsturen, drukt ze af.
- Maximum vier, omdat een vijfde kolom smaller wordt dan een schoolnaam en je dan alleen nog
  aan het bladeren bent in plaats van aan het vergelijken.

**Opgelost**

- **Huisnummers als "2_B" staan er nu leesbaar in.** De brondata schrijft samengestelde
  huisnummers met een liggend streepje: `81_83` voor een reeks, `2_B` voor een nummer met een
  letter. Dat stond zo op de kaartjes, op de kaart en in de vergelijking. Nu wordt dat `81-83`
  en `2B`. Het nummer wordt niet ingekort — in Puurs bestaan Begijnhofstraat 3 en 3-5 als twee
  verschillende adressen.

**Wat er niet in zit**

- De GOK-leerlingenkenmerken. Die horen thuis in deze vergelijkingstabel en de bron is al
  gecontroleerd, maar ze komen in een aparte versie — zie [ROADMAP.md](./ROADMAP.md).
- De vergelijking toont geen fiets- of reistijd per adres. Die berekening gebeurt bij één
  school tegelijk in het detailpaneel; vier adressen tegelijk laten uitrekenen is precies de
  belasting waar de gebruikte diensten voor waarschuwen.

---

## 0.5.0 — 29 augustus 2026

**Nieuw**

- **Adressen zonder studieaanbod staan niet meer in de weg.** 50 van de 303 adressen in de
  bron hebben geen enkele studierichting: dat is meestal het administratieve adres van een
  school, terwijl de lessen ergens anders doorgaan. Die staan nu niet meer standaard in de
  lijst, zodat je er niet meer op klikt om vast te stellen dat er niets te zien is.
  Ze verdwijnen niet stiekem: boven de lijst staat hoeveel er verborgen zijn met een knop om
  ze toch te tonen, en in de filterkolom staat een vinkje "Toon ze ook". Dat het aanbod
  ontbreekt, betekent trouwens niet altijd dat er geen les gegeven wordt — vandaar dat je er
  altijd bij kan.

**Details**

- Het filter zit in de link, net als de andere filters (`?zonderaanbod=1`), dus een gedeelde
  zoekopdracht toont bij de ander hetzelfde.
- Het wordt als laatste toegepast, ná alle andere filters. Zo telt "x adressen verborgen"
  alleen wat door dít filter wegvalt, en niet wat een ander filter al had weggenomen.
- Leeg betekent hier: geen enkele school op dat adres heeft een richting. Staat er één school
  mét aanbod, dan blijft het hele adres zichtbaar.

---

## 0.4.0 — 28 augustus 2026

**Nieuw**

- **"Bekijk de rit stap voor stap"** onder het reisadvies in het detailpaneel. Die link opent de
  reisplanner van Transitous met jouw adres, de school en dezelfde aankomsttijd (8u30) al
  ingevuld, zodat je de haltes, de vertrekuren en de alternatieven ziet die niet in het paneel
  passen. De link verschijnt zodra je je eigen adres hebt ingevuld.
- **"Bekijk de fietsroute op de kaart"** doet hetzelfde voor de fiets: die opent de kaart van
  openrouteservice met jouw route erop, inclusief de weg die genomen wordt en het hoogteprofiel.
  Let op: die kaart opent soms sterk ingezoomd en heeft even nodig om naar de hele route uit te
  zoomen; met de knop rechtsboven op de kaart forceer je dat meteen.

**Gewijzigd**

- **De bovenkant van het detailpaneel is opgeruimd.** Adres, telefoon, e-mail en website stonden
  als gewone regels tussen de fiets- en OV-informatie, waardoor je ze moest zoeken. Het adres
  staat nu groot bovenaan met de afstand ernaast, en telefoon, e-mail en website staan daaronder
  in een apart kadertje. Die rijen zijn volledig aanklikbaar: op een telefoon bel je met één tik,
  en de website toont enkel het domein in plaats van een lange URL. De reisinformatie is
  samengebracht onder de kop "Hoe geraak je er?".
- De algemene link naar Transitous in het detailpaneel is vervangen door die dieplink; hij stond
  onderaan de pagina toch al.

---

## 0.3.0 — 27 augustus 2026

De eerste versie met een tag, en de eerste die je met het openbaar vervoer laat rekenen.

**Nieuw**

- **Reistijd met bus of trein** in het detailpaneel, naast de fietstijd die er al stond. Er wordt
  gerekend op aankomst om 8u30 op de eerstvolgende weekdag, dus je ziet een realistische
  schoolrit en niet de dienstregeling van het moment waarop je toevallig zit te zoeken. Het
  resultaat vermeldt het aantal overstappen, de lijnnummers en hoeveel je onderweg stapt, met de
  datum waarvoor gerekend is erbij.
- Ligt de school om de hoek, dan zegt het paneel dat wandelen sneller is in plaats van een
  busrit te zoeken die niet bestaat.
- **De resultatenlijst laadt per 25 scholen**, met een "Toon meer"-knop onderaan. Zonder filters
  stonden er ruim 300 kaartjes tegelijk op de pagina, wat het doorscrollen traag maakte. Het
  aantal resultaten bovenaan blijft het totaal tonen.

**Gewijzigd**

- De footer draagt nu een contactadres, een link naar de broncode en de bronvermelding voor de
  reisadviezen.

**Onder de motorkap**

- De code staat onder de **AGPL-3.0**-licentie en de repository is publiek.
- Reisadviezen komen van [Transitous](https://transitous.org/), een gratis, niet-commerciële
  dienst die de dienstregelingen van De Lijn en NMBS inleest. Er is geen server van ons bij
  betrokken: je browser praat rechtstreeks met hen, en alleen voor de school die je opent.

**Goed om te weten**

- De reistijd houdt geen rekening met schoolvakanties: valt de eerstvolgende weekdag in een
  vakantie, dan zie je de vakantiedienstregeling. De datum staat er daarom altijd bij.

---

De versies hieronder zijn **achteraf gereconstrueerd** uit de git-geschiedenis en dragen geen
tag; het nummeren begon pas bij 0.3.0.

## 0.2.1 — 27 augustus 2026

- Licht, donker of "volg mijn toestel" als weergave, met een schakelaar rechtsboven.
- Nieuw kleurenpalet, getoetst op kleurenblindheid. De finaliteiten kregen er een vormteken bij
  (▲ ◆ ■), zodat kleur nergens het enige onderscheid is.
- De actieve filters staan als wegklikbare labels onder de zoekbalk, met "Alles wissen".
- Het detailpaneel sluit nu ook met Escape.

## 0.2.0 — 27 augustus 2026

- Alle schoolgegevens komen voortaan van de API's van Onderwijs en Vorming, in plaats van uit
  gedownloade bestanden.
- **Het studieaanbod staat in de app**: per graad gegroepeerd, met de finaliteit erbij
  (doorstroom, dubbel, arbeidsmarkt). Je kan erop filteren en vrij zoeken op studierichting.
- Het net is opgesplitst in GO!, Provinciaal, Gemeentelijk en Vrij gesubsidieerd, in plaats van
  alles wat niet GO! of vrij was op één hoop te gooien.

## 0.1.1 — 25 augustus 2026

- Fietsafstand en fietstijd per school in het detailpaneel.

## 0.1.0 — 25 augustus 2026

- De eerste werkende versie: alle middelbare scholen in de provincie Antwerpen, gesorteerd op
  hemelsbrede afstand tot je adres, met filters op net, gemeente en naam, een kaartweergave, een
  detailpaneel per school en een deelbare link die je zoekopdracht onthoudt.
- Scholen die hetzelfde adres delen staan samen op één kaartje in plaats van als losse
  resultaten.
