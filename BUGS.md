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
