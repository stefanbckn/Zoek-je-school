import { FINALITEIT_OPTIONS, FINALITEIT_STYLES, type FinaliteitKeuze } from '../lib/aanbod'
import { NET_STYLES, NET_UITLEG } from '../lib/net'
import type { Net } from '../types'

interface FilterPanelProps {
  netOpties: Net[]
  gemeenteOpties: string[]
  netten: Net[]
  gemeenten: string[]
  tekst: string
  finaliteiten: FinaliteitKeuze[]
  richting: string
  onNettenChange: (netten: Net[]) => void
  onGemeentenChange: (gemeenten: string[]) => void
  onTekstChange: (tekst: string) => void
  onFinaliteitenChange: (finaliteiten: FinaliteitKeuze[]) => void
  onRichtingChange: (richting: string) => void
}

/** Korte uitleg bij elke finaliteit — de termen zijn nieuw voor veel ouders. */
const FINALITEIT_UITLEG: Record<FinaliteitKeuze, string> = {
  Doorstroom: 'bereidt voor op hoger onderwijs',
  Dubbel: 'hoger onderwijs of meteen aan het werk',
  Arbeidsmarkt: 'bereidt voor op meteen aan het werk',
}

export function FilterPanel({
  netOpties,
  gemeenteOpties,
  netten,
  gemeenten,
  tekst,
  finaliteiten,
  richting,
  onNettenChange,
  onGemeentenChange,
  onTekstChange,
  onFinaliteitenChange,
  onRichtingChange,
}: FilterPanelProps) {
  function toggleNet(net: Net) {
    onNettenChange(netten.includes(net) ? netten.filter((n) => n !== net) : [...netten, net])
  }

  function toggleFinaliteit(finaliteit: FinaliteitKeuze) {
    onFinaliteitenChange(
      finaliteiten.includes(finaliteit)
        ? finaliteiten.filter((f) => f !== finaliteit)
        : [...finaliteiten, finaliteit],
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
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col gap-6">
      <div>
        <label htmlFor="tekst" className="block text-sm font-medium text-slate-700 mb-1">
          Zoek op schoolnaam
        </label>
        <input
          id="tekst"
          type="text"
          value={tekst}
          onChange={(e) => onTekstChange(e.target.value)}
          placeholder="bv. Atheneum"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-2">Net</h2>
        <div className="flex flex-col gap-2">
          {netOpties.map((net) => (
            <label key={net} className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={netten.includes(net)}
                onChange={() => toggleNet(net)}
                className="mt-1 rounded border-slate-300"
              />
              <span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${NET_STYLES[net]}`}>
                  {net}
                </span>
                {NET_UITLEG[net] && (
                  <span className="block text-xs text-slate-500">{NET_UITLEG[net]}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-2">Gemeente</h2>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-auto pr-1">
          {gemeenteOpties.map((gemeente) => (
            <label key={gemeente} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={gemeenten.includes(gemeente)}
                onChange={() => toggleGemeente(gemeente)}
                className="rounded border-slate-300"
              />
              {gemeente}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-2">Finaliteit</h2>
        <div className="flex flex-col gap-2">
          {FINALITEIT_OPTIONS.map((finaliteit) => (
            <label key={finaliteit} className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={finaliteiten.includes(finaliteit)}
                onChange={() => toggleFinaliteit(finaliteit)}
                className="mt-1 rounded border-slate-300"
              />
              <span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${FINALITEIT_STYLES[finaliteit]}`}
                >
                  {finaliteit}
                </span>
                <span className="block text-xs text-slate-500">
                  {FINALITEIT_UITLEG[finaliteit]}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Geldt vanaf de tweede graad. De eerste graad is voor iedereen hetzelfde.
        </p>
      </div>

      <div>
        <label htmlFor="richting" className="block text-sm font-medium text-slate-700 mb-1">
          Zoek op studierichting
        </label>
        <input
          id="richting"
          type="text"
          value={richting}
          onChange={(e) => onRichtingChange(e.target.value)}
          placeholder="bv. Latijn, verzorging, STEM"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Toont adressen waar minstens één richting hierop matcht.
        </p>
      </div>

    </aside>
  )
}
