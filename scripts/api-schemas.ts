/**
 * Schema's voor de vijf API-responses die `fetch-data.ts` gebruikt, met valibot.
 *
 * Waarom: tot 2.13.3 kwamen alle records binnen als `any`. Hernoemde Onderwijs en Vorming een
 * veld, dan schreef het script stil een lege waarde weg, en de omvangcontrole van 15% ving dat niet:
 * het aantal adressen bleef gelijk, enkel de inhoud verarmde. Nu stopt het script met een fout.
 *
 * Enkel de velden die het script effectief leest, staan erin. De rest van een record wordt
 * weggelaten (`v.object` laat onbekende sleutels vallen), dus wat hier niet staat, kan het
 * script ook niet per ongeluk gebruiken.
 *
 * **Verplicht of optioneel is gemeten, niet geschat:** op een live respons van 08/10/2026 telde
 * elk veld hieronder. Wat in alle records stond, is verplicht. Wat soms ontbrak, is optioneel,
 * met het aantal records zonder erbij. Ontbrekende velden ontbreken in de bron echt (geen
 * `null`); `v.nullish` aanvaardt toch allebei, want dat verschil maakt voor het script niets uit.
 *
 * Een optioneel veld dat hernoemd wordt, ontbreekt daarna overal, en dat is voor een schema
 * geldig. Daarom bestaat `controleerAanwezigheid()` hieronder: een optioneel veld dat in geen
 * enkel record meer voorkomt, is ook een fout.
 */
import * as v from 'valibot'

/**
 * De bron heeft een andere vorm dan het schema. Een eigen type, omdat `fetch-data.ts` bij een
 * gewone ophaalfout terugvalt op de gecommitte dataset en met exitcode 0 eindigt. Voor deze fout
 * mag dat niet: dan draait de kwartaalverversing groen met "ongewijzigd" en merkt niemand iets.
 */
export class BronVeranderd extends Error {}

// 2153 records op 08/10/2026, met filter op hoofdstructuur 311.
export const Locatie = v.object({
  instelling_nummer: v.number(),
  instellingslocatie_vestigingsnummer: v.number(),
  instellingslocatie_provincie: v.string(),
  instellingslocatie_straatnaam: v.string(),
  instellingslocatie_huisnummer: v.nullish(v.string()), // 7 zonder
  instellingslocatie_postcode: v.string(),
  instellingslocatie_gemeente: v.string(),
  instellingslocatie_gemeente_nis: v.string(),
  gps_breedtegraad: v.nullish(v.number()), // 32 zonder
  gps_lengtegraad: v.nullish(v.number()), // 32 zonder
  instellingslocatie_telefoonnummers: v.nullish(v.array(v.string())), // 177 zonder
})

// 1182 records op 08/10/2026, met filter op niveau SO.
export const Instelling = v.object({
  instelling_nummer: v.number(),
  instelling_naam: v.string(),
  instelling_naam_volledig: v.string(),
  instelling_hoofdzetel_vestigingsnr: v.number(),
  instelling_bestuur: v.object({ instellingsnummer: v.number() }),
  instelling_net: v.nullish(v.object({ omschrijving: v.nullish(v.string()) })), // 5 zonder
  instelling_levensbeschouwing: v.nullish(v.object({ omschrijving: v.nullish(v.string()) })), // 382 zonder
  instelling_telefoon: v.nullish(v.string()), // 13 zonder
  instelling_email: v.nullish(v.string()), // 27 zonder
  instelling_website: v.nullish(v.string()), // 59 zonder
  instelling_status_erkenning: v.object({ code: v.string() }),
  instelling_scholengemeenschap: v.nullish(v.object({ instellingsnummer: v.nullish(v.number()) })), // 92 zonder
})

// 913 records op 08/10/2026, met filter op instellingstype 300.
export const Bestuur = v.object({
  instelling_nummer: v.number(),
  instelling_soort_bestuur: v.object({ code: v.string() }),
})

// 42228 records op 08/10/2026.
export const IngerichteRichting = v.object({
  instelling_nummer: v.number(),
  instellingslocatie_vestigingsnummer: v.number(),
  administratievegroep_code: v.number(),
  administratievegroep_omschrijving: v.string(),
  schooljaar: v.number(),
  inschrijvingen: v.boolean(),
})

