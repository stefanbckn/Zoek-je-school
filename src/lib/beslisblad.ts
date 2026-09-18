/**
 * Het beslisblad in het vergelijkingsvenster: per onderwerp een gewicht, een beste en een
 * tweede adres, en een notitie per adres. Hieruit volgt "Jullie volgorde".
 *
 * **Dit is geen ranglijst van de site.** De onderwerpen zijn voor elke school dezelfde vragen,
 * zonder één gegeven over een school. Het gewicht, de keuze en de notities komen allemaal van
 * de bezoeker; de site telt enkel op. Daarom mag het, terwijl een score die de site zelf aan een
 * school geeft niet mag. Zie de productregels in CLAUDE.md.
 *
 * **Niets wordt bewaard.** De stand leeft in `App.tsx`, zodat ze het sluiten en opnieuw openen
 * van het venster overleeft, maar niet het herladen van de pagina. Geen `localStorage`: op een
 * gedeelde gezinscomputer blijven notities over een kind dan staan voor wie er daarna aan zit.
 * Wie het wil houden, drukt het af.
 */

/** Eén onderwerp: een vraag die je op elke infodag kan stellen. */
export interface Onderwerp {
  id: string
  titel: string
  vraag: string
  /** Meer plaats om te schrijven, op het scherm en op papier. */
  ruim?: boolean
}

/**
 * De onderwerpen, in de volgorde waarin ze op het blad staan. Allemaal dingen die niet in de
 * officiële gegevens staan en die per school verschillen; "Eigen indruk" staat bewust
 * achteraan, na de feiten.
 */
export const ONDERWERPEN: Onderwerp[] = [
  {
    id: 'kostprijs',
    titel: 'Kostprijs',
    vraag: 'Wat kost het eerste jaar in totaal, met boeken, materiaal en uitstappen?',
  },
  {
    id: 'laptop',
    titel: 'Laptop',
    vraag: 'Is een laptop verplicht? Huren of kopen, en van wie is hij na zes jaar?',
  },
  {
    id: 'uitstappen',
    titel: 'Uitstappen en reizen',
    vraag: 'Welke uitstappen en meerdaagse reizen zijn er, en zijn ze verplicht?',
  },
  {
    id: 'kledij',
    titel: 'Kledij',
    vraag: 'Is er een uniform, of gelden er kledijafspraken?',
  },
  {
    id: 'zorg',
    titel: 'Zorg en opvolging',
    vraag: 'Wie volgt op als het even minder gaat, en hoe snel hoor je dat als ouder?',
  },
  {
    id: 'schooldag',
    titel: 'Schooldag',
    vraag: 'Hoe laat begint en eindigt de dag? Hoe zit het met de middag en warme maaltijden?',
  },
  {
    id: 'indruk',
    titel: 'Eigen indruk',
    vraag: 'De sfeer, de gebouwen, en wat je kind er zelf van vond.',
    ruim: true,
  },
]

/** Hoe zwaar een onderwerp weegt. 0 haalt het uit de telling zonder de notities te wissen. */
export const GEWICHTEN = [
  { waarde: 0, label: 'Telt niet mee' },
  { waarde: 1, label: 'Beetje' },
  { waarde: 3, label: 'Belangrijk' },
  { waarde: 5, label: 'Doorslaggevend' },
] as const

export const STANDAARD_GEWICHT = 3

/**
 * De plaats van een adres binnen één onderwerp.
 *
 * Er wordt enkel een beste en een tweede gekozen; wat overblijft is `rest`. Een derde en vierde
 * plaats laten kiezen maakt het blad trager voor een onderscheid dat een ouder zelden echt
 * maakt. Bij twee adressen volstaat één klik: het andere is dan vanzelf de tweede.
 */
export type Plaats = 'beste' | 'tweede' | 'rest' | 'gelijk'

export const PUNTEN: Record<Plaats, number> = { beste: 5, tweede: 3, rest: 1, gelijk: 3 }

export const PLAATS_LABEL: Record<Plaats, string> = {
  beste: 'Beste',
  tweede: 'Tweede',
  rest: 'Minder',
  gelijk: 'Gelijk',
}

