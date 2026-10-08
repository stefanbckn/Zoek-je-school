/**
 * De sleutel waarop `fetch-data.ts` vestigingsplaatsen tot één `Campus` groepeert.
 *
 * Het busnummer telt bewust niet mee: een andere ingang van hetzelfde gebouw is nog steeds
 * dezelfde campus. Zie `.claude/rules/datamodel.md`. Hoofdletters tellen evenmin mee.
 */
export function adresSleutel(adres: {
  postcode: string
  straat: string
  huisnummer: string
}): string {
  return `${adres.postcode}|${adres.straat}|${adres.huisnummer}`.toLowerCase()
}
