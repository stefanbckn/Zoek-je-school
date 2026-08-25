import type { VestigingMetAfstand } from '../types'
import { NET_STYLES } from '../lib/net'

interface ResultCardProps {
  vestiging: VestigingMetAfstand
  onSelect: (vestiging: VestigingMetAfstand) => void
}

export function ResultCard({ vestiging, onSelect }: ResultCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(vestiging)}
      className="w-full text-left rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-900">{vestiging.naam}</h3>
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${NET_STYLES[vestiging.net]}`}>
          {vestiging.net}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {vestiging.straat} {vestiging.huisnummer}, {vestiging.postcode} {vestiging.gemeente}
      </p>
      {vestiging.afstandKm !== null && (
        <p className="mt-1 text-sm font-medium text-slate-700">
          {vestiging.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km hemelsbreed
        </p>
      )}
    </button>
  )
}
