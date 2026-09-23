/**
 * De steden die een eigen pagina krijgen, in de volgorde waarin ze in de sitemap staan.
 *
 * Waarom een aparte lijst en geen "alle gemeenten": 241 gemeenten die enkel in hun naam
 * verschillen, zijn doorway pages. Elke pagina hier moet iets zeggen dat alleen voor die
 * stad klopt. Zie de sectie "Gemeentepagina's voor zoekmachines" in ROADMAP.md.
 *
 * Een stad wordt aangeduid met haar **niscode**, niet met de naam uit het veld `gemeente`.
 * Dat veld draagt de plaatsnaam van de postcode, niet de gemeente: Brugge staat er als
 * Assebroek, Brugge, Sint-Andries, Sint-Kruis, Sint-Michiels en Zeebrugge, en Antwerpen als
 * negen districten. Op naam filteren gaf dus een pagina die Sint-Andries als *buurgemeente*
 * van Brugge opvoerde. De niscode groepeert ze wel correct, en volgt ook de fusies van
 * 1 januari 2025 (Borsbeek zit in 11002 bij Antwerpen).
 */
export interface Stad {
  /** Laatste stuk van de URL: /gemeente/<slug>/ */
  slug: string
  /** Zoals de stad in lopende tekst heet. */
  naam: string
  /**
   * De NIS-code van de gemeente, of het begin ervan. Een volledige code (vijf cijfers) is één
   * gemeente met al haar deelgemeenten en districten. '21' is het hele Brussels Hoofdstedelijk
   * Gewest: alle negentien gemeenten daar hebben een code die met 21 begint. Zo komt een
   * nieuwe school in een Brusselse gemeente vanzelf op de pagina, zonder dat deze lijst moet
   * volgen.
   */
  niscode: string
  /** De h1 en de paginatitel, als die afwijkt van "Middelbare scholen in <naam>". */
  titel?: string
  /**
   * Voor een gebied met meer dan één gemeente: hoe het in een volle zin heet ("het Brussels
   * Hoofdstedelijk Gewest"). Dan spreekt de pagina van een gewest in plaats van een gemeente.
   */
  gewest?: string
  /**
   * Zet de adreslijst in groepen, met een inhoudsopgave bovenaan. Nodig vanaf een honderdtal
   * adressen: één alfabetische lijst op straatnaam is dan niet meer te overzien.
   *
   * - `district`: per plaatsnaam uit het veld `gemeente`. In Antwerpen valt dat samen met de
   *   districten (Berchem, Deurne, ...).
   * - `gemeente`: per niscode. Nodig voor Brussel, waar Laken een plaatsnaam is maar bij de
   *   stad Brussel hoort.
   */
  groepen?: {
    per: 'district' | 'gemeente'
    /** Het woord in de tekst: "district" of "gemeente". */
    woord: string
    meervoud: string
    /** Naam van een groep met meer dan één plaatsnaam, op niscode. Zonder naam: een fout. */
    namen?: Record<string, string>
    /**
     * Alle delen van het gebied, zodat de pagina ook kan zeggen waar géén school staat. Enkel
     * namen: een deel zonder school heeft geen niscode in de dataset om tegen te controleren.
     */
    alle?: string[]
  }
}

export const STEDEN: Stad[] = [
  { slug: 'mechelen', naam: 'Mechelen', niscode: '12025' },
  { slug: 'gent', naam: 'Gent', niscode: '44021' },
  { slug: 'leuven', naam: 'Leuven', niscode: '24062' },
  { slug: 'kortrijk', naam: 'Kortrijk', niscode: '34010' },
  { slug: 'brugge', naam: 'Brugge', niscode: '31005' },
  {
    slug: 'antwerpen',
    naam: 'Antwerpen',
    niscode: '11002',
    groepen: { per: 'district', woord: 'district', meervoud: 'districten' },
  },
  {
    slug: 'brussel',
    naam: 'Brussel',
    niscode: '21',
    // De dataset bevat enkel het onderwijs van de Vlaamse Gemeenschap. "Nederlandstalig" in
    // de titel is dus geen versiering: zonder dat woord belooft de pagina alle scholen van
    // Brussel en toont ze er maar een deel van. Het is ook hoe ouders het zelf intikken.
    titel: 'Nederlandstalige middelbare scholen in Brussel',
    gewest: 'het Brussels Hoofdstedelijk Gewest',
    groepen: {
      per: 'gemeente',
      woord: 'gemeente',
      meervoud: 'gemeenten',
      // 21004 draagt de plaatsnamen Brussel en Laken.
      namen: { '21004': 'Brussel-stad' },
      // Nederlandse namen, nagekeken op 22/09/2026: vijftien staan zo in de dataset, de vier
      // zonder school (Sint-Gillis, Sint-Joost-ten-Node, Watermaal-Bosvoorde en
      // Sint-Lambrechts-Woluwe) op de Franstalige Wikipedia-lijst van de gemeenten.
      alle: [
        'Anderlecht',
        'Brussel-stad',
        'Elsene',
        'Etterbeek',
        'Evere',
        'Ganshoren',
        'Jette',
        'Koekelberg',
        'Oudergem',
        'Schaarbeek',
        'Sint-Agatha-Berchem',
        'Sint-Gillis',
        'Sint-Jans-Molenbeek',
        'Sint-Joost-ten-Node',
        'Sint-Lambrechts-Woluwe',
        'Sint-Pieters-Woluwe',
        'Ukkel',
        'Vorst',
        'Watermaal-Bosvoorde',
      ],
    },
  },
]

/** Hoort een adres met deze niscode bij de stad? Zie `Stad.niscode` voor het prefix. */
export function hoortBij(stad: Stad, niscode: string): boolean {
  return niscode.startsWith(stad.niscode)
}

/** Waar de gegenereerde pagina's terechtkomen, relatief aan de projectwortel. */
export const UITVOERMAP = 'gemeente'

/** Het pad waarop een stad live staat, met sluitende schuine streep. */
export function stadPad(stad: Stad): string {
  return `/${UITVOERMAP}/${stad.slug}/`
}
