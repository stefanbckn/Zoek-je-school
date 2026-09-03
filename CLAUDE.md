# Zoek je school — projectconventies

Zoeker voor middelbare scholen (voltijds gewoon secundair onderwijs) in Vlaanderen en Brussel,
voor ouders die een school kiezen. Volledig client-side (Vite + React + TypeScript + Tailwind
v4), gehost op Netlify, zonder backend en zonder database.

## Harde productregels

Deze liggen vast. Keer ze niet om zonder de gebruiker.

- **Geen accounts, geen login, geen tracking, geen analytics, geen cookies.** De site bewaart
  niets over wie er langskomt. Enige uitzondering: de themakeuze in `localStorage`.
- **Geen backend.** De scholendata wordt build-time opgehaald en als statische JSON
  meegecommit. De enige live calls uit de browser zijn geolocatie, de reistijd met openbaar
  vervoer, en onze eigen Netlify Function voor de fietsroute.
- **Geen ranglijsten, geen scores, geen kwaliteitsoordeel over scholen.** Cijfers over
  leerlingen zijn context met uitleg, nooit een rapport.
- **Geen advertenties en geen betaalmuur.** Een donatieknop kan; commercieel worden kost ons de
  toegang tot Transitous.
- De code staat onder **AGPL-3.0**. Twee dingen in de footer zijn daarom geen opsmuk maar een
  verplichting: de **broncodelink** (AGPL artikel 13) en de **contactregel `info@bckn.be`**
  (voorwaarde van Transitous). Ook de attributie van openrouteservice en Transitous moet
  zichtbaar blijven.
- De data in `public/data/` valt **niet** onder de AGPL: die blijft van Onderwijs en Vorming.
- **Geen enkele hardgecodeerde schoolnaam of richting in de code.** Alles komt uit de dataset.
- **Ouders bereiken ons via de mailto-link in de footer**, niet via een formulier: dat vraagt een
  backend en een verwerking van persoonsgegevens.

## Regel: nooit gokken

Verzin nooit een API-endpoint, veldnaam of URL. Alles wat in dit project genoteerd staat, is
geverifieerd door de respons effectief op te halen. Werkt iets niet meer of blijkt een veld niet
te bestaan: **zeg dat expliciet en stel een alternatief voor.** Verzin geen vervanging.

## Commando's

```
npm run dev          # dev-server, poort via process.env.PORT, standaard 5173
npm run build        # tsc -b && vite build — moet slagen na elke afgeronde stap
npm run lint         # oxlint
npm run fetch-data   # data verversen; vraagt een API-key, hoort NIET bij elke build
node scripts/kleurcheck.mjs   # contrast + kleurenblindheid; draai dit na elke kleurwijziging
```

Netlify bouwt elke push op `main` en deployt vanaf daar. Feature branches gaan via een PR.

## Valkuilen van deze machine

- **Systeem-`node` is een oude v12** (`/usr/local/bin/node`). Zet de Homebrew-node (v25) op
  PATH via `/usr/local/opt/node/bin`, anders faalt Vite/tsx.
- **Start de dev-server zelf** met `npm run dev` in een aparte shell; koppel de preview daarna
  vast aan `http://localhost:5173`.
- **`.claude/launch.json` is bewust attach-only** (enkel een `url`, geen `runtimeExecutable`).
  Laat je de preview-tool de server spawnen, dan botst dat op een sandbox-`EPERM`. Dit is al
  twee keer opnieuw uitgevonden (25/08/2026 en 27/08/2026). Zet er geen
  `runtimeExecutable`/`runtimeArgs` in.

## Versies, branches en releases

- **Nooit pushen zonder expliciet akkoord op dat moment.** Committen mag vrij; één akkoord geldt
  niet voor volgende pushes.
- **Vraag eerst of het MAJOR, MINOR of PATCH wordt, vóór je een branch aanmaakt.** Ook bij een
  kleine vraag die niet in de roadmap staat. Niet zelf inschatten, de gebruiker beslist.
- Kleine stappen, één commit per afgeronde stap, en `npm run build` moet per stap slagen.
- Het versienummer op de site komt uit `package.json` via `__APP_VERSION__` en staat in de
  footer, met een link naar de changelog.

De volledige werkwijze (changelog, tags, dataverversing, PR-afspraken) staat in de skill
**`release`**. Roep die aan zodra er een versie, een branch, een tag of een dataverversing in
het spel is.

## Waar hoort wat

Eén onderwerp staat op één plaats. Zet je iets bij, kies de plaats bewust.

| Waar | Wat |
| --- | --- |
| Dit bestand | Wat altijd geldt, in elke sessie |
| `.claude/rules/*.md` | Conventies per gebied; laden vanzelf bij het juiste bestand |
| `docs/onderzoek/*.md` | Bronnenonderzoek per thema; laadt nooit vanzelf, open wat je nodig hebt |
| [ROADMAP.md](./ROADMAP.md) | Wat er nog komt, in volgorde, en wat bewust geschrapt is |
| [CHANGELOG.md](./CHANGELOG.md) | Wat een bezoeker per versie gemerkt heeft |
| [GitHub Issues](https://github.com/stefanbckn/Zoek-je-school/issues) | Wat kapot is |

**Lees ROADMAP.md vóór je begint** wanneer er een versienummer of een `v0.x.y`-branch valt, er
gevraagd wordt wat er nu aan de beurt is, of er een functionaliteit besproken wordt die nog niet
bestaat. Bij bugfixes, refactors en tekstwijzigingen hoeft het niet.
