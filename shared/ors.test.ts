import { describe, expect, it } from 'vitest'
import { leesRoute } from './ors.js'

// Ingekorte vorm van een echt antwoord van het geojson-endpoint (21/11/2026).
const antwoord = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.420932, 51.217203],
          [4.4209461, 51.2175123],
        ],
      },
      properties: { summary: { distance: 7029.9, duration: 1483.3 } },
    },
  ],
}

describe('leesRoute', () => {
  it('rekent afstand en duur om naar km en minuten', () => {
    const route = leesRoute(antwoord)
    expect(route.afstandKm).toBeCloseTo(7.0299)
    expect(route.duurMin).toBeCloseTo(24.72, 2)
  })

  it('draait het traject om naar lat,lon en rondt af op 5 decimalen', () => {
    expect(leesRoute(antwoord).traject).toEqual([
      [51.2172, 4.42093],
      [51.21751, 4.42095],
    ])
  })

  it('weigert een antwoord zonder route', () => {
    expect(() => leesRoute({ features: [] })).toThrow('ORS gaf geen route terug')
    expect(() => leesRoute({ error: { code: 2010 } })).toThrow()
  })
})
