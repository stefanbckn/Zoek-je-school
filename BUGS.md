# Bekende bugs

Lopende lijst van gemelde problemen die nog niet opgelost zijn. Eén kop per bug, met wat er
gebeurt, wat de oorzaak lijkt, en wat er nog geverifieerd moet worden. Opgeloste bugs gaan
eruit — de git-geschiedenis houdt ze bij.

Houd deze lijst gelijk met de opsomming in de README.

---

## De kaart is hoger dan het scherm en vangt het scrollen af (gemeld 02/09/2026)

**Wat er gebeurt.** Op een laptop past de kaart niet in één scherm, en scrollen met het wiel
boven de kaart zoomt uit in plaats van de pagina verder te scrollen. Je zit dus vast: je kan de
onderkant van de kaart niet bereiken zonder de kaart zelf te verzetten.

**Doorgemeten in de browser** op een venster van 1440 × 800 (02/09/2026, weergave "Kaart", geen
filters):

| | |
| --- | --- |
| Hoogte van het venster | 800 px |
| Hoogte van de kaart | 1305 px |
| Bovenkant van de kaart op de pagina | 260 px |
| Onderkant van de kaart | 1565 px, dus 765 px onder de vouw |
| Hoogte van de hele pagina | 7104 px |

**Wat de oorzaak lijkt.** Twee dingen die elkaar versterken:

1. De kaart staat in `App.tsx` in een `<div className="flex-1 mt-4 min-h-[400px] …">` naast de
   filterkolom. Er is wel een minimum- maar geen maximumhoogte, en als flex-item naast die
   kolom neemt de kaart de hoogte van de rij over. Die rij is zo hoog als de filterkolom, en die
   is met de provincie- en gemeentefilter erbij (0.12.0) langer geworden. De kaart schaalt dus
   mee met de filters in plaats van met het scherm.
2. `MapView.tsx` zet `scrollWheelZoom` aan. Dat is het gedrag van Leaflet zelf: het wiel boven
   de kaart stuurt de zoom en niet de pagina.

**Nog te verifiëren vóór er een oplossing gekozen wordt:**

- Een maximumhoogte gekoppeld aan het scherm (iets in de trant van `max-h-[calc(100vh-…)]`) is
  de voor de hand liggende ingreep, maar het aftrekgetal hangt af van de kop, de zoekbalk en de
  actieve-filterrij, en die wrappen op smallere schermen. Doormeten, niet inschatten.
- Voor het wiel: `scrollWheelZoom={false}` laat de pagina scrollen maar kost het inzoomen met
  het wiel, wat op de kaart net handig is. De gebruikelijke tussenweg is zoomen enkel met een
  toets erbij (ctrl of cmd). **Leaflet heeft daar geen ingebouwde optie voor** — er bestaat een
  plugin (`leaflet-gesture-handling`), maar of die met react-leaflet 5 en React 19 overweg kan,
  is niet nagekeken. Doe dat eerst, zoals bij de clustering.
- Let op mobiel: daar is het wiel geen kwestie, maar de kaart heeft er wél een minimumhoogte
  nodig, en er staat al een opmerking bij die `relative` over een kaart die op kleine schermen
  naar hoogte 0 zakte. Niet opnieuw introduceren.

---

## Scholen zonder studieaanbod blijven staan op een adres dat wél aanbod heeft (gemeld 02/09/2026)

**Wat er gebeurt.** Op Guffenslaan 27 in Hasselt staat "Hast Katholiek Onderwijs Hasselt 039107"
tussen de scholen op dat adres, maar wie de officiële fiche opent, vindt Guffenslaan daar niet
terug. De bezoeker besluit dan dat ons adres fout is.

**Het adres is niet fout.** Nagekeken op de bron (02/09/2026): instelling 39107 heeft zeven
vestigingsplaatsen in `instellingslocatie/v1`, waaronder nummer 10 op Guffenslaan 27, actief
sinds 01/09/2023 en zonder einddatum. De fiche op data-onderwijs.vlaanderen.be staat standaard
op **"met studieaanbod"**, en op die vestiging richt 39107 dit schooljaar geen enkele richting
in. Zet je de fiche op "zonder", dan staat Guffenslaan er wel. Twee lijsten, andere filter.

**Wat de oorzaak is.** De schakelaar "adressen zonder studieaanbod verbergen" werkt op
**adresniveau**, niet per school (`heeftAanbod` in `App.tsx`). Guffenslaan 27 telt acht scholen,
waarvan er zes wel aanbod hebben (Virga Jessecollege en co). Het adres blijft dus terecht staan,
maar de rijen van 39107 en Middenschool Kindsheid Jesu liften mee zonder één richting. Daar komt
bij dat het aanbodblok in het detailpaneel **per adres** samengevoegd is (`campusAanbod`), zodat
je bij 39107 het aanbod van de buren leest.

**Omvang, geteld op de gecommitte dataset (02/09/2026):**

| | |
| --- | --- |
| Schoolrijen in de dataset | 2145 |
| Rijen zonder enige richting | 688 |
| ... waarvan op een adres dat wél aanbod heeft, dus nu zichtbaar | 404 |
| ... waarvan op een adres zonder aanbod, dus nu al verborgen | 284 |
| Adressen zonder enig aanbod (nu al verborgen) | 163 van 1075 |

**De voor de hand liggende oplossing** is de filter ook per schoolrij laten werken: het adres
blijft, de lege rij verdwijnt. **Nagerekend wat dat weggooit** (02/09/2026):

- Van de 994 scholen in de dataset hebben er **2** op geen enkel adres aanbod. Eén daarvan valt
  nu al weg via de adresfilter; de andere, **Safe college** (onafhankelijk, één adres), zou
  nieuw onzichtbaar worden zodra de filter aanstaat. Alle andere 404 rijen horen bij een school
  die elders wél aanbod heeft, dus die school blijft vindbaar op haar andere adressen.
- Geen enkele rij is leeg door onze verwerking. Alle 1769 (school, vestiging)-paren met aanbod
  in de bron overleven de catalogusjoin; er is geen paar dat enkel leeg lijkt doordat een
  richtingcode ontbreekt in `/administratievegroep`. Van die 1769 vallen er 312 buiten onze
  dataset omdat ze op een vestiging staan die niet in hoofdstructuur 311 zit.

**Nog te verifiëren vóór er een oplossing gekozen wordt:**

- Wat er met het detailpaneel gebeurt. Het toont vandaag het aanbod van het hele adres bij één
  specifieke school. Verdwijnt de rij uit de lijst, dan blijft een gedeelde link naar die school
  bestaan; die mag geen leeg of misleidend paneel geven.
- Of de teller in de filterkolom ("x adressen vallen nu weg") schoolrijen moet meetellen. Nu telt
  hij adressen; met een filter per rij verdwijnt er iets zonder dat het cijfer beweegt.
- Of zoeken op naam de rij nog moet vinden. Wie "Safe college" intikt terwijl de filter aanstaat,
  krijgt met een naïeve implementatie nul resultaten en geen uitleg.
