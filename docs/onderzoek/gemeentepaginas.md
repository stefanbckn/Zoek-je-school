# Gemeentepagina's voor zoekmachines

Eén statische pagina per gemeente op `/gemeente/<slug>/`, build-time gegenereerd uit de
gecommitte dataset. Proef in 2.7.0 met Mechelen en Brugge, alle centrumsteden in 2.11.0, alle
172 gemeenten met een school in 2.12.0, en sinds 2.13.0 een `ref=gemeente-<naam>` op elke link
naar de zoeker. Verhuisd uit ROADMAP.md op 08/10/2026, nadat het thema af was. Wat er nog open
staat, staat in de roadmap bij de kleine open punten.


**Waarom.** Ouders zoeken niet op "middelbare school Vlaanderen" maar op hun eigen regio:
"middelbare scholen Mechelen". Tot 2.7.0 kon de site daar niet op scoren. Er waren drie URL's
(`/`, `/uitleg/` en `/uitleg/inschrijven/`), alle gemeentekeuze zat in de querystring, en de
canonical in `index.html` wees alles terug naar `/`.

Aanleiding was Bing Webmaster Tools op 20/09/2026: twee vertoningen, op "middelbare school" en
op "zoek en vind school". Op de brede term is niets te winnen (die is bezet door de scholen zelf
en door Onderwijs Vlaanderen); op een term met intentie erin staat de site wél vooraan, met de
`<meta name="description">` letterlijk als antwoordblok bovenaan.

**Wat er in 2.7.0 gebouwd is.** `scripts/genereer-gemeentepaginas.ts` schrijft build-time één
pagina per stad naar `gemeente/<slug>/index.html`, uit de gecommitte dataset. De uitvoer staat
niet in git (zie `.gitignore`); `prebuild` en `predev` draaien het script. De stedenlijst staat
in `scripts/steden.ts`, en `vite.config.ts` leidt daar zijn entry points uit af. Het script
stopte met een fout zodra een stad niet in `public/sitemap.xml` stond, want dat bestand stond toen
nog in git en zou anders stil achterlopen. Sinds 2.12.0 genereert het script de sitemap zelf uit
dezelfde lijst als de pagina's; het bestand staat nu in `.gitignore` en die controle is weg.

**Groeperen gebeurt op `niscode`, niet op de naam in `gemeente`.** Dat veld draagt de plaatsnaam
van de postcode: Brugge staat er als Assebroek, Brugge, Sint-Andries, Sint-Kruis, Sint-Michiels
en Zeebrugge. De eerste versie filterde op naam en zette Sint-Andries daardoor als *buurgemeente*
van Brugge op de pagina. Op niscode klopt het wel, en **daarmee is de Antwerpse districtenkwestie
ook opgelost**: 11002 bevat Antwerpen plus Berchem, Borgerhout, Borsbeek, Deurne, Ekeren,
Hoboken, Merksem en Wilrijk. De codes volgen ook de fusies van 01/01/2025. 27 van de 189
niscodes in de dataset dragen meer dan één plaatsnaam, dus dit raakt veel meer dan Antwerpen
alleen.

De zoeker filtert wél op plaatsnaam (`?gemeenten=`), dus een dieplink voor Brugge draagt alle
zes de namen. Het script leidt die lijst uit de data af.

**De centrumsteden.** De dertien Vlaamse centrumsteden, plus het Brussels gewest; de vijf
provinciehoofdsteden zitten daar al in (Antwerpen, Gent, Brugge, Hasselt, Leuven). Sinds 2.11.0
staan ze allemaal live. Geteld op 21/09/2026 (Gent en de negen laatste op 23/09/2026, via
`npm run genereer-gemeentepaginas`),
**op niscode en enkel adressen met studieaanbod**, dus zoals de pagina's ze tellen:

