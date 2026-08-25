import { useEffect, useRef, useState } from 'react'
import { suggestLocaties, zoekLocatie, type LocatieSuggestie } from '../lib/geolocatie'

const STRAAL_OPTIES: { label: string; waarde: number | null }[] = [
  { label: '5 km', waarde: 5 },
  { label: '10 km', waarde: 10 },
  { label: '15 km', waarde: 15 },
  { label: '25 km', waarde: 25 },
  { label: 'Alles', waarde: null },
]

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
    <div className="p-4 border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={invoer}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setOpen(suggesties.length > 0)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Typ je gemeente of adres…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          {open && (
            <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
              {suggesties.map((s) => (
                <li key={s.tekst}>
                  <button
                    type="button"
                    onMouseDown={() => kiesSuggestie(s.tekst)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
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
            className="text-sm text-slate-500 underline"
          >
            Wissen
          </button>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="straal" className="text-sm text-slate-500">
            Straal:
          </label>
          <select
            id="straal"
            value={straalKm === null ? 'alles' : straalKm}
            onChange={(e) => onStraalChange(e.target.value === 'alles' ? null : Number(e.target.value))}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {STRAAL_OPTIES.map((o) => (
              <option key={o.label} value={o.waarde === null ? 'alles' : o.waarde}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        Tip: typ een straatnaam voor de nauwkeurigste locatie. Deelgemeenten zoals Borsbeek, Vremde
        of Deurne worden door deze zoekdienst niet apart herkend en vallen terug op het centrum van
        de hoofdgemeente.
      </p>
    </div>
  )
}
