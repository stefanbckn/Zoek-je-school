import { inflateRawSync } from 'node:zlib'

/**
 * Piepkleine xlsx-lezer: genoeg om één werkblad met platte cellen uit te lezen, meer niet.
 *
 * Bewust geen dependency (SheetJS en co) voor dit ene bestand: we lezen precies één
 * AgODi-publicatie die uit één werkblad met tekst- en getalcellen bestaat. Wat hier níét
 * inzit en er ook niet in hoort: formules, datumopmaak, meerdere werkbladen, zip64.
 * Heb je dat ooit nodig, neem dan een echte bibliotheek in plaats van dit uit te breiden.
 */

// --- zip --------------------------------------------------------------------------------

const EOCD_SIGNATUUR = 0x06054b50
const CENTRAL_SIGNATUUR = 0x02014b50

/** Pakt een zip-archief uit in het geheugen: bestandsnaam → inhoud. */
export function leesZip(archief: Buffer): Map<string, Buffer> {
  // De End of Central Directory staat achteraan, na een comment van onbekende lengte.
  // Achterwaarts zoeken naar de signatuur is de gebruikelijke aanpak.
  let eocd = -1
  for (let i = archief.length - 22; i >= 0; i--) {
    if (archief.readUInt32LE(i) === EOCD_SIGNATUUR) {
      eocd = i
      break
    }
  }
  if (eocd === -1) throw new Error('Geen geldig zip-archief: End of Central Directory niet gevonden.')

  const aantal = archief.readUInt16LE(eocd + 10)
  let pos = archief.readUInt32LE(eocd + 16)

  const bestanden = new Map<string, Buffer>()
  for (let i = 0; i < aantal; i++) {
    if (archief.readUInt32LE(pos) !== CENTRAL_SIGNATUUR) {
      throw new Error(`Zip-archief beschadigd: onverwachte signatuur op positie ${pos}.`)
    }
    const methode = archief.readUInt16LE(pos + 10)
    const gecomprimeerd = archief.readUInt32LE(pos + 20)
    const naamLengte = archief.readUInt16LE(pos + 28)
    const extraLengte = archief.readUInt16LE(pos + 30)
    const commentLengte = archief.readUInt16LE(pos + 32)
    const lokaalOffset = archief.readUInt32LE(pos + 42)
    const naam = archief.toString('utf-8', pos + 46, pos + 46 + naamLengte)

    // De lengtes in de lokale header wijken af van die in de central directory — lees ze
    // daar opnieuw, anders wijst de dataposities net verkeerd.
    const lokaalNaamLengte = archief.readUInt16LE(lokaalOffset + 26)
    const lokaalExtraLengte = archief.readUInt16LE(lokaalOffset + 28)
    const dataStart = lokaalOffset + 30 + lokaalNaamLengte + lokaalExtraLengte
    const ruw = archief.subarray(dataStart, dataStart + gecomprimeerd)

    if (methode === 0) bestanden.set(naam, Buffer.from(ruw))
    else if (methode === 8) bestanden.set(naam, inflateRawSync(ruw))
    else throw new Error(`Zip-item "${naam}" gebruikt compressiemethode ${methode}; enkel 0 en 8 ondersteund.`)

    pos += 46 + naamLengte + extraLengte + commentLengte
  }
  return bestanden
}

// --- xml --------------------------------------------------------------------------------

function decodeerEntiteiten(tekst: string): string {
  return tekst
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
}

/** Alle `<t>`-teksten binnen één fragment, aan elkaar geplakt (rich text valt zo samen). */
function tekstUit(fragment: string): string {
  let resultaat = ''
  for (const match of fragment.matchAll(/<t[^>]*\/>|<t[^>]*>([\s\S]*?)<\/t>/g)) {
    resultaat += decodeerEntiteiten(match[1] ?? '')
  }
  return resultaat
}

// --- werkblad ---------------------------------------------------------------------------

/** Eén rij: kolomletter → celwaarde als tekst. Lege cellen ontbreken. */
export type XlsxRij = Record<string, string>

/**
 * Leest het eerste werkblad van een xlsx als rijen met kolomletters. Waarden komen er als
 * tekst uit; getallen staan er in de ruwe Excel-notatie in (punt als decimaalteken).
 */
export function leesEersteWerkblad(bestand: Buffer): XlsxRij[] {
  const zip = leesZip(bestand)

  const werkbladNaam = [...zip.keys()]
    .filter((naam) => /^xl\/worksheets\/sheet\d+\.xml$/.test(naam))
    .sort()[0]
  if (!werkbladNaam) throw new Error('Geen werkblad gevonden in het xlsx-bestand.')

  const gedeeldeTeksten: string[] = []
  const gedeeld = zip.get('xl/sharedStrings.xml')
  if (gedeeld) {
    for (const match of gedeeld.toString('utf-8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      gedeeldeTeksten.push(tekstUit(match[1]))
    }
  }

  const werkblad = zip.get(werkbladNaam)!.toString('utf-8')
  const rijen: XlsxRij[] = []
  for (const rijMatch of werkblad.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const rij: XlsxRij = {}
    for (const celMatch of rijMatch[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const [, kolom, attributen, inhoud] = celMatch
      const type = /t="([^"]+)"/.exec(attributen)?.[1]
      let waarde: string
      if (type === 's') {
        const index = Number(/<v>([\s\S]*?)<\/v>/.exec(inhoud)?.[1])
        waarde = gedeeldeTeksten[index] ?? ''
      } else if (type === 'inlineStr') {
        waarde = tekstUit(inhoud)
      } else {
        waarde = decodeerEntiteiten(/<v>([\s\S]*?)<\/v>/.exec(inhoud)?.[1] ?? '')
      }
      if (waarde !== '') rij[kolom] = waarde
    }
    rijen.push(rij)
  }
  return rijen
}

/**
 * Zet een Excel-serieel datumgetal om naar een ISO-datum (YYYY-MM-DD). Excel telt dagen
 * vanaf 30/12/1899 — dat gat van twee dagen is de bekende schrikkeljaarbug van 1900, die
 * we hier gewoon moeten volgen.
 */
export function excelDatum(serieel: number): string {
  const epoch = Date.UTC(1899, 11, 30)
  return new Date(epoch + serieel * 86_400_000).toISOString().slice(0, 10)
}
