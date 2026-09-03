import { useEffect, useMemo, useState } from 'react'
import {
  FINALITEIT_CHIP,
  FINALITEIT_OPTIONS,
  FINALITEIT_STYLES,
  FINALITEIT_TEKEN,
  type FinaliteitKeuze,
} from '../lib/aanbod'
import { DOMEIN_OVERSCHRIJDEND, domeinLabel } from '../lib/domein'
import { MATRIX_GRADEN, bouwMatrix, telPerRichting, type MatrixGraad, type MatrixRichting } from '../lib/matrix'
import type { Campus, Studierichting } from '../types'

interface MatrixPanelProps {
  open: boolean
  /** De catalogus uit `richtingen.json`. */
  studierichtingen: Studierichting[]
  /**
   * De adressen waarop geteld wordt: alle filters behalve de aanbodfilters zelf. Zie de
   * berekening van `matrixCampussen` in App.tsx voor waarom die eruit moeten blijven.
   */
  campussen: Campus[]
  /** Beschrijft waar er geteld wordt ("in Gent", "binnen 10 km"), of null bij heel Vlaanderen. */
  gebiedLabel: string | null
  onClose: () => void
  /**
   * Filtert de zoekresultaten op één exacte studierichting en sluit de matrix. De graad hoort
   * erbij: dezelfde code bestaat in de tweede én de derde graad.
   */
  onKiesRichting: (code: string, graad: MatrixGraad) => void
  /** Filtert op een hele cel: één domein en één finaliteit. */
  onKiesCel: (domeinCode: string, finaliteit: FinaliteitKeuze) => void
}

/**
 * De matrix secundair onderwijs, als ingang op de zoekresultaten.
 *
 * **Waarom het raster altijd volledig is.** Elke richting van de gekozen graad staat erin, ook
 * als geen enkel adres in je buurt ze aanbiedt. Die staat dan gedimd op 0. Dat is met opzet:
 * wie een school zoekt, wil niet alleen weten wat er in de buurt is, maar ook wat er bestaat
 * en hier ontbreekt. Een matrix die enkel toont wat toevallig in de resultaten zit, verbergt
 * precies die vaststelling.
 *
 * **Wat hier niet staat: pijlen.** De matrix ordent, ze voorspelt niet. Welke richting van de
 * derde graad op welke van de tweede volgt, staat in geen enkele bron die we hebben.
 */
