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
  /** De NIS-code van de gemeente. Groepeert alle deelgemeenten en districten. */
  niscode: string
}

export const STEDEN: Stad[] = [
  { slug: 'mechelen', naam: 'Mechelen', niscode: '12025' },
  { slug: 'brugge', naam: 'Brugge', niscode: '31005' },
]

/** Waar de gegenereerde pagina's terechtkomen, relatief aan de projectwortel. */
export const UITVOERMAP = 'gemeente'

/** Het pad waarop een stad live staat, met sluitende schuine streep. */
export function stadPad(stad: Stad): string {
  return `/${UITVOERMAP}/${stad.slug}/`
}
