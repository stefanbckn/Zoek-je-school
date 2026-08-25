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
  naam: string
  isHoofdzetel: boolean
  net: Net
  straat: string
  huisnummer: string
  postcode: string
  gemeente: string
  niscode: string
  /** Null als de bron geen (geldige) lx/ly-coördinaten heeft voor deze vestiging. */
  lat: number | null
  lon: number | null
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

export interface VestigingMetAfstand extends Vestiging {
  /** Hemelsbrede afstand in km tot de gezochte locatie, of null als er geen locatie gekozen is. */
  afstandKm: number | null
}

export interface DatasetMeta {
  opgehaaldOp: string
  bron: string[]
  aantalVestigingenTotaal: number
  aantalVestigingenAntwerpen: number
}
