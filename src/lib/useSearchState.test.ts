import { describe, expect, it } from 'vitest'
import { parseNetten } from './useSearchState'

describe('parseNetten', () => {
  it('vertaalt de oude waarde uit gedeelde links naar Provinciaal en Gemeentelijk', () => {
    expect(parseNetten('Officieel gesubsidieerd').sort()).toEqual(['Gemeentelijk', 'Provinciaal'])
  })

  it('ontdubbelt wanneer de opvolger er ook al in staat', () => {
    expect(parseNetten('Gemeentelijk,Officieel gesubsidieerd').sort()).toEqual([
      'Gemeentelijk',
      'Provinciaal',
    ])
  })

  it('laat onbekende netten vallen in plaats van een filter te maken die nooit matcht', () => {
    expect(parseNetten('GO!,onzin')).toEqual(['GO!'])
  })

  it('geeft een lege lijst voor een lege of ontbrekende parameter', () => {
    expect(parseNetten(null)).toEqual([])
    expect(parseNetten('')).toEqual([])
  })
})
