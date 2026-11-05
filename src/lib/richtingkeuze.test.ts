import { describe, expect, it } from 'vitest'
import {
  keuzesOpCampus,
  parseRichtingKeuzes,
  richtingInKeuzes,
  richtingKeuzesNaarUrl,
  zoekRichtingen,
} from './richtingkeuze'
import type { Campus, Richting, SchoolOpCampus, Studierichting } from '../types'
import richtingenJson from '../../public/data/richtingen.json'

const catalogus = richtingenJson as Studierichting[]

describe('parseRichtingKeuzes', () => {
  it('leest een link van vóór 2.14.0 met één code en één graad', () => {
    expect(parseRichtingKeuzes('1271', 'Tweede graad')).toEqual([
      { code: '1271', graad: 'Tweede graad' },
    ])
  })

  it('leest een oude link met een code zonder graad als elke graad', () => {
    expect(parseRichtingKeuzes('1271', null)).toEqual([{ code: '1271', graad: null }])
  })

  it('koppelt codes en graden per positie, ook met een lege plek', () => {
    expect(parseRichtingKeuzes('1,2,3', 'Tweede graad,,Derde graad')).toEqual([
      { code: '1', graad: 'Tweede graad' },
      { code: '2', graad: null },
      { code: '3', graad: 'Derde graad' },
    ])
  })

  it('ontdubbelt en laat lege codes vallen', () => {
    expect(parseRichtingKeuzes('1,,1', 'Tweede graad,,Tweede graad')).toEqual([
      { code: '1', graad: 'Tweede graad' },
    ])
  })

  it('komt heelhuids terug uit de eigen URL-vorm', () => {
    const keuzes = [
      { code: '1', graad: 'Tweede graad' },
      { code: '2', graad: null },
    ]
    const url = richtingKeuzesNaarUrl(keuzes)!
    expect(parseRichtingKeuzes(url.rcode, url.rgraad)).toEqual(keuzes)
  })
})

describe('richtingInKeuzes', () => {
  const richting = { studierichtingCode: '1271', graad: 'Derde graad' } as Richting

  it('vraagt code én graad', () => {
    expect(richtingInKeuzes(richting, [{ code: '1271', graad: 'Tweede graad' }])).toBe(false)
    expect(richtingInKeuzes(richting, [{ code: '1271', graad: 'Derde graad' }])).toBe(true)
  })

  it('is een OF over de keuzes', () => {
    expect(
      richtingInKeuzes(richting, [
        { code: '9999', graad: 'Derde graad' },
        { code: '1271', graad: null },
      ]),
    ).toBe(true)
  })
})

describe('zoekRichtingen op de echte catalogus', () => {
  it('vindt bij "sport" ook Topsport, maar zet "Sport" erboven', () => {
    const namen = zoekRichtingen(catalogus, 'sport', new Map()).map((r) => r.naam)
    expect(namen[0].toLowerCase().startsWith('sport')).toBe(true)
    expect(namen.indexOf('Sport')).toBeLessThan(namen.indexOf('Topsport'))
  })

  it('zet richtingen die in het gebied bestaan vóór die met 0 adressen', () => {
    const sport = catalogus.filter((r) => r.naam === 'Sport')
    expect(sport.length).toBe(2)
    const [eerste, tweede] = sport
    const tellingen = new Map([[`${tweede.code}|${tweede.graad}`, 3]])
    const gevonden = zoekRichtingen(catalogus, 'sport', tellingen)
    expect(gevonden.indexOf(tweede)).toBeLessThan(gevonden.indexOf(eerste))
  })

  it('negeert hoofdletters en accenten', () => {
    const namen = zoekRichtingen(catalogus, 'COMMERCIELE', new Map()).map((r) => r.naam)
    expect(namen).toContain('Commerciële organisatie')
  })

  it('geeft niets bij een lege zoekterm', () => {
    expect(zoekRichtingen(catalogus, '  ', new Map())).toEqual([])
  })
})

describe('keuzesOpCampus', () => {
  const r = (code: string, graad: string) => ({ studierichtingCode: code, graad }) as Richting
  const campus = (...perSchool: Richting[][]) =>
    ({ scholen: perSchool.map((richtingen) => ({ richtingen }) as SchoolOpCampus) }) as Campus
  const sport = { code: '1', graad: 'Derde graad' }
  const wiskunde = { code: '2', graad: 'Derde graad' }

  it('geeft enkel de keuzes die het adres aanbiedt', () => {
    expect(keuzesOpCampus(campus([r('1', 'Derde graad')]), [sport, wiskunde])).toEqual([sport])
  })

  it('telt de scholen op één adres samen, in de volgorde van de keuzes', () => {
    const c = campus([r('2', 'Derde graad')], [r('1', 'Derde graad')])
    expect(keuzesOpCampus(c, [sport, wiskunde])).toEqual([sport, wiskunde])
  })

  it('kijkt naar de graad', () => {
    expect(keuzesOpCampus(campus([r('1', 'Tweede graad')]), [sport])).toEqual([])
  })
})
