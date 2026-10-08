# Roadmap — Zoek je school

Wat er nog komt. Wat er al is, staat in [CHANGELOG.md](./CHANGELOG.md); de projectconventies in
[CLAUDE.md](./CLAUDE.md) en `.claude/rules/`, en het bronnenonderzoek per thema in
[docs/onderzoek/](./docs/onderzoek/).

**Wat hier hoort, en wat niet.** Dit bestand houdt de **volgorde** bij van wat er nog niet is,
en het onderzoek naar wat nog niet af is. Wat af is, wordt hier leeggehaald in plaats van te
blijven staan.

| Waar | Wat |
| --- | --- |
| Hier | De volgorde, plus het onderzoek naar wat nog niet af is |
| [docs/onderzoek/](./docs/onderzoek/) | Afgerond of doodgelopen bronnenonderzoek, per thema |
| `.claude/rules/` | Regels die vastliggen en niet omgekeerd mogen worden |
| [CHANGELOG.md](./CHANGELOG.md) | Wat een bezoeker gemerkt heeft |
| [GitHub Issues](https://github.com/stefanbckn/Zoek-je-school/issues) | Wat kapot is |

Zo staat elk stuk op één plaats. Bij de opruimronde van 03/09/2026 zijn de secties over 0.2.0,
0.2.1, 0.3.0, 0.11.0 en 0.12.0 op die manier verdeeld; ze stonden hier grotendeels dubbel, en de
sectie over 0.2.0 beschreef de netfilter nog met de achterhaalde waarde "Stedelijk". Later die
dag zijn ook het afgeronde onderzoek naar aanmelden, ScholenKompas, de GOK-routes en de
De Lijn-API naar `docs/onderzoek/` verhuisd. Op 07/09/2026 volgde het onderzoek naar de uitleg
voor ouders diezelfde weg, na 2.2.0 en 2.3.0:
[docs/onderzoek/uitleg-voor-ouders.md](./docs/onderzoek/uitleg-voor-ouders.md).

**Versienummers staan hier niet bij wat er nog moet komen — bewust.** Een nummer krijgt een
thema pas op het moment dat het af is en naar `main` gaat. Zo kan elk stuk los uitgebracht
worden zonder dat alles eronder verschuift, en klopt SemVer vanzelf: nieuwe functionaliteit is
een MINOR, ook als het maar één filter is. Deze tabel houdt dus de **volgorde** bij, niet de
nummering. De regels voor het nummeren zelf staan in de skill `release`
(`.claude/skills/release/SKILL.md`).

(Deze nummering verving eerder al de oorspronkelijke backlog-nummering uit de opzet; de oude
v0.2 "Reizen" is deels opgeleverd als 0.1.1. Dat vooraf nummeren is nu helemaal losgelaten.)

## Uitgebracht

Wat er per versie veranderd is, staat in [CHANGELOG.md](./CHANGELOG.md) — niet hier.

| Versie | Thema | Inhoud |
| --- | --- | --- |
| **0.1.0** | Basis | Vestigingen → campussen, afstand (hemelsbreed), filters (net/gemeente/naam), kaart, detailpaneel, URL-state, mobiel |
| **0.1.1** | Fiets | Fietsafstand/-tijd per school in detailpaneel (OpenRouteService via api.heigit.org) |
| **0.2.0** | API Onderwijs Vlaanderen | Schooldata via API · studieaanbod + finaliteit per vestiging · net-onderscheid via soort_bestuur. Infodagen geschrapt: geen bron |
| **0.2.1** | UI-verbeteringen | Actieve filters onder de zoekbalk + reset · kleurenpalet herzien (kleurenblindheid) · thema's/dark mode |
| **0.3.0** | Openbaar vervoer + pagineren | AGPL-3.0-licentie · reistijd met bus/trein via Transitous · contactgegevens in de footer · lijst pagineren |
| **0.4.0** | Dieplinks + opgeruimd detailpaneel | Link naar de rit in de Transitous-planner en naar de fietsroute op de ORS-kaart · adres en contactgegevens bovenaan het detailpaneel, reisinfo apart onder "Hoe geraak je er?" |
| **0.5.0** | Lege adressen wegfilteren | Adressen zonder studieaanbod standaard verborgen, met teller boven de lijst en een vinkje in de filterkolom om ze terug te tonen |
| **0.6.0** | Campussen vergelijken | 2–4 adressen naast elkaar in één tabel (afstand, scholen, aanbod per graad, contact), aan te vinken vanaf de resultatenkaarten en afdrukbaar naar papier of PDF |
| **0.7.0** | UI-details | "Hemelsbreed" heet "in vogelvlucht" op alle plaatsen · versienummer met changelog-link onderaan in de footer |
| **0.8.0** | Disclaimer + over deze site | Paneel "Over deze site" met herkomst, bewerkingen, privacy en disclaimer (deelbaar via `?over=1`), te openen vanuit de kop én de footer · korte disclaimerregel altijd zichtbaar in de footer |
| **0.10.0** | GOK-leerlingenkenmerken | Vier leerlingenkenmerken per school in het detailpaneel (opleiding moeder, schooltoeslag, thuistaal, buurt) én als rijen met balkje in de vergelijkingstabel, met schooljaar, teldatum en de kadering dat het indicatieve achtergrondcijfers zijn · automatisch opgehaald uit de AgODi-xlsx, join op 266 van de 272 scholen |
| **0.9.0** | Uitleg- en helppaneel | Paneel "Hoe werkt deze site?" in de kop met uitleg bij zoeken, filteren, één adres bekijken en vergelijken, plus een blok over wat de site niet toont (deelbaar via `?help=1`) |
| **0.11.0** | Markers clusteren | Nabije adressen op de kaart samengevoegd tot één bol met het aantal erin, die bij klikken en inzoomen uit elkaar valt · vanaf zoom 16 staan alle markers los |
| **0.12.0** | Heel Vlaanderen en Brussel | Alle 2145 vestigingen op 1075 adressen in één keer geladen in plaats van enkel provincie Antwerpen · filter op provincie · gemeentefilter met zoekveld, resultaataantallen en enkel gemeenten die nog resultaten hebben |
| **1.0.0** | De matrix | Alle 572 studierichtingen als raster van studiedomein × finaliteit per graad, in een paneel achter "Alle richtingen" (`?matrix=1`) · teller per richting binnen de gekozen gemeente of straal, ook wanneer die nul is · klikken filtert de lijst op die richting en graad · filter op studiedomein in de filterkolom |
| **2.2.0** | De eerste graad uitgelegd | 1A, 1B, 2A en 2B op `/uitleg/`, met per leerjaar de uren basisvorming, differentiatie en basisoptie en de bron erbij · steunknop ook onderaan die pagina |
| **2.3.0** | Aanmelden en inschrijven | Nieuwe pagina `/uitleg/inschrijven/` met de procedure voor het 1ste jaar, de twee tests van Onderwijskiezer, voorrang en ordening, en een link naar de officiële data · schakelaar tussen de twee uitlegpagina's · knop in de kop heet nu "Uitleg voor ouders" |
| **2.4.0** | Mobiel | Sticky resultatenbalk met de filterknop en de lijst/kaart-schakelaar erop · filters als eigen scherm met een teller op de sluitknop · kaart die het scherm vult · vergelijking als stapel per adres in plaats van een tabel · tip over deelgemeenten pas bij het typen · tikdoelen op 44 px · kaart past zich op de resultaten in (#42, #43, #36) |
| **2.5.0** | Toetsenbord en schermlezer | Suggesties onder de zoekbalk met de pijltjes te kiezen · vensters die de focus bijhouden · een melding wanneer een locatie niet gevonden wordt · mislukte reistijden proberen opnieuw |
| **2.6.0** | Jullie keuze | Beslisblad in het vergelijkingsvenster naast de gegevens: elf infodagvragen met een notitie per adres, een gewicht en een beste en tweede keuze per onderwerp, en daaruit de eigen volgorde van de ouders · niets bewaard, wel een waarschuwing voor het verloren gaat · afdrukbaar leeg of ingevuld |
| **2.7.0** | Gemeentepagina's (proef) | Eigen build-time pagina op `/gemeente/<slug>/` voor Mechelen en Brugge, op niscode gegroepeerd, met dieplinks naar de zoeker |
| **2.8.0** | Kopbalk overal | Gemeente- en uitlegpagina's dragen dezelfde kopbalk als de zoeker, met kruimelpad en themaknop |
| **2.9.0** | Antwerpen en Brussel | Pagina's voor Antwerpen (per district) en het Brussels gewest (per gemeente), met inhoudsopgave |
| **2.10.0** | Gent | Pagina voor Gent |
| **2.11.0** | Alle centrumsteden | Aalst, Genk, Hasselt, Kortrijk, Leuven, Oostende, Roeselare, Sint-Niklaas en Turnhout: alle dertien Vlaamse centrumsteden gedekt |
| **2.12.0** | Alle gemeenten met een school | 172 gemeentepagina's, de niet-centrumsteden afgeleid uit de dataset · andere opbouw onder 5 scholen · juiste namen voor zes fusiegemeenten · sitemap gegenereerd in plaats van gecommit |
| **2.13.0** | Herkomst via gemeentepagina | Links van een gemeentepagina naar de zoeker dragen `ref=gemeente-<naam>`, zichtbaar in Simple Analytics |

## Nog te doen

In volgorde. Het bovenste is het eerstvolgende; het nummer wordt bij de merge toegekend.

**Stand op 09/09/2026, van de gebruiker.** De site doet wat ze moet doen. Van wat hier nog staat
hoort er één ding echt bij, **aanmelden**, en is de rest nice to have: leuk als het lukt, geen
reden om er iets voor uit te stellen. Dat verandert de volgorde hieronder, niet de
inhoud: aanmelden stond bewust buiten de rij omdat er geen bron voor is, en staat nu bovenaan
mét die beperking erbij.

| # | Thema | Inhoud | Status / blocker |
| --- | --- | --- | --- |
| 1 | Aanmelden | Aanmeldsysteem per school tonen en linken | **Geen bron, wel te bouwen.** Er is geen register dat scholen aan een aanmeldsysteem koppelt: dit wordt een klein gecommit bestand per gemeente of regio dat `fetch-data.ts` erbij joint, en géén scraping van de deelnemerslijsten. Toon nooit een datum zonder jaartal erbij, want aanmeldperiodes zijn kort en jaargebonden. Zie [docs/onderzoek/aanmelden.md](./docs/onderzoek/aanmelden.md) |
| 2 | Wat volgt er na deze richting? | Bij het aanbod van de 2e graad tonen waar die richting op dit adres naartoe loopt in de 3e graad, en zichtbaar maken wanneer ze hier doodloopt | *Nice to have.* **Deels klaar om te bouwen, deels bron nodig.** Wat op dit adres zelf doorloopt is een feit uit onze eigen data en kan meteen. De officiële doorstroommatrix (welke richting waar logisch op volgt, ook buiten dit adres) staat niet in het API-portaal en is nog niet gevonden, zie hieronder |
| 3 | Dropouts + doorstroom hoger onderwijs | Vroegtijdige schoolverlaters en rechtstreekse doorstroom naar het hoger onderwijs, per school | *Nice to have.* **Bron gevonden, data afgesloten.** Staat per school in ScholenKompas, maar daar is download uitgezet (`allowDataAccess: false`); niet in Dataloep (enkel Vlaams + gemeente) en niet in het API-portaal. Volgende stap is de cijfers opvragen onder het recht op hergebruik, zie [docs/onderzoek/scholenkompas.md](./docs/onderzoek/scholenkompas.md) |
| 4 | Infodagen | Infomomenten en opendeurdagen per school | *Nice to have.* **Geen bron.** In 0.2.0 al geschrapt en sindsdien niets veranderd: de volledige catalogus van het onderwijsportaal is nagekeken en geen enkel product bevat ze. onderwijskiezer.be heeft ze wel maar valt juridisch af, en hun API (OKAPI) bevat ze niet (bevestigd door de beheerder, oktober 2026). **Volgende stap: maart/april 2027** opnieuw contact opnemen over de nieuwe Onderwijskiezer-API, die tegen september 2027 komt. Dan ook de CLB per school meevragen. Zie [docs/onderzoek/databronnen.md](./docs/onderzoek/databronnen.md). Tot dan valt er niets te bouwen |
| 5 | Praktisch | Fietsvriendelijkheid route, fietsenstalling, fietsbus, afstand tot halte, warme maaltijden, opvang | Afstand tot halte: **bron gevonden** (`/haltes/indebuurt/{lat,lng}` bij De Lijn, zie [docs/onderzoek/openbaar-vervoer.md](./docs/onderzoek/openbaar-vervoer.md)). Rest nog te onderzoeken |
| 6 | Kwaliteitsbewaking | Tests op de pure functies, schemavalidatie op de API-responses | **Klaar om te bouwen, geen bron nodig.** De CI-workflow zelf staat er sinds 2.13.1. Niet zichtbaar voor een bezoeker, dus los in te schuiven tussen twee features door, zie hieronder |

Uit de parkeerstand gehaald: **reistijd met de bus** stond geparkeerd en is in 0.3.0 uitgebracht
via Transitous. De Lijn zelf heeft nog steeds geen routeplanner-API — niet opnieuw gaan zoeken.

## Kleine open punten

Losse wensen, te klein voor een eigen regel in de tabel hierboven. Ze zijn hier bewaard omdat ze
anders begraven bleven in secties over versies die al uit zijn.

- **Filterkolom sticky met één scrollgebied (desktop).** Nu is het het slechtste van twee
  werelden: de `<aside>` scrollt weg bij lange resultatenlijsten, terwijl de gemeentelijst erin
  wél een eigen scrollbalk heeft (`max-h-48 overflow-auto`). Doe het als één scrollgebied: aside
  sticky met eigen overflow én die `max-h-48` weghalen. Enkel desktop. Stond open sinds 0.2.1;
  het pagineren van 0.3.0 maakte het minder nijpend maar loste het niet op.
- ~~**Filteren op studiegebied.**~~ Geschrapt op 03/09/2026. Het veld bestaat, maar is in de
  bron zelf zo goed als leeg (8 van de 1160 records). De bruikbare indeling is `domein`, niet
  `studiegebied`; zie [docs/onderzoek/matrix-studiedomein.md](./docs/onderzoek/matrix-studiedomein.md).
- **Vergelijkbalk compacter op mobiel.** Blijft open na 2.4.0: die versie pakte de tabel aan,
  niet de balk eronder. Met drie adressen is de balk 162 px hoog, met vier
  ruim 190 px: een vijfde tot een kwart van een telefoonscherm. Elke chip krijgt een eigen regel,
  want ze zijn 183 tot 191 px breed in een venster van 343 px. De balk is `sticky bottom-0` en
  dekt dus niets af, het is puur ruimtebeslag. Voorstel: op mobiel één regel met "3 adressen
  gekozen · Vergelijk · Wissen", en de chips pas uitklappen bij een tik op het aantal. Genoteerd
  bij [#35](https://github.com/stefanbckn/Zoek-je-school/issues/35), dat over het plakgedrag in
  Vivaldi op iOS gaat; als die balk toch onder handen genomen wordt, kan dit mee.
- **Buurgemeenten op een gemeentepagina naar hun eigen pagina laten wijzen.** Sinds 2.12.0 heeft
  elke gemeente met een school een pagina, maar de lijst "In de buurt" linkt nog altijd naar de
  zoeker (`buurgemeentenLijst()` in `scripts/gemeentepagina-html.ts`). Naar de eigen pagina
  linken maakt er een net van ingangen van, zonder dat de zoeker er iets van merkt. Zie
  [docs/onderzoek/gemeentepaginas.md](./docs/onderzoek/gemeentepaginas.md).
- **Overzicht op `/gemeente/` met één link in de voet**, enkel als de vindbaarheid tegenvalt. De
  zoeker zelf linkt nooit naar een gemeentepagina (beslist 21/09/2026, zie hetzelfde bestand).
- **Naamgenoten in de naamfilter.** Sinds 0.12.0 zoekt de naamfilter in heel Vlaanderen, dus
  dezelfde schoolnaam komt vaker meerdere keren terug. Als dat in de praktijk stoort, is de
  oplossing de gemeente in het resultaat prominenter maken, niet de filter aanpassen.

## Wat volgt er na deze richting? (nog niet onderzocht)

De vraag die een ouder bij de tweede graad eigenlijk stelt, is niet "wat kan mijn kind hier
kiezen" maar "waar loopt dat op uit". Een richting kiezen in het derde jaar is in de praktijk
al half kiezen wat het vijfde en zesde jaar worden. De site toont dat vandaag nergens: het
aanbod staat per graad gegroepeerd, zonder enig verband tussen die groepen.

Er zitten twee dingen in, met een heel verschillende zekerheid. Niet door elkaar halen.

**1. Wat loopt er door op dít adres? Feit, en nu al te bouwen.**

We hebben per adres alle richtingen met `graad`, `studiegebied` en `finaliteit` (zie
`Richting` in `src/types.ts`). Daarmee is te tonen welke richtingen van de tweede graad hier
een voortzetting hebben in de derde, en welke niet. Dat laatste is het waardevolste stuk: kiest
je kind hier iets waarvan de derde graad op dit adres niet bestaat, dan verandert het na twee
jaar van school. Dat is een harde, controleerbare uitspraak over onze eigen dataset, geen
inschatting over het onderwijssysteem.

Aandachtspunten:

- **Op adresniveau, net als de rest van het aanbod.** `campusAanbod()` in
  `src/lib/aanbod.ts` voegt de scholen op één adres al samen; een buurschool op dezelfde
  campus die de derde graad wél inricht, telt dus mee. Dat is hier terecht, maar het moet er
  wel bij staan wanneer het om een andere school gaat.
- **De koppeling zelf blijft een afleiding**, ook al zijn de velden een feit. Studiegebied plus
  finaliteit zeggen dat twee richtingen bij elkaar in de buurt liggen, niet dat de ene officieel
  op de andere volgt. Formuleer dus wat we écht weten ("in hetzelfde studiegebied biedt dit
  adres in de derde graad ..."), nooit "dit is de logische vervolgrichting".
- **Groepeer op `domein`, niet op studiegebied.** Studiegebied is in de bron zo goed als leeg;
  domein zit er wel op, behalve bij eerste graad, OKAN en HBO5. Die vallen buiten deze
  weergave, ze horen er niet in geforceerd te worden. Zie
  [docs/onderzoek/matrix-studiedomein.md](./docs/onderzoek/matrix-studiedomein.md).

**2. De officiële doorstroommatrix. Bron nog niet gevonden.**

Om te kunnen zeggen wat er ná een richting komt, ook buiten dit adres, is de officiële structuur
van de matrix secundair onderwijs nodig: welke richtingen van de derde graad op welke richting
van de tweede graad aansluiten. Wat we daarover weten:

- **Het API-portaal heeft er geen veld voor.** `/administratievegroep` levert per richting
  finaliteit, graad, leerjaar, onderwijsvorm, studiegebied, studierichting, duaal, modulair,
  niche, stem-categorie en gemoderniseerd (opsomming in
  [docs/onderzoek/databronnen.md](./docs/onderzoek/databronnen.md)). Geen enkel
  veld verwijst naar een voorafgaande of volgende richting. **Opnieuw nagekeken op een live
  respons op 03/09/2026** (bij het onderzoek naar studiedomein): nog steeds geen doorstroomveld.
- **Eén nieuw spoor, niet geverifieerd:** elk catalogusrecord draagt een
  `structuuronderdeel.structuuronderdeel_nummer`, en het API design document verwijst voor de
  details naar een aparte **Structuuronderdelen API**. Of die op ons portaal beschikbaar is en of
  ze toelatingsvoorwaarden of doorstroom bevat, is niet nagekeken. Dat is het eerste wat je moet
  proberen als je hier terugkomt.
- **onderwijskiezer.be heeft dit wél en valt af.** Daar staat per richting waar ze naartoe leidt,
  maar hun voorwaarden verbieden kopiëren en herdistribueren. Alleen naar linken mag. Zelfde
  verhaal als bij de infomomenten.
- **Nog uit te zoeken, in deze volgorde:** of de matrix als bestand op het documentenportaal van
  Onderwijs en Vorming staat (daar stond de GOK-xlsx ook, dus het is geen gek idee), en of de
  toelatingsvoorwaarden per administratieve groep ergens machineleesbaar zijn. Niets hiervan is
  geverifieerd. Ga niet bouwen op een gereconstrueerde matrix: fout doorverwijzen is hier erger
  dan niets tonen.

**Vorm, als stuk 1 er komt.** Een regel of blokje bij het aanbod in `DetailPanel`, niet een
apart paneel, en zeker geen pijlendiagram: het gaat om een handvol richtingen per adres. In de
vergelijkingstabel hoort het voorlopig niet thuis, daar staat het aanbod al per graad.

## Kwaliteitsbewaking: CI, tests en schemavalidatie (besproken 01/09/2026)

Eén thema, want de losse stukken hangen samen: zonder CI draait er niets automatisch, en zonder
tests bewaakt die CI niets dat de build niet al bewaakt. Stap 1 is uitgebracht in 2.13.1.

**De aanleiding.** Op 01/09/2026 draaide er niets automatisch. Sinds 04/09/2026 doet
`controles.yml` de kleurcheck bij een PR die aan `src/index.css` komt, en per kwartaal de
linkcheck. Wat nog altijd ontbreekt, is een controle bij élke push en PR: lint en build draaien
pas op Netlify, en enkel op `main`. Sinds 2.7.0 weegt dat zwaarder, want `npm run build`
genereert ook 172 gemeentepagina's en de sitemap. Een fout in dat script merk je nu pas bij de
deploy.

### Stap 1: een CI-workflow bij elke push en PR (uitgebracht in 2.13.1)

`.github/workflows/ci.yml` draait `npm ci`, `oxlint --deny-warnings` en `npm run build` op Node 22,
bij elke push op `main` en elke PR. Waarom elke keuze zo is, staat als commentaar in het bestand.
Twee dingen die anders liepen dan het plan van 01/09/2026:

- **De kleurcheck zit er niet in.** Die draait sinds 04/09/2026 al in `controles.yml`, bij elke PR
  die aan `src/index.css` komt. Een rechtstreekse push op `main` die aan de kleuren komt, valt
  daar wel buiten.
- **Nieuwere oxlint gaf vier waarschuwingen** (`react/set-state-in-effect` op drie bewuste
  plaatsen, een ongebruikte catch-parameter in `public/thema.js`). Die staan per regel uit, met
  de reden erbij, zodat de regel voor nieuwe code blijft gelden.

Alle workflows staan sindsdien op `actions/checkout@v7` en `actions/setup-node@v7`.

⚠️ **Nog te controleren in de Netlify-UI:** staan deploy previews aan? Zo ja, dan bouwt Netlify je
PR-branches al en is de buildstap in CI deels dubbel. Ze blijft dan nog steeds nuttig als snelle
faalmelding en omdat ze los staat van de `ignore`-regel in `netlify.toml`.

### Stap 2: tests, maar alleen op wat al eens misging

Er zijn vandaag nul tests: geen vitest, geen testbestand, geen `test`-script. Niet naar
dekkingsgraad streven, wel de handvol beslissingen vastpinnen die in `.claude/rules/` al een eigen
waarschuwing hebben. Vijf kandidaten, allemaal pure functies zonder DOM:

- **`NET_MIGRATIE`** in `useSearchState.ts`: een oude link met `?net=Officieel gesubsidieerd` moet
  Provinciaal plus Gemeentelijk opleveren. Breekt dat, dan geeft een gedeelde link een lege
  pagina, zonder foutmelding.
- **`volgendeSchooldagOchtend()`** in `ov.ts`: datumlogica rond weekend en zomertijd, plus de
  lokale-tijd-val waar `toISOString()` er 06:30 van maakt.
- **`transitousPlannerUrl()`** en **`orsKaartUrl()`**: encodering van namen met een schuine streep,
  en de omgekeerde `lon,lat`-volgorde.
- **`campusAanbod()`** in `aanbod.ts`: aanbod per adres samenvoegen zonder duplicaten.
- De groepeersleutel **`postcode|straat|huisnummer`** in `fetch-data.ts`, met busnummer genegeerd.
- Sinds 2.12.0: **`controleerSlugs()`** in `genereer-gemeentepaginas.ts` (twee entries met
  dezelfde slug moeten een fout geven, zie de Brusselkwestie) en de afleiding in
  **`gemeenten-afgeleid.ts`** (elke niscode met een school precies één keer).

Schatting: een uurtje met vitest, zo'n twintig assertions. Pas hierna bewaakt CI iets dat de
build niet al bewaakt.

### Stap 3: schemavalidatie op de API-responses (valibot)

Alleen in `scripts/fetch-data.ts`, want daar zit de enige echt onbetrouwbare grens. Hernoemt
Onderwijs en Vorming een veld, dan schrijft het script nu stil `null` weg; de omvangcontrole van
15% vangt alleen krimp, niet stille verarming. Een schema per endpoint maakt daar een luide fout
van.

**Niet client-side gebruiken.** `public/data/vestigingen.json` maakt je eigen script; die 4 MB
opnieuw valideren in de browser kost bundle en parsetijd voor nul winst. Valibot is boven zod de
juiste keuze vanwege tree-shaking, al speelt dat in een buildscript niet eens. Laatste versie op
npm: 1.4.2 (nagekeken 01/09/2026).

### Wat er bewust NIET in zit

- **Geen CI-badge in de README, zolang er geen tests zijn.** Een badge zou dan zeggen "de build
  slaagt", en dat weet je al: Netlify bouwt elke push op `main`. Bovendien is het publiek
  beperkt; de repo staat publiek omdat de AGPL en Transitous dat vragen, niet omdat er
  bijdragers langskomen. Na stap 2 is de badge wel iets waard.
- **CodeQL: mag, maar verwacht er weinig van.** Dit is een client-side app zonder database of
  authenticatie; het enige serverpad is de ORS-proxy. Via *default setup* (Settings → Code
  security) kost het bijna niets en is er geen workflowbestand te onderhouden. **Dependabot
  levert hier meer op**, want het risico zit in dependencies. ⚠️ Niet geverifieerd: default setup
  zet géén workflowbestand in de repo, en de badge-URL verwijst naar een workflowbestand. Wil je
  per se een CodeQL-badge, dan moet je waarschijnlijk de advanced variant nemen.

## Bewust geschrapt

Ideeën die uit de volgorde gehaald zijn, met de reden erbij. Ze staan hier zodat ze niet over een
half jaar opnieuw als goed idee binnenkomen en het uitzoekwerk overgedaan wordt.

**Doorlichting** (geschrapt 03/09/2026, beslist door de gebruiker). Was: een link naar het
doorlichtingsverslag met de datum erbij, per school. **De reden om het te laten: het staat al op
de officiële fiche waar we per school naar doorlinken.** Twee keer naar hetzelfde verslag linken
voegt niets toe, en het bespaart ons een bron die nooit geverifieerd is (of de verslagen per
`schoolnummer` op te halen zijn, was nog open).

Wat het waard is om te bewaren voor als er ooit iets in deze hoek terugkomt: **nooit als score
tonen.** Niet elke school heeft een verslag, en in een lijst met cijfers belanden die scholen
onderaan zonder dat er iets over hen gezegd is; afwezigheid van informatie leest dan als een
slecht rapport. Eén punt doet een school bovendien onrecht, en verslagen van verschillende jaren
naast elkaar vergelijken twee momenten in plaats van twee scholen. Dezelfde lijn als bij de
GOK-cijfers: context met uitleg, geen kwaliteitsoordeel.

**Lijst en kaart naast elkaar** (geschrapt 09/09/2026, beslist door de gebruiker na het te
hebben gebouwd en bekeken). Was: op een breed scherm drie kolommen, met de kaart vast naast de
lijst en één gedeelde hover-toestand, zodat een speld en zijn resultaatkaart samen oplichten.

**De reden om het te laten: het oplichten werkt niet waar het het meest nodig is.** De kaart
clustert nabije adressen tot één bol, en in een stad zit het merendeel van de resultaten in zo'n
bol. Wijs je dan een kaartje in de lijst aan, dan is er geen speld om te laten oplichten en
gebeurt er zichtbaar niets. Net in de gevallen met veel scholen dicht bij elkaar, precies waar
"waar ligt dit ten opzichte van dat?" een echte vraag is, geeft de koppeling dus geen antwoord.
Zonder die koppeling blijft er een kaart over die de lijst van 1170 naar 660 px knijpt in ruil
voor niets dat de bezoeker nog niet kon.

Wat het waard is om te bewaren: **een oplossing hiervoor moet bij het cluster beginnen, niet bij
de speld.** Denkbaar is een bol die zelf oplicht en zegt dat het aangewezen adres erin zit, of
inzoomen bij het aanwijzen. Dat eerste botst op de regel dat een cluster nooit iets over één
school mag zeggen; het tweede laat de kaart bewegen bij elke muisbeweging over de lijst. Beide
zijn dus een eigen ontwerpvraag en geen detail bij deze indeling. De bouw zelf was klein (twee
commits, branch `v2.5.0-kolommen`, verwijderd): het probleem zit in het idee, niet in het werk.

**Kostprijs** (geschrapt 03/09/2026, beslist door de gebruiker). Was: maximumfactuur en
materiaalkost bij de start (boeken, laptop, kaften). **De reden om het te laten: er is geen
centrale bron en het is te schoolafhankelijk.** Het zou neerkomen op de informatie per school
opzoeken en met de hand bijhouden, voor een cijfer dat per richting en per leerjaar verschilt en
elk jaar verandert. Dat is precies het soort onderhoud dat een statische site zonder backend niet
kan dragen.

⚠️ **Gevolg in de code:** `SchoolOpCampus.kostprijs` in `src/types.ts` is een placeholder die op
`null` staat en die nu geen bestemming meer heeft. Het veld wordt door `fetch-data.ts`
weggeschreven en staat dus ook in `public/data/vestigingen.json`. Weghalen kan, maar vraagt een
verse dataset; het is geen opruiming die tussendoor moet.
