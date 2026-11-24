import { DOMEIN_RIJEN } from './domein'
import { FINALITEIT_OPTIONS, type FinaliteitKeuze } from './aanbod'
import type { Campus, Studierichting } from '../types'

/**
 * De matrix secundair onderwijs: studiedomein (rij) × finaliteit (kolom), per graad.
 *
 * Wat hier gebeurt is enkel ordenen, geen afleiden. Domein en finaliteit staan allebei als
 * veld op de richting in de bron (zie docs/onderzoek/matrix-studiedomein.md); deze module legt
 * ze naast elkaar. Er wordt níét afgeleid welke richting op welke volgt — die doorstroom staat
 * in geen enkele bron die we hebben, en een pijl tekenen zou een gok zijn.
 */

/**
 * De graden in de schakelaar van de matrix. De tweede en de derde graad krijgen een raster; de
 * eerste graad een lijst per leerjaar (zie `bouwEersteGraad`), want daar bestaan domein en
 * finaliteit nog niet. OKAN en HBO5 vallen erbuiten.
 */
export const MATRIX_GRADEN = ['Eerste graad', 'Tweede graad', 'Derde graad'] as const

export type MatrixGraad = (typeof MATRIX_GRADEN)[number]

/** De graden met een raster van domein × finaliteit. */
export type RasterGraad = Exclude<MatrixGraad, 'Eerste graad'>

export interface MatrixRichting extends Studierichting {
  /** Adressen binnen de huidige plaatsfilters die deze richting aanbieden. */
  aantalHier: number
}

export interface MatrixCel {
  domeinCode: string
  finaliteit: FinaliteitKeuze
  richtingen: MatrixRichting[]
}

export interface MatrixRij {
  domeinCode: string
  cellen: MatrixCel[]
  /**
   * De zevende leerjaren van dit domein. Ze staan apart omdat ze wél een domein hebben maar
   * geen finaliteit (broncode `7E`): in een van de drie kolommen zetten zou een finaliteit
   * verzinnen die de bron niet geeft.
   */
  zevendeLeerjaren: MatrixRichting[]
}

/**
 * Op hoeveel van deze adressen elke studierichting aangeboden wordt. Sleutel is
 * `studierichtingCode|graad`, dezelfde als in de catalogus.
 *
 * Per adres geteld, niet per school: twee scholen op één campus die dezelfde richting
 * inrichten, zijn voor wie zoekt één plek. Zie .claude/rules/datamodel.md.
 */
export function telPerRichting(campussen: Campus[]): Map<string, number> {
  const tellingen = new Map<string, number>()
  for (const campus of campussen) {
    const opDitAdres = new Set<string>()
    for (const school of campus.scholen) {
      for (const richting of school.richtingen) {
        if (richting.studierichtingCode) {
          opDitAdres.add(`${richting.studierichtingCode}|${richting.graad}`)
        }
      }
    }
    for (const sleutel of opDitAdres) {
      tellingen.set(sleutel, (tellingen.get(sleutel) ?? 0) + 1)
    }
  }
  return tellingen
}

/**
 * Bouwt de matrix van één graad. Alle richtingen van die graad komen erin, ook die met
 * `aantalHier === 0`: dat een richting in jouw buurt niet bestaat, is precies wat een ouder
 * hier wil zien. De weergave dimt ze, de matrix laat ze niet vallen.
 *
 * Richtingen zonder domein (eerste graad A/B, OKAN, HBO5) horen niet in de matrix en vallen
 * hier stil weg — ze hebben ook geen finaliteit.
 */
export function bouwMatrix(
  catalogus: Studierichting[],
  graad: RasterGraad,
  tellingen: Map<string, number>,
): MatrixRij[] {
  const vanDezeGraad = catalogus
    .filter((s) => s.graad === graad && s.domeinCode !== null)
    .map<MatrixRichting>((s) => ({
      ...s,
      aantalHier: tellingen.get(`${s.code}|${s.graad}`) ?? 0,
    }))

  return DOMEIN_RIJEN.map((domeinCode) => {
    const vanDitDomein = vanDezeGraad.filter((s) => s.domeinCode === domeinCode)
    return {
      domeinCode,
      cellen: FINALITEIT_OPTIONS.map((finaliteit) => ({
        domeinCode,
        finaliteit,
        richtingen: vanDitDomein.filter((s) => !s.zevendeLeerjaar && s.finaliteit === finaliteit),
      })),
      zevendeLeerjaren: vanDitDomein.filter((s) => s.zevendeLeerjaar),
    }
  }).filter((rij) => rij.cellen.some((c) => c.richtingen.length > 0) || rij.zevendeLeerjaren.length > 0)
}

/** Hoeveel richtingen staan er in deze rij, zevende leerjaren niet meegeteld? */
export function aantalInRij(rij: MatrixRij): number {
  return rij.cellen.reduce((n, c) => n + c.richtingen.length, 0)
}

// ---------------------------------------------------------------------------------------------
// De eerste graad
// ---------------------------------------------------------------------------------------------

