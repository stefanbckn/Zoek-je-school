import type { Vestiging } from '../types'
import { ResultCard } from './ResultCard'

interface ResultListProps {
  vestigingen: Vestiging[]
  onSelect: (vestiging: Vestiging) => void
}

export function ResultList({ vestigingen, onSelect }: ResultListProps) {
  if (vestigingen.length === 0) {
    return <p className="p-4 text-sm text-slate-500">Geen scholen gevonden voor deze zoekopdracht.</p>
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {vestigingen.map((v) => (
        <ResultCard key={v.id} vestiging={v} onSelect={onSelect} />
      ))}
    </div>
  )
}
