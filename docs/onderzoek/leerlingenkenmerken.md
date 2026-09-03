# GOK-leerlingenkenmerken — waarom de xlsx-route

Opgeleverd in 0.10.0. **De werking en de valkuilen van het inlezen staan in
`.claude/rules/data-import.md`**; de regels over tonen en kaderen in
`.claude/rules/datamodel.md`. Dit bestand is waarom deze route gekozen is, en wat de
alternatieven zijn.

## De bron

AgODi-publicatie **"Overzicht leerlingkenmerken secundair onderwijs voorschot
werkingstoelagen"** op het documentenportaal. Geen API-key, geen registratie, gewone HTTP GET.

```
https://data-onderwijs.vlaanderen.be/documenten/bestanden/
  Publicaties_Leerlingenkenmerken_Overzicht_<jaar>-<jaar+1>_so.xlsx
```

**Gevonden via** `onderwijsstatistieken.depuydt.eu` (Dieter Depuydt), die dezelfde cijfers toont
en in zijn FAQ schrijft dat alles uit publieke AgODi-publicaties komt. Zijn percentages zijn
exact gereproduceerd uit de xlsx (Sint-Jan Berchmanscollege Brussel: 14,7 / 65,6 / 24,2 / 62,3),
dus dat is zijn bron én de bevestiging dat onze kolominterpretatie klopt.

**Nieuwste publicatie is 2024-2025** (nagekeken 01/09/2026: 2025-2026 geeft 404, ook in Dataloep
is 2024-2025 het laatste schooljaar). De cijfers lopen dus een schooljaar achter op het
studieaanbod. Dat staat in de UI, en het is geen fout om "op te lossen".

**983 van de 994 scholen matchen** (gemeten 03/09/2026 op de huidige dataset). De rest zijn
onafhankelijke scholen zonder werkingstoelagen en recent gesplitste scholen. Dat is verwacht,
geen bug. *(Het eerder genoteerde "266 van de 272" sloeg op de Antwerpen-only dataset van vóór
0.12.0.)*

## Waarom geen zelfberekende OKI

De som van de vier kenmerken gedeeld door het leerlingenaantal benadert de gepubliceerde OKI,
maar is een afleiding. Zolang die niet naast het officiële cijfer in Dataloep gelegd is: vier
percentages tonen, geen samengesteld getal.

## De afweging: xlsx of Dataloep

Automatisch en per school (de xlsx), of handwerk en per vestigingsplaats (Tableau/Dataloep).
Het is de xlsx geworden. Per vestigingsplaats bestaat het wél, maar enkel handmatig; die weg
staat hieronder voor als we ze ooit nodig hebben.

**Zijdelings genoteerd:** de AgODi-pagina `cijfermateriaal-leerlingenkenmerken` was op
27-28/08/2026 zelf niet bereikbaar (`www.agodi.be` geeft een DNS-fout, de redirect naar
`paddlecms.net` loopt in een time-out). Het documentenportaal werkt wél, en dat is wat het
script gebruikt.

## De Dataloep-route (per vestigingsplaats, handmatig)

- Bron: **Dataloep Leerlingenkenmerken Secundair**, op de Tableau Server van de overheid:
  `https://onderwijs-tableau.vlaanderen.be/t/EXTERN/views/DataloepLeerlingenkenmerkenSecundair/SOCijfersperschooljaar`
  Publiek, geen login.
- Zet in het dashboard de uitsplitsing **"instelling | vestigingsplaats adres"**. Rijen zien er
  dan zo uit: `28514 - Provinciaal Instituut PIVA | Antwerpen, Desguinlei 244` met gemiddelde
  OKI plus de 4 kenmerken in procent.
- **Join werkt**: op `(schoolnummer, "straat huisnummer")` tegen ons campusmodel. Getest op
  4 rijen, 4/4 match.
- **Export**: de raw "Data"-download is door de publisher bewust uitgeschakeld;
  **"Kruistabel → CSV"** is wél toegestaan (werkblad `SO | CIJF | Leerlingenkenmerken %`). Dat is
  de sanctioned route.
- **Niet automatiseerbaar via URL**: de `.csv`-suffix (gedocumenteerde Tableau-feature) werkt op
  werkbladen maar geeft leeg terug op dashboards, en parameterstate overleeft geen anonieme
  sessie. Tableau's interne `vizql`-protocol scrapen: **niet doen**, fragiel en niet-ondersteund.
- **Aanpak als het ooit moet**: het is een Vlaamse Openbare Statistiek met jaarlijkse
  publicatiekalender, dus één keer per jaar handmatig exporteren, als statische CSV in de repo
  committen, en `fetch-data.ts` laten joinen.

## Doodlopende sporen (opnieuw nagekeken 27/08/2026)

Bij het voorbereiden van v0.3 is nog eens gezocht naar een bron die wél automatiseerbaar is per
vestigingsplaats. Die is er niet. Wat gecontroleerd is, zodat niemand het een derde keer doet:

- **De site is verhuisd.** `onderwijs.vlaanderen.be/nl/onderwijsstatistieken/...` geeft nu 301
  naar `vlaanderen.be`, en die datapagina somt Dataloep, het statistisch jaarboek en het
  API-portaal op, géén downloadbaar leerlingenkenmerken-bestand. Oude links naar
  statistiekpagina's landen op een algemene pagina, dus een dode link betekent hier niet dat de
  data weg is.
- **`agodi.be` bestaat niet meer als host** (DNS-fout op `www.agodi.be`; `agodi.be` redirect naar
  een `paddlecms.net`-adres dat time-outt). Zoekresultaten verwijzen er nog naar.
- **provincies.incijfers.be** (Swing/ABF, het platform achter "Provincies in cijfers") heeft wél
  een OData-service op `/viewerservices/odata/`, maar die geeft anoniem
  `401 {"error":{"message":"Guest user group not found, No access!"}}`. Geen open API dus. De
  databank zelf zit bovendien op gemeenteniveau, niet per vestigingsplaats.
- Het **Tableau-dashboard staat er nog** en laadt (geverifieerd 27/08/2026). De handmatige
  kruistabel-export blijft de route.
