# Een beveiligingsprobleem melden

Zoek je school heeft geen accounts en bewaart geen persoonsgegevens. Toch kan er iets mis zijn,
bijvoorbeeld in de Netlify Function voor de fietsroute of in de beveiligingsheaders van de site.
Heb je zoiets gevonden, dan horen we het graag.

## Hoe je het meldt

Open er geen publiek issue voor. Dan ziet iedereen het probleem voor het opgelost is.

- Via GitHub: [meld het privé](https://github.com/stefanbckn/Zoek-je-school/security/advisories/new).
  Alleen jij en de beheerder zien de melding.
- Via mail: [info@zoekjeschool.be](mailto:info@zoekjeschool.be), met "Beveiliging" in het
  onderwerp.

Vertel wat je gevonden hebt, hoe we het kunnen nazien en wat iemand ermee zou kunnen doen.

## Wat er dan gebeurt

Zoek je school is een project van één persoon, in de vrije tijd. Je krijgt binnen een week een
antwoord. Is het probleem echt, dan lossen we het op en vermelden we je in de changelog, als je
dat wilt.

## Waarover het gaat

Wel:

- de site op [zoekjeschool.be](https://zoekjeschool.be) en de code in deze repo
- de Netlify Function `fietsroute`, die de fietsafstand ophaalt bij openrouteservice
- de beveiligingsheaders en de Content Security Policy in `netlify.toml`

Niet:

- de schoolgegevens zelf. Die komen van Onderwijs en Vorming.
- de diensten waar de site mee praat: de adreszoeker van de Vlaamse overheid, Transitous,
  openrouteservice, OpenStreetMap en Simple Analytics. Een probleem bij hen meld je het best
  rechtstreeks aan hen.

Alleen de versie die nu live staat, wordt bijgewerkt. Oudere versies bestaan enkel als tag.
