import type { CampusMetAfstand } from '../types'
import { campusLabel, MAX_VERGELIJK, MIN_VERGELIJK } from '../lib/vergelijking'

interface VergelijkBalkProps {
  gekozen: CampusMetAfstand[]
  onVerwijder: (id: string) => void
  onWisAlles: () => void
  onOpen: () => void
}

/**
 * Vaste balk onderaan zodra er iets aangevinkt staat. Zonder die balk is een aangevinkte
 * campus onvindbaar: je vinkt er één aan bovenaan de lijst, scrollt door, en ziet nergens meer
 * wat er in je selectie zit of hoe je ze opent.
 *
 * Hij bestaat ook op mobiel — daar staat hij zelfs vaker in beeld, omdat de lijst er langer
 * is. Zie de opmerking bij VergelijkPanel over waarom de tabel zelf ook op een telefoon werkt.
 */
export function VergelijkBalk({ gekozen, onVerwijder, onWisAlles, onOpen }: VergelijkBalkProps) {
  if (gekozen.length === 0) return null

  const genoeg = gekozen.length >= MIN_VERGELIJK

  return (
    // print:hidden: bij het afdrukken van de vergelijking hoort een knoppenbalk niet op papier.
    <div className="sticky bottom-0 z-10 border-t border-rand bg-kaart px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zacht">
          Vergelijken ({gekozen.length}/{MAX_VERGELIJK}):
        </span>

        <ul className="flex flex-1 flex-wrap items-center gap-1.5">
          {gekozen.map((campus) => (
            <li key={campus.id}>
              <button
                type="button"
                onClick={() => onVerwijder(campus.id)}
                aria-label={`${campusLabel(campus)} uit de vergelijking halen`}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-rand bg-grond py-1 pr-1.5 pl-2.5 text-xs text-inkt transition-colors hover:bg-hover"
              >
                {campusLabel(campus)}
                <span
                  aria-hidden="true"
                  className="grid size-4 place-items-center rounded-sm text-zacht group-hover:text-inkt"
                >
                  ✕
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onWisAlles}
            className="rounded-lg px-2 py-1 text-xs font-medium text-accent underline underline-offset-2 hover:bg-hover"
          >
            Wissen
          </button>
          <button
            type="button"
            onClick={onOpen}
            disabled={!genoeg}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-inkt disabled:cursor-not-allowed disabled:opacity-50"
          >
            Vergelijk {gekozen.length}
          </button>
        </div>
      </div>

      {/* De knop uitschakelen zonder te zeggen waarom is een raadsel voor de bezoeker: één
          aangevinkte school ziet er niet uit als een fout. */}
      {!genoeg && (
        <p className="mt-1.5 text-xs text-zacht">
          Vink er minstens {MIN_VERGELIJK} aan om ze naast elkaar te zetten.
        </p>
      )}
    </div>
  )
}
