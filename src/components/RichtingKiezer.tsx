import { useMemo, useRef, useState } from 'react'
import {
  aantalHier,
  isGekozen,
  keuzeLabel,
  keuzeSleutel,
  voegKeuzesToe,
  wisselKeuze,
  zoekRichtingen,
  type RichtingKeuze,
} from '../lib/richtingkeuze'
import type { Studierichting } from '../types'

interface RichtingKiezerProps {
  studierichtingen: Studierichting[]
  /** Adressen per `code|graad` binnen de plaatsfilters, dezelfde tellers als de matrix. */
  tellingen: Map<string, number>
  namen: Map<string, string>
  keuzes: RichtingKeuze[]
  onKeuzesChange: (keuzes: RichtingKeuze[]) => void
}

/**
 * Meer suggesties tonen helpt niemand: wie bij één letter honderden richtingen krijgt, typt
 * verder. De optie "alle kiezen" telt wel alle treffers.
 */
const MAX_SUGGESTIES = 60

function graadKort(graad: string | null): string | null {
  return graad ? graad.toLowerCase() : null
}

/**
 * Het zoekveld "Zoek op studierichting". Typen zoekt in de catalogus van `richtingen.json`, de
 * lijst eronder toont elke richting met dat stukje in de naam, en aanklikken zet ze bij de
 * gekozen richtingen. De lijst blijft open na een keuze, zodat je er meerdere na elkaar kiest.
 *
 * Combobox-patroon (WAI-ARIA APG), net als de zoekbalk: de focus blijft in het invoerveld, de
 * pijltjes verschuiven welke suggestie actief is, en aria-activedescendant zegt welke dat is.
 */
