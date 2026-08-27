export type Net =
  | 'GO!'
  | 'Officieel gesubsidieerd'
  | 'Vrij gesubsidieerd'
  | 'Onafhankelijk'

/**
 * Soort schoolbestuur, uit de Codelijst-API (`/codelijst/soort_bestuur`). Dit maakt het
 * onderscheid dat `net` niet kan maken: binnen "Officieel gesubsidieerd" zitten zowel
 * provinciale als gemeentelijke/stedelijke scholen. Zit niet op de school zelf maar op het
 * bestuur — zie CLAUDE.md.
 */
export type SoortBestuur =
  | 'GO!'
  | 'Vrij'
  | 'Provincie'
  | 'Gemeente'
  | 'OCMW'
  | 'Intercommunale'
  | 'Vlaamse Gemeenschap'
  | 'Andere'

export type StatusErkenning = 'S' | 'E'

/**
 * Finaliteit van een studierichting in de 2e/3e graad. Komt rechtstreeks uit de
 * catalogus `/administratievegroep` (veld `administratievegroep_finaliteit`) — niet afgeleid.
 * `null` voor de eerste graad, 7e leerjaren, OKAN en HBO5, waar finaliteit niet van toepassing is.
 */
export type Finaliteit = 'Doorstroom' | 'Dubbel' | 'Arbeidsmarkt' | null

/** Eén studierichting zoals die op een specifieke vestiging wordt aangeboden. */
export interface Richting {
  /** `administratievegroep_code` — stabiel over schooljaren heen. */
  code: number
  naam: string
  /** 'Eerste graad' | 'Tweede graad' | 'Derde graad' | ... , of null. */
  graad: string | null
  finaliteit: Finaliteit
  /** Oude onderwijsvorm (ASO/TSO/BSO/KSO/GSO). Blijft in de brondata naast finaliteit bestaan. */
  onderwijsvorm: string | null
  studiegebied: string | null
  duaal: boolean
  /** Of er voor dit schooljaar ingeschreven kan worden in deze richting op deze vestiging. */
  inschrijvingenOpen: boolean
}

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
  soortBestuur: SoortBestuur | null
  /** Bv. 'Katholiek', 'Niet-confessioneel'. Null als de bron het niet vermeldt. */
  levensbeschouwing: string | null
  telefoon: string | null
  email: string | null
  website: string | null
  linkFiche: string
  statusErkenning: StatusErkenning
  scholengemeenschap: string | null
  /** Studieaanbod op déze vestiging. Lege array = geen aanbod geregistreerd. */
  richtingen: Richting[]
  /** Placeholder voor v0.5 (kostprijs/materiaalkost). */
  kostprijs: null
  /** Placeholder voor v0.6 (fietsenstalling, halte-afstand, ...). */
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
  /** Null als de bron geen (geldige) coördinaten heeft voor dit adres. */
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
  /** Schooljaar waarop het studieaanbod slaat (bv. 2026 = schooljaar 2026-2027). */
  schooljaarAanbod: number | null
  aantalVestigingenTotaal: number
  aantalVestigingenAntwerpen: number
  aantalCampussenAntwerpen: number
  aantalRichtingen: number
}
