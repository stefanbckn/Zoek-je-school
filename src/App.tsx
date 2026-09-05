import { useMemo, useState } from 'react'
import { ActieveFilters } from './components/ActieveFilters'
import { DetailPanel } from './components/DetailPanel'
import { FilterPanel } from './components/FilterPanel'
import { Footer } from './components/Footer'
import { HelpPanel } from './components/HelpPanel'
import { MatrixPanel } from './components/MatrixPanel'
import { OverPanel } from './components/OverPanel'
import { Beeldmerk } from './components/Beeldmerk'
import { MapView } from './components/MapView'
import { ResultList } from './components/ResultList'
import { SearchBar } from './components/SearchBar'
import { ThemaToggle } from './components/ThemaToggle'
import { VergelijkBalk } from './components/VergelijkBalk'
import { VergelijkPanel } from './components/VergelijkPanel'
import {
  heeftAanbod,
  richtingMatcht,
  scholenMetAanbod,
  verborgenOmschrijving,
} from './lib/aanbod'
import { haversineKm } from './lib/haversine'
import { NET_OPTIONS } from './lib/net'
import { PROVINCIE_OPTIONS } from './lib/provincie'
import { useSearchState } from './lib/useSearchState'
import { MAX_VERGELIJK, toggleVergelijking } from './lib/vergelijking'
import { useVestigingen } from './lib/useVestigingen'
import type { CampusMetAfstand, SchoolOpCampus } from './types'

type Weergave = 'lijst' | 'kaart'

