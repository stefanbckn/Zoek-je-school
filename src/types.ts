/**
 * Het net zoals de app het toont. Fijner opgedeeld dan het `instelling_net`-veld van de API:
 * dat kent alleen GO! / Officieel gesubsidieerd / Vrij gesubsidieerd, waardoor provinciale en
 * gemeentelijke scholen op één hoop belanden. Het onderscheid komt uit `soort_bestuur` van het
 * schoolbestuur — zie .claude/rules/datamodel.md.
 *
 * 'Officieel gesubsidieerd' blijft bestaan als terugval voor officiële scholen met een bestuur
 * dat noch provincie noch gemeente is (OCMW, intercommunale, Vlaamse Gemeenschap). De mapping
 * mag er niet stilzwijgend op gokken dat die categorie leeg blijft.
 */
export type Net =
  | 'GO!'
  | 'Provinciaal'
  | 'Gemeentelijk'
  | 'Officieel gesubsidieerd'
  | 'Vrij gesubsidieerd'
  | 'Onafhankelijk'

/**
 * Soort schoolbestuur, uit de Codelijst-API (`/codelijst/soort_bestuur`). Dit maakt het
 * onderscheid dat `net` niet kan maken: binnen "Officieel gesubsidieerd" zitten zowel
 * provinciale als gemeentelijke/stedelijke scholen. Zit niet op de school zelf maar op het
 * bestuur — zie .claude/rules/datamodel.md.
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

/**
 * Het gebied waarin een adres ligt. Vijf provincies plus Brussel, want het Brussels
 * Hoofdstedelijk Gewest is geen provincie maar staat wél in dezelfde bron: de API is die van
 * de Vlaamse onderwijsadministratie, dus er zit per definitie enkel Nederlandstalig onderwijs
 * van de Vlaamse Gemeenschap in. Franstalige Brusselse scholen komen er niet in voor.
 *
 * De labels zijn ingekort tegenover de bron ('Provincie Antwerpen', 'Brussels Hoofdstedelijk
 * Gewest'), want ze staan als vinkje in de filterkolom en in de URL.
 */
export type Provincie =
  | 'Antwerpen'
  | 'Limburg'
  | 'Oost-Vlaanderen'
  | 'Vlaams-Brabant'
  | 'West-Vlaanderen'
  | 'Brussel'

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
 * De vier GOK-leerlingenkenmerken van één school, als aandeel van de leerlingen (0 tot 1).
 * Uit de AgODi-publicatie "voorschot werkingstoelagen" — zie .claude/rules/data-import.md.
 *
 * Drie dingen die hier vastliggen:
 * - **Dit hangt aan de school, niet aan de campus.** De publicatie telt per instelling; een
 *   school met drie vestigingen heeft één cijfer voor alle drie. Optellen over scholen die een
 *   adres delen zou een gemiddelde over andere leerlingenpopulaties maken. Niet doen.
 * - **Geen zelfberekende OKI.** De som van de vier gedeeld door het leerlingenaantal lijkt op
 *   de gepubliceerde OKI, maar is een afleiding. Zolang die niet naast het officiële cijfer
 *   gelegd is, tonen we de vier percentages en geen samengesteld getal.
 * - Een kenmerk kan `null` zijn als de bron de telling niet invult.
 */
export interface Leerlingenkenmerken {
  /** Leerlingen op de teldatum. Halven bestaan: leerlingen in co-ouderschap tellen half mee. */
  aantalLeerlingen: number
  /** Moeder is niet gediplomeerd in het secundair onderwijs. */
  opleidingMoeder: number | null
  /** Kreeg een schooltoeslag (selectiebeurs). */
  schooltoelage: number | null
  /** Spreekt thuis niet (of niet altijd) Nederlands met gezinsleden. */
  thuistaal: number | null
  /** Woont in een buurt met een hoge schoolse vertraging. */
  buurt: number | null
}

/**
 * Eén apart geregistreerde school (eigen schoolnummer) op een campus. Meerdere scholen
 * kunnen hetzelfde fysieke adres (dezelfde Campus) delen — zie .claude/rules/datamodel.md.
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
  /**
   * GOK-leerlingenkenmerken van de school. Null als ze niet in de publicatie staat — dat komt
   * voor bij scholen die geen werkingstoelagen krijgen en bij recent gesplitste scholen.
   * Schooljaar en teldatum staan één keer in `DatasetMeta`, niet bij elke school.
   */
  leerlingenkenmerken: Leerlingenkenmerken | null
  /** Placeholder voor v0.6 (kostprijs/materiaalkost). */
  kostprijs: null
  /** Placeholder voor v0.7 (fietsenstalling, halte-afstand, ...). */
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
  provincie: Provincie
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
  /** Alles wat de bron voor hoofdstructuur 311 teruggeeft, vóór onze eigen filters. */
  aantalVestigingenTotaal: number
  /** Vestigingen in de dataset. Sinds 0.12.0 heel Vlaanderen en Brussel, dus gelijk aan het totaal
      op de vestigingen na die geen bijhorende instelling hebben. */
  aantalVestigingen: number
  aantalCampussen: number
  aantalRichtingen: number
  /**
   * Herkomst van de leerlingenkenmerken: één schooljaar en één teldatum voor de hele dataset.
   * Null als de publicatie niet opgehaald kon worden; de UI toont het blok dan niet.
   */
  leerlingenkenmerken: {
    /** Bv. '2024-2025'. */
    schooljaar: string
    /** ISO-datum. De financieringsteling van 1 februari van het jaar ervóór. */
    teldatum: string
    bron: string
    /** Aantal scholen in onze dataset waarvoor er cijfers gevonden zijn. */
    aantalScholenMetCijfers: number
  } | null
}
