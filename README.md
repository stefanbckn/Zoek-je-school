# Zoek je school

[![Netlify Status](https://api.netlify.com/api/v1/badges/a71213ec-47f4-42c4-bbd5-a252e68f2d2e/deploy-status)](https://app.netlify.com/projects/zoekjeschool/deploys)

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in Vlaanderen en Brussel.
Live op [zoekjeschool.netlify.app](https://zoekjeschool.netlify.app/).

Zie [CLAUDE.md](./CLAUDE.md) voor de bronbeschrijving, de datamodel-keuzes en de
projectconventies.

## Ontwikkelen

```bash
npm install
npm run dev
```

`npm run dev` heeft geen API-key nodig: de scholendata staat in `public/data/` en zit in git.
Wil je de fietsafstand in het detailpaneel lokaal zien werken, zet dan `ORS_API_KEY` in
`.env.local` — zie [`.env.example`](./.env.example).

## Bouwen

```bash
npm run build
```

De build gebruikt de gecommitte data en doet dus géén API-calls. Dat is bewust: het
schoolaanbod verandert praktisch één keer per schooljaar, dus bij elke deploy de API bevragen
is verspilling en maakt de build afhankelijk van een externe dienst.

## Data verversen

Twee manieren, allebei dezelfde code:

```bash
npm run fetch-data
```

Lokaal, met `ONDERWIJS_API_KEY` in `.env.local`. Commit daarna `public/data/*.json` mee.

Automatisch draait de GitHub Action
[`ververs-scholendata.yml`](./.github/workflows/ververs-scholendata.yml) elk kwartaal (en
handmatig via "Run workflow"). Die commit niet naar `main` maar opent een pull request, zodat
er niets live gaat dat niemand gezien heeft.

Het script weigert weg te schrijven als de dataset meer dan 15% krimpt — een vangnet tegen een
gewijzigde API of een halve storing. Is de krimp terecht, draai dan
`npm run fetch-data -- --force`.

## Openbaar vervoer

De reistijd met bus of trein in het detailpaneel komt van
[Transitous](https://transitous.org/), rechtstreeks vanuit de browser. Geen key nodig, maar wel
voorwaarden: het project moet open source en niet-commercieel zijn, de contactgegevens en de
bronvermelding in de footer moeten blijven staan, en zware endpoints (zoals routing) gebruik je
pas na een seintje via hun Matrix-kanaal `#transitous:matrix.spline.de`. Zie
[CLAUDE.md](./CLAUDE.md) voor de volledige lijst en wat er geverifieerd is.

## Controles

```bash
npm run lint                  # oxlint
npx tsc --noEmit -p tsconfig.app.json
node scripts/kleurcheck.mjs   # contrast + kleurenblindheid van het palet
```

`kleurcheck.mjs` rekent het contrast uit en simuleert protanopie, deuteranopie en tritanopie.
Draai het als je kleuren in `src/index.css` wijzigt — "dit lijkt me wel te onderscheiden" is
geen verificatie gebleken.

## Releases

Wat er per versie veranderde, staat in **[CHANGELOG.md](./CHANGELOG.md)** — geschreven vanuit wat
een bezoeker merkt. Elke uitgebrachte versie draagt op `main` de tag `v<versie>`; welke de
laatste is, staat bovenaan de changelog. Hier stond dat nummer eerst voluit, maar het bleef bij
`v0.6.0` hangen terwijl er al drie versies verder waren, dus het staat nog op één plaats.
De afspraken over nummering en releases staan in [CLAUDE.md](./CLAUDE.md).

## Bekende bugs

Eén regel per open bug. De diagnose, wat al uitgezocht is en wat nog geverifieerd moet worden
staat in **[BUGS.md](./BUGS.md)** — houd die twee gelijk als je er een toevoegt of oplost.

- **De kaart is hoger dan het scherm en het muiswiel zoomt in plaats van te scrollen** (gemeld 02/09/2026).

## Sanity check

Zoek op **Boechout**: Sint-Gabriëlcollege en Regina Pacisinstituut (Hove) horen bij de eerste
resultaten te staan.

## Licentie

De **code** staat onder de **GNU Affero General Public License v3.0 of later** — de volledige
tekst staat in [LICENSE](./LICENSE). © 2026 Stefan Bocken.

Waarom AGPL en niet MIT: dit is een website, geen bibliotheek. Bij een gewone GPL kan iemand de
code draaien op zijn eigen domein zonder ooit iets terug te geven, want hij *distribueert* niets.
De AGPL sluit dat gat: wie de app voor anderen host, moet de broncode aanbieden. Artikel 13
vraagt dat een webapp een zichtbare weg naar z'n bron biedt — vandaar de repo-link in de footer.
Haal die dus niet weg.

**De data valt hier niet onder.** `public/data/*.json` is opgehaald bij het API-portaal van
Onderwijs en Vorming en blijft van hen; wij vermelden de bron in de footer. Het portaal
publiceert geen expliciete hergebruikslicentie bij deze producten (nagekeken op 27/08/2026) —
wie de dataset voor iets anders dan deze site wil gebruiken, vraagt dat het best na bij het
portaal. Kaartlaag en routes dragen hun eigen voorwaarden: OpenStreetMap voor de tegels,
CC-BY-SA 4.0 voor de routeresultaten van openrouteservice/HeiGIT.
