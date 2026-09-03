import {
  FINALITEIT_CHIP,
  FINALITEIT_OPTIONS,
  FINALITEIT_STYLES,
  FINALITEIT_TEKEN,
  type FinaliteitKeuze,
  verborgenOmschrijving,
} from '../lib/aanbod'
import { useMemo, useState } from 'react'
import { DOMEIN_RIJEN, domeinLabel } from '../lib/domein'
import { NET_CHIP, NET_STYLES, NET_UITLEG } from '../lib/net'
import { PROVINCIE_UITLEG } from '../lib/provincie'
import type { Net, Provincie } from '../types'

interface FilterPanelProps {
  netOpties: Net[]
  provincieOpties: Provincie[]
  gemeenteOpties: string[]
  /** Aantal adressen per gemeente bij de huidige filters, zónder de gemeentefilter zelf. */
  gemeenteTellingen: Map<string, number>
  netten: Net[]
  provincies: Provincie[]
  gemeenten: string[]
  tekst: string
  finaliteiten: FinaliteitKeuze[]
  /** Aangevinkte studiedomeinen, als code. Leeg = alle. */
  domeinen: string[]
  richting: string
  toonZonderAanbod: boolean
  /** Hoeveel adressen op dit moment door dit filter wegvallen. 0 = niets te melden. */
  verborgenZonderAanbod: number
  /** Hoeveel losse schoolrijen wegvallen op adressen die wél blijven staan. */
  verborgenLegeScholen: number
  onNettenChange: (netten: Net[]) => void
  onProvinciesChange: (provincies: Provincie[]) => void
  onGemeentenChange: (gemeenten: string[]) => void
  onTekstChange: (tekst: string) => void
  onFinaliteitenChange: (finaliteiten: FinaliteitKeuze[]) => void
  onDomeinenChange: (domeinen: string[]) => void
  /** Opent de matrix vanuit de filterkolom, waar het domein voor het eerst opduikt. */
  onMatrixOpen: () => void
  onRichtingChange: (richting: string) => void
  onToonZonderAanbodChange: (toon: boolean) => void
}

/** Korte uitleg bij elke finaliteit — de termen zijn nieuw voor veel ouders. */
const FINALITEIT_UITLEG: Record<FinaliteitKeuze, string> = {
  Doorstroom: 'bereidt voor op hoger onderwijs',
  Dubbel: 'bereidt voor op hoger onderwijs of op werk',
  Arbeidsmarkt: 'bereidt voor op werk meteen na het secundair',
}

