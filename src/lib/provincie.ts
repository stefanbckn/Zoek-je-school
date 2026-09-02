import type { Provincie } from '../types'

/**
 * De volgorde waarin de provincies in de filterkolom staan: alfabetisch, met Brussel
 * achteraan. Brussel is geen provincie maar een gewest, en het staat alleen in deze lijst
 * omdat de bron er het Nederlandstalig onderwijs van de Vlaamse Gemeenschap in meetelt.
 * Het tussen Antwerpen en Limburg zetten zou suggereren dat het er één van is.
 */
export const PROVINCIE_OPTIONS: readonly Provincie[] = [
  'Antwerpen',
  'Limburg',
  'Oost-Vlaanderen',
  'Vlaams-Brabant',
  'West-Vlaanderen',
  'Brussel',
]

/** Wat er bij het vinkje staat. Enkel waar de korte naam op zichzelf misleidend is. */
export const PROVINCIE_UITLEG: Partial<Record<Provincie, string>> = {
  Brussel: 'Nederlandstalige scholen in het Brussels Hoofdstedelijk Gewest',
}
