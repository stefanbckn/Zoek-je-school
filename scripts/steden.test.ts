import { describe, expect, it } from 'vitest'
import type { Campus } from '../src/types.ts'
import { adresSleutel } from './adres.ts'
import { afgeleideSteden, alleSteden } from './gemeenten-afgeleid.ts'
import { STEDEN, anker, controleerSlugs, hoortBij } from './steden.ts'

function adres(niscode: string, gemeente: string): Campus {
  return { niscode, gemeente } as Campus
}

describe('adresSleutel', () => {
  it('groepeert op postcode, straat en huisnummer, zonder hoofdlettergevoeligheid', () => {
    expect(adresSleutel({ postcode: '2000', straat: 'Meir', huisnummer: '1A' })).toBe(
      adresSleutel({ postcode: '2000', straat: 'MEIR', huisnummer: '1a' }),
    )
  })

  it('houdt een ander huisnummer apart', () => {
    expect(adresSleutel({ postcode: '2000', straat: 'Meir', huisnummer: '1' })).not.toBe(
      adresSleutel({ postcode: '2000', straat: 'Meir', huisnummer: '2' }),
    )
  })
})

describe('anker', () => {
  it('maakt van een naam met accenten en spaties een slug', () => {
    expect(anker('Nazareth-De Pinte')).toBe('nazareth-de-pinte')
    expect(anker('Sint-Lambrechts-Woluwe')).toBe('sint-lambrechts-woluwe')
    expect(anker('Bièvre')).toBe('bievre')
  })
})

describe('hoortBij', () => {
  const brussel = STEDEN.find((s) => s.slug === 'brussel')!

  it('leest een korte niscode als prefix, zodat "21" het hele gewest dekt', () => {
    expect(hoortBij(brussel, '21004')).toBe(true)
    expect(hoortBij(brussel, '21015')).toBe(true)
    expect(hoortBij(brussel, '12025')).toBe(false)
  })
})

describe('controleerSlugs', () => {
  it('stopt met een fout wanneer twee entries dezelfde slug krijgen', () => {
    expect(() =>
      controleerSlugs([
        { slug: 'brussel', naam: 'Brussel', niscode: '21' },
        { slug: 'brussel', naam: 'Brussel', niscode: '21004' },
      ]),
    ).toThrow(/brussel/)
  })

  it('laat unieke slugs door', () => {
    expect(() => controleerSlugs(STEDEN)).not.toThrow()
  })
})

describe('afgeleideSteden', () => {
  it('slaat niscodes over die al een eigen entry in STEDEN hebben', () => {
    const steden = afgeleideSteden([adres('12025', 'Mechelen'), adres('21004', 'Laken')])
    expect(steden).toEqual([])
  })

  it('kiest de plaatsnaam met de meeste adressen', () => {
    const steden = afgeleideSteden([
      adres('71004', 'Paal'),
      adres('71004', 'Beringen'),
      adres('71004', 'Beringen'),
    ])
    expect(steden).toEqual([{ slug: 'beringen', naam: 'Beringen', niscode: '71004' }])
  })

  it('kiest bij gelijke stand alfabetisch', () => {
    const steden = afgeleideSteden([adres('99999', 'Zele'), adres('99999', 'Aalter')])
    expect(steden[0].naam).toBe('Aalter')
  })
})

// Op de echte dataset: dit is wat `genereer-gemeentepaginas.ts` bij elke build doet.
describe('alleSteden op de gecommitte dataset', () => {
  const steden = alleSteden()

  it('geeft elke gemeente een eigen slug', () => {
    expect(() => controleerSlugs(steden)).not.toThrow()
  })

  it('geeft geen niscode zowel een eigen entry als een afgeleide', () => {
    const afgeleid = steden.slice(STEDEN.length)
    for (const stad of afgeleid) {
      expect(STEDEN.some((s) => hoortBij(s, stad.niscode))).toBe(false)
    }
  })
})
