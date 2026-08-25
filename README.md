# Zoek je school

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in provincie Antwerpen.
Zie [CLAUDE.md](./CLAUDE.md) voor de bronbeschrijving en projectconventies.

## Ontwikkelen

```bash
npm install
npm run fetch-data
npm run dev
```

## Bouwen voor deploy

```bash
npm run fetch-data && npm run build
```

`npm run fetch-data` haalt de scholendata op en schrijft ze naar `public/data/` (niet in git,
wordt bij elke build opnieuw gegenereerd).
