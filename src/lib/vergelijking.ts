import type { Campus } from '../types'
import { huisnummerLabel } from './adres'

/**
 * Hoeveel campussen er tegelijk vergeleken kunnen worden.
 *
 * Vier is geen willekeurig getal: bij vijf kolommen wordt elke kolom smaller dan een
 * schoolnaam en moet je op elk scherm zijwaarts scrollen om er twee naast elkaar te krijgen —
 * dan vergelijk je niet meer, dan blader je. Twee is het minimum waarbij "vergelijken" iets
 * betekent.
 */
export const MAX_VERGELIJK = 4
export const MIN_VERGELIJK = 2

/**
 * Korte aanduiding van een adres, voor de knoppenbalk en de kolomkoppen. Bewust de straat en
 * niet de schoolnaam: de vergelijking gaat over adressen, en op 130 van de 303 adressen staat
 * meer dan één school — er ís daar geen enkele naam die het adres dekt.
 */
export function campusLabel(campus: Campus): string {
  return `${campus.straat} ${huisnummerLabel(campus.huisnummer)}, ${campus.gemeente}`
}

/**
 * Zet een campus in of uit de vergelijking. Boven `MAX_VERGELIJK` verandert er niets — de
 * knoppen zijn dan al uitgeschakeld, maar een toetsenbord- of dubbelklikpad mag er niet
 * langs kunnen.
 */
export function toggleVergelijking(huidig: string[], id: string): string[] {
  if (huidig.includes(id)) return huidig.filter((x) => x !== id)
  if (huidig.length >= MAX_VERGELIJK) return huidig
  return [...huidig, id]
}

/** De verschillende schoolnamen op een adres, in de volgorde van de dataset. */
export function schoolNamen(campus: Campus): string[] {
  return [...new Set(campus.scholen.map((s) => s.naam))]
}

/**
 * Een naam waarmee alle andere namen op het adres beginnen, gevolgd door een spatie, komma of
 * streepje: "Sint-Gabriëlcollege" naast "Sint-Gabriëlcollege - Middenschool 1". Null als die
 * naam niet letterlijk in de dataset staat.
 *
 * Bewust geen gemeenschappelijk begin dat we zelf afknippen. Doorgemeten op 18/09/2026: dat
 * geeft wel "Moretus" en "KOGEKA", maar net zo goed "De", "GO!", "Vrije" en "Provinciale".
 */
function gedeeldeNaam(namen: string[]): string | null {
  return (
    namen.find((kort) =>
      namen.every(
        (naam) =>
          naam === kort || (naam.startsWith(kort) && /^[\s,-]/.test(naam.slice(kort.length))),
      ),
    ) ?? null
  )
}

/**
 * Moet de ouder zelf zeggen welke school hij bedoelt? Alleen op een adres met meerdere namen
 * zonder gedeelde naam: 398 van de 1075 adressen, gemeten op 18/09/2026.
 */
export function vraagtSchoolkeuze(campus: Campus): boolean {
  const namen = schoolNamen(campus)
  return namen.length > 1 && gedeeldeNaam(namen) === null
}

/**
 * De naam waaronder een ouder een adres kent, voor het beslisblad. De vergelijking blijft per
 * adres (zie `campusLabel`), maar kiezen doe je voor een school, niet voor een straat.
 *
 * Elke naam die hier verschijnt, staat letterlijk in de dataset; er wordt niets ingekort of
 * samengesteld. Gemeten op 1075 adressen op 18/09/2026:
 *
 * - **Eén school (611 adressen):** haar naam.
 * - **Eén naam waarmee alle andere beginnen (66):** die naam, zie `gedeeldeNaam`.
 * - **Echt verschillende namen (398):** de naam die de ouder koos in het beslisblad, of zolang
 *   dat niet gebeurd is de eerste naam en hoeveel er nog zijn. Er zelf één kiezen zou de andere
 *   scholen wegmoffelen; bij OLVE in Edegem staat de naam van het college nergens los, enkel
 *   met "1", "2" of "Middenschool" erachter.
 *
 * Het adres staat in het blad altijd klein onder dit label.
 */
export function schoolLabel(campus: Campus, gekozen?: string): string {
  const namen = schoolNamen(campus)
  if (namen.length === 0) return campusLabel(campus)
  if (namen.length === 1) return namen[0]
  if (gekozen && namen.includes(gekozen)) return gekozen
  return gedeeldeNaam(namen) ?? `${namen[0]} en ${namen.length - 1} andere`
}
