import { describe, expect, it } from 'vitest'
import { transitousPlannerUrl, volgendeSchooldagOchtend } from './ov'

// Deze tests draaien in Europe/Brussels (zie het npm-script `test`): de functies rekenen in
// lokale tijd, en op GitHub staat de klok op UTC.

describe('volgendeSchooldagOchtend', () => {
  it('neemt vandaag 8u30 als dat nog moet komen', () => {
    const doel = volgendeSchooldagOchtend(new Date(2026, 9, 8, 7, 0)) // donderdag
    expect(doel).toEqual(new Date(2026, 9, 8, 8, 30))
  })

  it('schuift door naar morgen zodra 8u30 bereikt is', () => {
    const doel = volgendeSchooldagOchtend(new Date(2026, 9, 8, 8, 30))
    expect(doel).toEqual(new Date(2026, 9, 9, 8, 30))
  })

  it('slaat het weekend over op vrijdag na 8u30', () => {
    const doel = volgendeSchooldagOchtend(new Date(2026, 9, 9, 10, 0))
    expect(doel).toEqual(new Date(2026, 9, 12, 8, 30))
  })

  it('slaat het weekend over op zondagochtend', () => {
    const doel = volgendeSchooldagOchtend(new Date(2026, 9, 11, 7, 0))
    expect(doel).toEqual(new Date(2026, 9, 12, 8, 30))
  })

  it('blijft op 8u30 lokale tijd over de overgang naar wintertijd heen', () => {
    // In de nacht van 24 op 25 oktober 2026 gaat de klok een uur terug.
    const doel = volgendeSchooldagOchtend(new Date(2026, 9, 24, 20, 0))
    expect(doel.getDate()).toBe(26)
    expect(doel.getHours()).toBe(8)
    expect(doel.getMinutes()).toBe(30)
  })
})

describe('transitousPlannerUrl', () => {
  const van = { lat: 51.2172, lon: 4.4211 }
  const naar = { lat: 51.1784, lon: 4.3925 }

  it('zet de aankomst in lokale tijd, niet in UTC', () => {
    // Met toISOString() werd dit in de zomer 06:30.
    const url = new URL(
      transitousPlannerUrl(van, naar, { van: 'Thuis', naar: 'School' }, new Date(2026, 8, 14, 8, 30)),
    )
    expect(url.searchParams.get('time')).toBe('2026-09-14T08:30')
    expect(url.searchParams.get('arriveBy')).toBe('true')
  })

  it('geeft coördinaten als lat,lon en houdt namen met een schuine streep heel', () => {
    const url = new URL(
      transitousPlannerUrl(van, naar, { van: 'Thuis', naar: 'Campus A/B' }, new Date(2026, 8, 14, 8, 30)),
    )
    expect(url.searchParams.get('fromPlace')).toBe('51.2172,4.4211')
    expect(url.searchParams.get('toName')).toBe('Campus A/B')
  })
})
