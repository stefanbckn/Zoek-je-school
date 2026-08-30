# Wat er veranderde

Release notes per uitgebrachte versie, geschreven vanuit wat een bezoeker van de site merkt —
niet als lijst van commits, die staat al in de git-geschiedenis.

De nummering volgt MAJOR.MINOR.PATCH; zie de sectie Versienummering in [CLAUDE.md](./CLAUDE.md).
Elke uitgebrachte versie draagt op `main` de tag `v<versie>`.

---

## 0.6.0 — 29 augustus 2026

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
