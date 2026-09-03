# Waarom één JSON voor heel Vlaanderen, en niet één per provincie

Bij het inplannen stond in de roadmap één JSON per provincie, met bijladen bij het wisselen.
**Dat is bij het bouwen omgedraaid, op basis van metingen** (02/09/2026).

## De metingen

- `vestigingen.json` is 12,2 MB ruw maar **192 KB over de lijn** (brotli). De schatting in de
  roadmap ging uit van ~530 KB en was te somber: de helft van het bestand zijn richtingen, en
  daarvan zijn er maar een fractie uniek, dus brotli vreet die herhaling op.
- Netlify serveert het met `cache-control: public,max-age=0,must-revalidate` plus ETag.
  Nagemeten met een conditionele request: **een herbezoek krijgt HTTP 304 en nul bytes.** Alleen
  het eerste bezoek betaalt, en pas na een verversing opnieuw. De site is een statische build;
  er wordt niets per bezoek gegenereerd.

## Wat een splitsing zou kosten

Een splitsing brengt een hele categorie problemen mee die nu niet bestaat:

- grensgevallen bij een straal die over een provinciegrens gaat
- een provincie die uit een ingevuld adres afgeleid moet worden
- een laadvolgorde waarin de provincie vóór de eerste render vast moet liggen
- een omvangcontrole per bestand
- een melding in de UI dat resultaten aan een grens afgekapt zijn

**Provincie is daardoor gewoon een filter geworden**, zoals gemeente en net, en straal werkt
vanzelf over grenzen heen.

Wil je dit ooit toch splitsen: doe dat pas als het bestand echt te zwaar wordt, en **meet
opnieuw**, niet op een schatting.