| Stad | Adressen | Scholen | Studierichtingen | Status |
| --- | --- | --- | --- | --- |
| Mechelen | 16 | 19 | 151 | Live sinds 2.7.0 |
| Gent | 57 | 53 | 229 | Live sinds 2.10.0 |
| Brugge | 29 | 31 | 204 | Live sinds 2.7.0 |
| Antwerpen | 106 | 77 | 254 | Live sinds 2.9.0 |
| Brussels gewest | 49 | 45 | 175 | Live sinds 2.9.0 |
| Aalst | 17 | 24 | 154 | Live sinds 2.11.0 |
| Genk | 12 | 12 | 146 | Live sinds 2.11.0 |
| Hasselt | 16 | 20 | 177 | Live sinds 2.11.0 |
| Kortrijk | 21 | 25 | 172 | Live sinds 2.11.0 |
| Leuven | 22 | 31 | 159 | Live sinds 2.11.0 |
| Oostende | 13 | 14 | 132 | Live sinds 2.11.0 |
| Roeselare | 14 | 19 | 165 | Live sinds 2.11.0 |
| Sint-Niklaas | 17 | 24 | 134 | Live sinds 2.11.0 |
| Turnhout | 13 | 20 | 142 | Live sinds 2.11.0 |

⚠️ Een eerdere telling in dit bestand ging uit van de plaatsnaam en telde ook adressen zonder
aanbod mee. Die cijfers (Brugge 21 adressen) waren dus te laag én verkeerd afgebakend. Tel
nieuwe steden met hetzelfde script, niet met de hand.

**Antwerpen en Brussel in 2.9.0 (beslist 22/09/2026 door de gebruiker).** Allebei te groot
voor één lijst op straatnaam, dus de adressen staan per groep met een inhoudsopgave erboven:
Antwerpen per district (de plaatsnaam in `gemeente` valt daar samen met het district), Brussel
per gemeente (op niscode, want Laken is een plaatsnaam van Brussel-stad). Elke groep heeft een
eigen dieplink naar de zoeker.

Brussel is één pagina voor het hele gewest, geen pagina per gemeente: die zouden te dun zijn.
Dat past toch in de niscode-aanpak, door `niscode` in `scripts/steden.ts` als prefix te lezen:
`'21'` dekt alle negentien gemeenten. Twee dingen die alleen daar gelden: de titel zegt
"Nederlandstalige", omdat de dataset enkel het onderwijs van de Vlaamse Gemeenschap bevat, en de
pagina noemt de gemeenten zonder school. Op 22/09/2026 waren dat Sint-Gillis,
Sint-Joost-ten-Node, Sint-Lambrechts-Woluwe en Watermaal-Bosvoorde. Die lijst leidt het script
af uit `groepen.alle`; komt er een gemeente bij met een andere schrijfwijze, dan stopt het met
een fout in plaats van een foute zin te schrijven.

**Wanneer doorschalen (herzien 23/09/2026 door de gebruiker).** De wachtperiode van drie
maanden hierboven is losgelaten: Mechelen en Brugge staan pas sinds 2.7.0 (21/09/2026) live, dus
lang voor die termijn om was, dook in Bing Webmaster Tools al een vertoning op voor een
zoekopdracht die specifiek genoeg was om te overtuigen. De resterende negen centrumsteden zijn
daarom meteen gebouwd en in 2.11.0 uitgebracht, zonder verdere wachttijd.

**Past binnen de harde regels.** Build-time gegenereerd uit de bestaande statische JSON, dus geen
backend en geen live call erbij. Geen hardgecodeerde schoolnaam of richting: het script kent er
geen enkele, het leest ze. Geen ranglijst: de adressen staan op alfabet van de straatnaam en de
pagina velt geen oordeel. De leerlingenkenmerken staan er bewust **niet** op: die per stad
optellen leest als een oordeel over een stad.

**2.8.0 gaf ze dezelfde kopbalk als de zoeker**, met een kruimelpad in plaats van een
terugweglink. Vanaf die pagina's openen `?matrix=1`, `?help=1` en `?over=1` de zoeker met dat
venster open.

### Geen link vanaf de zoeker naar deze pagina's (beslist 21/09/2026 door de gebruiker)

Deze pagina's blijven **ingangen, geen onderdeel van de app**. De zoeker krijgt er geen link
naartoe. Reden: een stadspagina stopt aan de gemeentegrens, en de site zegt zelf dat een
schoolkeuze dat niet doet. Voor wie al op de zoeker staat, is de stadspagina dus het mindere
gereedschap: minder precies dan een eigen adres met een straal, en zonder reistijd. Een link
daarheen stuurt mensen van het betere naar het mindere.

