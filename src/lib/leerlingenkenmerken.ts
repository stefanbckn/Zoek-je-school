import type { Leerlingenkenmerken } from '../types'

/**
 * De vier GOK-indicatoren, in de bewoording van een ouder in plaats van die van de regelgeving
 * ("leerling wiens moeder niet gediplomeerd is in het secundair onderwijs"). De uitleg blijft
 * wel dicht bij de officiële definitie — zonder die zin is "buurt" niet te begrijpen.
 *
 * Staat hier en niet in een component omdat zowel het detailpaneel als de vergelijkingstabel
 * dezelfde vier rijen in dezelfde volgorde moet tonen. Lopen die uiteen, dan vergelijkt iemand
 * per ongeluk twee verschillende dingen.
 */
export const KENMERKEN: {
  veld: Exclude<keyof Leerlingenkenmerken, 'aantalLeerlingen'>
  label: string
  /** Korte label voor de vergelijkingstabel, waar de kenmerkkolom smal is. */
  kortLabel: string
  uitleg: string
}[] = [
  {
    veld: 'opleidingMoeder',
    label: 'Moeder zonder diploma secundair onderwijs',
    kortLabel: 'Moeder zonder diploma SO',
    uitleg: 'De moeder heeft het secundair onderwijs niet afgemaakt.',
  },
  {
    veld: 'schooltoelage',
    label: 'Krijgt een schooltoeslag',
    kortLabel: 'Schooltoeslag',
    uitleg: 'De toeslag die het gezin krijgt op basis van zijn inkomen.',
  },
  {
    veld: 'thuistaal',
    label: 'Spreekt thuis geen Nederlands',
    kortLabel: 'Thuis geen Nederlands',
    uitleg: 'De taal die de leerling thuis met het gezin spreekt, is niet het Nederlands.',
  },
  {
    veld: 'buurt',
    label: 'Woont in een buurt met veel schoolse vertraging',
    kortLabel: 'Buurt met schoolse vertraging',
    uitleg: 'In die buurt lopen relatief veel leerlingen schoolachterstand op.',
  },
]

/**
 * Aandeel (0 tot 1) als percentage met één decimaal, of 'onbekend' als het cijfer ontbreekt.
 *
 * Altijd één decimaal, ook bij een rond getal: in de vergelijkingstabel staan deze getallen
 * onder elkaar, en "31%" naast "33,8%" springt uit de kolom.
 */
export function percentageLabel(aandeel: number | null): string {
  if (aandeel === null) return 'onbekend'
  return `${(aandeel * 100).toLocaleString('nl-BE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

/** ISO-datum uit meta.json als leesbare Nederlandse datum. */
export function datumLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
