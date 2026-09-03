# Kleur, kleurenblindheid en de keuze van de clusterbibliotheek

De regels die hieruit volgen staan in `.claude/rules/frontend.md`. Dit bestand is waaróm ze zo
staan, zodat niemand ze op gevoel omkeert.

## Meten, niet schatten

`node scripts/kleurcheck.mjs` berekent contrast (WCAG AA) én simuleert protanopie, deuteranopie
en tritanopie, en meet hoe ver de kleuren binnen één categorie uit elkaar liggen.

Waarom dat script bestaat: het eerste finaliteitspalet (blauw #0b4a7d, pruim #7a2665, bruin
#7d4700) haalde overal AA, maar de eerste twee vielen bij protanopie praktisch samen, op afstand
12. Dat werd pas zichtbaar door te meten. Op een normaal scherm zag het er prima uit.

## Het kleurbudget gaat naar finaliteit

Daar wordt op gescand en gefilterd. Blauw, groenblauw en oranje, met minimaal 49 kleurafstand in
licht en 31 in donker, over alle vier de zichtsituaties.

**De netkleuren blijven ondersteunend.** Bij protanopie liggen GO! en Gemeentelijk dicht bij
elkaar (afstand 12 licht, 8 donker) en dat is aanvaard: elke net-chip draagt zijn naam voluit.
Zeven categorieën allemaal CVD-veilig kleuren **kán niet**; het beste palet voor vier netten
haalde maar 20. Vandaar de keuze om er niet meer kleur in te steken.

Let op bij het bijstellen van netkleuren: het oranje van Provinciaal ligt op afstand 4 van het
finaliteitsoranje van Arbeidsmarkt. Ze zijn uit elkaar te houden door rand en vormteken, maar
maak het verschil niet nóg kleiner.

## Vorm draagt het onderscheid tussen de families

Net is een gevulde chip. Finaliteit is een gevulde chip mét rand en vormteken (▲ doorstroom,
◆ dubbel, ■ arbeidsmarkt). Een omlijnde chip alleen bleek te weinig kleuroppervlak te hebben om
de families uit elkaar te houden, ook met normaal zicht.

Kaartmarkers zijn allemaal identiek en elke chip heeft een tekstlabel, dus kleur is nergens de
enige drager van informatie (WCAG 1.4.1).

## Waarom `react-leaflet-cluster` en niet een van de andere twee

Nagekeken in het npm-register op 31/08/2026:

- **`react-leaflet-cluster` 4.1.3** (31/03/2026) heeft `react-leaflet@^5`, `react@^19` en
  `leaflet.markercluster` in z'n peers. De enige onderhouden stabiele release die met onze
  versies overweg kan. **Gekozen.**
- `react-leaflet-markercluster` 5.0.0-rc.0 kan het ook, maar staat al sinds januari 2025 in rc.
- `@changey/react-leaflet-markercluster` zit nog op react-leaflet 4 en valt af.

De terugvalweg (markercluster rechtstreeks op de Leaflet-instantie via `useMap()`, zoals
`FitBounds` doet) was niet nodig.

## Waarom de clusterkleur het thema niet volgt

`--c-cluster` staat alleen in `:root` en wordt niet herhaald in de donkere blokken. De
tegellaag van OpenStreetMap is altijd licht (in donkere modus enkel gedempt), en de losse
markers zijn in beide thema's hetzelfde blauwe speldje; een bol die naar de lichte accentkleur
omslaat zou op die lichte kaart net onleesbaar worden.

De waarde is gelijk aan het lichte accent (#0b5c6e), witte tekst haalt daarop 7,58:1. Geen
nieuwe kleur, dus `scripts/kleurcheck.mjs` hoefde er niet over.

## Bewust geen webfont

De app gebruikt de systeemletter (Tailwinds `font-sans`): geen extra download, geen
layout-verschuiving bij het laden, en niets dat de CSP of de privacy raakt. Wil je later meer
karakter, doe dat dan met één webfont voor koppen alleen, niet voor lopende tekst.
