---
paths:
  - "src/lib/ov.ts"
  - "src/lib/fietsroute.ts"
  - "src/lib/geolocatie.ts"
  - "src/components/DetailPanel.tsx"
  - "netlify/**"
  - "shared/**"
---

# Reistijd en geolocatie — live calls vanuit de browser

Dit zijn de enige live calls die de app doet. De scholendata zelf komt build-time binnen.
Achtergrond en licentievoorwaarden: [docs/onderzoek/fietsroute.md](../../docs/onderzoek/fietsroute.md)
en [docs/onderzoek/openbaar-vervoer.md](../../docs/onderzoek/openbaar-vervoer.md).

**Gedeelde regel:** beide routes worden **enkel voor de geselecteerde school in het
detailpaneel** aangeroepen, nooit voor elke kaart in de resultatenlijst. Anders is de gratis
quota in enkele zoekopdrachten op, en bij Transitous is dat precies de belasting waar zij voor
waarschuwen. Beide hebben een in-memory cache per route-paar.

## Fietsroute — via onze eigen Netlify Function

De browser roept `/api/fietsroute` aan, **zonder key**. `netlify/functions/fietsroute.mts` zet
de call door met `ORS_API_KEY` uit de server-side omgeving. `shared/ors.ts` is de gedeelde code.

**De key mag niet client-side.** ORS is daar expliciet over, en domeinrestrictie bestaat bij
HeiGIT niet. Zet er dus nooit een `VITE_`-prefix op en roep ORS nooit rechtstreeks aan vanuit
`src/`.

Wat de proxy hardcodeert, en waarom het zo moet blijven: alleen GET, coördinaten binnen een
bounding box rond België, alleen het fietsprofiel, antwoord met enkel afstand en duur (geen
geometrie), géén CORS-header, en een dag CDN-cache. Het endpoint is publiek bereikbaar (de site
is publiek); die beperkingen maken misbruik onaantrekkelijk, niet onmogelijk.

Voor de call naar ORS zelf:

- **Gebruik `api.heigit.org`, NIET `api.openrouteservice.org`.** Beide draaien dezelfde backend,
  maar `api.openrouteservice.org` stuurt CORS-headers enkel op de OPTIONS-preflight. Dat is een
  bekend, jarenlang terugkerend probleem, geen toevalstreffer.
- Endpoint: `POST https://api.heigit.org/openrouteservice/v2/directions/cycling-regular/json`
- Auth: header `Authorization: <key>`, de ruwe key, **geen `Bearer`-prefix**.
- Body: `{"coordinates": [[lon,lat],[lon,lat]]}`. **lon eerst**, omgekeerd van de rest van de app.
- Respons: `routes[0].summary.distance` (meter) en `.duration` (seconden).
- Quota gratis tier: 2000 calls/dag, 40/minuut.
- Geen key ingesteld: `berekenFietsroute` geeft stil `null` terug. Geen fetch-poging, geen crash.

`orsKaartUrl()` maakt een dieplink naar `maps.openrouteservice.org`. Dat is géén API-gebruik:
wie de link volgt doet zelf de call. Het is een **hash-route met een JSON-blok**, geen
querystring; query-parameters op het pad worden stil genegeerd.

## Openbaar vervoer — Transitous, rechtstreeks vanuit de browser

`src/lib/ov.ts`. `https://api.transitous.org/api/v1/plan`, geen key, geen registratie.

**Niet proxyen via een Netlify Function.** Bij de fietsroute was de reden een geheime key, en
die is hier niet; proxyen zou net de `Referer` wegnemen waarmee Transitous ons herkent. Dat is
een van hun voorwaarden.

- **`arriveBy=true` met een aankomsttijd op een schooldag.** We mikken op 8u30 op de
  eerstvolgende weekdag: een zoekopdracht op zondagavond mag geen zondagse dienstregeling tonen.
  Bereken die datum, hardcode ze niet, dan veroudert ze stil. Vakantiedienstregelingen vangt dat
  niet op, daarom staat de datum waarvoor gerekend is in de UI.
- ⚠️ **Bij korte afstanden is `itineraries` leeg en staat er enkel een wandelroute in `direct`.**
  Geverifieerd op een rit van 400 m. De app toont dan "te voet sneller", niet "geen verbinding".
  Wie dat onderscheid niet maakt, meldt bij elke school in de buurt ten onrechte dat er geen bus
  rijdt.
- ⚠️ **`mode` is niet betrouwbaar genoeg om er een vervoermiddel bij te schrijven.** De
  S-treinen van NMBS komen binnen als `METRO`, en Antwerpen heeft geen metro. Daarom toont de UI
  enkel het lijnnummer ("lijnen A3, 51") en geen "bus" of "trein" ervoor. Niet "verbeteren"
  zonder de feed opnieuw na te kijken.
- `transitousPlannerUrl()` maakt de dieplink naar hun webplanner. Het paneel geeft **dezelfde
  `aankomst` mee aan de link als aan de API-call**, anders opent de planner op een ander moment
  dan wat op het scherm staat. De tijd gaat er in **lokale tijd** in als `YYYY-MM-DDTHH:mm`;
  `toISOString()` zou er in de zomer 06:30 van maken.

## Geolocatie van het eigen adres

- Autocomplete: `GET https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=...`
- Coördinaten: `GET https://geo.api.vlaanderen.be/geolocation/v4/Location?q=...`
- Geen API-key nodig. De documentatie zegt "CORS is not supported", maar in de praktijk stuurt
  de API `access-control-allow-origin: *` mee. Geverifieerd, werkt gewoon vanuit de browser.
- **Deelgemeenten** (Borsbeek, Vremde, Deurne, ...) hebben geen eigen punt in deze bron. Zie de
  hint onder de zoekbalk in `SearchBar.tsx`. Straatnaam-zoeken is wel altijd correct.

## Attributie is contractueel, niet decoratief

- ORS: "© openrouteservice by HeiGIT | Data from OpenStreetMap", **letterlijk**, in `Footer.tsx`
  én in `DetailPanel.tsx` (dat paneel ligt als modaal venster over de footer).
- Transitous: zichtbare link naar `https://transitous.org/sources/` in de footer, plus de
  OpenStreetMap-attributie.
- De contactregel `info@zoekjeschool.be` in de footer is een **Transitous-vereiste**, geen opsmuk.

Weghalen mag niet, ook niet "even voor de opmaak".

## CSP

`connect-src` in `netlify.toml` moet elke live origin bevatten. Voeg je een bron toe, voeg ze
daar toe. Een dieplink raakt de CSP niet: een link is geen `connect-src`.
