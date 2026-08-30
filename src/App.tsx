import { useMemo, useState } from 'react'
import { ActieveFilters } from './components/ActieveFilters'
import { DetailPanel } from './components/DetailPanel'
import { FilterPanel } from './components/FilterPanel'
import { Footer } from './components/Footer'
import { OverPanel } from './components/OverPanel'
import { MapView } from './components/MapView'
import { ResultList } from './components/ResultList'
import { SearchBar } from './components/SearchBar'
import { ThemaToggle } from './components/ThemaToggle'
import { VergelijkBalk } from './components/VergelijkBalk'
import { VergelijkPanel } from './components/VergelijkPanel'
import { heeftAanbod, richtingMatcht } from './lib/aanbod'
import { haversineKm } from './lib/haversine'
import { NET_OPTIONS } from './lib/net'
import { useSearchState } from './lib/useSearchState'
import { MAX_VERGELIJK, toggleVergelijking } from './lib/vergelijking'
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
  /**
   * De shortlist: id's van campussen, in de volgorde waarin ze aangevinkt zijn.
   *
   * Bewust géén URL-state, in tegenstelling tot de filters. De querystring beschrijft wát er
   * gezocht wordt; een shortlist is een tussenstap in het kijken, net als hoe ver iemand
   * gescrold heeft. Wie de vergelijking wil bewaren, drukt ze af — dat is de gekozen
   * exportvorm.
   */
  const [vergelijking, setVergelijking] = useState<string[]>([])
  const [vergelijkOpen, setVergelijkOpen] = useState(false)

  const actieveFilters =
    state.netten.length +
    state.gemeenten.length +
    state.finaliteiten.length +
    (state.tekst.trim() ? 1 : 0) +
    (state.richting.trim() ? 1 : 0) +
    (state.toonZonderAanbod ? 1 : 0)

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

  const { zichtbareCampussen, verborgenZonderAanbod } = useMemo(() => {
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

    // Adressen zonder studieaanbod als láátste stap eruit, na alle andere filters. Zo telt
    // `verborgenZonderAanbod` alleen wat door dít filter wegvalt en niet door een ander —
    // dat cijfer staat in de UI, dus het moet kloppen met wat de bezoeker terugkrijgt als hij
    // het vinkje aanzet. (Filtert iemand op finaliteit of richting, dan zijn lege adressen daar
    // al uit gevallen en is dit cijfer terecht 0.)
    const zonderAanbod = binnenStraal.filter((c) => !heeftAanbod(c))
    return {
      zichtbareCampussen: state.toonZonderAanbod
        ? binnenStraal
        : binnenStraal.filter((c) => heeftAanbod(c)),
      verborgenZonderAanbod: state.toonZonderAanbod ? 0 : zonderAanbod.length,
    }
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
    state.toonZonderAanbod,
  ])

  /**
   * De aangevinkte campussen, afgeleid uit de vólledige dataset en niet uit `zichtbareCampussen`.
   * Dat is met opzet: wie er twee aanvinkt en daarna de gemeentefilter aanpast, mag zijn
   * shortlist niet zien verdampen. Ook de scholen komen hier ongefilterd binnen — in de
   * vergelijking hoort te staan wat er écht op dat adres zit, niet wat er van de netfilter
   * overblijft.
   */
  const vergelekenCampussen = useMemo<CampusMetAfstand[]>(() => {
    const perId = new Map(campussen.map((c) => [c.id, c]))
    return vergelijking.flatMap((id) => {
      const campus = perId.get(id)
      if (!campus) return []
      return [
        {
          ...campus,
          afstandKm:
            state.lat !== null && state.lon !== null && campus.lat !== null && campus.lon !== null
              ? haversineKm(state.lat, state.lon, campus.lat, campus.lon)
              : null,
        },
      ]
    })
  }, [campussen, vergelijking, state.lat, state.lon])

  function selecteer(campus: CampusMetAfstand, school: SchoolOpCampus) {
    setGeselecteerd({ campus, school })
  }

  return (
    <>
      {/* Bij het afdrukken van een vergelijking hoort enkel die tabel op papier. Het venster
          staat daarom búiten deze div, zodat `print:hidden` de hele app eronder kan wegnemen
          zonder ook de tabel te verbergen. */}
      <div className={`min-h-full flex flex-col ${vergelijkOpen ? 'print:hidden' : ''}`}>
        {/* flex-wrap is nodig: op 375px past de driestandenknop niet naast de titel en viel
            "Donker" buiten het scherm. Bij weinig ruimte zakt de knop naar een eigen regel. */}
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-rand px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-inkt">Zoek je school</h1>
            <p className="text-sm text-zacht">Middelbare scholen in provincie Antwerpen</p>
          </div>
          {/* "Over deze site" staat ook hier en niet enkel in de footer: onderaan moet je
              eerst voorbij 300 resultaten scrollen om te vinden waar de gegevens vandaan
              komen. In de header is het altijd zichtbaar, zonder ruimte te kosten in de
              zoekopdracht zelf. */}
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => update({ over: true })}
              className="rounded-lg border border-rand px-2.5 py-1.5 text-xs text-zacht transition-colors hover:bg-hover hover:text-inkt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Over deze site
            </button>
            <ThemaToggle />
          </div>
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
            update({
              netten: [],
              gemeenten: [],
              finaliteiten: [],
              tekst: '',
              richting: '',
              toonZonderAanbod: false,
            })
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
              toonZonderAanbod={state.toonZonderAanbod}
              verborgenZonderAanbod={verborgenZonderAanbod}
              onNettenChange={(netten) => update({ netten })}
              onGemeentenChange={(gemeenten) => update({ gemeenten })}
              onTekstChange={(tekst) => update({ tekst })}
              onFinaliteitenChange={(finaliteiten) => update({ finaliteiten })}
              onRichtingChange={(richting) => update({ richting })}
              onToonZonderAanbodChange={(toonZonderAanbod) => update({ toonZonderAanbod })}
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

                {/* Het aantal verborgen adressen staat hier en niet alleen in de filterkolom:
                    op mobiel zit die kolom achter de knop "Filters", en stil weglaten mag niet.
                    Een school waarvan het aanbod om een andere reden ontbreekt, zou anders
                    spoorloos verdwijnen zonder dat iemand weet dat er iets weg is. */}
                {verborgenZonderAanbod > 0 && (
                  <p className="px-4 pt-2 text-xs text-zacht">
                    {verborgenZonderAanbod}{' '}
                    {verborgenZonderAanbod === 1 ? 'adres is' : 'adressen zijn'} verborgen: daar is
                    geen studieaanbod geregistreerd.{' '}
                    <button
                      type="button"
                      onClick={() => update({ toonZonderAanbod: true })}
                      className="underline text-accent underline-offset-2"
                    >
                      Toon ze toch
                    </button>
                  </p>
                )}

                {weergave === 'lijst' ? (
                  <ResultList
                    campussen={zichtbareCampussen}
                    onSelect={selecteer}
                    vergelijking={vergelijking}
                    vergelijkVol={vergelijking.length >= MAX_VERGELIJK}
                    onVergelijkToggle={(campus) =>
                      setVergelijking((huidig) => toggleVergelijking(huidig, campus.id))
                    }
                  />
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

      <VergelijkBalk
        gekozen={vergelekenCampussen}
        onVerwijder={(id) => setVergelijking((huidig) => huidig.filter((x) => x !== id))}
        onWisAlles={() => setVergelijking([])}
        onOpen={() => setVergelijkOpen(true)}
      />

      <DetailPanel
        campus={geselecteerd?.campus ?? null}
        school={geselecteerd?.school ?? null}
        zoeklocatie={zoeklocatie}
        zoeklocatieLabel={state.label}
        schooljaarAanbod={meta?.schooljaarAanbod ?? null}
        onClose={() => setGeselecteerd(null)}
      />

      <Footer meta={meta} onOverOpen={() => update({ over: true })} />
      </div>

      <VergelijkPanel
        campussen={vergelijkOpen ? vergelekenCampussen : []}
        schooljaarAanbod={meta?.schooljaarAanbod ?? null}
        onClose={() => setVergelijkOpen(false)}
      />

      <OverPanel open={state.over} meta={meta} onClose={() => update({ over: false })} />
    </>
  )
}

export default App
