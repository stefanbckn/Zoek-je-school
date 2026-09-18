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

/**
 * De naam waaronder een ouder een adres kent, voor het beslisblad. De vergelijking blijft per
 * adres (zie `campusLabel`), maar kiezen doe je voor een school, niet voor een straat.
 *
 * Elke naam die hier verschijnt, staat letterlijk in de dataset; er wordt niets ingekort of
 * samengesteld. Drie gevallen, gemeten op 1075 adressen op 18/09/2026:
 *
 * - **Eén school (611 adressen):** haar naam.
 * - **Eén naam waarmee alle andere beginnen (66):** die naam. "Sint-Gabriëlcollege" naast
 *   "Sint-Gabriëlcollege - Middenschool 1" is voor een ouder één school. Het moet een volledig
 *   woord zijn: "Sint-" gevolgd door iets anders telt niet.
 * - **Echt verschillende namen (398):** de eerste twee, en hoeveel er nog zijn. Daar bestaat
 *   geen naam die het hele adres dekt, en er een kiezen zou de andere scholen wegmoffelen.
 *
 * Het adres staat in het blad altijd klein onder dit label.
 */
export function schoolLabel(campus: Campus): string {
  const namen = [...new Set(campus.scholen.map((s) => s.naam))]
  if (namen.length === 0) return campusLabel(campus)
  if (namen.length === 1) return namen[0]

  const gedeeld = namen.find((kort) =>
    namen.every(
      (naam) => naam === kort || (naam.startsWith(kort) && /^[\s,-]/.test(naam.slice(kort.length))),
    ),
  )
  if (gedeeld) return gedeeld

  if (namen.length === 2) return `${namen[0]} en ${namen[1]}`
  return `${namen[0]}, ${namen[1]} en ${namen.length - 2} andere`
}
