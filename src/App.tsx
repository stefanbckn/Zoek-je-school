import { useMemo, useState } from 'react'
import { DetailPanel } from './components/DetailPanel'
import { FilterPanel } from './components/FilterPanel'
import { Footer } from './components/Footer'
import { ResultList } from './components/ResultList'
import { SearchBar } from './components/SearchBar'
import { haversineKm } from './lib/haversine'
import { useSearchState } from './lib/useSearchState'
import { useVestigingen } from './lib/useVestigingen'
import type { VestigingMetAfstand } from './types'

function App() {
  const { vestigingen, meta, loading, error } = useVestigingen()
  const { state, update } = useSearchState()
  const [geselecteerd, setGeselecteerd] = useState<VestigingMetAfstand | null>(null)

  const gemeenteOpties = useMemo(
    () => [...new Set(vestigingen.map((v) => v.gemeente))].sort((a, b) => a.localeCompare(b, 'nl')),
    [vestigingen],
  )

  const zichtbareVestigingen = useMemo(() => {
    const tekstLower = state.tekst.trim().toLowerCase()

    const gefilterd = vestigingen.filter((v) => {
      if (state.netten.length > 0 && !state.netten.includes(v.net)) return false
      if (state.gemeenten.length > 0 && !state.gemeenten.includes(v.gemeente)) return false
      if (tekstLower && !v.naam.toLowerCase().includes(tekstLower)) return false
      return true
    })

    const metAfstand = gefilterd.map((v) => ({
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
  }, [vestigingen, state.lat, state.lon, state.straalKm, state.netten, state.gemeenten, state.tekst])

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

      <div className="flex-1 flex flex-col md:flex-row">
        <FilterPanel
          gemeenteOpties={gemeenteOpties}
          netten={state.netten}
          gemeenten={state.gemeenten}
          tekst={state.tekst}
          onNettenChange={(netten) => update({ netten })}
          onGemeentenChange={(gemeenten) => update({ gemeenten })}
          onTekstChange={(tekst) => update({ tekst })}
        />

        <main className="flex-1">
          {loading && <p className="p-4 text-sm text-slate-500">Bezig met laden…</p>}
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <>
              <p className="px-4 pt-4 text-sm text-slate-500">
                {zichtbareVestigingen.length} resultaten
              </p>
              <ResultList vestigingen={zichtbareVestigingen} onSelect={setGeselecteerd} />
            </>
          )}
        </main>
      </div>

      <DetailPanel vestiging={geselecteerd} onClose={() => setGeselecteerd(null)} />

      <Footer meta={meta} />
    </div>
  )
}

export default App