export function MatrixPanel({
  open,
  studierichtingen,
  campussen,
  gebiedLabel,
  onClose,
  onKiesRichting,
  onKiesCel,
}: MatrixPanelProps) {
  const [graad, setGraad] = useState<MatrixGraad>('Tweede graad')

  useEffect(() => {
    if (!open) return
    function opToets(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opToets)
    return () => document.removeEventListener('keydown', opToets)
  }, [open, onClose])

  // Enkel rekenen als het paneel open staat: dit loopt over alle richtingen van alle adressen.
  const rijen = useMemo(() => {
    if (!open) return []
    return bouwMatrix(studierichtingen, graad, telPerRichting(campussen))
  }, [open, studierichtingen, campussen, graad])

  if (!open) return null

  const aantalRichtingen = rijen.reduce(
    (n, rij) => n + rij.cellen.reduce((m, c) => m + c.richtingen.length, 0) + rij.zevendeLeerjaren.length,
    0,
  )

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mt-4 w-full max-w-6xl rounded-lg bg-kaart p-6 shadow-xl sm:mt-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="matrix-titel"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="matrix-titel" className="text-lg font-semibold text-inkt">
            De matrix: alle studierichtingen
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-zacht hover:text-inkt"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 max-w-3xl text-sm text-zacht">
          Zo is het secundair onderwijs ingedeeld: acht studiedomeinen, elk met drie finaliteiten.
          Klik op een richting om te zien welke adressen ze aanbieden. Het getal erachter is het
          aantal adressen {gebiedLabel ?? 'in Vlaanderen en Brussel'}; staat er nul, dan bestaat de
          richting wel maar niet daar.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div
            className="flex overflow-hidden rounded-md border border-rand text-sm"
            role="group"
            aria-label="Graad"
          >
            {MATRIX_GRADEN.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGraad(g)}
                aria-pressed={graad === g}
                className={`px-3 py-1 ${graad === g ? 'bg-accent text-accent-inkt' : 'bg-kaart text-inkt hover:bg-hover'}`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="text-xs text-zacht">{aantalRichtingen} richtingen in deze graad</p>
        </div>

        {/* De kolomkoppen staan enkel op breed scherm boven het raster: daaronder staat elke
            finaliteit als eigen kopje in de cel zelf, want drie kolommen naast elkaar op een
            telefoon maakt elke kolom smaller dan een richtingnaam. */}
        <div className="mt-5 hidden grid-cols-[10rem_repeat(3,minmax(0,1fr))] gap-3 md:grid">
          <div />
          {FINALITEIT_OPTIONS.map((f) => (
            <h3 key={f} className="text-sm font-semibold text-inkt">
              <span className={`${FINALITEIT_CHIP} ${FINALITEIT_STYLES[f]}`}>
                <span aria-hidden="true">{FINALITEIT_TEKEN[f]}</span>
                {f}
              </span>
            </h3>
          ))}
        </div>

        <div className="mt-3 space-y-3">
          {rijen.map((rij) => (
            <div
              key={rij.domeinCode}
              className="grid gap-3 rounded-lg border border-rand p-3 md:grid-cols-[10rem_repeat(3,minmax(0,1fr))] md:border-0 md:p-0"
            >
              <h3 className="self-start text-sm font-semibold text-inkt md:pt-2">
                {domeinLabel(rij.domeinCode)}
                {rij.domeinCode === DOMEIN_OVERSCHRIJDEND && (
                  <span className="mt-0.5 block text-xs font-normal text-zacht">
                    hoort bij geen enkel domein
                  </span>
                )}
              </h3>

              {rij.cellen.map((cel) => (
                <div
                  key={cel.finaliteit}
                  // Een lege combinatie is op breed scherm een zinvol gat in het raster: je
                  // ziet dat er niets staat waar wél iets had kunnen staan. Onder elkaar op
                  // een telefoon is het enkel lengte, want daar is er geen raster om een gat
                  // in te laten vallen.
                  className={`rounded-lg border border-rand p-2 ${
                    cel.richtingen.length === 0 ? 'hidden md:block' : ''
                  }`}
                >
                  <h4 className="mb-1.5 text-xs font-medium text-zacht md:hidden">
                    {cel.finaliteit}
                  </h4>
                  {cel.richtingen.length === 0 ? (
                    <p className="px-1 py-1 text-xs text-zacht">Bestaat niet in deze combinatie</p>
                  ) : (
                    <>
                      <ul className="space-y-0.5">
                        {cel.richtingen.map((r) => (
                          <RichtingKnop
                            key={r.code}
                            richting={r}
                            graad={graad}
                            onKies={onKiesRichting}
                          />
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => onKiesCel(rij.domeinCode, cel.finaliteit)}
                        className="mt-1 w-full rounded-md px-2 py-1 text-left text-xs text-accent underline underline-offset-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {/* Het domeinlabel blijft zoals het is: STEM in kleine letters is
                            geen domein meer. */}
                        Alle adressen met {domeinLabel(rij.domeinCode)},{' '}
                        {cel.finaliteit.toLowerCase()}
                      </button>
                    </>
                  )}
                </div>
              ))}

              {rij.zevendeLeerjaren.length > 0 && (
                <details className="md:col-start-2 md:col-end-5">
                  <summary className="cursor-pointer rounded-md px-1 py-1 text-xs text-zacht hover:text-inkt">
                    {rij.zevendeLeerjaren.length} zevende leerjaren in dit domein
                  </summary>
                  {/* Een zevende leerjaar heeft wél een domein maar geen finaliteit: de bron
                      zegt daar uitdrukkelijk "n.v.t.". Ze in een van de drie kolommen zetten
                      zou een finaliteit verzinnen. */}
                  <ul className="mt-1 space-y-0.5 md:columns-2">
                    {rij.zevendeLeerjaren.map((r) => (
                      <RichtingKnop key={r.code} richting={r} graad={graad} onKies={onKiesRichting} />
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>

        <p className="mt-5 max-w-3xl text-xs text-zacht">
          De indeling komt uit de officiële catalogus van Onderwijs en Vorming, net als het
          aanbod per school. Wat hier niet staat, is welke richting van de derde graad op welke
          van de tweede volgt: die doorstroom staat in geen enkele bron die wij kunnen ophalen,
          en wij verzinnen ze niet.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-inkt hover:opacity-90"
        >
          Sluiten
        </button>
      </div>
    </div>
  )
}

/** Eén richting in een cel: naam, of ze duaal is, en op hoeveel adressen ze hier bestaat. */
function RichtingKnop({
  richting,
  graad,
  onKies,
}: {
  richting: MatrixRichting
  graad: MatrixGraad
  onKies: (code: string, graad: MatrixGraad) => void
}) {
  const hier = richting.aantalHier
  return (
    <li>
      <button
        type="button"
        onClick={() => onKies(richting.code, graad)}
        disabled={hier === 0}
        aria-label={
          hier === 0
            ? `${richting.naam}: hier geen enkel adres`
            : `${richting.naam}: ${hier} ${hier === 1 ? 'adres' : 'adressen'} tonen`
        }
        className={`flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1 text-left text-sm ${
          hier === 0
            // Bewust geen opacity erbij: `text-zacht` is gemeten op contrast (zie
            // scripts/kleurcheck.mjs), en een halfdoorzichtige variant daarvan is dat niet.
            // Dat deze richting hier niet bestaat, staat al in het cijfer en in het aria-label.
            ? 'cursor-default text-zacht'
            : 'text-inkt hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
        }`}
      >
        <span>
          {richting.naam}
          {richting.duaal && (
            <span className="ml-1.5 rounded border border-rand px-1 py-px text-[0.65rem] text-zacht">
              duaal
            </span>
          )}
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs text-zacht tabular-nums">
          {hier}
        </span>
      </button>
    </li>
  )
}
