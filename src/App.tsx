import { useMemo, useState } from 'react'
import { DetailPanel } from './components/DetailPanel'
import { FilterPanel } from './components/FilterPanel'
import { Footer } from './components/Footer'
import { MapView } from './components/MapView'
import { ResultList } from './components/ResultList'
import { SearchBar } from './components/SearchBar'
import { haversineKm } from './lib/haversine'
import { useSearchState } from './lib/useSearchState'
import { useVestigingen } from './lib/useVestigingen'
import type { CampusMetAfstand, SchoolOpCampus } from './types'

type Weergave = 'lijst' | 'kaart'

function App() {
  const { campussen, meta, loading, error } = useVestigingen()
  const { state, update } = useSearchState()
  const [geselecteerd, setGeselecteerd] = useState<{
    campus: CampusMetAfstand
    school: SchoolOpCampus
  } | null>(null)
  const [weergave, setWeergave] = useState<Weergave>('lijst')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const actieveFilters =
    state.netten.length + state.gemeenten.length + (state.tekst.trim() ? 1 : 0)

  const gemeenteOpties = useMemo(
    () => [...new Set(campussen.map((c) => c.gemeente))].sort((a, b) => a.localeCompare(b, 'nl')),
    [campussen],
  )

  // Stabiele referentie: anders herstart DetailPanel's fietsroute-effect bij elke
  // ongerelateerde re-render (bv. lijst/kaart wisselen) terwijl het paneel open staat.
  const zoeklocatie = useMemo(
    () => (state.lat !== null && state.lon !== null ? { lat: state.lat, lon: state.lon } : null),
    [state.lat, state.lon],
  )

  const zichtbareCampussen = useMemo(() => {
    const tekstLower = state.tekst.trim().toLowerCase()

    const gefilterd = campussen
      .map((c) => ({
        ...c,
        scholen: c.scholen.filter((s) => {
          if (state.netten.length > 0 && !state.netten.includes(s.net)) return false
          if (tekstLower && !s.naam.toLowerCase().includes(tekstLower)) return false
          return true
        }),
      }))
      .filter((c) => {
        if (c.scholen.length === 0) return false
        if (state.gemeenten.length > 0 && !state.gemeenten.includes(c.gemeente)) return false
        return true
      })

    const metAfstand: CampusMetAfstand[] = gefilterd.map((c) => ({
      ...c,
      afstandKm:
        state.lat !== null && state.lon !== null && c.lat !== null && c.lon !== null
          ? haversineKm(state.lat, state.lon, c.lat, c.lon)
          : null,
    }))

    const binnenStraal = metAfstand.filter((c) => {
      const zoektLocatie = state.lat !== null && state.lon !== null
      if (!zoektLocatie || state.straalKm === null) return true
      // Geen coördinaten bekend voor deze campus: kan niet binnen een straal vallen.
      if (c.afstandKm === null) return false
      return c.afstandKm <= state.straalKm
    })

    if (state.lat !== null && state.lon !== null) {
      // Resterende null hier betekent: campus heeft geen coördinaten in de bron — achteraan.
      binnenStraal.sort((a, b) => (a.afstandKm ?? Infinity) - (b.afstandKm ?? Infinity))
    }

    return binnenStraal
  }, [campussen, state.lat, state.lon, state.straalKm, state.netten, state.gemeenten, state.tekst])

  function selecteer(campus: CampusMetAfstand, school: SchoolOpCampus) {
    setGeselecteerd({ campus, school })
  }

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
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <FilterPanel
            gemeenteOpties={gemeenteOpties}
            netten={state.netten}
            gemeenten={state.gemeenten}
            tekst={state.tekst}
            onNettenChange={(netten) => update({ netten })}
            onGemeentenChange={(gemeenten) => update({ gemeenten })}
            onTekstChange={(tekst) => update({ tekst })}
          />
        </div>

        <main className="flex-1 flex flex-col min-h-[60vh]">
          {loading && <p className="p-4 text-sm text-slate-500">Bezig met laden…</p>}
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <>
              <div className="flex items-center justify-between px-4 pt-4 gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500 shrink-0">
                    {zichtbareCampussen.length} resultaten
                  </p>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className="md:hidden text-sm rounded-md border border-slate-300 px-3 py-1"
                  >
                    Filters{actieveFilters > 0 ? ` (${actieveFilters})` : ''}
                    {filtersOpen ? ' ▲' : ' ▼'}
                  </button>
                </div>
                <div className="flex rounded-md border border-slate-300 text-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWeergave('lijst')}
                    className={`px-3 py-1 ${weergave === 'lijst' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                  >
                    Lijst
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeergave('kaart')}
                    className={`px-3 py-1 ${weergave === 'kaart' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                  >
                    Kaart
                  </button>
                </div>
              </div>

              {weergave === 'lijst' ? (
                <ResultList campussen={zichtbareCampussen} onSelect={selecteer} />
              ) : (
                <div className="flex-1 mt-4 min-h-[400px] isolate">
                  <MapView campussen={zichtbareCampussen} onSelect={selecteer} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <DetailPanel
        campus={geselecteerd?.campus ?? null}
        school={geselecteerd?.school ?? null}
        zoeklocatie={zoeklocatie}
        onClose={() => setGeselecteerd(null)}
      />

      <Footer meta={meta} />
    </div>
  )
}

export default App
