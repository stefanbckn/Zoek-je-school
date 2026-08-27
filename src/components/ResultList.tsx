import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import { ResultCard } from './ResultCard'

interface ResultListProps {
  campussen: CampusMetAfstand[]
  onSelect: (campus: CampusMetAfstand, school: SchoolOpCampus) => void
}

export function ResultList({ campussen, onSelect }: ResultListProps) {
  if (campussen.length === 0) {
    return <p className="p-4 text-sm text-zacht">Geen scholen gevonden voor deze zoekopdracht.</p>
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {campussen.map((c) => (
        <ResultCard key={c.id} campus={c} onSelect={onSelect} />
      ))}
    </div>
  )
}
