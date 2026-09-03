# De matrix van het secundair onderwijs: waar studiedomein vandaan komt

Opgeleverd in 1.0.0. Onderzocht op 03/09/2026, naar aanleiding van de vraag of we een matrix kunnen tonen zoals
[die van onderwijskiezer](https://www.onderwijskiezer.be/v2/secundair/sec_matrix_so.php).

**Conclusie: dat kan volledig uit onze eigen bron.** Het veld dat we misten,
`administratievegroep_domein`, zit in de API die we al bevragen. Het staat alleen niet in onze
mapping, en daarom niet in `vestigingen.json`.

## Wat de matrix is

De officiële ordening van de tweede en derde graad, vastgelegd in een besluit van de Vlaamse
Regering. Twee assen:

- **Finaliteit:** doorstroom, dubbel, arbeidsmarkt. Dat hebben we al.
- **Studiedomein:** acht inhoudelijke domeinen, plus domeinoverschrijdend. Dat hadden we niet.

De eerste graad staat buiten de matrix, en zevende leerjaren hebben wel een domein maar geen
finaliteit.

## De bron: `administratievegroep_domein`

Endpoint `.../onderwijsaanbod_so/v2/administratievegroep`, hetzelfde endpoint waar finaliteit,
graad en onderwijsvorm vandaan komen. Gedocumenteerd in het
[API design document Onderwijsaanbod SO 2.6](https://onderwijs-api-portaal.vlaanderen.be/system/files/api/doc/2026-02/20241023_Onderwijsaanbod_SO_v2_6.pdf),
te decoderen via `/codelijst/domein_so`.

Vorm: het gebruikelijke `CodeOmschrijving`-paar.

```json
"administratievegroep_domein": { "code": "2", "omschrijving": "STEM" }
```

**Live geverifieerd op 03/09/2026** met onze eigen key, niet enkel uit het document gelezen. Op
de 1160 catalogusrecords met `filter_administratievegroep_hoofdstructuur=311`:

| Code | Domein | Records |
| --- | --- | --- |
| 2 | STEM | 514 |
| 8 | Voeding en horeca | 112 |
| 4 | Land- en tuinbouw | 103 |
| 6 | Maatschappij en welzijn | 95 |
| 10 | Eerste graad | 76 |
| 3 | Kunst en creatie | 73 |
| 5 | Economie en organisatie | 72 |
| 9 | Domeinoverschrijdend | 60 |
| 7 | Sport | 20 |
| 1 | Taal en cultuur | 18 |
| | leeg | 17 |

Let op twee dingen in die lijst. De omschrijvingen komen in **hoofdletters** uit de API ("TAAL EN
CULTUUR"), dus ze moeten voor de UI omgezet worden. En **"Eerste graad" is zelf een domeincode**,
geen inhoudelijk domein: die hoort in de weergave niet als kolom of rij naast STEM te staan.

## Dekking op onze eigen dataset

Van de **1010 richtingcodes** die in `public/data/vestigingen.json` voorkomen, staan er 1010 in
de catalogus en hebben er **998 een domein**. De twaalf zonder zijn precies de richtingen die
buiten de matrix vallen:

- 1ste leerjaar A en 1ste leerjaar B
- Onthaaljaar voor anderstalige nieuwkomers (OKAN)
- Basisverpleegkunde en negen HBO5-modules

Die horen er niet in geforceerd te worden. Ze hebben ook geen finaliteit, om dezelfde reden.

## Meegenomen vondst: `administratievegroep_studierichting`

Hetzelfde record bevat de **kale studierichting met een eigen stabiele code**:

```json
"administratievegroep_studierichting": { "code": "1095", "omschrijving": "Elektromechanische technieken duaal" }
```

Dat is de naam zonder "1e leerjaar in de 3e graad ..." ervoor en zonder "TSO" erachter. Vandaag
kappen we dat voorvoegsel met een regex (`LEERJAAR_PREFIX` in `src/lib/aanbod.ts`), wat werkt
voor 589 van de 744 namen maar een bewerking op een string blijft. Deze code is een echte
sleutel: alle leerjaren van dezelfde richting delen ze. Wie ooit richtingen wil ontdubbelen of
groeperen, hoort ze te gebruiken in plaats van de naam.

De code komt overeen met de `o=`-parameter op de site van het ministerie
(`onderwijsaanbod/so/lijst?ohs=311&o=1271&sl=1` is Bedrijfswetenschappen), dus er is ook een
officiële dieplink per richting mogelijk. Niet nodig voor de matrix zelf, wel handig om te weten.

## Waarom `studiegebied` het verkeerde spoor was

ROADMAP.md had lang een open punt "filteren op studiegebied", met de vaststelling dat het veld in
de data zit. Dat klopt formeel: `administratievegroep_studiegebied` bestaat en wordt door
`fetch-data.ts` gemapt. Maar het is **in de bron zelf zo goed als leeg**: 8 van de 1160 records
met hoofdstructuur 311, allemaal met dezelfde waarde "Personenzorg". In onze dataset zijn dat 235
van de 31380 rijen.

Studiegebied is de indeling van vóór de modernisering en heeft bij gemoderniseerde richtingen
geen betekenis meer. **Het is dus geen gat in onze data dat opgevuld moet worden, en geen filter
die nog gebouwd hoort te worden.** Domein is wat het geworden is.

## Wat onderwijskiezer hierin nog steeds niet oplost

Deze bron geeft de **assen** van de matrix, niet de **doorstroom** ertussen. Welke richting van
de derde graad officieel volgt op welke richting van de tweede, staat nog altijd in geen enkel
veld. Dat blijft open, met het onderzoek ernaartoe in ROADMAP.md. Niet door elkaar halen: een
richting in een cel plaatsen is een feit uit de bron, een pijl tussen twee cellen tekenen is dat
niet.

En onderwijskiezer blijft juridisch uitgesloten als databron, zoals in
[databronnen.md](./databronnen.md) staat. Dat hoeft hier ook niet meer: de matrix is nu uit de
officiële API te bouwen.
