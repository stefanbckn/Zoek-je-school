/**
 * Leidt uit `vestigingen.json` een generieke `Stad`-entry af voor elke niscode die nog geen
 * eigen `STEDEN`-entry heeft (zie `scripts/steden.ts`). Zie ROADMAP.md, "Van centrumsteden naar
 * alle gemeenten".
 *
 * Enkel niscodes die al minstens één school met studieaanbod hebben komen in aanmerking:
 * gemeenten zonder enige vestiging in de dataset (zo'n 130 van de ~319 in Vlaanderen en
 * Brussel) blijven buiten deze lijst. Voor hen is er geen naam, geen coördinaat en geen
 * niscode-bevestiging uit onze eigen data te halen, en de projectregel "nooit gokken" verbiedt
 * om daar een externe bron voor te verzinnen. Beslist door de gebruiker op 23/09/2026.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { heeftAanbod, scholenMetAanbod } from '../src/lib/aanbod.ts'
import type { Campus } from '../src/types.ts'
import { STEDEN, anker, hoortBij, type Stad } from './steden.ts'

const WORTEL = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * `zichtbaar` is dezelfde lijst als de generator voor `STEDEN` gebruikt: na `heeftAanbod` en
 * `scholenMetAanbod`. Een niscode waarvan geen enkele campus die filter overleeft, komt door die
 * voorfiltering vanzelf niet in deze lijst terecht — geen aparte "0 scholen"-uitsluiting nodig.
 */
export function afgeleideSteden(zichtbaar: Campus[]): Stad[] {
  const perNiscode = new Map<string, Campus[]>()
  for (const c of zichtbaar) {
    if (STEDEN.some((s) => hoortBij(s, c.niscode))) continue
    perNiscode.set(c.niscode, [...(perNiscode.get(c.niscode) ?? []), c])
  }

  return [...perNiscode.entries()]
    .map(([niscode, adressen]): Stad => {
      const naam = meestVoorkomendeNaam(adressen)
      return { slug: anker(naam), naam, niscode }
    })
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

/**
 * `Campus.gemeente` draagt de plaatsnaam van de postcode, niet altijd de officiële
 * gemeentenaam: 27 van de 189 niscodes met een school dragen meerdere plaatsnamen (bv. 71004 →
 * Beringen, Beverlo, Paal). Voor de 13 centrumsteden lost `STEDEN.groepen.namen` dat gericht op;
 * voor de overige ~150 gemeenten schaalt een losse override per niscode niet. Deze regel kiest
 * daarom de plaatsnaam met de meeste campussen, bij gelijke stand alfabetisch. Dat is niet
 * feilloos — de officiële naam hoeft niet de naam met de meeste campussen te zijn — vandaar de
 * eenmalige controle van de 27 meerkernige niscodes na het genereren (zie ROADMAP.md).
 */
function meestVoorkomendeNaam(adressen: Campus[]): string {
  const tellingen = new Map<string, number>()
  for (const c of adressen) tellingen.set(c.gemeente, (tellingen.get(c.gemeente) ?? 0) + 1)
  return [...tellingen.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'nl'),
  )[0][0]
}

/**
 * `STEDEN` plus de afgeleide entries, samen alle 189 niscodes met een school. `zichtbaar`
 * optioneel doorgeven vermijdt een dubbele inleesbeurt van `vestigingen.json` in
 * `genereer-gemeentepaginas.ts`, dat die lijst toch al berekent; `vite.config.ts` heeft ze niet
 * bij de hand en roept deze functie zonder argument aan.
 */
export function alleSteden(zichtbaar?: Campus[]): Stad[] {
  return [...STEDEN, ...afgeleideSteden(zichtbaar ?? leesZichtbaar())]
}

function leesZichtbaar(): Campus[] {
  const campussen: Campus[] = JSON.parse(
    readFileSync(resolve(WORTEL, 'public/data/vestigingen.json'), 'utf8'),
  )
  return campussen.filter(heeftAanbod).map(scholenMetAanbod)
}