/**
 * De vier leerjaren van de eerste graad, in de volgorde waarin een leerling ze doorloopt.
 *
 * **Waar het leerjaar vandaan komt.** De catalogus (`richtingen.json`) zegt enkel "Eerste
 * graad". Het leerjaar staat wel in de naam van elke aangeboden rij: "1ste leerjaar A",
 * "2e leerjaar A Sport", "2e leerjaar B Stem-technieken". Nagekeken op 24/11/2026 over alle
 * 4954 rijen van de eerste graad in `vestigingen.json`: elke rij begint met één van deze vier,
 * zonder uitzondering. Dat is geen richtingnaam die we hardcoderen maar de officiële
 * benaming van het leerjaar.
 *
 * Basisopties bestaan pas vanaf het tweede leerjaar; het eerste leerjaar heeft enkel
 * differentiatie-uren, die geen eigen code hebben (zie `/uitleg/`). En alle combinaties van
 * basisopties staan in 2B, waar er tot drie gecombineerd mogen worden.
 */
export const EERSTE_GRAAD_LEERJAREN = ['1A', '1B', '2A', '2B'] as const

export type EersteGraadLeerjaar = (typeof EERSTE_GRAAD_LEERJAREN)[number]

/** Het leerjaar uit de naam van een aangeboden rij, of null als de naam niet zo begint. */
export function leerjaarUitNaam(naam: string): EersteGraadLeerjaar | null {
  const m = /^(1ste|2e) leerjaar ([AB])(?:\s|$)/.exec(naam)
  if (!m) return null
  return `${m[1] === '1ste' ? '1' : '2'}${m[2]}` as EersteGraadLeerjaar
}

export interface EersteGraadBlok {
  leerjaar: EersteGraadLeerjaar
  richtingen: MatrixRichting[]
}

export interface EersteGraadLijst {
  /** Per leerjaar de richtingen die er bestaan. Een optie als Sport staat in 2A én 2B. */
  blokken: EersteGraadBlok[]
  /**
   * Richtingen met een domein die nergens in Vlaanderen aangeboden worden. Die kunnen we bij
   * geen leerjaar zetten, want het leerjaar staat enkel op een aangeboden rij. Ze laten vallen
   * zou verbergen dat ze bestaan; gokken bij welk leerjaar ze horen kan niet.
   */
  zonderLeerjaar: MatrixRichting[]
}

/**
 * Op hoeveel adressen elke richting van de eerste graad per leerjaar aangeboden wordt.
 * Sleutel `studierichtingCode|leerjaar`. Per adres geteld, net als `telPerRichting`.
 */
export function telEersteGraad(campussen: Campus[]): Map<string, number> {
  const tellingen = new Map<string, number>()
  for (const campus of campussen) {
    const opDitAdres = new Set<string>()
    for (const school of campus.scholen) {
      for (const richting of school.richtingen) {
        if (richting.graad !== 'Eerste graad' || !richting.studierichtingCode) continue
        const leerjaar = leerjaarUitNaam(richting.naam)
        if (leerjaar) opDitAdres.add(`${richting.studierichtingCode}|${leerjaar}`)
      }
    }
    for (const sleutel of opDitAdres) {
      tellingen.set(sleutel, (tellingen.get(sleutel) ?? 0) + 1)
    }
  }
  return tellingen
}

/**
 * De eerste graad als lijst per leerjaar.
 *
 * @param alleTellingen `telEersteGraad` over **alle** adressen: daaruit volgt bij welk leerjaar
 *   een richting hoort. Niet over het gekozen gebied, anders verdwijnt een optie uit haar blok
 *   zodra ze in jouw buurt niet bestaat, terwijl ze dan net gedimd op 0 moet blijven staan.
 * @param tellingenHier `telEersteGraad` over de adressen in het gekozen gebied: het getal.
 *
 * Richtingen zonder domein vallen weg als ze nergens aangeboden worden: dat zijn de
 * Franstalige BuSO-jaren en opleidingsvorm 4, geen keuze in het gewoon secundair onderwijs.
 * 1A en 1B hebben ook geen domein, maar die worden wel aangeboden en komen dus mee.
 */
export function bouwEersteGraad(
  catalogus: Studierichting[],
  alleTellingen: Map<string, number>,
  tellingenHier: Map<string, number>,
): EersteGraadLijst {
  const vanDezeGraad = catalogus
    .filter((s) => s.graad === 'Eerste graad')
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))

  const blokken: EersteGraadBlok[] = EERSTE_GRAAD_LEERJAREN.map((leerjaar) => ({
    leerjaar,
    richtingen: vanDezeGraad
      .filter((s) => alleTellingen.has(`${s.code}|${leerjaar}`))
      .map((s) => ({ ...s, aantalHier: tellingenHier.get(`${s.code}|${leerjaar}`) ?? 0 })),
  }))

  const zonderLeerjaar = vanDezeGraad
    .filter((s) => s.domeinCode !== null)
    .filter((s) => !EERSTE_GRAAD_LEERJAREN.some((l) => alleTellingen.has(`${s.code}|${l}`)))
    .map((s) => ({ ...s, aantalHier: 0 }))

  return { blokken, zonderLeerjaar }
}
