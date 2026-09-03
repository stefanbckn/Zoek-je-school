---
paths:
  - "src/types.ts"
  - "src/lib/**/*.ts"
  - "scripts/**/*.ts"
---

# Datamodel — Campus, SchoolOpCampus en wat er per adres samengaat

## Campus is de eenheid die de app toont, niet de school

`scripts/fetch-data.ts` groepeert vestigingsplaatsen op **`postcode|straat|huisnummer`** tot een
`Campus`, met een `scholen: SchoolOpCampus[]`-array erin. Busnummer telt bewust **niet** mee in
de groepeersleutel: een andere ingang van hetzelfde gebouw is nog steeds dezelfde campus.
`public/data/vestigingen.json` bevat dus `Campus[]`, geen platte lijst.

- `Campus` draagt adres, provincie, coördinaten en afstand: gedeeld door alle scholen erop.
- `SchoolOpCampus` draagt naam, net, contactgegevens, erkenning, richtingen en
  leerlingenkenmerken: per school verschillend.

Meerdere scholen op één adres is de regel, niet de uitzondering: 1563 van de 2145 vestigingen
delen een adres, op één adres staan er tot 11. Waarom deze groepering en niet op bestuur staat
in [docs/onderzoek/campusgroepering.md](../../docs/onderzoek/campusgroepering.md).

## Wat wél per adres samengevoegd wordt: het studieaanbod

`campusAanbod()` in `src/lib/aanbod.ts` voegt de richtingen van alle scholen op één adres samen.
Filteren gebeurt op dat samengevoegde aanbod. Een andere campus met ander aanbod blijft wél
apart. `SchoolOpCampus.richtingen` is waar het per school binnenkomt.

**Richtingen zijn ontdubbeld tot één regel per graad.** De bron noemt elk leerjaar apart ("1e
leerjaar in de 2e graad Latijn ASO" én "2e leerjaar in de 2e graad Latijn ASO"); dat voorvoegsel
wordt weggehaald en de dubbels vallen samen. Matcht het voorvoegselpatroon niet (eerste graad,
7e leerjaar, HBO5, OKAN), dan blijft de naam onaangeroerd.

Richtingen zitten per **vestiging** in het model, niet per school: een school met meerdere
campussen kan per campus een ander aanbod hebben.

⚠️ **Een vestigingsplaats heeft niet noodzakelijk studieaanbod.** 688 van de 2145 (school,
vestiging)-paren hebben geen enkele richting. Dat is geen fout in onze data; de officiële fiche
staat standaard op "met studieaanbod" en toont zo'n adres dan niet. Zie
[issue #23](https://github.com/stefanbckn/Zoek-je-school/issues/23).

**De schakelaar "zonder studieaanbod" werkt sinds 0.12.2 op twee niveaus.** Eerst vallen de 163
adressen weg waar geen enkele school aanbod heeft (`heeftAanbod`), daarna binnen de
overblijvende adressen de 404 losse schoolrijen zonder richting (`scholenMetAanbod`). Dat tweede
niveau is nodig omdat `campusAanbod` per adres samentelt: een lege rij toonde anders het aanbod
van de buurschool. Zet de bezoeker de schakelaar aan, dan komen allebei terug.

## Wat NIET per adres samengevoegd wordt: de leerlingenkenmerken

Die hangen aan `SchoolOpCampus`, niet aan `Campus`. Optellen over scholen die een campus delen
zou een gemiddelde over andere leerlingenpopulaties maken. De UI zegt er expliciet bij over
welke school het gaat.

**Geen zelfberekende OKI.** De som van de vier gedeeld door het leerlingenaantal benadert de
gepubliceerde OKI, maar is een afleiding. Vier percentages tonen, geen samengesteld getal.

**Framing ligt vast: kansarmoede-indicatoren, geen kwaliteitsoordeel.** De balkjes zijn neutraal
grijs, bewust geen kleurschaal van groen naar rood, en eronder staat dat het indicatieve
achtergrondcijfers zijn waarop je geen schoolkeuze baseert. De labels en de volgorde staan één
keer in `src/lib/leerlingenkenmerken.ts`, zodat het detailpaneel en de vergelijkingstabel niet
uiteenlopen.

## Net: 6 waarden, uit het bestuur

`Net` in `src/types.ts`: GO! / Provinciaal / Gemeentelijk / Officieel gesubsidieerd /
Vrij gesubsidieerd / Onafhankelijk.

`instelling_net` heeft maar 3 bruikbare categorieën en kan Provinciaal niet van Gemeentelijk
scheiden. Het onderscheid komt uit `instelling_soort_bestuur`, dat **op het bestuur staat**, niet
op de school. Codelijst geverifieerd: `1` GO!, `2` Vrij, `3` Provincie, `4` Gemeente, `5` OCMW,
`6` Intercommunale, `7` Vlaamse Gemeenschap, `8` Vlaamse autonome hogeschool, `9` Andere.

Verdeling per vestiging (gemeten 03/09/2026): Vrij gesubsidieerd 1437, GO! 564, Gemeentelijk 93,
Provinciaal 46, Onafhankelijk 5.

- **"Gemeentelijk", niet "Stedelijk".** Veel gemeentelijke scholen liggen in gemeenten die geen
  stad zijn.
- **'Officieel gesubsidieerd' blijft als terugval bestaan** voor officiële scholen met een
  bestuur dat noch provincie noch gemeente is (OCMW, intercommunale). In de huidige dataset komt
  die waarde niet voor. Niet gokken dat zo'n school gemeentelijk is.
- De oude tekst-heuristiek op de bestuursnaam is definitief van tafel. Niet meer gebruiken.

## Afstand

Altijd hemelsbrede afstand (haversine). In de UI heet dat **"in vogelvlucht"**, nooit
"reisafstand".

## Placeholders in `src/types.ts`

Twee velden staan op `null`: `vervoer` voor het roadmapthema "Praktisch", en `kostprijs`, dat
sinds 03/09/2026 **geen bestemming meer heeft** omdat kostprijs uit de roadmap geschrapt is.
Weghalen kan, maar vraagt een verse dataset, want het veld staat ook in
`public/data/vestigingen.json`.
