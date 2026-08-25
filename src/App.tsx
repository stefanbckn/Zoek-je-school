import { useMemo, useState } from 'react'
import { Footer } from './components/Footer'
import { ResultList } from './components/ResultList'
import { SearchBar } from './components/SearchBar'
import { haversineKm } from './lib/haversine'
import { useSearchState } from './lib/useSearchState'
import { useVestigingen } from './lib/useVestigingen'
import type { Vestiging } from './types'

function App() {
  const { vestigingen, meta, loading, error } = useVestigingen()
  const { state, update } = useSearchState()
  const [, setGeselecteerd] = useState<Vestiging | null>(null)

  const zichtbareVestigingen = useMemo(() => {
    const metAfstand = vestigingen.map((v) => ({
      ...v,
      afstandKm:
        state.lat !== null && state.lon !== null
          ? haversineKm(state.lat, state.lon, v.lat, v.lon)
          : null,
    }))

    const binnenStraal = metAfstand.filter((v) => {
      if (state.straalKm === null || v.afstandKm === null) return true
      return v.afstandKm <= state.straalKm
    })

    if (state.lat !== null && state.lon !== null) {
      binnenStraal.sort((a, b) => (a.afstandKm ?? 0) - (b.afstandKm ?? 0))
    }

    return binnenStraal
  }, [vestigingen, state.lat, state.lon, state.straalKm])

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-slate-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-slate-900">Zoek je school</h1>
        <p className="text-sm text-slate-500">
          Middelbare scholen in provincie Antwerpen
        </p>
      </header>

      <SearchBar
        label={state.label}
        straalKm={state.straalKm}
        onLocatieGekozen={(locatie) =>
          update({ lat: locatie.lat, lon: locatie.lon, label: locatie.label })
        }
        onStraalChange={(straalKm) => update({ straalKm })}
        onWissen={() => update({ lat: null, lon: null, label: null })}
      />

      <main className="flex-1">
        {loading && <p className="p-4 text-sm text-slate-500">Bezig met laden…</p>}
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <ResultList vestigingen={zichtbareVestigingen} onSelect={setGeselecteerd} />
        )}
      </main>

      <Footer meta={meta} />
    </div>
  )
}

export default App
