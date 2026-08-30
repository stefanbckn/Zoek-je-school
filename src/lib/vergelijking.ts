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