interface Keuze {
  /** Campus-id's in de volgorde waarin ze aangeklikt zijn: eerst de beste, dan de tweede. */
  volgorde: string[]
  gelijk: boolean
}

export interface Beslisblad {
  gewicht: Record<string, number>
  keuze: Record<string, Keuze>
  /** Sleutel `onderwerpId|campusId`, zie `notitieSleutel`. */
  notities: Record<string, string>
}

export const LEEG_BLAD: Beslisblad = { gewicht: {}, keuze: {}, notities: {} }

export function notitieSleutel(onderwerpId: string, campusId: string): string {
  return `${onderwerpId}|${campusId}`
}

export function gewichtVan(blad: Beslisblad, onderwerpId: string): number {
  return blad.gewicht[onderwerpId] ?? STANDAARD_GEWICHT
}

function keuzeVan(blad: Beslisblad, onderwerpId: string): Keuze {
  return blad.keuze[onderwerpId] ?? { volgorde: [], gelijk: false }
}

/** Hoeveel adressen er aangeklikt moeten worden voor een onderwerp af is. */
function nodigeKliks(aantalAdressen: number): number {
  return Math.min(2, aantalAdressen - 1)
}

/**
 * De volgorde van één onderwerp, beperkt tot de adressen die nu in de vergelijking staan. Een
 * adres dat eruit gehaald is, telt dus niet meer mee, ook al werd het vroeger aangeklikt.
 */
function actieveVolgorde(blad: Beslisblad, onderwerpId: string, campusIds: string[]): string[] {
  return keuzeVan(blad, onderwerpId).volgorde.filter((id) => campusIds.includes(id))
}

export function isIngevuld(blad: Beslisblad, onderwerpId: string, campusIds: string[]): boolean {
  if (keuzeVan(blad, onderwerpId).gelijk) return true
  return actieveVolgorde(blad, onderwerpId, campusIds).length >= nodigeKliks(campusIds.length)
}

/** Null zolang het adres nog geen plaats heeft, omdat het onderwerp niet af is. */
export function plaatsVan(
  blad: Beslisblad,
  onderwerpId: string,
  campusId: string,
  campusIds: string[],
): Plaats | null {
  if (keuzeVan(blad, onderwerpId).gelijk) return 'gelijk'
  const volgorde = actieveVolgorde(blad, onderwerpId, campusIds)
  const i = volgorde.indexOf(campusId)
  if (i === 0) return 'beste'
  if (i === 1) return 'tweede'
  if (!isIngevuld(blad, onderwerpId, campusIds)) return null
  // Bij twee adressen is wat niet de beste is vanzelf de tweede, niet "minder".
  return campusIds.length === 2 ? 'tweede' : 'rest'
}

/**
 * Een adres aanklikken: nog eens klikken haalt het weg, anders wordt het de volgende keuze. Is
 * het onderwerp al af, dan gebeurt er niets; eerst iets wegklikken of wissen.
 */
export function klikAdres(
  blad: Beslisblad,
  onderwerpId: string,
  campusId: string,
  campusIds: string[],
): Beslisblad {
  const volgorde = actieveVolgorde(blad, onderwerpId, campusIds)
  let nieuw: string[]
  if (volgorde.includes(campusId)) nieuw = volgorde.filter((id) => id !== campusId)
  else if (volgorde.length < nodigeKliks(campusIds.length)) nieuw = [...volgorde, campusId]
  else return blad
  return { ...blad, keuze: { ...blad.keuze, [onderwerpId]: { volgorde: nieuw, gelijk: false } } }
}

export function zetGelijk(blad: Beslisblad, onderwerpId: string): Beslisblad {
  const gelijk = !keuzeVan(blad, onderwerpId).gelijk
  return { ...blad, keuze: { ...blad.keuze, [onderwerpId]: { volgorde: [], gelijk } } }
}

export function wisKeuze(blad: Beslisblad, onderwerpId: string): Beslisblad {
  return { ...blad, keuze: { ...blad.keuze, [onderwerpId]: { volgorde: [], gelijk: false } } }
}

export function zetGewicht(blad: Beslisblad, onderwerpId: string, gewicht: number): Beslisblad {
  return { ...blad, gewicht: { ...blad.gewicht, [onderwerpId]: gewicht } }
}

