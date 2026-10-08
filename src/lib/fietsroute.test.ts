import { describe, expect, it } from 'vitest'
import { orsKaartUrl } from './fietsroute'

describe('orsKaartUrl', () => {
  const url = orsKaartUrl(
    { lat: 51.2172, lon: 4.4211 },
    { lat: 51.1784, lon: 4.3925 },
    { van: 'Thuis', naar: 'Sint-Jan/Campus Noord' },
  )
  const [, pad] = url.split('#/directions/')
  const delen = pad.split('/')

  it('houdt een schoolnaam met een schuine streep in één padstuk', () => {
    expect(delen).toHaveLength(4)
    expect(decodeURIComponent(delen[1])).toBe('Sint-Jan/Campus Noord')
  })

  it('zet de coördinaten als lon,lat, omgekeerd van de rest van de app', () => {
    const data = JSON.parse(decodeURIComponent(delen[3]))
    expect(data.coordinates).toBe('4.4211,51.2172;4.3925,51.1784')
    expect(data.options.profile).toBe('cycling-regular')
  })
})
