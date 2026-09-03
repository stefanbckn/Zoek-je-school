---
name: release
description: De release-, git- en dataverversingswerkwijze van Zoek je school. Gebruik dit bij het uitbrengen van een versie, het aanmaken van een branch, het bumpen van het versienummer, het bijwerken van de changelog, het zetten van een tag, het opzetten van een PR, het draaien van npm run fetch-data, de jaarlijkse of periodieke refresh van de scholendataset, de GitHub Action ververs-scholendata, of wanneer er gevraagd wordt hoe iets live gaat.
---

# Release en git-werkwijze — Zoek je school

Twee regels staan bewust ook in CLAUDE.md zelf, omdat ze moeten gelden ook als deze skill niet
geladen is: **nooit pushen zonder akkoord op dat moment**, en **vraag eerst of het MAJOR, MINOR
of PATCH wordt vóór je een branch aanmaakt.**

De valkuilen van `fetch-data.ts` zelf (API-paginatie, de xlsx-bestandsnaam, de joins) staan niet
hier maar in `.claude/rules/data-import.md`; die laadt vanzelf zodra je aan `scripts/` werkt.

## Workflow

- Kleine stappen, één git commit per afgeronde stap.
- Voor elke stap: `npm run build` moet slagen. `npm run fetch-data` vereist een API-key en
  hoort **niet** bij elke build — zie hieronder.
- **Data verversen is een aparte, periodieke stap.** `npm run fetch-data` draait niet meer mee in
  de Netlify-build: het schoolaanbod verandert praktisch één keer per schooljaar, dus elke deploy
  de API bevragen is verspilling en maakt builds afhankelijk van een externe dienst.

  Twee manieren, allebei dezelfde code:

  | Manier | Commando | Wanneer |
  | --- | --- | --- |
  | Lokaal | `npm run fetch-data` (key uit `.env.local`), dan `public/data/*.json` mee committen | Tussendoor, of om te testen |
  | Automatisch | GitHub Action `.github/workflows/ververs-scholendata.yml` | Per kwartaal, of handmatig via "Run workflow" |

  De Action commit **niet** rechtstreeks naar `main` maar opent een PR op branch
  `data/ververs-<datum>`. Netlify deployt enkel vanaf `main`, dus er gaat niets live zonder dat
  er iemand naar gekeken heeft. De PR-beschrijving bevat de tellingen uit het script — dat is de
  zinvolle review, want de diff zelf is tienduizenden regels.

  Vereist de repo-secret `ONDERWIJS_API_KEY` (Settings → Secrets and variables → Actions).

- **Omvangcontrole.** `fetch-data.ts` weigert weg te schrijven als het aantal vestigingen meer dan
  15% kleiner is dan in de gecommitte dataset, en eindigt met exitcode 1. Dat vangnet bestaat
  omdat het script ook ongesuperviseerd draait: een gewijzigde filterparam of een halve storing
  mag niet stilzwijgend over goede data heen gecommit worden. Groei is nooit verdacht, enkel
  krimp. Is de krimp terecht (scholen sluiten), draai dan `npm run fetch-data -- --force`.
  Geverifieerd dat de controle afgaat én dat `--force` hem overslaat.
- **Let op bij shell-stappen in de Action:** de default shell in GitHub Actions is `bash -e`
  *zonder* `pipefail`. In een stap met een pipe (`... | tee`) telt dan de exitcode van het
  láátste commando, waardoor een gefaalde fetch als geslaagd doorgaat. De workflow zet daarom
  expliciet `defaults.run.shell: bash` (= `bash -eo pipefail`). Geverifieerd in de GitHub-docs.
- Geen enkele hardgecodeerde schoolnaam of richting in de code — alles komt uit de gegenereerde data.

### Versienummering (SemVer)

Het project gebruikt **MAJOR.MINOR.PATCH**.

**Een nummer wordt toegekend bij de release, niet bij de planning.** [ROADMAP.md](./ROADMAP.md)
houdt de volgorde bij zonder cijfers; wat af is en naar `main` gaat, krijgt op dat moment het
volgende nummer. Zo kan één afgewerkte feature los uitkomen zonder dat de rest van de planning
moet verschuiven. Vooraf nummeren heeft hier al twee keer tot hernummeren geleid — niet opnieuw
doen. Het versienummer valt dus pas wanneer je de branch aanmaakt (die draagt het in de naam),
en dan nog steeds na de vraag aan de gebruiker of het MAJOR, MINOR of PATCH wordt.

**Eén feature = één MINOR.** Een thema dat uit meerdere losse stukken bestaat, wordt niet in één
grote branch verzameld: elk stuk gaat apart naar `main`, met eigen changelog-kop en eigen tag.
Een lang openstaande branch houdt werk onnodig van de site af — de merge is wat live gaat. Dat
betekent ook dat je nieuwe functionaliteit **nooit als PATCH** uitbrengt om "nog even bij het
oude thema te blijven": een filter erbij is een MINOR, hoe klein ook.

Drie plaatsen moeten samen kloppen:

- **`package.json`** draagt de huidige versie. Staat sinds de merge van 0.4.0 op `0.4.0`. Zet
  het nummer in de versie-branch zelf, niet achteraf op `main` — dan komt de bump mee in de PR
  die de functionaliteit brengt.
- **Een git tag per release**, `v<versie>` (bv. `v0.3.0`), gezet op `main` *nadat* de PR gemerged
  is. Nooit taggen op een branch die nog niet gemerged is — die commit ligt na de merge niet meer
  in de geschiedenis van `main`, dus de tag wijst dan naar een losse commit.
