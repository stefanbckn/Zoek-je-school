export type Net =
  | 'GO!'
  | 'Officieel gesubsidieerd'
  | 'Vrij gesubsidieerd'
  | 'Onafhankelijk'

export type StatusErkenning = 'S' | 'E'

export interface Vestiging {
  id: string
  schoolnummer: string
  internVplnummer: string
  instellingsnaam: string
  vestigingsnaam: string
  isHoofdzetel: boolean
  net: Net
  straat: string
  huisnummer: string
  postcode: string
  gemeente: string
  niscode: string
  lat: number
  lon: number
  telefoon: string | null
  email: string | null
  website: string | null
  linkFiche: string
  statusErkenning: StatusErkenning
  scholengemeenschap: string | null
  /** Placeholder voor v0.2+ (nog geen API-key voor Onderwijsaanbod SO). */
  richtingen: null
  /** Placeholder voor v0.3 (kostprijs/materiaalkost). */
  kostprijs: null
  /** Placeholder voor v0.4 (fietsafstand, OV-reistijd, ...). */
  vervoer: null
}

export interface DatasetMeta {
  opgehaaldOp: string
  bron: string[]
  aantalVestigingenTotaal: number
  aantalVestigingenAntwerpen: number
}