// 3021 records op 08/10/2026. Graad en onderwijsvorm ontbreken bij 243, finaliteit en domein
// bij 112, de studierichting bij 7: eerste graad, OKAN en HBO5 hebben die niet allemaal.
export const CatalogusRichting = v.object({
  administratievegroep_code: v.number(),
  administratievegroep_graad: v.nullish(v.object({ omschrijving: v.nullish(v.string()) })),
  administratievegroep_finaliteit: v.nullish(v.object({ code: v.nullish(v.string()) })),
  administratievegroep_onderwijsvorm: v.nullish(v.object({ code: v.nullish(v.string()) })),
  administratievegroep_domein: v.nullish(v.object({ code: v.nullish(v.string()) })),
  administratievegroep_studierichting: v.nullish(
    v.object({ code: v.string(), omschrijving: v.string() }),
  ),
  administratievegroep_duaal: v.boolean(),
})

/** De envelop rond elke pagina. `content` wordt pas per endpoint gevalideerd. */
export const Pagina = v.object({
  meta: v.object({ total_pages: v.number(), last: v.boolean() }),
  content: v.array(v.unknown()),
})

/**
 * Valideert alle records van één endpoint. Faalt er een, dan stopt het script met de eerste
 * paar fouten, elk met het pad naar het veld en het record waar het misging.
 */
export function valideer<S extends v.GenericSchema>(
  label: string,
  schema: S,
  records: unknown[],
): v.InferOutput<S>[] {
  const uit: v.InferOutput<S>[] = []
  const fouten: string[] = []
  let aantalFout = 0
  records.forEach((record, i) => {
    const resultaat = v.safeParse(schema, record)
    if (resultaat.success) {
      uit.push(resultaat.output)
      return
    }
    aantalFout++
    if (fouten.length < 5) {
      const issue = resultaat.issues[0]
      fouten.push(`  record ${i}, veld ${v.getDotPath(issue) ?? '(record zelf)'}: ${issue.message}`)
    }
  })
  if (aantalFout > 0) {
    throw new BronVeranderd(
      `${label}: ${aantalFout} van de ${records.length} records passen niet in het schema. ` +
        'De bron is veranderd; pas scripts/api-schemas.ts aan na het nakijken van een live ' +
        `respons, niet op gevoel.\n${fouten.join('\n')}`,
    )
  }
  return uit
}

/**
 * Een optioneel veld dat in geen enkel record meer voorkomt, is vrijwel zeker hernoemd. Het
 * schema laat dat door, deze controle niet. `paden` zijn punt-paden zoals
 * `instelling_net.omschrijving`.
 */
export function controleerAanwezigheid(label: string, records: unknown[], paden: string[]): void {
  if (records.length === 0) return
  const nergens = paden.filter((pad) => !records.some((r) => leesPad(r, pad) != null))
  if (nergens.length > 0) {
    throw new BronVeranderd(
      `${label}: ${nergens.join(', ')} ontbreekt in alle ${records.length} records. ` +
        'Waarschijnlijk hernoemd door de bron; kijk een live respons na.',
    )
  }
}

function leesPad(record: unknown, pad: string): unknown {
  let waarde = record
  for (const deel of pad.split('.')) {
    if (waarde == null || typeof waarde !== 'object') return undefined
    waarde = (waarde as Record<string, unknown>)[deel]
  }
  return waarde
}

/** Per endpoint de optionele velden die `controleerAanwezigheid` moet zien. */
export const OPTIONELE_VELDEN = {
  locaties: [
    'instellingslocatie_huisnummer',
    'gps_breedtegraad',
    'gps_lengtegraad',
    'instellingslocatie_telefoonnummers',
  ],
  instellingen: [
    'instelling_net.omschrijving',
    'instelling_levensbeschouwing.omschrijving',
    'instelling_telefoon',
    'instelling_email',
    'instelling_website',
    'instelling_scholengemeenschap.instellingsnummer',
  ],
  catalogus: [
    'administratievegroep_graad.omschrijving',
    'administratievegroep_finaliteit.code',
    'administratievegroep_onderwijsvorm.code',
    'administratievegroep_domein.code',
    'administratievegroep_studierichting.code',
  ],
} as const
