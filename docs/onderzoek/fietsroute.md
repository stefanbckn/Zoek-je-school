# Fietsroute — openrouteservice / HeiGIT

De fietsafstand en -tijd in het detailpaneel komen van **openrouteservice**, via onze eigen
Netlify Function. De praktische regels staan in `.claude/rules/reistijd.md`; dit is het
onderzoek en de voorwaarden.

## De key mag niet client-side

De officiële ORS-documentatie
(`giscience.github.io/openrouteservice/frequently-asked-questions.html`) is expliciet:
*"every HeiGIT API key belongs to one person"* en *"an API key must not be used client-side in
an application: Inspecting the requests sent by the application would 'leak' the API key"*.
Hun aanbevolen oplossing is server-side proxyen.

**Domeinrestrictie bestaat niet** bij HeiGIT. Nagekeken in het dashboard en in de docs. Dat is
dus géén beschikbare mitigatie; eerder in dit project is ze ten onrechte als oplossing
voorgesteld.

**Opgelost.** In v0.1 stond de key nog met een `VITE_`-prefix in de publieke bundle, en dat was
verifieerbaar lek. Vandaag draait de call via `netlify/functions/fietsroute.mts` met
`shared/ors.ts`: de browser praat met ons eigen endpoint zonder key, de key staat in de
server-side omgeving (`ORS_API_KEY`, zonder `VITE_`). Dat lost meteen ook de CORS-kwestie op,
want het is dan same-origin.

## Quota en account

- Account en key via `https://account.heigit.org` (self-service signup).
- Gratis tier: **2000 calls/dag, 40/minuut**, geverifieerd op de prijzenpagina van het
  HeiGIT-account.
- Er bestaat een gratis **"Collaborative"-tier (10.000/dag)** voor onderwijs, overheid en
  non-profit. De moeite waard om voor dit project aan te vragen via het dashboard.

## Attributie is contractueel

De HeiGIT-voorwaarden eisen de vermelding "© openrouteservice by HeiGIT | Data from
OpenStreetMap" **letterlijk**, en hun routeresultaten staan onder **CC-BY-SA 4.0**. Weghalen
mag dus niet, ook niet "even voor de opmaak". Geverifieerd in de ToS op
`account.heigit.org/info/tos` (27/08/2026).

Diezelfde ToS bevat **géén non-commerciële beperking**, dus een donatieknop op de site raakt
dit niet. (Bij Transitous ligt dat anders, zie [openbaar-vervoer.md](./openbaar-vervoer.md).)

De vermelding staat in `Footer.tsx` en nogmaals in `DetailPanel.tsx`, omdat dat paneel als
modaal venster over de footer ligt. De **link** op het woord "openrouteservice" is uit het
paneel gehaald en staat enkel in de footer: de vermelding is contractueel, de link erin niet.

## Dieplink naar de kaart van openrouteservice

Dezelfde goedkope weg als bij Transitous: linken naar `maps.openrouteservice.org` met de route
al ingevuld. Geen key, geen quota. Wie de link volgt, doet zelf de call. Geïmplementeerd als
`orsKaartUrl()` in `src/lib/fietsroute.ts`.

```
https://maps.openrouteservice.org/#/directions/<vanNaam>/<naarNaam>/data/
  {"coordinates":"<lon,lat>;<lon,lat>","options":{"profile":"cycling-regular","preference":"recommended"}}
```

Live nagespeeld op 28/08/2026 (Antwerpen-Centraal naar Wilrijk, en Antwerpen-Centraal naar
Onyx): de kaart berekent de rit, zet het profiel op de fiets en toont naam, afstand en tijd in
de zijbalk. Punten om niet in te lopen:

- **Het is een hash-route met een JSON-blok erin**, geen gewone querystring. Query-parameters op
  het pad (`?a=…&b=1`, zoals oudere forumposts tonen) worden **stil genegeerd**; geverifieerd,
  de app laadt dan gewoon de wereldkaart. Encodeer ook de namen: die staan in het pad, en een
  schoolnaam met een schuine streep zou de route anders in stukken hakken.
- **`coordinates` is `lon,lat`**, omgekeerd van de rest van deze app, en de punten scheiden met
  een puntkomma.
- **`"zoom"` in het optieblok doet niets merkbaars**, en een `/@lon,lat,zoom`-achtervoegsel
  evenmin. Beide geprobeerd. De kaart opent op straatniveau en zoomt pas na tien tot dertig
  seconden uit naar de volledige route (één keer wél gezien, één keer niet binnen 40 s). De
  bezoeker kan zelf op de "volledige route"-knop rechtsboven klikken. Dat is de bekende ruwe
  kant van deze link; de berekende route zelf klopt wel.