function App() {
  const { campussen, studierichtingen, meta, loading, error } = useVestigingen()
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
    state.provincies.length +
    state.gemeenten.length +
    state.finaliteiten.length +
    state.domeinen.length +
    (state.richtingCode ? 1 : 0) +
    (state.tekst.trim() ? 1 : 0) +
    (state.richting.trim() ? 1 : 0) +
    (state.toonZonderAanbod ? 1 : 0)

  // Alleen netten aanbieden die in de dataset voorkomen. 'Officieel gesubsidieerd' (OCMW,
  // intercommunale) bestaat als categorie maar heeft in de huidige dataset geen enkele school;
  // dat als vinkje tonen levert enkel een filter op die gegarandeerd niets teruggeeft.
  const netOpties = useMemo(() => {
    const aanwezig = new Set(campussen.flatMap((c) => c.scholen.map((s) => s.net)))
    // Een net dat wél aangevinkt staat maar in de data ontbreekt, tonen we toch — anders zie je
    // 0 resultaten zonder enig zichtbaar vinkje om weer uit te zetten.
    return NET_OPTIONS.filter((n) => aanwezig.has(n) || state.netten.includes(n))
  }, [campussen, state.netten])

  // Zelfde redenering als bij de netten: enkel wat in de data zit, plus wat aangevinkt staat.
  const provincieOpties = useMemo(() => {
    const aanwezig = new Set(campussen.map((c) => c.provincie))
    return PROVINCIE_OPTIONS.filter((p) => aanwezig.has(p) || state.provincies.includes(p))
  }, [campussen, state.provincies])

  // Stabiele referentie: anders herstart DetailPanel's fietsroute-effect bij elke
  // ongerelateerde re-render (bv. lijst/kaart wisselen) terwijl het paneel open staat.
  const zoeklocatie = useMemo(
    () => (state.lat !== null && state.lon !== null ? { lat: state.lat, lon: state.lon } : null),
    [state.lat, state.lon],
  )

  const {
    zichtbareCampussen,
    verborgenZonderAanbod,
    verborgenLegeScholen,
    gemeenteTellingen,
    matrixCampussen,
  } = useMemo(() => {
    const tekstLower = state.tekst.trim().toLowerCase()
    const richtingTerm = state.richting.trim()
    const filtertOpAanbod =
      richtingTerm.length > 0 ||
      state.finaliteiten.length > 0 ||
      state.domeinen.length > 0 ||
      state.richtingCode !== null

    const naSchoolFilters = campussen
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
        if (state.provincies.length > 0 && !state.provincies.includes(c.provincie)) return false
        // De gemeentefilter staat bewust NIET hier maar helemaal achteraan: de tellingen achter
        // de gemeentenamen moeten zeggen hoeveel resultaten je krijgt als je er één aanvinkt,
        // en dat kan alleen als ze berekend zijn op de lijst zónder die filter erop.
        return true
      })

    // Aanbodfilters gelden op adresniveau, niet per school: scholen die een campus delen
    // vullen elkaars aanbod aan, en wie op "Latijn" zoekt wil dat adres zien — ook als
    // de richting bij de buurschool op hetzelfde adres hoort. Zie .claude/rules/datamodel.md.
    //
    // Ze staan apart van de filters hierboven omdat de matrix de lijst nodig heeft zoals ze
    // eruitziet zónder deze filters: anders zou het aanklikken van één richting elke andere cel
    // op 0 zetten. Zelfde redenering als bij de tellingen per gemeente.
    const gefilterd = !filtertOpAanbod
      ? naSchoolFilters
      : naSchoolFilters.filter((c) =>
          c.scholen.some((s) =>
            s.richtingen.some((r) => {
              if (state.finaliteiten.length > 0) {
                if (r.finaliteit === null) return false
                if (!state.finaliteiten.includes(r.finaliteit)) return false
              }
              if (state.domeinen.length > 0) {
                if (r.domeinCode === null || !state.domeinen.includes(r.domeinCode)) return false
              }
              if (state.richtingCode !== null) {
                if (r.studierichtingCode !== state.richtingCode) return false
                // De graad hoort bij de code: dezelfde richting bestaat in de tweede én de
                // derde graad, en de matrix belooft het aantal van één cel.
                if (state.richtingGraad !== null && r.graad !== state.richtingGraad) return false
              }
              return richtingMatcht(r, richtingTerm)
            }),
          ),
        )

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

    // Hoeveel adressen elke gemeente oplevert, berekend op alles behalve de gemeentefilter
    // zelf. Anders zou een aangevinkte gemeente alle andere op 0 zetten en was het cijfer
    // waardeloos. Adressen zonder aanbod tellen alleen mee als de bezoeker ze ook te zien
    // krijgt, zodat het getal klopt met wat er na het aanvinken in de lijst staat.
    const telbaar = state.toonZonderAanbod ? binnenStraal : binnenStraal.filter((c) => heeftAanbod(c))
    const gemeenteTellingen = new Map<string, number>()
    for (const c of telbaar) {
      gemeenteTellingen.set(c.gemeente, (gemeenteTellingen.get(c.gemeente) ?? 0) + 1)
    }

    // Waarop de matrix haar tellers baseert: dezelfde plaatsfilters als de lijst (net, naam,
    // provincie, gemeente, straal), maar zónder de aanbodfilters. Klik je in de matrix op één
    // richting, dan moet elke andere cel blijven zeggen hoeveel adressen er in jouw buurt zijn.
    const matrixCampussen = naSchoolFilters.filter((c) => {
      if (state.gemeenten.length > 0 && !state.gemeenten.includes(c.gemeente)) return false
      if (state.lat === null || state.lon === null || state.straalKm === null) return true
      if (c.lat === null || c.lon === null) return false
      return haversineKm(state.lat, state.lon, c.lat, c.lon) <= state.straalKm
    })

    const naGemeente =
      state.gemeenten.length === 0
        ? binnenStraal
        : binnenStraal.filter((c) => state.gemeenten.includes(c.gemeente))

    // Adressen zonder studieaanbod als láátste stap eruit, na alle andere filters. Zo telt
    // `verborgenZonderAanbod` alleen wat door dít filter wegvalt en niet door een ander —
    // dat cijfer staat in de UI, dus het moet kloppen met wat de bezoeker terugkrijgt als hij
    // het vinkje aanzet. (Filtert iemand op finaliteit of richting, dan zijn lege adressen daar
    // al uit gevallen en is dit cijfer terecht 0.)
    if (state.toonZonderAanbod) {
      return {
        zichtbareCampussen: naGemeente,
        verborgenZonderAanbod: 0,
        verborgenLegeScholen: 0,
        gemeenteTellingen,
        matrixCampussen,
      }
    }

    // Twee lagen, allebei van dezelfde schakelaar. Eerst de adressen waar geen enkele school
    // aanbod heeft, daarna binnen de overblijvende adressen de losse schoolrijen zonder
    // richting. Zonder die tweede laag blijft een lege school meeliften op een adres dat
    // dankzij de buren zichtbaar is, en leest de bezoeker daar het aanbod van die buren —
    // zie issue #23.
    const metAanbod = naGemeente.filter((c) => heeftAanbod(c))
    return {
      zichtbareCampussen: metAanbod.map(scholenMetAanbod),
      verborgenZonderAanbod: naGemeente.length - metAanbod.length,
      verborgenLegeScholen: metAanbod.reduce(
        (n, c) => n + c.scholen.filter((s) => s.richtingen.length === 0).length,
        0,
      ),
      gemeenteTellingen,
      matrixCampussen,
    }
  }, [
    campussen,
    state.lat,
    state.lon,
    state.straalKm,
    state.netten,
    state.provincies,
    state.gemeenten,
    state.tekst,
    state.finaliteiten,
    state.richting,
    state.domeinen,
    state.richtingCode,
    state.richtingGraad,
    state.toonZonderAanbod,
  ])

  /**
   * De gemeenten die de filterkolom aanbiedt: enkel die in de huidige resultaten voorkomen.
   * Met 245 gemeenten in heel Vlaanderen en Brussel is een volledige lijst geen filter meer,
   * en een gemeente aanbieden waar na de andere filters niets meer staat, levert gegarandeerd
   * 0 resultaten op. Aangevinkte gemeenten blijven altijd staan, ook als ze op 0 vallen —
   * anders zie je een lege pagina zonder vinkje om weer uit te zetten.
   */
  const gemeenteOpties = useMemo(() => {
    const namen = new Set(gemeenteTellingen.keys())
    for (const g of state.gemeenten) namen.add(g)
    return [...namen].sort((a, b) => a.localeCompare(b, 'nl'))
  }, [gemeenteTellingen, state.gemeenten])

  /**
   * De aangevinkte campussen, afgeleid uit de vólledige dataset en niet uit `zichtbareCampussen`.
   * Dat is met opzet: wie er twee aanvinkt en daarna de gemeentefilter aanpast, mag zijn
   * shortlist niet zien verdampen. Ook de netfilter geldt hier niet — in de vergelijking hoort
   * te staan wat er écht op dat adres zit, niet wat er van de netfilter overblijft. De enige
   * uitzondering is de schakelaar "zonder studieaanbod": die verbergt hier dezelfde lege
   * schoolrijen als in de lijst, anders duikt de rij die daar net verdween hier weer op.
   */
  const vergelekenCampussen = useMemo<CampusMetAfstand[]>(() => {
    const perId = new Map(campussen.map((c) => [c.id, c]))
    return vergelijking.flatMap((id) => {
      const vol = perId.get(id)
      if (!vol) return []
      // Lege schoolrijen gaan wél weg, net als in de lijst: een rij zonder één richting zegt
      // niets in een vergelijking en leest daar het aanbod van de buren op hetzelfde adres.
      const campus = state.toonZonderAanbod || !heeftAanbod(vol) ? vol : scholenMetAanbod(vol)
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
  }, [campussen, vergelijking, state.lat, state.lon, state.toonZonderAanbod])

  /**
   * De namen achter `richtingCodes`, voor de chips onder de zoekbalk. Een code die niet in de
   * catalogus staat (bewerkte URL) valt terug op de code zelf: de chip blijft dan zichtbaar en
   * wegklikbaar in plaats van een onverklaarbaar lege lijst achter te laten.
   */
  const richtingNamen = useMemo(
    () => new Map(studierichtingen.map((s) => [s.code, s.naam])),
    [studierichtingen],
  )

  /**
   * Waar de matrix haar aantallen op telt, in woorden. Volgt dezelfde volgorde als de
   * filterpijplijn: de gemeente is specifieker dan de straal, en die weer specifieker dan de
   * provincie.
   */
  const gebiedLabel = useMemo(() => {
    if (state.gemeenten.length > 0) return `in ${state.gemeenten.join(', ')}`
    if (state.lat !== null && state.lon !== null && state.straalKm !== null) {
      return state.label
        ? `binnen ${state.straalKm} km van ${state.label}`
        : `binnen ${state.straalKm} km`
    }
    if (state.provincies.length > 0) return `in ${state.provincies.join(', ')}`
    return null
  }, [state.gemeenten, state.lat, state.lon, state.straalKm, state.label, state.provincies])

  const verborgen = verborgenOmschrijving(verborgenZonderAanbod, verborgenLegeScholen)

  function selecteer(campus: CampusMetAfstand, school: SchoolOpCampus) {
    setGeselecteerd({ campus, school })
  }

  return (
    <>
      {/* Bij het afdrukken van een vergelijking hoort enkel die tabel op papier. Het venster
          staat daarom búiten deze div, zodat `print:hidden` de hele app eronder kan wegnemen
          zonder ook de tabel te verbergen. */}
      <div className={`min-h-full flex flex-col ${vergelijkOpen ? 'print:hidden' : ''}`}>
        {/* flex-wrap is nodig: op 375px past de knoppenrij niet naast de titel en viel
            "Donker" buiten het scherm. Bij weinig ruimte zakt ze naar een eigen regel. */}
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-kop px-4 py-3.5 text-kop-inkt sm:px-7">
          {/* Het woordmerk is echte tekst en geen afbeelding. Het logopakket levert het als
              vectorpaden, maar sinds Plus Jakarta Sans zelf op de site staat tekent de browser
              exact dezelfde letters — en dan blijft het selecteerbaar, schaalt het mee met de
              lettergrootte van de bezoeker, en is het meteen de h1 in plaats van een plaatje
              met een verborgen kop ernaast.

              De ".be" is geel en decoratief; de betekenis zit in het woord ervoor. Op deze
              balk haalt dat geel 4,9:1, ruim boven de grens, dus het mag hier wél gewoon als
              tekst meetellen. Op een lichte grond zou dat niet lukken — daar bestaat
              logo-lockup-be-teal.svg voor. */}
          <a
            href="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-signaal"
          >
            <Beeldmerk grootte={34} />
            <h1 className="text-xl font-extrabold tracking-tight">
              zoekjeschool<span className="text-signaal">.be</span>
            </h1>
          </a>
          {/* Geen `shrink-0` hier, en dat is geen detail: met shrink-0 krimpt deze rij nooit
              onder haar max-content-breedte, dus perkte de header ze nooit in en had het
              `flex-wrap` erop niets om op te reageren. De knoppen wrapten dan nooit en de
              themaschakelaar stak op een smalle telefoon buiten het scherm, wat de hele pagina
              horizontaal scrollbaar maakte. `min-w-0` erbij omdat de standaard `min-width: auto`
              van een flex-item anders alsnog op de inhoud terugvalt. */}
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            {/* De matrix staat vooraan: het is de enige knop hier die iets aan de resultaten
                doet in plaats van uit te leggen. */}
            <button
              type="button"
              onClick={() => update({ matrix: true })}
              className="rounded-lg border border-kop-inkt/30 px-2.5 py-1.5 text-xs font-semibold text-kop-inkt transition-colors hover:bg-kop-inkt/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-signaal"
            >
              Alle richtingen
            </button>
            {/* De uitleg staat vóór "Over deze site": wie hier klikt zit meestal vast in het
                zoeken zelf, niet in de vraag waar de gegevens vandaan komen. */}
            <button
              type="button"
              onClick={() => update({ help: true })}
              className="rounded-lg border border-kop-inkt/30 px-2.5 py-1.5 text-xs font-semibold text-kop-inkt transition-colors hover:bg-kop-inkt/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-signaal"
            >
              Hoe werkt deze site?
            </button>
            {/* Een link en geen knop, want dit is het enige item hier dat de pagina verlaat in
                plaats van een paneel te openen. Het pijltje maakt dat verschil zichtbaar vóór
                de klik. Bewust géén target="_blank": de browserknop terug brengt de bezoeker
                op zijn zoekopdracht terug, want die staat volledig in de querystring. */}
            <a
              href="/uitleg/"
              className="rounded-lg border border-kop-inkt/30 px-2.5 py-1.5 text-xs font-semibold text-kop-inkt transition-colors hover:bg-kop-inkt/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-signaal"
            >
              Wat betekenen de termen? <span aria-hidden="true">&#8599;</span>
            </a>
            <button
              type="button"
              onClick={() => update({ over: true })}
              className="rounded-lg border border-kop-inkt/30 px-2.5 py-1.5 text-xs font-semibold text-kop-inkt transition-colors hover:bg-kop-inkt/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-signaal"
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
          richtingNamen={richtingNamen}
          onUpdate={update}
          onWisAlles={() =>
            update({
              netten: [],
              provincies: [],
              gemeenten: [],
              finaliteiten: [],
              tekst: '',
              richting: '',
              domeinen: [],
              richtingCode: null,
              richtingGraad: null,
              toonZonderAanbod: false,
            })
          }
        />

        <div className="flex-1 flex flex-col md:flex-row">
          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
            <FilterPanel
              netOpties={netOpties}
              provincieOpties={provincieOpties}
              gemeenteOpties={gemeenteOpties}
              gemeenteTellingen={gemeenteTellingen}
              netten={state.netten}
              provincies={state.provincies}
              gemeenten={state.gemeenten}
              tekst={state.tekst}
              finaliteiten={state.finaliteiten}
              domeinen={state.domeinen}
              richting={state.richting}
              toonZonderAanbod={state.toonZonderAanbod}
              verborgenZonderAanbod={verborgenZonderAanbod}
              verborgenLegeScholen={verborgenLegeScholen}
              onNettenChange={(netten) => update({ netten })}
              onProvinciesChange={(provincies) => update({ provincies })}
              onGemeentenChange={(gemeenten) => update({ gemeenten })}
              onTekstChange={(tekst) => update({ tekst })}
              onFinaliteitenChange={(finaliteiten) => update({ finaliteiten })}
              onDomeinenChange={(domeinen) => update({ domeinen })}
              onMatrixOpen={() => update({ matrix: true })}
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

                {/* Wat er verborgen is staat hier en niet alleen in de filterkolom: op mobiel
                    zit die kolom achter de knop "Filters", en stil weglaten mag niet. Een school
                    waarvan het aanbod om een andere reden ontbreekt, zou anders spoorloos
                    verdwijnen zonder dat iemand weet dat er iets weg is. */}
                {verborgen && (
                  <p className="px-4 pt-2 text-xs text-zacht">
                    {verborgen.tekst} {verborgen.enkelvoud ? 'is' : 'zijn'} verborgen: daar is geen
                    studieaanbod geregistreerd.{' '}
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
                  <div className="mt-4 h-[calc(100dvh-1rem)] min-h-[400px] isolate relative">
                    {/* De kaart is zo hoog als het venster, niet zo hoog als de filterkolom
                        ernaast. Die kolom groeit met elke filter erbij, en als flex-item nam de
                        kaart die hoogte over: op 1440 x 800 werd hij 1305px en liep hij 765px
                        onder de vouw door, met een muiswiel dat de pagina niet verder liet
                        scrollen. Sinds het wiel dat wél doet (zie MapView) mag de kaart weer
                        groter zijn dan wat er onder de kop overblijft.

                        `dvh` en niet `vh`, want op een telefoon verandert de zichtbare hoogte
                        mee met de adresbalk. `min-h` blijft nodig voor een laag venster, en de
                        `relative` hoort bij de `absolute inset-0` van de kaart zelf: op mobiel
                        staat deze div in een kolom-flexbox zonder vaste hoogte, en dan
                        resolveert een `h-full` op de kaart naar 0, waardoor de kaart op kleine
                        schermen volledig verdween. */}
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
        kenmerkenMeta={meta?.leerlingenkenmerken ?? null}
        onClose={() => setGeselecteerd(null)}
      />

      <Footer meta={meta} onOverOpen={() => update({ over: true })} />
      </div>

      <VergelijkPanel
        campussen={vergelijkOpen ? vergelekenCampussen : []}
        schooljaarAanbod={meta?.schooljaarAanbod ?? null}
        kenmerkenMeta={meta?.leerlingenkenmerken ?? null}
        onClose={() => setVergelijkOpen(false)}
      />

      <OverPanel open={state.over} meta={meta} onClose={() => update({ over: false })} />

      {/* Van de uitleg naar de herkomst is één klik: het ene paneel sluit terwijl het andere
          opengaat, in dezelfde update, anders zou de tussenstand even beide tonen. */}
      {/* Een richting aanklikken wist de vrije-tekstfilter op richting: die twee zouden anders
          samen filteren (EN), en dan geeft een klik in de matrix nul resultaten zonder dat
          zichtbaar is waarom. */}
      <MatrixPanel
        open={state.matrix}
        studierichtingen={studierichtingen}
        campussen={matrixCampussen}
        gebiedLabel={gebiedLabel}
        onClose={() => update({ matrix: false })}
        onKiesRichting={(code, graad) =>
          update({
            matrix: false,
            richtingCode: code,
            richtingGraad: graad,
            richting: '',
            domeinen: [],
          })
        }
        onKiesCel={(domeinCode, finaliteit) =>
          update({
            matrix: false,
            domeinen: [domeinCode],
            finaliteiten: [finaliteit],
            richting: '',
            richtingCode: null,
            richtingGraad: null,
          })
        }
      />

      <HelpPanel
        open={state.help}
        onClose={() => update({ help: false })}
        onOverOpen={() => update({ help: false, over: true })}
      />
    </>
  )
}

export default App