export function zetNotitie(
  blad: Beslisblad,
  onderwerpId: string,
  campusId: string,
  tekst: string,
): Beslisblad {
  return { ...blad, notities: { ...blad.notities, [notitieSleutel(onderwerpId, campusId)]: tekst } }
}

/**
 * Staat er iets dat verloren zou gaan? Een notitie of een aangeklikt adres telt; een gewicht
 * alleen niet, dat is in twee klikken terug. Zonder `campusId` geldt het voor het hele blad.
 */
export function heeftInvoer(blad: Beslisblad, campusId?: string): boolean {
  const notitie = Object.entries(blad.notities).some(
    ([sleutel, tekst]) =>
      tekst.trim() !== '' && (campusId === undefined || sleutel.endsWith(`|${campusId}`)),
  )
  if (notitie) return true
  return Object.values(blad.keuze).some((k) =>
    campusId === undefined ? k.gelijk || k.volgorde.length > 0 : k.volgorde.includes(campusId),
  )
}

/** Alles van één adres wegnemen, wanneer het uit de vergelijking gaat. */
export function zonderCampus(blad: Beslisblad, campusId: string): Beslisblad {
  const notities = Object.fromEntries(
    Object.entries(blad.notities).filter(([sleutel]) => !sleutel.endsWith(`|${campusId}`)),
  )
  const keuze = Object.fromEntries(
    Object.entries(blad.keuze).map(([id, k]) => [
      id,
      { ...k, volgorde: k.volgorde.filter((x) => x !== campusId) },
    ]),
  )
  return { ...blad, notities, keuze }
}

export interface Stand {
  campusId: string
  punten: number
  /** Punten herrekend naar 100, zodat het aantal ingevulde onderwerpen niet meetelt. */
  op100: number
  /** Bij hoeveel onderwerpen dit adres als beste aangeduid werd. */
  keerBeste: number
  /** 1 voor het hoogste; bij gelijke punten dezelfde plaats. */
  plaats: number
}

export interface Uitslag {
  stand: Stand[]
  /** Onderwerpen die meewegen (gewicht boven 0). */
  meewegend: number
  /** Daarvan ingevuld. */
  ingevuld: number
}

export function berekenUitslag(blad: Beslisblad, campusIds: string[]): Uitslag {
  const punten = new Map(campusIds.map((id) => [id, 0]))
  const keerBeste = new Map(campusIds.map((id) => [id, 0]))
  let maximum = 0
  let meewegend = 0
  let ingevuld = 0

  for (const onderwerp of ONDERWERPEN) {
    const gewicht = gewichtVan(blad, onderwerp.id)
    if (gewicht === 0) continue
    meewegend++
    if (!isIngevuld(blad, onderwerp.id, campusIds)) continue
    ingevuld++
    maximum += gewicht * PUNTEN.beste
    for (const id of campusIds) {
      const plaats = plaatsVan(blad, onderwerp.id, id, campusIds)
      if (!plaats) continue
      punten.set(id, (punten.get(id) ?? 0) + gewicht * PUNTEN[plaats])
      if (plaats === 'beste') keerBeste.set(id, (keerBeste.get(id) ?? 0) + 1)
    }
  }

  const stand = campusIds.map((id) => ({
    campusId: id,
    punten: punten.get(id) ?? 0,
    op100: maximum > 0 ? ((punten.get(id) ?? 0) / maximum) * 100 : 0,
    keerBeste: keerBeste.get(id) ?? 0,
    plaats: 0,
  }))
  for (const s of stand) s.plaats = 1 + stand.filter((ander) => ander.punten > s.punten).length
  return { stand, meewegend, ingevuld }
}

/**
 * Hoe groot een voorsprong moet zijn om iets te betekenen, in punten op 100. Onder `RUIS`
 * zegt het blad uitdrukkelijk dat het niet voor de bezoeker kiest; onder `SMAL` dat één ander
 * gewicht het kan omdraaien. Overgenomen uit het blad waar dit idee vandaan komt.
 */
export const RUIS = 3
export const SMAL = 8
