# Dropouts en doorstroom naar het hoger onderwijs — ScholenKompas

Onderzocht 01/09/2026, download nagekeken 02/09/2026. **Niet gebouwd**: de cijfers bestaan per
school, maar niet in een bron die we vandaag kunnen automatiseren.

## Waar ze níét staan

- **Niet in het API-portaal.** Zie [databronnen.md](./databronnen.md); er is geen product met
  loopbaan- of doorstroomcijfers.
- **Niet in de AgODi-xlsx** die we in 0.10.0 gebruiken. Die bevat enkel de vier
  GOK-leerlingenkenmerken.
- **Vroegtijdig schoolverlaten staat in Dataloep enkel op Vlaams niveau en per stad/gemeente**,
  niet per school. Herhaald bevestigd op de pagina's van Onderwijs en Vorming, en zichtbaar in
  de leeswijzer bij die cijfers: de uitsplitsingen zijn uitstroompositie, loopbaantypologie,
  schoolse achterstand, leeftijd, graad/leerjaar, studiegebied, nationaliteit, provincie en
  centrumsteden. **Instelling staat er niet tussen.** Niet opnieuw gaan zoeken in Dataloep zelf.

## Waar ze wél staan

Een publiek dashboard van Onderwijs en Vorming met cijfers per school, voor alle 706 scholen
gewoon secundair onderwijs in Vlaanderen. Geen login.

```
https://www.vlaanderen.be/onderwijs-en-vorming/scholenkompas
→ https://public.tableau.com/views/ScholenKompasSecundair/Landingspagina
```

Let op: dit staat op **Tableau Public**, niet op de Tableau-server van de overheid waar Dataloep
draait. Andere host, andere mogelijkheden; dat is nog niet uitgezocht.

Uit de technische fiche (`data-onderwijs.vlaanderen.be/documenten/bestanden/
technische-fiche-scholenkompas.pdf`), letterlijk nagelezen:

- **3.4 Vroegtijdige schoolverlaters**, op basis van administratieve data. In de toepassing zijn
  de 2de en 3de graad samengenomen.
- **3.11 Rechtstreekse doorstroom van het secundair naar het hoger onderwijs**: hoeveel procent
  van de leerlingen zich na hun diploma rechtstreeks inschrijft, opgesplitst naar professionele
  bachelor, academische bachelor en graduaat. Daarbovenop **studierendement** (welk aandeel van
  de opgenomen studiepunten ze in het eerste jaar behalen) en **studiesucces** vier jaar na het
  secundair: wie een studiebewijs haalde, wie nog studeert, en wie stopte zonder diploma. Dat
  laatste is een tweede soort drop-out, die van het hoger onderwijs en niet van de school zelf.
  **Twee verschillende dingen, niet door elkaar halen in de UI.**
- Verder nog: oriënteringsattesten (A/B/C), schoolse vordering en zittenblijven, ongewettigde
  afwezigheden, nationaliteit, personeelscijfers, en dezelfde vier leerlingenkenmerken die we al
  hebben.
- **Rapportageniveau is de 'unit'** (alle vestigingsplaatsen van een school samen), niet de
  vestigingsplaats. Leerlingencijfers worden per vestigingsplaats verzameld maar per unit
  getoond; personeelscijfers gaan soms over een nog hoger niveau ('complex'). Dat sluit aan bij
  hoe wij de leerlingenkenmerken al tonen: per school, niet per adres.
- **Privacydrempels**: cijfers verdwijnen als de groep te klein is (bijvoorbeeld minder dan 5
  uitgereikte attesten). Reken dus op gaten.

## De data is niet te downloaden (uitgezocht 02/09/2026)

Nagekeken, niet ingeschat:

1. **De uitgever heeft data-download uitgezet.** De werkmap-metadata van Tableau Public
   (`https://public.tableau.com/profile/api/single_workbook/ScholenKompasSecundair`) geeft
   `"allowDataAccess": false`. Dat is de instelling achter "Download workbook or data"; die
   staat dus bewust af. De `.csv`-suffix op de view geeft 404, net als `.twb` en `.twbx`.
2. **Er staat geen bestand op het documentenportaal.** Bij de GOK-kenmerken bestond er wél een
   publieke xlsx; hier linkt de ScholenKompas-pagina enkel naar de technische fiche.
3. **Het vizql-protocol scrapen doen we niet.** Dat gold al voor Dataloep (fragiel,
   niet-ondersteund) en hier komt een tweede reden bij: het omzeilt een instelling die de
   uitgever expliciet heeft uitgezet.

## Blijft over, in deze volgorde

1. **De cijfers opvragen bij Onderwijs en Vorming.** Het Bestuursdecreet geeft een algemeen
   **recht op hergebruik van bestuursdocumenten**, en datasets vallen daar uitdrukkelijk onder.
   Belangrijk detail: een aanvraag moet over een **bestaand** document gaan, je kan een bestuur
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
   van de parameter is nog niet nagekeken. **Niet gokken, uittesten.**
3. **Zelf cijfers overnemen kan pas na 1.** Zonder expliciete licentie is doorlinken het enige
   dat sowieso mag.

## Kadering, als het er komt

Katholiek Onderwijs waarschuwt bij ScholenKompas expliciet voor strategisch gedrag om
indicatoren te beïnvloeden, schoolkeuze die te sterk op cijfers steunt, en toenemende
segregatie. ScholenKompas zelf maakt daarom géén ranglijsten en toont de resultaten van de
Vlaamse toetsen niet. Dezelfde lijn als bij de GOK-cijfers: context tonen, met uitleg, nooit als
score.
