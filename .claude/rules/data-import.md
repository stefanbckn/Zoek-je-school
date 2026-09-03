---
paths:
  - "scripts/**"
  - "public/data/**"
  - ".github/workflows/**"
---

# Data ophalen — API-conventies en valkuilen

Welke bronnen er bestaan en waarom, staat in
[docs/onderzoek/databronnen.md](../../docs/onderzoek/databronnen.md). Hier staat wat je moet
weten terwijl je het script schrijft.

## API-key

- Env var `ONDERWIJS_API_KEY`, gelezen via `process.loadEnvFile()` (Node 21+, geen `dotenv`).
  Het script laadt **`.env` én `.env.local`**, in die volgorde, en overleeft een ontbrekend
  bestand (in CI komt de key uit de omgeving). Lokaal staat de key in `.env.local`.
- **Bewust geen `VITE_`-prefix.** De key wordt alleen door het build-time Node-script gebruikt,
  nooit door client-code. Een `VITE_`-prefix zou Vite de key in de publieke JS-bundle bakken.
  Enkel de opgehaalde data komt in `public/data/*.json`, en die data is publiek.
- Key aanvragen: `https://onderwijs-api-portaal.vlaanderen.be/contact/aanvraag-apikey`.

## API-conventies (geverifieerd, hier ingelopen valkuilen)

- **Auth:** header `x-api-key: <key>`. Kan ook als `?apikey=`, maar niet doen: dan staat de key
  in serverlogs.
- **Paginatie is `page=`, niet `number=`.** `number=` wordt *stil genegeerd* en geeft dan
  eindeloos pagina 1 terug, zonder foutmelding. Hier is ooit in ingelopen: 16 "pagina's" bleken
  16 keer dezelfde data. `size=5000` werkt.
- Onbekende **`filter_*`-params geven wél netjes HTTP 400** met `Attribuut niet toegestaan`.
  Andere onbekende params worden stil genegeerd. Gebruik dus altijd het `filter_`-prefix, dan
  merk je een typefout meteen.
- Respons-envelop: `{ meta: { total_elements, total_pages, number, last, ... }, content: [...] }`.
  De `links`-array is altijd leeg. Niet op vertrouwen voor paginatie.
- **Een onbekende provinciewaarde is een harde fout** in `fetch-data.ts`, geen stille overslag.
  Dan is de bron veranderd, en er horen geen adressen ongemerkt te verdwijnen.
- **Coördinaten:** `gps_breedtegraad` / `gps_lengtegraad` staan rechtstreeks in de API, in
  WGS84. Geen Lambert72-conversie, geen `proj4`. 15 campussen hebben geen coördinaten en krijgen
  `lat/lon = null`.
- **`instelling_naam_volledig` bevat soms het instellingsnummer**, bijvoorbeeld "Hast Katholiek
  Onderwijs Hasselt 039107". Dat is geen fout: bij 25 van de 1182 SO-instellingen zit het nummer
  letterlijk in dat veld (geteld 02/09/2026), want zo houdt de bron gelijknamige scholen uit
  elkaar. **Niet wegpoetsen met een regex**, dan zijn die scholen op het scherm niet meer te
  onderscheiden.
- **Besturen worden in één gepagineerde call opgehaald** (`filter_instelling_type=300`, 928
  records) en lokaal gejoind, niet als 928 losse detailcalls.

## Twee endpoints joinen voor het aanbod

Het studieaanbod komt uit **twee** endpoints, te joinen op `administratievegroep_code`:

- `/ingerichteadministratievegroep`: welke school+vestiging richt welke richting in. Velden:
  `instelling_nummer`, `instellingslocatie_vestigingsnummer`, `administratievegroep_code`,
  `administratievegroep_omschrijving`, `schooljaar`, `inschrijvingen`, `financierbaar`,
  begin- en einddatum. **Meer niet.**
