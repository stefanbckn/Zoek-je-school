import { useThema, type Thema } from '../lib/thema'

const OPTIES: { waarde: Thema; label: string; titel: string }[] = [
  { waarde: 'licht', label: 'Licht', titel: 'Altijd lichte weergave' },
  { waarde: 'systeem', label: 'Systeem', titel: 'Volg de instelling van je toestel' },
  { waarde: 'donker', label: 'Donker', titel: 'Altijd donkere weergave' },
]

export function ThemaToggle() {
  const { thema, setThema } = useThema()

  return (
    // Staat alleen op de kopbalk, dus de kleuren komen uit het koppaar en niet uit
    // rand/zacht: die zijn op teal onleesbaar. Een pil met een halfdoorzichtige goot,
    // waarin de gekozen stand als volle knop staat.
    <div
      role="radiogroup"
      aria-label="Weergave"
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-kop-inkt/25 bg-kop-inkt/10 p-[3px] text-xs"
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
            className={`rounded-full px-2.5 py-1 transition-colors ${
              actief
                ? 'bg-kop-inkt text-kop font-semibold'
                : 'text-kop-inkt/80 hover:bg-kop-inkt/15 hover:text-kop-inkt'
            }`}
          >
            {optie.label}
          </button>
        )
      })}
    </div>
  )
}
