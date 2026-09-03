/**
 * De studiedomeinen van de matrix secundair onderwijs, met hun officiële code uit
 * `administratievegroep_domein`. Herkomst en verificatie:
 * docs/onderzoek/matrix-studiedomein.md.
 *
 * De labels staan hier omdat de bron ze in hoofdletters levert ("LAND- EN TUINBOUW"). Ze
 * omzetten met een generieke functie gaat mis op STEM, dat wél in hoofdletters hoort. Dit is
 * geen hardgecodeerde inhoud in de zin van de projectregel: de code komt uit de data, deze
 * tabel vertaalt er enkel tien vaste categorielabels van.
 */
const DOMEIN_LABELS: Record<string, string> = {
  '1': 'Taal en cultuur',
  '2': 'STEM',
  '3': 'Kunst en creatie',
  '4': 'Land- en tuinbouw',
  '5': 'Economie en organisatie',
  '6': 'Maatschappij en welzijn',
  '7': 'Sport',
  '8': 'Voeding en horeca',
  '9': 'Domeinoverschrijdend',
  '10': 'Eerste graad',
}

/**
 * De acht inhoudelijke domeinen, **alfabetisch op hun label**.
 *
 * ⚠️ Niet op de domeincode sorteren, ook al ligt dat voor de hand omdat de bron ze genummerd
 * levert. De rijvolgorde van de officiële matrixtabel is niet te verifiëren: de ene pdf geeft
 * 403, de andere levert een tekstlaag zonder tabelstructuur (nagekeken 03/09/2026). Wat wél
 * vaststaat, is dat twee onafhankelijke bronnen de domeinen alfabetisch opsommen: de
 * matrixtoelichting van de vrije CLB's en de studiedomeinenpagina van data-onderwijs.
 * Alfabetisch is bovendien het snelst af te lopen, en niemand kent die codenummers.
 *
 * Gesorteerd in plaats van met de hand opgesomd, zodat de volgorde niet uit elkaar kan lopen
 * met de labels hierboven. `localeCompare('nl')` zet STEM tussen Sport en Taal en cultuur,
 * net als de site van het ministerie.
 *
 * Code '9' (domeinoverschrijdend) en '10' (eerste graad) staan er bewust NIET in. Dat zijn
 * geen inhoudelijke domeinen; ze horen niet als negende en tiende rij naast STEM.
 */
export const DOMEIN_VOLGORDE: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8'].sort(
  (a, b) => DOMEIN_LABELS[a].localeCompare(DOMEIN_LABELS[b], 'nl'),
)

/** Domeinoverschrijdend: de richtingen die bij geen enkel domein horen (o.a. de ASO-richtingen). */
export const DOMEIN_OVERSCHRIJDEND = '9'

/** Alle codes die in de matrix een rij krijgen, domeinoverschrijdend achteraan. */
export const DOMEIN_RIJEN: readonly string[] = [...DOMEIN_VOLGORDE, DOMEIN_OVERSCHRIJDEND]

/**
 * Het label van een domeincode. Onbekende codes komen als de code zelf terug in plaats van
 * te verdwijnen: krijgt de bron er ooit een domein bij, dan valt dat op in plaats van
 * stilzwijgend uit de matrix te vallen.
 */
export function domeinLabel(code: string | null): string {
  if (code === null) return 'Zonder domein'
  return DOMEIN_LABELS[code] ?? `Domein ${code}`
}