Het publiek verschilt: de stadspagina is er voor wie de site nog niet kent en "middelbare
scholen Mechelen" intikt. Haar taak is binnenhalen en doorsturen, en dat doen de twee links
bovenaan al.

**Wat we wél gaan doen, zodra er meer steden zijn (nog open, zie de kleine open punten in de
roadmap).** De buurgemeentenlijst wijst nu volledig
naar de zoeker. Bestaat een buurgemeente zelf als pagina, laat die regel er dan naartoe wijzen.
Zo ontstaat een net van ingangen dat zichzelf vindbaar maakt, zonder dat de zoeker rommeliger
wordt.

**De goedkope achterdeur als vindbaarheid tegenvalt:** een overzichtje op `/gemeente/` met één
link in de voet. De voet is geen gereedschap, dus daar kost een link niets aan focus. Pas doen
vanaf een stuk of vijf steden; met twee is zo'n pagina zelf thin content.

**Waaraan je zou merken dat deze beslissing fout is:** als Search Console toont dat mensen op een
stadspagina landen en weggaan zonder door te klikken naar de zoeker. Dan doet de pagina haar werk
als ingang niet, en gaat het gesprek over de tekst bovenaan die pagina, niet over integratie.

### Van centrumsteden naar alle gemeenten (besproken 23/09/2026, uitgebracht in 2.12.0)

**Volgorde.** Eerst de centrumsteden afwerken (2.11.0), daarna alle Vlaamse en Brusselse
gemeenten met minstens één school (2.12.0, 172 pagina's). Ook een kleine gemeente is een
zoekterm, en zonder eigen pagina wint de site daar niets. Gemeenten zonder school in de dataset
krijgen geen pagina: er is geen naam of coördinaat uit onze eigen data voor te halen.

**`steden.ts` dekte de lading niet meer.** Een handonderhouden `Stad[]`-entry per gemeente
schaalt niet naar de ~300 niscodes in de dataset, zoals dat nu wel gaat voor een stuk of dertien
centrumsteden. Gekozen is voor het tweede: `scripts/gemeenten-afgeleid.ts` leidt elke niscode
zonder eigen entry af uit `vestigingen.json`, en `steden.ts` houdt enkel de uitzonderingen
(`groepen`, een aangepaste titel zoals bij Brussel).

**Gemeenten met minder dan 5 scholen hebben een andere pagina-opbouw.** Vanaf 5 scholen blijft
het zoals nu: eerst de eigen scholen, dan "In de buurt". Onder de 5 wordt "Scholen in de buurt
van [gemeente]" de hoofdlijst, met de eigen school(en) er gewoon tussen en de titel mee
aangepast. Reden: een pagina met twee scholen is thin content; het bredere buurtaanbod is dan
het nuttigere antwoord op de zoekterm.

**Let op bij Brussel: naam- en slugbotsing.** Er bestaat al een `Stad`-entry "Brussel" (slug
`brussel`, niscode-prefix `'21'`, het hele gewest). Krijgt straks ook de commune Brussel-stad
zelf (niscode 21004) een eigen gemeentepagina, dan wil die dezelfde naam "Brussel" en dus
dezelfde slug dragen — de tweede `writeFileSync` naar `gemeente/brussel/index.html` overschrijft
dan stil de eerste, zonder foutmelding. Twee dingen die dat voorkomen: de bestaande
`groepen.namen`-afspraak (`{'21004': 'Brussel-stad'}`) ook als slug voor de eigen
commune-pagina hergebruiken, én een harde fout in het generatorscript zodra twee entries tot
dezelfde output-slug leiden. Die harde fout bestaat sinds 2.12.0: `controleerSlugs()` in
`scripts/genereer-gemeentepaginas.ts`.

**`/gemeente/` blijft een pure ingang, ook op deze schaal.** Zie "Geen link vanaf de zoeker naar
deze pagina's" hierboven: die beslissing verandert niet zodra het er honderden zijn. Een
overzichtspagina op `/gemeente/` mag bestaan als vindbaarheid tegenvalt, met een link in de
voet, maar zoekjeschool.be zelf blijft nergens naar een gemeentepagina linken — enkel andersom:
wie van een zoekmachine op zo'n pagina landt, vindt daar de weg naar de zoeker.