- **De branchnaam** draagt het versienummer: `v0.5.0-lege-vestigingen-filteren` voor een
  roadmapthema. Losse bugfixronden buiten een versie blijven `fix/<kort-onderwerp>`; die krijgen
  hun nummer pas wanneer ze in een release meegaan.

**Release notes horen in [CHANGELOG.md](./CHANGELOG.md)**, niet in de roadmaptabel en niet enkel
op GitHub. Werkwijze:

1. Tijdens het werk vult de versie-branch de kop **Niet uitgebracht** aan, in dezelfde PR als de
   wijziging zelf. Zo is de tekst reviewbaar vóór de merge, in plaats van achteraf uit commits
   gereconstrueerd te worden.
2. **Nog in dezelfde branch, vóór de merge:** die kop wordt het versienummer met datum, en
   `package.json` gaat mee omhoog. Allebei in de PR, niet achteraf op `main`. Anders draagt de
   Netlify-deploy die uit de merge volgt nog het vorige nummer, en bevat de commit waar de tag
   op komt te staan een changelog met "Niet uitgebracht" erin. Dat is bij 0.4.0 misgegaan: de
   correctie belandde ná de tag.
3. Ná de merge: de tag zetten, en dezelfde tekst als GitHub Release bij die tag plakken. Het
   bestand is de bron, de Release is de kopie.

Schrijf de notes vanuit wat een bezoeker merkt ("je ziet nu de reistijd met bus of trein"), niet
als opsomming van commits — die staat al in git. Wat er niet werkt of niet meegenomen is, hoort er
ook in: een changelog die enkel goed nieuws bevat, wordt niet gelezen.

Wat welk cijfer verhoogt: MINOR bij elke nieuwe functionaliteit die een bezoeker merkt, ook al
is het maar één filter; PATCH bij bugfixes en tekstcorrecties zonder gedragswijziging. MAJOR blijft 0 zolang de site niet publiek
aangekondigd is.

**Wat wanneer live gaat.** De volledige gang: branch → PR → merge in `main` → Netlify deployt
automatisch → tag zetten → GitHub Release aanmaken. Twee dingen die daarbij verwarren:

- **Een tag of een release deployt niets.** Netlify luistert enkel naar pushes op `main`, en de
  enige workflow in `.github/workflows/` is de kwartaalverversing van de scholendata. De site
  staat dus al live vóór de tag bestaat; taggen en releasen zijn boekhouding. Rustig een dag
  later doen mag.
- **Een push met enkel `.md`-wijzigingen bouwt niet.** De `ignore`-regel in `netlify.toml`
  annuleert de build als er buiten de documentatie niets veranderde. Terecht — er valt dan niets
  te deployen. Komt een échte wijziging ooit niet live, kijk daar dan eerst.

### Samenwerking / git

- **Nooit pushen zonder expliciet akkoord op dat moment.** Committen mag vrij; de gebruiker pusht
  zelf of geeft er per keer toestemming voor. Eén akkoord geldt niet voor volgende pushes.
- **Open bugs staan als GitHub Issues**, niet in een bestand in de repo. Tot 03/09/2026 was dat
  `BUGS.md`, omdat `gh` toen niet ingelogd was; dat is het intussen wel (account `stefanbckn`,
  scope `repo`), en daarmee verviel de enige reden voor dat bestand. De lijst opvragen doe je met
  `gh issue list`. Maak `BUGS.md` niet opnieuw aan: dan staat dezelfde bug op twee plaatsen en
  loopt er één achter.
- **Een bug melden is `gh issue create`**, met dezelfde inhoud als vroeger: wat er gebeurt, op
  welk toestel/browser, wat de oorzaak lijkt, en wat er nog geverifieerd moet worden. Vermeld ook
  wat al gemeten of nagekeken is, zodat niemand dat werk overdoet. Label `bug`.
- **De README somt de bugs niet meer op** maar linkt naar de issue-lijst. Dat was bewust: elke
  opsomming die je met de hand gelijk moet houden, loopt uit elkaar.
- **Een bug oplossen gaat op een `fix/`-branch**: naamgeving `fix/<kort-onderwerp>`, bijvoorbeeld
  `fix/ios-zoom-invoervelden`, afgetakt van een **verse** `main` (`git fetch` eerst — dat is hier
  al een keer misgegaan). **Zet `Fixes #<nummer>` in de PR-beschrijving**, dan sluit GitHub het
  issue bij de merge zelf. Sluit het niet handmatig vooraf: dan lijkt de bug opgelost terwijl de
  fix nog op een branch staat.
- **Vraag eerst of het een MAJOR, MINOR of PATCH wordt, vóór je een branch aanmaakt.** Ook bij
  een kleine vraag die niet in de roadmap staat: het versienummer bepaalt de branchnaam, en
  achteraf hernoemen is rommelig. Niet zelf inschatten — de gebruiker beslist dat.
- **Begin elke nieuwe versie op een eigen branch, meteen bij de eerste commit.** Niet op `main`
  werken en achteraf verplaatsen. Naamgeving: `v0.4.0-gok-indicatoren` — het volledige
  versienummer plus een kort thema. Alleen losse fixes buiten een versie mogen rechtstreeks
  op `main`.
- De gebruiker werkt met feature branches + pull requests op GitHub
  (`git@github.com:stefanbckn/Zoek-je-school.git`, SSH — de HTTPS-remote heeft geen credentials).
  Netlify deployt enkel vanaf `main`, dus werk op een branch gaat niet live tot de PR gemerged is.
- `gh` CLI staat geïnstalleerd maar is **niet ingelogd** (vereist interactieve browser-login).
  PR's aanmaken doet de gebruiker zelf, of via een voorgevulde compare-link.

