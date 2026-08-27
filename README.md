# Zoek je school

[![Netlify Status](https://api.netlify.com/api/v1/badges/a71213ec-47f4-42c4-bbd5-a252e68f2d2e/deploy-status)](https://app.netlify.com/projects/zoekjeschool/deploys)

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in provincie Antwerpen.
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

## Controles

```bash
npm run lint                  # oxlint
npx tsc --noEmit -p tsconfig.app.json
node scripts/kleurcheck.mjs   # contrast + kleurenblindheid van het palet
```

`kleurcheck.mjs` rekent het contrast uit en simuleert protanopie, deuteranopie en tritanopie.
Draai het als je kleuren in `src/index.css` wijzigt — "dit lijkt me wel te onderscheiden" is
geen verificatie gebleken.

## Sanity check

Zoek op **Boechout**: Sint-Gabriëlcollege en Regina Pacisinstituut (Hove) horen bij de eerste
resultaten te staan.
