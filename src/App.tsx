import { useMemo, useState } from 'react'
import { ActieveFilters } from './components/ActieveFilters'
import { DetailPanel } from './components/DetailPanel'
import { FilterPanel } from './components/FilterPanel'
import { Footer } from './components/Footer'
import { MapView } from './components/MapView'
import { ResultList } from './components/ResultList'
import { SearchBar } from './components/SearchBar'
import { ThemaToggle } from './components/ThemaToggle'
import { richtingMatcht } from './lib/aanbod'
import { haversineKm } from './lib/haversine'
import { NET_OPTIONS } from './lib/net'
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
    state.netten.length +
    state.gemeenten.length +
    state.finaliteiten.length +
    (state.tekst.trim() ? 1 : 0) +
    (state.richting.trim() ? 1 : 0)

  // Alleen netten aanbieden die in de dataset voorkomen. 'Officieel gesubsidieerd' (OCMW,
  // intercommunale) bestaat als categorie maar heeft in provincie Antwerpen geen enkele school;
  // dat als vinkje tonen levert enkel een filter op die gegarandeerd niets teruggeeft.
  const netOpties = useMemo(() => {
    const aanwezig = new Set(campussen.flatMap((c) => c.scholen.map((s) => s.net)))
    // Een net dat wél aangevinkt staat maar in de data ontbreekt, tonen we toch — anders zie je
    // 0 resultaten zonder enig zichtbaar vinkje om weer uit te zetten.
    return NET_OPTIONS.filter((n) => aanwezig.has(n) || state.netten.includes(n))
  }, [campussen, state.netten])

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
    const richtingTerm = state.richting.trim()
    const filtertOpAanbod = richtingTerm.length > 0 || state.finaliteiten.length > 0

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
        if (!filtertOpAanbod) return true
        // Aanbodfilters gelden op adresniveau, niet per school: scholen die een campus delen
        // vullen elkaars aanbod aan, en wie op "Latijn" zoekt wil dat adres zien — ook als
        // de richting bij de buurschool op hetzelfde adres hoort. Zie CLAUDE.md.
        return c.scholen.some((s) =>
          s.richtingen.some((r) => {
            if (state.finaliteiten.length > 0) {
              if (r.finaliteit === null) return false
              if (!state.finaliteiten.includes(r.finaliteit)) return false
            }
            return richtingMatcht(r, richtingTerm)
          }),
        )
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
  }, [
    campussen,
    state.lat,
    state.lon,
    state.straalKm,
    state.netten,
    state.gemeenten,
    state.tekst,
    state.finaliteiten,
    state.richting,
  ])

  function selecteer(campus: CampusMetAfstand, school: SchoolOpCampus) {
    setGeselecteerd({ campus, school })
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* flex-wrap is nodig: op 375px past de driestandenknop niet naast de titel en viel
          "Donker" buiten het scherm. Bij weinig ruimte zakt de knop naar een eigen regel. */}
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-rand px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-inkt">Zoek je school</h1>
          <p className="text-sm text-zacht">Middelbare scholen in provincie Antwerpen</p>
        </div>
        <ThemaToggle />
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

      <ActieveFilters
        state={state}
        onUpdate={update}
        onWisAlles={() =>
          update({ netten: [], gemeenten: [], finaliteiten: [], tekst: '', richting: '' })
        }
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <FilterPanel
            netOpties={netOpties}
            gemeenteOpties={gemeenteOpties}
            netten={state.netten}
            gemeenten={state.gemeenten}
            tekst={state.tekst}
            finaliteiten={state.finaliteiten}
            richting={state.richting}
            onNettenChange={(netten) => update({ netten })}
            onGemeentenChange={(gemeenten) => update({ gemeenten })}
            onTekstChange={(tekst) => update({ tekst })}
            onFinaliteitenChange={(finaliteiten) => update({ finaliteiten })}
            onRichtingChange={(richting) => update({ richting })}
          />
        </div>

        <main className="flex-1 flex flex-col min-h-[60vh]">
          {loading && <p className="p-4 text-sm text-zacht">Bezig met laden…</p>}
          {error && <p className="p-4 text-sm text-fout">{error}</p>}
          {!loading && !error && (
            <>
              <div className="flex items-center justify-between px-4 pt-4 gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-zacht shrink-0">
                    {zichtbareCampussen.length} resultaten
                  </p>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className="md:hidden text-sm rounded-md border border-rand px-3 py-1"
                  >
                    Filters{actieveFilters > 0 ? ` (${actieveFilters})` : ''}
                    {filtersOpen ? ' ▲' : ' ▼'}
                  </button>
                </div>
                <div className="flex rounded-md border border-rand text-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWeergave('lijst')}
                    className={`px-3 py-1 ${weergave === 'lijst' ? 'bg-accent text-accent-inkt' : 'bg-kaart text-inkt'}`}
                  >
                    Lijst
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeergave('kaart')}
                    className={`px-3 py-1 ${weergave === 'kaart' ? 'bg-accent text-accent-inkt' : 'bg-kaart text-inkt'}`}
                  >
                    Kaart
                  </button>
                </div>
              </div>

              {weergave === 'lijst' ? (
                <ResultList campussen={zichtbareCampussen} onSelect={selecteer} />
              ) : (
                <div className="flex-1 mt-4 min-h-[400px] isolate relative">
                  {/* `relative` hoort bij de `absolute inset-0` van de kaart zelf: op mobiel
                      staat deze div in een kolom-flexbox zonder vaste hoogte, en dan
                      resolveert een `h-full` op de kaart naar 0 — de kaart verdween
                      daardoor volledig op kleine schermen. */}
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
        schooljaarAanbod={meta?.schooljaarAanbod ?? null}
        onClose={() => setGeselecteerd(null)}
      />

      <Footer meta={meta} />
    </div>
  )
}

export default App
