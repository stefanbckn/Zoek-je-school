import { describe, expect, it } from 'vitest'
import { bouwEersteGraad, leerjaarUitNaam, telEersteGraad } from './matrix'
import type { Campus, Studierichting } from '../types'
import richtingenJson from '../../public/data/richtingen.json'
import vestigingenJson from '../../public/data/vestigingen.json'

const catalogus = richtingenJson as Studierichting[]
const campussen = vestigingenJson as unknown as Campus[]

describe('leerjaarUitNaam', () => {
  it('leest de vier leerjaren van de eerste graad', () => {
    expect(leerjaarUitNaam('1ste leerjaar A')).toBe('1A')
    expect(leerjaarUitNaam('1ste leerjaar B')).toBe('1B')
    expect(leerjaarUitNaam('2e leerjaar A Sport')).toBe('2A')
    expect(leerjaarUitNaam('2e leerjaar B Stem-technieken')).toBe('2B')
  })

  it('geeft null voor alles wat niet zo begint', () => {
    expect(leerjaarUitNaam('Sport')).toBeNull()
    expect(leerjaarUitNaam('2e leerjaar Autotechniek')).toBeNull()
    expect(leerjaarUitNaam('2e leerjaar AB')).toBeNull()
  })
})

describe('de eerste graad in de echte dataset', () => {
  it('elke aangeboden rij van de eerste graad heeft een leerbaar leerjaar', () => {
    // Valt dit om na een dataverversing, dan heeft de bron de namen veranderd. Kijk dan eerst
    // of er een veld voor het leerjaar bijgekomen is, in plaats van de regex op te rekken.
    const zonder = campussen.flatMap((c) =>
      c.scholen.flatMap((s) =>
        s.richtingen.filter((r) => r.graad === 'Eerste graad' && leerjaarUitNaam(r.naam) === null),
      ),
    )
    expect(zonder.map((r) => r.naam)).toEqual([])
  })

  const alle = telEersteGraad(campussen)
  const lijst = bouwEersteGraad(catalogus, alle, alle)
  const blok = (l: string) => lijst.blokken.find((b) => b.leerjaar === l)!.richtingen

  it('zet 1A en 1B elk in hun eigen blok', () => {
    expect(blok('1A').map((r) => r.code)).toEqual(['1'])
    expect(blok('1B').map((r) => r.code)).toEqual(['2'])
  })

  it('heeft geen basisopties in het eerste leerjaar', () => {
    expect(blok('1A').length + blok('1B').length).toBe(2)
  })

  it('zet een optie die in 2A en 2B bestaat in beide blokken, elk met een eigen getal', () => {
    const sportA = blok('2A').find((r) => r.naam === 'Sport')
    const sportB = blok('2B').find((r) => r.naam === 'Sport')
    expect(sportA).toBeDefined()
    expect(sportB).toBeDefined()
    expect(sportA!.aantalHier).not.toBe(sportB!.aantalHier)
  })

  it('laat de Franstalige BuSO-jaren en opleidingsvorm 4 weg', () => {
    const alleNamen = [...lijst.blokken.flatMap((b) => b.richtingen), ...lijst.zonderLeerjaar]
    expect(alleNamen.some((r) => r.naam.includes('BuSO'))).toBe(false)
    expect(alleNamen.some((r) => r.naam.startsWith('Opleidingsvorm'))).toBe(false)
  })

  it('houdt een richting met domein die nergens bestaat apart, op 0', () => {
    for (const r of lijst.zonderLeerjaar) {
      expect(r.aantalHier).toBe(0)
      expect(r.domeinCode).not.toBeNull()
    }
  })

  it('laat een optie op 0 staan als ze in het gekozen gebied niet bestaat', () => {
    const leeg = bouwEersteGraad(catalogus, alle, new Map())
    expect(leeg.blokken.map((b) => b.richtingen.length)).toEqual(
      lijst.blokken.map((b) => b.richtingen.length),
    )
    expect(leeg.blokken.every((b) => b.richtingen.every((r) => r.aantalHier === 0))).toBe(true)
  })
})