export function RichtingKiezer({
  studierichtingen,
  tellingen,
  namen,
  keuzes,
  onKeuzesChange,
}: RichtingKiezerProps) {
  const [invoer, setInvoer] = useState('')
  const [open, setOpen] = useState(false)
  /** Index van de actieve optie; -1 = geen. Optie 0 is "alle kiezen" als die er staat. */
  const [actief, setActief] = useState(-1)
  const invoerRef = useRef<HTMLInputElement>(null)

  const treffers = useMemo(
    () => zoekRichtingen(studierichtingen, invoer, tellingen),
    [studierichtingen, invoer, tellingen],
  )
  const getoond = treffers.slice(0, MAX_SUGGESTIES)
  const nogNietGekozen = treffers.filter((r) => !isGekozen(keuzes, naarKeuze(r)))
  const metAlles = nogNietGekozen.length > 1
  const aantalOpties = getoond.length + (metAlles ? 1 : 0)

  function naarKeuze(r: Studierichting): RichtingKeuze {
    return { code: r.code, graad: r.graad }
  }

  function kiesOptie(index: number) {
    if (metAlles && index === 0) {
      onKeuzesChange(voegKeuzesToe(keuzes, nogNietGekozen.map(naarKeuze)))
      setOpen(false)
      setActief(-1)
      return
    }
    const richting = getoond[index - (metAlles ? 1 : 0)]
    if (richting) onKeuzesChange(wisselKeuze(keuzes, naarKeuze(richting)))
  }

  function opToets(e: React.KeyboardEvent<HTMLInputElement>) {
    const n = aantalOpties
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (n === 0) return
      e.preventDefault()
      const stap = e.key === 'ArrowDown' ? 1 : -1
      const volgende = !open || actief < 0 ? (stap === 1 ? 0 : n - 1) : (actief + stap + n) % n
      setOpen(true)
      setActief(volgende)
      document.getElementById(`richting-optie-${volgende}`)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      if (open && actief >= 0 && actief < n) {
        e.preventDefault()
        kiesOptie(actief)
      }
    } else if (e.key === 'Escape' && open) {
      setOpen(false)
      setActief(-1)
    }
  }

  return (
    <div>
      <label htmlFor="richting" className="sectiekop mb-2 block">
        Zoek op studierichting
      </label>
      <div className="relative">
        <input
          ref={invoerRef}
          id="richting"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && aantalOpties > 0}
          aria-controls="richting-suggesties"
          aria-activedescendant={open && actief >= 0 ? `richting-optie-${actief}` : undefined}
          value={invoer}
          onChange={(e) => {
            setInvoer(e.target.value)
            setActief(-1)
            setOpen(e.target.value.trim() !== '')
          }}
          onKeyDown={opToets}
          onFocus={() => setOpen(invoer.trim() !== '')}
          onBlur={() => {
            setOpen(false)
            setActief(-1)
          }}
          placeholder="bv. Latijn, sport, verzorging"
          className="w-full rounded-lg border border-rand px-3 py-2 text-base md:text-sm focus:border-accent"
        />
        {open && invoer.trim() !== '' && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-rand bg-kaart shadow-lg md:w-80">
            <ul
              id="richting-suggesties"
              role="listbox"
              aria-label="Studierichtingen"
              aria-multiselectable="true"
              className="max-h-72 overflow-auto"
            >
              {treffers.length === 0 && (
                <li className="px-3 py-2 text-sm text-zacht">Geen richting met deze naam.</li>
              )}
              {metAlles && (
                <li
                  id="richting-optie-0"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => kiesOptie(0)}
                  className={`cursor-pointer border-b border-rand px-3 py-2 text-sm font-medium text-accent hover:bg-hover ${actief === 0 ? 'bg-hover' : ''}`}
                >
                  {/* Het totaal, ook als er al enkele gekozen zijn: "Kies alle 22" terwijl er 24
                      treffers zijn, las als een fout in de telling. */}
                  {`Kies alle ${treffers.length} richtingen met "${invoer.trim()}"`}
                </li>
              )}
              {getoond.map((r, i) => {
                const index = i + (metAlles ? 1 : 0)
                const gekozen = isGekozen(keuzes, naarKeuze(r))
                const hier = aantalHier(tellingen, r)
                return (
                  <li
                    key={`${r.code}|${r.graad}`}
                    id={`richting-optie-${index}`}
                    role="option"
                    aria-selected={gekozen}
                    // preventDefault houdt de focus in het invoerveld, zodat de blur de lijst
                    // niet sluit vóór de klik aankomt.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => kiesOptie(index)}
                    className={`flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-hover ${index === actief ? 'bg-hover' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border text-[10px] leading-none ${gekozen ? 'border-accent bg-accent text-accent-inkt' : 'border-rand'}`}
                    >
                      {gekozen ? '✓' : ''}
                    </span>
                    <span className={hier === 0 ? 'text-zacht' : 'text-inkt'}>
                      {r.naam}
                      <span className="block text-xs text-zacht">
                        {[graadKort(r.graad), `${hier} ${hier === 1 ? 'adres' : 'adressen'}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </li>
                )
              })}
              {treffers.length > getoond.length && (
                <li className="px-3 py-2 text-xs text-zacht">
                  Nog {treffers.length - getoond.length} richtingen. Typ verder om te verfijnen.
                </li>
              )}
            </ul>
            {/* Op een telefoon vult de lijst het scherm en is er amper plaats om ernaast te
                tikken. Deze knop sluit ze en laat ook het toetsenbord zakken. Hij staat buiten de
                listbox, want daarin horen enkel opties. Met een muis klik je gewoon ernaast. */}
            <div className="border-t border-rand p-2 md:hidden">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  setActief(-1)
                  invoerRef.current?.blur()
                }}
                className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-inkt"
              >
                Klaar
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-zacht">
        Kies er gerust meerdere. Je ziet elk adres waar minstens één ervan te volgen is. Het
        aantal adressen telt binnen je gekozen gebied.
      </p>

      {keuzes.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Gekozen studierichtingen">
          {keuzes.map((k) => {
            const label = keuzeLabel(k, namen)
            return (
              <li key={keuzeSleutel(k)}>
                <button
                  type="button"
                  onClick={() => onKeuzesChange(wisselKeuze(keuzes, k))}
                  aria-label={`Richting ${label} wissen`}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-rand bg-kaart py-1 pr-1.5 pl-2.5 text-left text-xs text-inkt hover:bg-hover"
                >
                  {label}
                  <span
                    aria-hidden="true"
                    className="grid size-4 shrink-0 place-items-center rounded-sm text-zacht group-hover:text-inkt"
                  >
                    ✕
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
