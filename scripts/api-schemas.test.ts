import { describe, expect, it } from 'vitest'
import {
  Bestuur,
  BronVeranderd,
  Instelling,
  OPTIONELE_VELDEN,
  controleerAanwezigheid,
  valideer,
} from './api-schemas.ts'

const instelling = {
  instelling_nummer: 1234,
  instelling_naam: 'Testschool',
  instelling_naam_volledig: 'Testschool Voluit',
  instelling_hoofdzetel_vestigingsnr: 1,
  instelling_bestuur: { instellingsnummer: 9999 },
  instelling_net: { omschrijving: 'Gemeenschapsonderwijs' },
  instelling_status_erkenning: { code: 'E' },
  instelling_website: 'www.example.be',
  // Velden die het script niet gebruikt, mogen erbij staan en vallen weg.
  instelling_iets_anders: 'genegeerd',
}

describe('valideer', () => {
  it('laat een geldig record door en houdt enkel de velden uit het schema', () => {
    const [uit] = valideer('instellingen', Instelling, [instelling])
    expect(uit.instelling_naam).toBe('Testschool')
    expect('instelling_iets_anders' in uit).toBe(false)
  })

  it('aanvaardt een ontbrekend optioneel veld, ook als null', () => {
    const zonderNet = { ...instelling, instelling_net: undefined, instelling_email: null }
    expect(() => valideer('instellingen', Instelling, [zonderNet])).not.toThrow()
  })

  it('stopt met het pad naar het veld wanneer een verplicht veld hernoemd is', () => {
    const { instelling_naam_volledig: _weg, ...rest } = instelling
    const hernoemd = { ...rest, instelling_naam_lang: 'Testschool Voluit' }
    expect(() => valideer('instellingen', Instelling, [instelling, hernoemd])).toThrow(
      /instellingen: 1 van de 2 records.*\n.*record 1, veld instelling_naam_volledig/,
    )
  })

  it('gooit een BronVeranderd, zodat fetch-data.ts niet terugvalt op de oude dataset', () => {
    expect(() => valideer('instellingen', Instelling, [{}])).toThrow(BronVeranderd)
    expect(() =>
      controleerAanwezigheid('instellingen', [{}], ['instelling_net.omschrijving']),
    ).toThrow(BronVeranderd)
  })

  it('stopt wanneer een veld van type verandert', () => {
    const tekst = { instelling_nummer: 1, instelling_soort_bestuur: { code: 2 } }
    expect(() => valideer('schoolbesturen', Bestuur, [tekst])).toThrow(/instelling_soort_bestuur\.code/)
  })
})

describe('controleerAanwezigheid', () => {
  it('laat door zolang een optioneel veld in minstens één record staat', () => {
    expect(() =>
      controleerAanwezigheid('instellingen', [{}, { instelling_net: { omschrijving: 'x' } }], [
        'instelling_net.omschrijving',
      ]),
    ).not.toThrow()
  })

  it('stopt wanneer een optioneel veld nergens meer voorkomt', () => {
    const records = [{ instelling_net: { naam: 'x' } }, {}]
    expect(() =>
      controleerAanwezigheid('instellingen', records, [...OPTIONELE_VELDEN.instellingen]),
    ).toThrow(/instelling_net\.omschrijving/)
  })
})
