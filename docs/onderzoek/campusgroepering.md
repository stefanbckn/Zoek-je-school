# Waarom scholen op adres gegroepeerd worden

De brondata bevat regelmatig **meerdere apart geregistreerde scholen (elk een eigen
`schoolnummer`) op exact hetzelfde fysieke adres**. Niet zomaar interne vestigingsplaats-
varianten van één school, maar echt losse legale entiteiten die een campus delen. Voorbeeld:
"Sint-Gabriëlcollege" plus "Sint-Gabriëlcollege - Middenschool 1/2/3" zijn 4 verschillende
schoolnummers op 2 gedeelde adressen.

**Gemeten op de huidige dataset (03/09/2026):** 1563 van de 2145 vestigingen (73%) delen een
adres met minstens één andere school. Dat gaat om 493 van de 1075 adressen; op één adres staan
er maximaal 11 verschillende scholen.

*(Eerdere cijfers in de projectdocumentatie — 386 van 559, 130 van 303 — sloegen op de
Antwerpen-only dataset van vóór 0.12.0 en zijn hier vervangen.)*

Dit als losse kaartjes tonen is verwarrend. Expliciet zo beslist door de gebruiker.

## Waarom niet op bestuursniveau

Gevraagd op 01/09/2026, en afgewezen. **Groeperen op bestuur is géén alternatief.** Het
verliest geen scholen, maar een bestuur kan scholen over verschillende gemeenten hebben, dus
kaartjes op bestuursniveau zetten campussen bij elkaar die tientallen kilometers uit elkaar
liggen. De adresgroepering bestaat net omdat scholen hetzelfde gebouw delen.

Als **filter** of als regel in het detailpaneel kan bestuur wel nuttig zijn. Daarvoor moet
`SchoolOpCampus` het bestuursnummer en de naam gaan dragen; vandaag staat er enkel
`soortBestuur` (het type) in.

## Wat er wél en niet per adres samengevoegd wordt

Dat onderscheid is een harde regel en staat in `.claude/rules/datamodel.md`. Kort: het
**studieaanbod** wordt per adres samengevoegd, de **leerlingenkenmerken** niet.
