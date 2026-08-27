# Bekende bugs

Lopende lijst van gemelde problemen die nog niet opgelost zijn. Eén kop per bug, met wat er
gebeurt, wat de oorzaak lijkt, en wat er nog geverifieerd moet worden. Opgeloste bugs gaan
eruit — de git-geschiedenis houdt ze bij.

---

## Mobiel: scherm blijft ingezoomd na typen in een invoerveld

**Gemeld:** 27/08/2026 · **Status:** open, niet opgelost

**Wat er gebeurt.** Op een klein scherm zoomt de pagina in zodra je een invoerveld aantikt.
Na het typen zoomt hij niet vanzelf weer uit, dus je blijft achter op een ingezoomde pagina
en moet handmatig terugknijpen.

**Vermoedelijke oorzaak.** Safari op iOS zoomt automatisch in wanneer een invoerveld dat focus
krijgt een tekstgrootte onder 16px heeft. Alle invoervelden staan op `text-sm` (14px):

- `SearchBar.tsx` — het adresveld
- `FilterPanel.tsx` — "Zoek op schoolnaam" en "Zoek op studierichting"
- `SearchBar.tsx` — de straal-`<select>` staat ook op `text-sm`

Dat iOS na het verlaten van het veld niet terugzoomt is bekend gedrag van Safari, geen
tweede bug: het inzoomen is de trigger, het niet-uitzoomen het gevolg.

**Nog te verifiëren.** De diagnose is gebaseerd op de code, niet op een test op een echt
toestel. Vóór het oplossen: nagaan of het ook op Android Chrome optreedt (verwachting van niet
— die kent dit autozoom-gedrag niet) en of het inderdaad verdwijnt bij 16px.

**Richting voor de oplossing.** Invoervelden op minstens 16px zetten (`text-base`), eventueel
alleen onder een bepaalde schermbreedte zodat het ontwerp op desktop niet verandert.

**Niet doen:** `maximum-scale=1` of `user-scalable=no` aan de viewport-meta toevoegen. Dat
onderdrukt het symptoom maar ontneemt iedereen de mogelijkheid om in te zoomen, wat een
toegankelijkheidsprobleem is voor slechtziende bezoekers (WCAG 1.4.4).