- `/administratievegroep`: de catalogus met de inhoudelijke velden, waaronder
  `administratievegroep_finaliteit`, `_graad`, `_leerjaar`, `_onderwijsvorm`, `_studiegebied`,
  `_studierichting`, `_duaal`, `_modulair`, `_niche`, `_stem_categorie`, `_gemoderniseerd`.

**Niet zelf finaliteit afleiden uit ASO/TSO/BSO/KSO.** De omschrijving draagt nog de oude
onderwijsvorm-labels, maar de mapping onderwijsvorm naar finaliteit is niet 1-op-1. Gebruik het
veld. `onderwijsvorm` bewaren we apart omdat ouders die termen nog kennen.

## GOK-leerlingenkenmerken uit xlsx

`scripts/leerlingenkenmerken.ts` haalt op, `scripts/xlsx.ts` leest uit, `fetch-data.ts` joint.

- ⚠️ **De bestandsnaam is niet voorspelbaar.** 2021-2022 en 2022-2023 heten `..._so_1.xlsx`,
  2023-2024 en 2024-2025 heten `..._so.xlsx`. Het script probeert daarom **beide varianten, vier
  schooljaren terug, nieuwste eerst** en neemt de eerste die bestaat. Het jaartal ophogen in één
  vast patroon gaat stuk. Niet "vereenvoudigen".
- **Het schooljaar komt uit de titelregel van het bestand zelf**, niet uit de URL die toevallig
  werkte. Idem de teldatum: die staat per rij als Excel-serieel getal in de kolom Teldatum.
- **Het zijn absolute aantallen, geen percentages**, met halven erin (733,5) doordat leerlingen
  in co-ouderschap half meetellen. Wij delen door `Aantal lln` en bewaren een fractie.
- **Teldatum is 1 februari van het jaar ervóór** (bestand 2024-2025 telt op 01/02/2024). Het is
  de financieringsteling, geen momentopname van het huidige schooljaar.
- **Kolomkoppen bevatten dubbele en harde spaties** (`Indicator         "opleiding moeder"`).
  Het script zoekt de kolommen genormaliseerd op inhoud, niet op vaste letters, en de kopregel
  wordt gezocht op de tekst "Provincie": die staat pas rond rij 11, na een titel en lege rijen.
  Kolomvolgorde geverifieerd tegen een gepubliceerd percentage, dus J=opleiding moeder,
  K=schooltoelage, L=thuistaal, M=buurt. **Niet op volgorde vertrouwen zonder die controle**: de
  koppen zijn de bron van waarheid.
- **Join op `schoolnummer`, nooit op adres.** Het adres in dit bestand is dat van de instelling
  en wijkt bij een deel van de scholen af van het campusadres dat wij tonen.
- **Faalt het ophalen, dan is dat geen harde fout**: de dataset komt er zonder kenmerken uit
  (luide waarschuwing) en het blok valt weg in de app. Faalt het *lezen* van een gevonden
  bestand, dan stopt het script wél: dan is er iets aan de publicatie veranderd.
- **`scripts/xlsx.ts` is bewust een eigen mini-lezer** (zip + sharedStrings + één werkblad, geen
  dependency). Wat er niet in zit: formules, datumopmaak, meerdere werkbladen, zip64. Heb je dat
  nodig, neem dan een echte bibliotheek. Niet dit uitbreiden.

## Wanneer draait dit script

**Niet bij elke build.** `public/data/*.json` staat bewust in git en is de primaire bron voor
`npm run build`. Verversen is een aparte, periodieke stap; zie de skill `release`.

Faalt het ophalen tóch, dan valt het script terug op de gecommitte dataset met een luide
waarschuwing. Ligt er géén dataset, dan faalt het hard.

**Omvangcontrole:** het script weigert weg te schrijven als het aantal vestigingen meer dan 15%
kleiner is dan in de gecommitte dataset, en eindigt met exitcode 1. Dat vangnet bestaat omdat
het script ook ongesuperviseerd draait via de GitHub Action. Groei is nooit verdacht, enkel
krimp. Is de krimp terecht, draai dan `npm run fetch-data -- --force`.
