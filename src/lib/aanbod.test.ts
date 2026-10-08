import { describe, expect, it } from 'vitest'
import type { Campus, Richting, SchoolOpCampus } from '../types'
import { campusAanbod, korteNaam } from './aanbod'

function richting(naam: string, extra: Partial<Richting> = {}): Richting {
  return {
    naam,
    graad: 'Tweede graad',
    finaliteit: 'Doorstroom',
    inschrijvingenOpen: false,
    ...extra,
  } as Richting
}

function campus(...richtingenPerSchool: Richting[][]): Campus {
  return {
    scholen: richtingenPerSchool.map((richtingen) => ({ richtingen }) as SchoolOpCampus),
  } as Campus
}

describe('korteNaam', () => {
  it('haalt het leerjaar-voorvoegsel weg', () => {
    expect(korteNaam('1e leerjaar in de 2e graad Latijn ASO')).toBe('Latijn ASO')
  })

  it('laat namen zonder dat voorvoegsel ongemoeid', () => {
    expect(korteNaam('1ste leerjaar A')).toBe('1ste leerjaar A')
  })
})

describe('campusAanbod', () => {
  it('voegt de leerjaren van dezelfde richting samen tot één regel', () => {
    const aanbod = campusAanbod(
      campus([
        richting('1e leerjaar in de 2e graad Latijn ASO'),
        richting('2e leerjaar in de 2e graad Latijn ASO'),
      ]),
    )
    expect(aanbod.map((r) => r.naam)).toEqual(['Latijn ASO'])
  })

  it('telt dezelfde richting bij twee scholen op één adres maar één keer', () => {
    const aanbod = campusAanbod(campus([richting('Economie')], [richting('Economie')]))
    expect(aanbod).toHaveLength(1)
  })

  it('houdt dezelfde naam in een andere graad of finaliteit apart', () => {
    const aanbod = campusAanbod(
      campus([
        richting('Economie'),
        richting('Economie', { graad: 'Derde graad' }),
        richting('Economie', { finaliteit: 'Dubbel' }),
      ]),
    )
    expect(aanbod).toHaveLength(3)
  })

  it('zet inschrijvingen open zodra één van de samengevoegde regels open is', () => {
    const aanbod = campusAanbod(
      campus([richting('Economie')], [richting('Economie', { inschrijvingenOpen: true })]),
    )
    expect(aanbod[0].inschrijvingenOpen).toBe(true)
  })

  it('sorteert op naam, op zijn Nederlands', () => {
    const aanbod = campusAanbod(campus([richting('Wiskunde'), richting('ademhaling'), richting('Bouw')]))
    expect(aanbod.map((r) => r.naam)).toEqual(['ademhaling', 'Bouw', 'Wiskunde'])
  })
})
