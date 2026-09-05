import { useEffect, useRef, useState } from 'react'
import { suggestLocaties, zoekLocatie, type LocatieSuggestie } from '../lib/geolocatie'

interface StraalOptie {
  label: string
  waarde: number | null
}

const STRAAL_OPTIES: StraalOptie[] = [
  { label: '5 km', waarde: 5 },
  { label: '10 km', waarde: 10 },
  { label: '15 km', waarde: 15 },
  { label: '25 km', waarde: 25 },
  { label: 'Alles', waarde: null },
]

/**
 * De straal komt uit de URL en hoeft geen keuze uit de lijst te zijn: `?straal=3` is geldig
 * en wordt ook echt toegepast. Zonder bijpassende <option> valt de <select> terug op de eerste
 * optie, waardoor er "5 km" stond terwijl er op 3 km gefilterd werd — de UI loog dan over wat
 * er gebeurde. Een afwijkende waarde krijgt daarom een eigen optie, op de juiste plek in de rij.
 */
function straalOpties(straalKm: number | null): StraalOptie[] {
  if (straalKm === null || STRAAL_OPTIES.some((o) => o.waarde === straalKm)) return STRAAL_OPTIES
  const extra: StraalOptie = { label: `${straalKm} km`, waarde: straalKm }
  const genummerd = STRAAL_OPTIES.filter((o) => o.waarde !== null)
  const alles = STRAAL_OPTIES.filter((o) => o.waarde === null)
  return [...genummerd, extra].sort((a, b) => (a.waarde ?? 0) - (b.waarde ?? 0)).concat(alles)
}

interface SearchBarProps {
  label: string | null
  straalKm: number | null
  onLocatieGekozen: (locatie: { label: string; lat: number; lon: number }) => void
  onStraalChange: (straalKm: number | null) => void
  onWissen: () => void
}

export function SearchBar({
  label,
  straalKm,
  onLocatieGekozen,
  onStraalChange,
  onWissen,
}: SearchBarProps) {
  const [invoer, setInvoer] = useState(label ?? '')
  const [suggesties, setSuggesties] = useState<LocatieSuggestie[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setInvoer(label ?? '')
  }, [label])

  function handleChange(waarde: string) {
    setInvoer(waarde)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!waarde.trim()) {
      setSuggesties([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const resultaten = await suggestLocaties(waarde)
        setSuggesties(resultaten)
        setOpen(resultaten.length > 0)
      } catch {
        setSuggesties([])
      }
    }, 250)
  }

  async function kiesSuggestie(tekst: string) {
    setInvoer(tekst)
    setOpen(false)
    const locatie = await zoekLocatie(tekst)
    if (locatie) onLocatieGekozen(locatie)
  }

  return (
    <div className="p-4 border-b border-rand">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={invoer}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setOpen(suggesties.length > 0)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Typ je gemeente of adres…"
            className="h-12 w-full rounded-lg border border-rand px-3.5 text-base focus:border-accent md:h-13"
          />
          {open && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-rand bg-kaart shadow-lg max-h-60 overflow-auto">
              {suggesties.map((s) => (
                <li key={s.tekst}>
                  <button
                    type="button"
                    onMouseDown={() => kiesSuggestie(s.tekst)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-hover"
                  >
                    {s.tekst}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {label && (
          <button
            type="button"
            onClick={() => {
              setInvoer('')
              onWissen()
            }}
            className="text-sm text-zacht underline"
          >
            Wissen
          </button>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="straal" className="text-sm text-zacht">
            Straal:
          </label>
          <select
            id="straal"
            value={straalKm === null ? 'alles' : straalKm}
            onChange={(e) => onStraalChange(e.target.value === 'alles' ? null : Number(e.target.value))}
            className="rounded-lg border border-rand px-2 py-1.5 text-base md:text-sm"
          >
            {straalOpties(straalKm).map((o) => (
              <option key={o.label} value={o.waarde === null ? 'alles' : o.waarde}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-1.5 text-xs text-zacht">
        Tip: typ een straatnaam voor de nauwkeurigste locatie. Deelgemeenten zoals Borsbeek, Vremde
        of Deurne worden door deze zoekdienst niet apart herkend en vallen terug op het centrum van
        de hoofdgemeente.
      </p>
    </div>
  )
}
