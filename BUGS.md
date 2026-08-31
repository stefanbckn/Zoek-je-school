# Bekende bugs

Lopende lijst van gemelde problemen die nog niet opgelost zijn. Eén kop per bug, met wat er
gebeurt, wat de oorzaak lijkt, en wat er nog geverifieerd moet worden. Opgeloste bugs gaan
eruit — de git-geschiedenis houdt ze bij.

Houd deze lijst gelijk met de opsomming in de README.

---

## Knoppenrij in de kop maakt de pagina te breed op een smal scherm

**Wat er gebeurt:** op een smalle telefoon steekt de rij met "Hoe werkt deze site?",
"Over deze site" en de driestandenknop Licht/Systeem/Donker buiten het scherm. De pagina wordt
daardoor breder dan de viewport en horizontaal scrollbaar; de knop "Donker" valt deels weg.
Gemeld op 31/08/2026 met een schermafbeelding.

**Toestel/browser:** mobiel, exact toestel en browser nog niet bekend. De schermafbeelding is
smal genoeg om ergens rond 375 px breed te zitten, maar dat is afgeleid, niet gemeten.

**Wat de oorzaak lijkt:** in `src/App.tsx` draagt de `div` rond de drie knoppen zowel
`shrink-0` als `flex-wrap`. Die twee bijten elkaar: met `shrink-0` krimpt de rij nooit onder
haar max-content-breedte, dus perkt de header ze nooit in en heeft het `flex-wrap` erop niets
om op te reageren. De kinderen wrappen dan nooit. De opmerking erboven ("bij weinig ruimte zakt
de knop naar een eigen regel") beschrijft dus gedrag dat er niet is sinds er een derde knop bij
kwam in 0.9.0.

**Nog te verifiëren:** dat `shrink-0` weghalen (eventueel met `min-w-0` erbij) het probleem
echt oplost, doorgemeten in de browser op 320 en 375 px, en dat de kop op een breed scherm
onveranderd blijft. Ook nakijken of `ThemaToggle` zelf nog op één regel past op 320 px, want
die houdt z'n eigen `shrink-0`.
