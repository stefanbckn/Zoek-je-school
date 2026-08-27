import { useThema, type Thema } from '../lib/thema'

const OPTIES: { waarde: Thema; label: string; titel: string }[] = [
  { waarde: 'licht', label: 'Licht', titel: 'Altijd lichte weergave' },
  { waarde: 'systeem', label: 'Systeem', titel: 'Volg de instelling van je toestel' },
  { waarde: 'donker', label: 'Donker', titel: 'Altijd donkere weergave' },
]

export function ThemaToggle() {
  const { thema, setThema } = useThema()

  return (
    <div
      role="radiogroup"
      aria-label="Weergave"
      className="flex shrink-0 overflow-hidden rounded-lg border border-rand text-xs"
    >
      {OPTIES.map((optie) => {
        const actief = thema === optie.waarde
        return (
          <button
            key={optie.waarde}
            type="button"
            role="radio"
            aria-checked={actief}
            title={optie.titel}
            onClick={() => setThema(optie.waarde)}
            className={`px-2.5 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
              actief ? 'bg-accent text-accent-inkt font-medium' : 'text-zacht hover:bg-hover'
            }`}
          >
            {optie.label}
          </button>
        )
      })}
    </div>
  )
}
