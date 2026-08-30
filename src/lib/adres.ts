/**
 * Huisnummer zoals het op het scherm hoort te staan.
 *
 * De bron schrijft samengestelde huisnummers met een liggend streepje als scheiding: `81_83`
 * voor een reeks, `2_B` voor een nummer met een letter erbij. Dat is een technische notatie —
 * afgedrukt of op een kaartje leest "Lucien Hendrickxlei 2_B" als een tikfout.
 *
 * **Niet afkappen tot het eerste nummer.** Dat lag voor de hand, maar in 2870 bestaan
 * Begijnhofstraat 3 én Begijnhofstraat 3_5 als twee aparte campussen; afkappen zet die er
 * identiek in, en dat is precies de verwarring die de campus-groepering moet voorkomen.
 * Geverifieerd op de dataset: 10 van de 303 adressen dragen zo'n nummer, en dit is de enige
 * botsing.
 */
export function huisnummerLabel(huisnummer: string): string {
  // Cijfer + letter hoort aan elkaar (2B); twee nummers zijn een reeks (81-83).
  return huisnummer.replace(/_(?=[A-Za-z])/g, '').replace(/_/g, '-')
}
