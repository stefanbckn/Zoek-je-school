# Wat er veranderde

Release notes per uitgebrachte versie, geschreven vanuit wat een bezoeker van de site merkt —
niet als lijst van commits, die staat al in de git-geschiedenis.

De nummering volgt MAJOR.MINOR.PATCH; zie de sectie Versienummering in [CLAUDE.md](./CLAUDE.md).
Elke uitgebrachte versie draagt op `main` de tag `v<versie>`.

---

## Niet uitgebracht

_Nog niets sinds 0.3.0._

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
