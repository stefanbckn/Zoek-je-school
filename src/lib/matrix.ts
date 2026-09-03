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

/** De graden die een matrix krijgen. De eerste graad, OKAN en HBO5 vallen erbuiten. */
export const MATRIX_GRADEN = ['Tweede graad', 'Derde graad'] as const

export type MatrixGraad = (typeof MATRIX_GRADEN)[number]

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
  graad: MatrixGraad,
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
