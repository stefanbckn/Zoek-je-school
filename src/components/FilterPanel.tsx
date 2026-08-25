import { NET_OPTIONS } from '../lib/net'
import type { Net } from '../types'

interface FilterPanelProps {
  gemeenteOpties: string[]
  netten: Net[]
  gemeenten: string[]
  tekst: string
  onNettenChange: (netten: Net[]) => void
  onGemeentenChange: (gemeenten: string[]) => void
  onTekstChange: (tekst: string) => void
}

export function FilterPanel({
  gemeenteOpties,
  netten,
  gemeenten,
  tekst,
  onNettenChange,
  onGemeentenChange,
  onTekstChange,
}: FilterPanelProps) {
  function toggleNet(net: Net) {
    onNettenChange(netten.includes(net) ? netten.filter((n) => n !== net) : [...netten, net])
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
        <div className="flex flex-col gap-1.5">
          {NET_OPTIONS.map((net) => (
            <label key={net} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={netten.includes(net)}
                onChange={() => toggleNet(net)}
                className="rounded border-slate-300"
              />
              {net}
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

      <div className="opacity-50">
        <h2 className="text-sm font-medium text-slate-700 mb-2">Studieaanbod — binnenkort</h2>
        <p className="text-xs text-slate-500">
          Filters op richting, finaliteit en studiedomein volgen zodra het studieaanbod
          gekoppeld is (vereist een API-key die nog aangevraagd moet worden).
        </p>
      </div>
    </aside>
  )
}
