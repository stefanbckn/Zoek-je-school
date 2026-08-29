import { useState } from 'react'
import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import { ResultCard } from './ResultCard'

/**
 * Aantal kaartjes dat we in één keer tonen. Zonder filters staan er ruim 300 in de lijst; die
 * allemaal tegelijk in de DOM zetten maakt doorscrollen traag, precies voor wie nog niet weet
 * waarop te filteren.
 *
 * Een "Toon meer"-knop en géén genummerde pagina's: de lijst staat op afstand gesorteerd, dus
 * wat bovenaan staat is wat telt — niemand bladert doelgericht naar pagina 7. Een knop houdt
 * bovendien de scrollpositie intact, en dat is op mobiel het verschil. Zie CLAUDE.md.
 */
const PAGINA = 25

interface ResultListProps {
  campussen: CampusMetAfstand[]
  onSelect: (campus: CampusMetAfstand, school: SchoolOpCampus) => void
  /** Id's van de campussen die in de vergelijking zitten. */
  vergelijking: string[]
  vergelijkVol: boolean
  onVergelijkToggle: (campus: CampusMetAfstand) => void
}

export function ResultList({
  campussen,
  onSelect,
  vergelijking,
  vergelijkVol,
  onVergelijkToggle,
}: ResultListProps) {
  // Terug naar de eerste lading zodra de zoekopdracht verandert. Zonder dit zit je na het
  // aanvinken van één gemeente nog steeds naar 75 items te kijken terwijl er 4 resultaten zijn.
  //
  // Bewust tijdens de render bijgesteld en niet in een useEffect: React herstart dan meteen de
  // render met de nieuwe waarde, zonder eerst de oude lijstlengte te tonen. `campussen` is in
  // App gememoiseerd, dus de vergelijking op identiteit klopt — een nieuwe array betekent hier
  // echt een nieuwe zoekopdracht.
  const [staat, setStaat] = useState({ lijst: campussen, zichtbaar: PAGINA })
  if (staat.lijst !== campussen) {
    setStaat({ lijst: campussen, zichtbaar: PAGINA })
  }
  const zichtbaar = staat.lijst === campussen ? staat.zichtbaar : PAGINA

  if (campussen.length === 0) {
    return <p className="p-4 text-sm text-zacht">Geen scholen gevonden voor deze zoekopdracht.</p>
  }

  const getoond = campussen.slice(0, zichtbaar)
  const rest = campussen.length - getoond.length

  return (
    <div className="flex flex-col gap-3 p-4">
      {getoond.map((c) => (
        <ResultCard
          key={c.id}
          campus={c}
          onSelect={onSelect}
          vergeleken={vergelijking.includes(c.id)}
          vergelijkVol={vergelijkVol}
          onVergelijkToggle={onVergelijkToggle}
        />
      ))}

      {/* "Scholen" en niet "adressen", ook al is één kaartje één adres dat meerdere scholen kan
          dragen. De bezoeker zoekt scholen; het datamodel is zijn probleem niet. Zelfde
          woordkeuze als de filterkolom. */}
      {rest > 0 && (
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            type="button"
            onClick={() => setStaat((s) => ({ ...s, zichtbaar: s.zichtbaar + PAGINA }))}
            className="rounded-md border border-rand px-4 py-2 text-sm font-medium text-inkt hover:bg-hover"
          >
            Toon {Math.min(PAGINA, rest)} scholen meer
          </button>
          <p className="text-xs text-zacht" aria-live="polite">
            {getoond.length} van {campussen.length} scholen getoond
          </p>
        </div>
      )}
    </div>
  )
}
