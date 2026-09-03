# Databronnen — wat er bestaat, en wat bewust ontbreekt

Alle schooldata komt uit het **API-portaal Onderwijs en Vorming**
(`https://onderwijs-api-portaal.vlaanderen.be/documentatie/instellingsgegevens`). Eén API-key
geeft toegang tot alle producten hieronder; geverifieerd, geen aparte aanvraag per product.

De praktische valkuilen bij het ophalen (paginatie, filters, auth) staan **niet hier** maar in
`.claude/rules/data-import.md`, want die heb je nodig terwijl je aan `scripts/` werkt.

## Producten die we gebruiken

| Product | Endpoint | Wat we ermee doen |
| --- | --- | --- |
| Instellingslocatie v1 | `.../instellingsgegevens/instellingslocatie/v1/instellingslocatie` | Adres + WGS84-coördinaten per vestigingsplaats. Basis van de dataset. |
| Instellingen v2 | `.../instellingsgegevens/instelling/v2/instelling` | Naam, net, levensbeschouwing, contact, erkenning, scholengemeenschap, bestuur per school. |
| Onderwijsaanbod SO v2 | `.../onderwijsaanbod_so/v2/ingerichteadministratievegroep` | Koppeling school+vestiging aan richting. Bevat géén inhoudelijke velden. |
| Onderwijsaanbod SO v2 | `.../onderwijsaanbod_so/v2/administratievegroep` | Catalogus van richtingen: finaliteit, graad, onderwijsvorm, studiegebied, duaal. |
| Codelijst v1 | `.../codelijst/v1/codelijst/{lijst}` | Decodeert codes (o.a. `soort_bestuur`, `net`). Eenmalig geraadpleegd, niet in het script. |

## Scope: heel Vlaanderen en Brussel

Scope-filter: vestigingsplaatsen met `filter_instellingslocatie_hoofdstructuur=311` (gewoon
voltijds secundair onderwijs). **Sinds 0.12.0 gaat alles mee wat die filter teruggeeft.** Tot dan
werd er client-side op `instellingslocatie_provincie === 'Provincie Antwerpen'` gefilterd en ging
ruim driekwart meteen weg.

**Brussel hoort erbij en vraagt geen extra filter.** De bron is de API van de Vlaamse
onderwijsadministratie, dus er zit per definitie enkel onderwijs van de Vlaamse Gemeenschap in;
de Brusselse vestigingen zijn de Nederlandstalige scholen. Franstalige scholen komen er niet in
voor. Verdeling geverifieerd op 02/09/2026: Oost-Vlaanderen 569, Antwerpen 560, West-Vlaanderen
461, Limburg 277, Vlaams-Brabant 204, Brussel 80.

De API heeft géén provinciefilter (`filter_instellingslocatie_provincie` geeft HTTP 400); het
provincieveld staat wel op elke vestigingsplaats.

## Finaliteit is officieel beschikbaar, niet afgeleid

Codes: `DO` Doorstroomfinaliteit, `DU` Dubbele finaliteit, `A` Arbeidsmarktfinaliteit,
`E` NVT (eerste graad), `7E` n.v.t. (7e leerjaar). Dekking geverifieerd: 758/758 richtingcodes
in ons aanbod staan in de catalogus; 2909 van 3021 catalogusrecords hebben een finaliteit. De
12 richtingen in onze data zonder finaliteit zijn HBO5 (9), eerste graad (2) en OKAN (1),
terecht leeg.

⚠️ Een eerdere versie van de projectdocumentatie beweerde dat finaliteit in
`/ingerichteadministratievegroep` zit. **Dat klopt niet**: dat endpoint heeft 11 velden en geen
enkel inhoudelijk veld. Wie enkel daar kijkt, concludeert ten onrechte dat finaliteit niet
bestaat in de API.

## Wat er NIET in zit

- **Infodagen en infomomenten.** De volledige catalogus is nagekeken: geen enkel product bevat
  ze. onderwijskiezer.be heeft ze wel, maar valt juridisch af (zie onder).
- **Aanmelden.** Geen veld voor. Zie [aanmelden.md](./aanmelden.md).
- **Doorstroommatrix** (welke richting van de derde graad volgt op welke van de tweede).
  `/administratievegroep` levert finaliteit, graad, leerjaar, onderwijsvorm, studiegebied,
  studierichting, duaal, modulair, niche, stem-categorie en gemoderniseerd. Geen enkel veld
  verwijst naar een voorafgaande of volgende richting. Zie ROADMAP.md.
- **Loopbaan- en doorstroomcijfers.** Zie [scholenkompas.md](./scholenkompas.md).

## Bewust niet gebruikt

- **Inschrijvingsaantal SO** (`.../inschrijvingsaantal_so/v1/inschrijvingsaantal`) werkt op
  dezelfde key en geeft leerlingenaantallen per richting per school, inclusief man/vrouw.
  Bewust niet opgenomen, beslist door de gebruiker. Reden om het niet stilletjes toe te voegen:
  de cijfers lopen achter op het aanbod (aanbod schooljaar 2026, aantallen schooljaar 2024), en
  leerlingenaantallen nodigen uit tot een populariteitsranglijst die deze site niet wil zijn.
- **Directeursnaam** (`instelling_directeur`): persoonsgegeven, en voor een zoeksite overbodig
  naast telefoon en website. Beslist door de gebruiker.

## Juridisch uitgesloten

`onderwijskiezer.be` (CLB) heeft studieaanbod mét finaliteit, infomomenten én de doorstroom per
richting, maar de algemene voorwaarden verbieden kopiëren, reproduceren en herdistribueren van
hun materiaal. **Enkel naar linken mag.** Niet als databron gebruiken.

## Licentie van de data zelf

Het API-portaal publiceert **geen expliciete hergebruikslicentie** bij deze producten
(nagekeken 27/08/2026). De data in `public/data/` valt dus niet onder de AGPL van de code: die
blijft van Onderwijs en Vorming. Niet gokken dat het open data is; bij twijfel navragen bij het
portaal.
