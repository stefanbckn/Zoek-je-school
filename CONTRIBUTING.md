# Meehelpen aan Zoek je school

Fijn dat je hier bent. Zoek je school helpt ouders in Vlaanderen en Brussel een middelbare
school kiezen, en elke fout die iemand meldt, maakt die keuze een beetje juister.

## Een fout gezien op de site?

Daar heb je geen GitHub-account voor nodig. Stuur een mailtje naar
[info@zoekjeschool.be](mailto:info@zoekjeschool.be) met de naam van de school en wat er
volgens jou niet klopt.

Heb je wel een account, open dan een issue:

- [Een fout in de schoolgegevens](https://github.com/stefanbckn/Zoek-je-school/issues/new?template=datafout.yml),
  zoals een verkeerd adres, een richting die ontbreekt of een school die niet meer bestaat.
- [Iets anders dat niet werkt](https://github.com/stefanbckn/Zoek-je-school/issues/new),
  zoals een knop die niets doet of een pagina die raar toont op je telefoon.

## Waar de schoolgegevens vandaan komen

De gegevens komen van Onderwijs en Vorming en worden elk kwartaal opnieuw opgehaald. We passen
ze nooit met de hand aan. Klopt er iets niet, dan kijken we eerst waar het misloopt: in onze
code, of al in de brongegevens zelf. In het eerste geval lossen we het op. In het tweede geval
laten we je weten dat de fout bij de bron zit, en verschijnt de correctie bij de volgende
verversing nadat de bron is aangepast.

## Code bijdragen

Een pull request is welkom. Begin bij een groter idee wel eerst met een issue, zodat we samen
kunnen nagaan of het past voor je er tijd in steekt.

Ontwikkelen, bouwen en testen staat in de [README](./README.md). Voor je een pull request
opent, moeten deze slagen:

```bash
npm run build
npm run lint
npm test
```

Wijzig je kleuren in `src/index.css`, draai dan ook `node scripts/kleurcheck.mjs`.

## Wat er bewust niet in komt

Sommige keuzes liggen vast. Een pull request die er tegenin gaat, wordt niet gemerged, hoe
goed hij ook gemaakt is. Beter dat je het nu leest dan nadat je er een avond aan gewerkt hebt.

- Geen ranglijsten, scores of kwaliteitsoordelen over scholen. Cijfers over leerlingen zijn
  context, nooit een rapport.
- Geen accounts, geen cookies en geen persoonsgegevens.
- Geen backend en geen database. De scholendata wordt bij de build meegeleverd als statische
  JSON.
- Geen advertenties en geen betaalmuur.
- Geen schoolnamen of richtingen in de code. Alles komt uit de dataset.

De volledige achtergrond staat in [CLAUDE.md](./CLAUDE.md).

## Hoe we met elkaar omgaan

Voor iedereen die hier meedoet, geldt de [gedragscode](./CODE_OF_CONDUCT.md). Gedraagt iemand
zich niet zoals het hoort, meld het dan via [info@zoekjeschool.be](mailto:info@zoekjeschool.be).

## Licentie

Wie code bijdraagt, doet dat onder dezelfde licentie als de rest van het project, de
[AGPL-3.0](./LICENSE). De schoolgegevens in `public/data/` vallen daar niet onder: die blijven
van Onderwijs en Vorming.
