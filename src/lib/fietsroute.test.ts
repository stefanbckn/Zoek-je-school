import { afterEach, describe, expect, it, vi } from 'vitest'
import { berekenFietsroute } from './fietsroute'

function antwoord(body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })))
}

// Elke test een ander punt: berekenFietsroute cachet per route-paar.
let n = 0
const punten = () => {
  n += 1
  return [
    { lat: 51.2 + n / 1000, lon: 4.42 },
    { lat: 51.17, lon: 4.39 },
  ] as const
}

afterEach(() => vi.unstubAllGlobals())

describe('berekenFietsroute', () => {
  it('geeft het traject door', async () => {
    antwoord({ afstandKm: 7, duurMin: 25, traject: [[51.2, 4.4], [51.17, 4.39]] })
    const r = await berekenFietsroute(...punten())
    expect(r).toEqual({
      status: 'ok',
      route: { afstandKm: 7, duurMin: 25, traject: [[51.2, 4.4], [51.17, 4.39]] },
    })
  })

  it('houdt afstand en duur bij een oud antwoord zonder traject', async () => {
    antwoord({ afstandKm: 7, duurMin: 25 })
    const r = await berekenFietsroute(...punten())
    expect(r).toEqual({ status: 'ok', route: { afstandKm: 7, duurMin: 25, traject: [] } })
  })

  it('laat een kapot traject vallen', async () => {
    antwoord({ afstandKm: 7, duurMin: 25, traject: [[51.2, 'x'], [51.17, 4.39]] })
    const r = await berekenFietsroute(...punten())
    expect(r.status === 'ok' && r.route.traject).toEqual([])
  })
})
