export type Net =
  | 'GO!'
  | 'Officieel gesubsidieerd'
  | 'Vrij gesubsidieerd'
  | 'Onafhankelijk'

export type StatusErkenning = 'S' | 'E'

/**
 * Eén apart geregistreerde school (eigen schoolnummer) op een campus. Meerdere scholen
 * kunnen hetzelfde fysieke adres (dezelfde Campus) delen — zie CLAUDE.md.
 */
export interface SchoolOpCampus {
  id: string
  schoolnummer: string
  internVplnummer: string
  naam: string
  isHoofdzetel: boolean
  net: Net
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

/**
 * Eén fysiek adres, met alle scholen die daar geregistreerd zijn (vaak 1, soms meerdere
 * apart geregistreerde scholen op dezelfde campus). Dit is de eenheid die de app toont —
 * niet de individuele school — zodat scholen op hetzelfde gebouw niet als losse, verwarrende
 * kaartjes verschijnen.
 */
export interface Campus {
  id: string
  straat: string
  huisnummer: string
  postcode: string
  gemeente: string
  niscode: string
  /** Null als de bron geen (geldige) lx/ly-coördinaten heeft voor dit adres. */
  lat: number | null
  lon: number | null
  scholen: SchoolOpCampus[]
}

export interface CampusMetAfstand extends Campus {
  /** Hemelsbrede afstand in km tot de gezochte locatie, of null als er geen locatie gekozen is. */
  afstandKm: number | null
}

export interface DatasetMeta {
  opgehaaldOp: string
  bron: string[]
  aantalVestigingenTotaal: number
  aantalVestigingenAntwerpen: number
  aantalCampussenAntwerpen: number
}
