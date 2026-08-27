/**
 * Controleert het kleurenpalet uit src/index.css op twee dingen:
 *   1. contrast van tekst op zijn eigen achtergrond (WCAG AA = 4.5:1 voor kleine tekst);
 *   2. hoe ver kleuren binnen één categorie uit elkaar liggen, ook gesimuleerd voor
 *      protanopie, deuteranopie en tritanopie.
 *
 * Draai met: node scripts/kleurcheck.mjs
 *
 * Waarom dit bestaat: "deze kleuren lijken me wel te onderscheiden" is geen verificatie.
 * Het eerste finaliteitspalet (blauw/pruim/bruin) zag er prima uit maar viel bij protanopie
 * praktisch samen — afstand 12. Pas na meten werd dat zichtbaar. Wijzig je kleuren, draai dit.
 *
 * De afstandsmaat is CIE76 in Lab: ruw, maar ruim voldoende om "duidelijk verschillend" van
 * "bijna hetzelfde" te scheiden. Vuistregel: >= 25 is comfortabel, < 15 is een probleem.
 * De simulatiematrices zijn de gangbare Viénot/Brettel-benadering voor dichromaten.
 */

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const delin = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
const lum = (h) => {
  const [r, g, b] = hex2rgb(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const MATRIX = {
  normaal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopie: [
    [0.170556992, 0.829443014, 0],
    [0.170556991, 0.829443008, 0],
    [-0.004517144, 0.004517144, 1],
  ],
  deuteranopie: [
    [0.33066007, 0.66933993, 0],
    [0.33066007, 0.66933993, 0],
    [-0.02785538, 0.02785538, 1],
  ],
  tritanopie: [
    [1, 0, 0],
    [0.1273989, 0.8726011, 0],
    [-0.01413052, 0.01413052, 1],
  ],
}

function simuleer(hex, type) {
  const v = hex2rgb(hex).map(lin)
  const uit = MATRIX[type].map((r) =>
    Math.min(1, Math.max(0, r[0] * v[0] + r[1] * v[1] + r[2] * v[2])),
  )
  return '#' + uit.map((c) => Math.round(delin(c) * 255).toString(16).padStart(2, '0')).join('')
}

function lab(hex) {
  const [r, g, b] = hex2rgb(hex).map(lin)
  let x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  let y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  let z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  ;[x, y, z] = [f(x), f(y), f(z)]
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

const afstand = (a, b) => {
  const [l1, a1, b1] = lab(a)
  const [l2, a2, b2] = lab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/** Zelfde waarden als in src/index.css. Houd ze gelijk als je daar iets wijzigt. */
const PALETTEN = {
  'finaliteit licht': {
    Doorstroom: ['#1155a3', '#dbeafe'],
    Dubbel: ['#00665d', '#cfeae4'],
    Arbeidsmarkt: ['#9a5300', '#fbe8cc'],
  },
  'finaliteit donker': {
    Doorstroom: ['#8ec5f5', '#102b46'],
    Dubbel: ['#5fd3bd', '#06322c'],
    Arbeidsmarkt: ['#f0b04a', '#3d2a08'],
  },
  'net licht': {
    'GO!': ['#0b4a7d', '#d5e7f8'],
    Provinciaal: ['#7d4700', '#fde5c8'],
    Gemeentelijk: ['#7a2665', '#f3dcef'],
    Vrij: ['#0a5340', '#cdeae0'],
  },
  'net donker': {
    'GO!': ['#a3caec', '#0d3050'],
    Provinciaal: ['#f2c37c', '#4b3311'],
    Gemeentelijk: ['#efaad3', '#481d38'],
    Vrij: ['#83d6b6', '#0c3629'],
  },
}

let problemen = 0

for (const [naam, palet] of Object.entries(PALETTEN)) {
  console.log(`\n=== ${naam} ===`)
  for (const [label, [voor, achter]] of Object.entries(palet)) {
    const c = contrast(voor, achter)
    const ok = c >= 4.5
    if (!ok) problemen++
    console.log(`  ${label.padEnd(13)} ${voor} op ${achter}  ${c.toFixed(2)}:1  ${ok ? 'AA' : 'TE LAAG'}`)
  }
  const labels = Object.keys(palet)
  for (const type of Object.keys(MATRIX)) {
    let kleinste = Infinity
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const d = afstand(
          simuleer(palet[labels[i]][0], type),
          simuleer(palet[labels[j]][0], type),
        )
        kleinste = Math.min(kleinste, d)
      }
    }
    // Netten dragen hun naam voluit, dus daar is kleur ondersteunend en geen harde eis.
    const eis = naam.startsWith('finaliteit') ? 25 : 0
    const ok = kleinste >= eis
    if (!ok) problemen++
    console.log(
      `  ${type.padEnd(13)} kleinste afstand ${Math.round(kleinste)}` +
        (eis ? `  (eis >= ${eis}) ${ok ? '✓' : '✗'}` : '  (ondersteunend, geen eis)'),
    )
  }
}

console.log(problemen === 0 ? '\nAlles in orde.' : `\n${problemen} probleem/problemen gevonden.`)
process.exit(problemen === 0 ? 0 : 1)