export function FilterPanel({
  netOpties,
  provincieOpties,
  gemeenteOpties,
  gemeenteTellingen,
  netten,
  provincies,
  gemeenten,
  tekst,
  finaliteiten,
  domeinen,
  richting,
  toonZonderAanbod,
  verborgenZonderAanbod,
  verborgenLegeScholen,
  onNettenChange,
  onProvinciesChange,
  onGemeentenChange,
  onTekstChange,
  onFinaliteitenChange,
  onDomeinenChange,
  onMatrixOpen,
  onRichtingChange,
  onToonZonderAanbodChange,
}: FilterPanelProps) {
  /**
   * Het zoekveldje boven de gemeentelijst. Bewust lokale state en niet in de URL: het is een
   * hulpmiddel om een vinkje terug te vinden, geen filter op de resultaten. Wat er gefilterd
   * wordt, staat in `gemeenten` en dus wél in de URL.
   */
  const [gemeenteZoek, setGemeenteZoek] = useState('')
  const verborgen = verborgenOmschrijving(verborgenZonderAanbod, verborgenLegeScholen)

  // Aangevinkte gemeenten staan altijd bovenaan en blijven staan, ook als ze niet op de
  // zoekterm matchen. Anders typ je "Gent", verdwijnt het vinkje van Antwerpen uit beeld, en
  // zie je niet meer waarom je resultaten zo mager zijn.
  const zichtbareGemeenten = useMemo(() => {
    const term = gemeenteZoek.trim().toLowerCase()
    const gekozen = gemeenteOpties.filter((g) => gemeenten.includes(g))
    const rest = gemeenteOpties.filter(
      (g) => !gemeenten.includes(g) && (term === '' || g.toLowerCase().includes(term)),
    )
    return [...gekozen, ...rest]
  }, [gemeenteOpties, gemeenten, gemeenteZoek])

  function toggleNet(net: Net) {
    onNettenChange(netten.includes(net) ? netten.filter((n) => n !== net) : [...netten, net])
  }

  function toggleDomein(domein: string) {
    onDomeinenChange(
      domeinen.includes(domein) ? domeinen.filter((d) => d !== domein) : [...domeinen, domein],
    )
  }

  function toggleFinaliteit(finaliteit: FinaliteitKeuze) {
    onFinaliteitenChange(
      finaliteiten.includes(finaliteit)
        ? finaliteiten.filter((f) => f !== finaliteit)
        : [...finaliteiten, finaliteit],
    )
  }

  function toggleProvincie(provincie: Provincie) {
    onProvinciesChange(
      provincies.includes(provincie)
        ? provincies.filter((p) => p !== provincie)
        : [...provincies, provincie],
    )
  }

  function toggleGemeente(gemeente: string) {
    onGemeentenChange(
      gemeenten.includes(gemeente)
        ? gemeenten.filter((g) => g !== gemeente)
        : [...gemeenten, gemeente],
    )
  }

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-rand p-4 flex flex-col gap-6">
      <div>
        <label htmlFor="tekst" className="block text-sm font-medium text-inkt mb-1">
          Zoek op schoolnaam
        </label>
        <input
          id="tekst"
          type="text"
          value={tekst}
          onChange={(e) => onTekstChange(e.target.value)}
          placeholder="bv. Atheneum"
          className="w-full rounded-md border border-rand px-3 py-2 text-base md:text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="richting" className="block text-sm font-medium text-inkt mb-1">
          Zoek op studierichting
        </label>
        <input
          id="richting"
          type="text"
          value={richting}
          onChange={(e) => onRichtingChange(e.target.value)}
          placeholder="bv. Latijn, verzorging, STEM"
          className="w-full rounded-md border border-rand px-3 py-2 text-base md:text-sm focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-xs text-zacht">
          Toont scholen waar minstens één richting hierop matcht.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-inkt mb-2">Net</h2>
        <div className="flex flex-col gap-2">
          {netOpties.map((net) => (
            <label key={net} className="flex items-start gap-2 text-sm text-zacht">
              <input
                type="checkbox"
                checked={netten.includes(net)}
                onChange={() => toggleNet(net)}
                className="mt-1 rounded border-rand"
              />
              <span>
                <span className={`${NET_CHIP} ${NET_STYLES[net]}`}>
                  {net}
                </span>
                {NET_UITLEG[net] && (
                  <span className="block text-xs text-zacht">{NET_UITLEG[net]}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-inkt mb-2">Provincie</h2>
        <div className="flex flex-col gap-2">
          {provincieOpties.map((provincie) => (
            <label key={provincie} className="flex items-start gap-2 text-sm text-zacht">
              <input
                type="checkbox"
                checked={provincies.includes(provincie)}
                onChange={() => toggleProvincie(provincie)}
                className="mt-1 rounded border-rand"
              />
              <span>
                <span className="text-inkt">{provincie}</span>
                {PROVINCIE_UITLEG[provincie] && (
                  <span className="block text-xs text-zacht">{PROVINCIE_UITLEG[provincie]}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="gemeentezoek" className="block text-sm font-medium text-inkt mb-1">
          Gemeente
        </label>
        {/* Een zoekveldje is hier geen luxe: heel Vlaanderen en Brussel telt 245 gemeenten met
            minstens één school, en die allemaal als vinkje aanbieden maakt van een filter een
            zoekopdracht op zich. De lijst toont enkel gemeenten die in de huidige resultaten
            voorkomen, met het aantal adressen erachter. */}
        <input
          id="gemeentezoek"
          type="search"
          value={gemeenteZoek}
          onChange={(e) => setGemeenteZoek(e.target.value)}
          placeholder="bv. Mechelen"
          className="w-full rounded-md border border-rand px-3 py-2 text-base md:text-sm focus:border-accent focus:outline-none"
        />
        {/* `relative` is hier geen opsmuk: elk label bevat een `sr-only` span, en die is
            absoluut gepositioneerd. Zonder containing block op deze scroller vallen die 236
            spans buiten het scrollgebied en rekken ze de hele pagina met ~2000px op. */}
        <div className="relative mt-2 flex flex-col gap-1.5 max-h-48 overflow-auto pr-1">
          {zichtbareGemeenten.map((gemeente) => (
            <label
              key={gemeente}
              className="flex items-center justify-between gap-2 text-sm text-zacht"
            >
              <span className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={gemeenten.includes(gemeente)}
                  onChange={() => toggleGemeente(gemeente)}
                  className="rounded border-rand shrink-0"
                />
                <span className="truncate">{gemeente}</span>
              </span>
              {/* Het aantal zegt hoeveel adressen je overhoudt als je dit aanvinkt. Voor een
                  schermlezer is een kaal getal naast een gemeentenaam betekenisloos. */}
              <span className="shrink-0 text-xs tabular-nums text-zacht">
                <span aria-hidden="true">{gemeenteTellingen.get(gemeente) ?? 0}</span>
                <span className="sr-only">
                  {gemeenteTellingen.get(gemeente) ?? 0} adressen
                </span>
              </span>
            </label>
          ))}
          {zichtbareGemeenten.length === 0 && (
            <p className="text-xs text-zacht">
              {gemeenteZoek.trim()
                ? `Geen gemeente gevonden voor "${gemeenteZoek.trim()}".`
                : 'Geen gemeenten in de huidige resultaten.'}
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-inkt mb-2">Finaliteit</h2>
        <div className="flex flex-col gap-2">
          {FINALITEIT_OPTIONS.map((finaliteit) => (
            <label key={finaliteit} className="flex items-start gap-2 text-sm text-zacht">
              <input
                type="checkbox"
                checked={finaliteiten.includes(finaliteit)}
                onChange={() => toggleFinaliteit(finaliteit)}
                className="mt-1 rounded border-rand"
              />
              <span>
                <span
                  className={`${FINALITEIT_CHIP} ${FINALITEIT_STYLES[finaliteit]}`}
                >
                  <span aria-hidden="true" className="text-[0.62em] leading-none">
                    {FINALITEIT_TEKEN[finaliteit]}
                  </span>
                  {finaliteit}
                </span>
                <span className="block text-xs text-zacht">
                  {FINALITEIT_UITLEG[finaliteit]}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-zacht">
          Geldt vanaf de tweede graad. De eerste graad is voor iedereen hetzelfde.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-inkt mb-2">Studiedomein</h2>
        <div className="flex flex-col gap-1.5">
          {DOMEIN_RIJEN.map((domein) => (
            <label key={domein} className="flex items-center gap-2 text-sm text-zacht">
              <input
                type="checkbox"
                checked={domeinen.includes(domein)}
                onChange={() => toggleDomein(domein)}
                className="rounded border-rand"
              />
              <span>{domeinLabel(domein)}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-zacht">
          Ook vanaf de tweede graad.{' '}
          <button
            type="button"
            onClick={onMatrixOpen}
            className="text-accent underline underline-offset-2"
          >
            Bekijk alle richtingen per domein
          </button>
          .
        </p>
      </div>

      {/* Standaard uit: adressen zonder aanbod zijn meestal administratief geregistreerde
          adressen waar geen les gegeven wordt. Hetzelfde geldt voor een losse school zonder
          aanbod op een adres waar de buren wél lesgeven. Bewust een zichtbaar vinkje en geen
          stille weglating — zie .claude/rules/frontend.md. */}
      <div>
        <h2 className="text-sm font-medium text-inkt mb-2">Zonder studieaanbod</h2>
        <label className="flex items-start gap-2 text-sm text-zacht">
          <input
            type="checkbox"
            checked={toonZonderAanbod}
            onChange={(e) => onToonZonderAanbodChange(e.target.checked)}
            className="mt-1 rounded border-rand"
          />
          <span>
            <span className="text-inkt">Toon ze ook</span>
            <span className="block text-xs text-zacht">
              {verborgen
                ? `${verborgen.tekst} ${verborgen.enkelvoud ? 'valt' : 'vallen'} nu weg`
                : 'Meestal een administratief adres waar geen les gegeven wordt'}
            </span>
          </span>
        </label>
      </div>

    </aside>
  )
}
