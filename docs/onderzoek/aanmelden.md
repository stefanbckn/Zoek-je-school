# Aanmelden — geen centrale bron

Onderzocht 27/08/2026. **Niet gebouwd, en bewust zonder plaats in de volgorde.**

Er is **geen register, dataset of API** die scholen aan een aanmeldsysteem koppelt. Nagekeken:
de API-catalogus van het onderwijsportaal bevat geen aanmelden-product (zie
[databronnen.md](./databronnen.md)), en er bestaat geen centrale lijst van
aanmeldingsinitiatieven.

Het landschap is versnipperd over minstens vier sporen:

- `aanmelden.vlaanderen`, het gratis platform van de Vlaamse overheid, met een aparte instantie
  per regio (bijvoorbeeld `zuiderkempenso.aanmelden.vlaanderen`). Secundair kreeg toegang in
  februari 2026.
- `meldjeaansecundair.antwerpen.be`, stad Antwerpen draait een eigen systeem.
- `aanmelden.school`, private aanbieder, gebruikt in een aantal regio's, met een eigen pagina
  "deelnemende scholen".
- Centraal Aanmeldingsregister van V-ICT-OR.

**Gevolg voor de aanpak:** dit wordt handmatige curatie per gemeente of regio, een klein
gecommit bestand dat gemeente of schoolnummer koppelt aan de naam en URL van het
aanmeldsysteem, dat `fetch-data.ts` erbij joint. **Niet scrapen**: de deelnemerslijsten staan op
sites met eigen voorwaarden, en ze wijzigen per schooljaar.

**Let op bij het tonen:** aanmeldperiodes zijn kort en jaargebonden (voor 2026-2027 liep het van
31 maart tot 24 april 2026). Toon dus nooit een harde datum uit een gecommit bestand zonder
jaartal erbij, en link naar de bron in plaats van de procedure over te nemen. Anders staat er
volgend jaar verouderde informatie die ouders een inschrijving kan kosten.
