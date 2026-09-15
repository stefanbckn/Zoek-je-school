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
  const [melding, setMelding] = useState<string | null>(null)
  /** Index van de suggestie die met de pijltjes gekozen is; -1 = geen. */
  const [actief, setActief] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Volgnummer van de laatste suggestievraag. Antwoorden komen niet in volgorde binnen: een
  // traag antwoord op "Ber" kon de lijst voor "Berchem" overschrijven, of de lijst heropenen
  // nadat het veld al leeg was. Elk antwoord met een ouder nummer wordt genegeerd.
  const verzoekRef = useRef(0)

  useEffect(() => {
    setInvoer(label ?? '')
  }, [label])

  function handleChange(waarde: string) {
    setInvoer(waarde)
    setMelding(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const verzoek = ++verzoekRef.current
    if (!waarde.trim()) {
      setSuggesties([])
      setActief(-1)
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const resultaten = await suggestLocaties(waarde)
        if (verzoek !== verzoekRef.current) return
        setSuggesties(resultaten)
        setActief(-1)
        setOpen(resultaten.length > 0)
      } catch {
        if (verzoek !== verzoekRef.current) return
        setSuggesties([])
      }
    }, 250)
  }

  async function kiesSuggestie(tekst: string) {
    // Ook een keuze maakt openstaande suggestievragen oud, anders klapt de lijst weer open.
    if (debounceRef.current) clearTimeout(debounceRef.current)
    verzoekRef.current++
    const verzoek = verzoekRef.current
    setInvoer(tekst)
    setOpen(false)
    setActief(-1)
    setMelding(null)
    // Faalde dit vroeger, dan gebeurde er niets terwijl het veld de gekozen tekst toonde: het
    // leek alsof de zoektocht liep of gelukt was. Nu staat er onder het veld wat er misging.
    let locatie: Awaited<ReturnType<typeof zoekLocatie>>
    try {
      locatie = await zoekLocatie(tekst)
    } catch {
      if (verzoek === verzoekRef.current) setMelding('Locatie opzoeken lukt nu niet. Probeer later opnieuw.')
      return
    }
    // Intussen verder getypt? Dan hoort dit antwoord niet meer bij wat er in het veld staat.
    if (verzoek !== verzoekRef.current) return
    if (locatie) onLocatieGekozen(locatie)
    else setMelding('Geen locatie gevonden. Kies een suggestie uit de lijst of typ een straatnaam.')
  }

  function opToets(e: React.KeyboardEvent<HTMLInputElement>) {
    const n = suggesties.length
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (n === 0) return
      e.preventDefault()
      const stap = e.key === 'ArrowDown' ? 1 : -1
      // Is de lijst dicht, dan opent de eerste druk ze op de eerste (of laatste) suggestie.
      const volgende = !open || actief < 0 ? (stap === 1 ? 0 : n - 1) : (actief + stap + n) % n
      setOpen(true)
      setActief(volgende)
      document.getElementById(`locatie-suggestie-${volgende}`)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      // Met een actieve suggestie kies je die. Zonder zoek je op wat er getypt staat, zodat
      // Enter na een volledig adres ook gewoon werkt.
      if (open && actief >= 0 && actief < n) {
        e.preventDefault()
        kiesSuggestie(suggesties[actief].tekst)
      } else if (invoer.trim()) {
        e.preventDefault()
        kiesSuggestie(invoer)
      }
    } else if (e.key === 'Escape' && open) {
      setOpen(false)
      setActief(-1)
    }
  }

  return (
    <div className="p-4 border-b border-rand">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          {/* Combobox-patroon (WAI-ARIA APG). De focus blijft altijd in het invoerveld; de
              pijltjes verschuiven enkel welke suggestie actief is, en aria-activedescendant
              vertelt een schermlezer welke dat is. Vroeger was elke suggestie een knop die
              enkel op onMouseDown reageerde, en sloot een blur-timeout van 150 ms de lijst
              voor je er met Tab kon komen: met het toetsenbord was er niets te kiezen. */}
          <input
            type="text"
            role="combobox"
            aria-label="Gemeente of adres"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="locatie-suggesties"
            aria-activedescendant={open && actief >= 0 ? `locatie-suggestie-${actief}` : undefined}
            value={invoer}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={opToets}
            onFocus={() => setOpen(suggesties.length > 0)}
            onBlur={() => {
              setOpen(false)
              setActief(-1)
            }}
            placeholder="Typ je gemeente of adres…"
            className="h-12 w-full rounded-lg border border-rand px-3.5 text-base focus:border-accent md:h-13"
          />
          {open && (
            <ul
              id="locatie-suggesties"
              role="listbox"
              aria-label="Suggesties"
              className="absolute z-10 mt-1 w-full rounded-lg border border-rand bg-kaart shadow-lg max-h-60 overflow-auto"
            >
              {suggesties.map((s, i) => (
                <li
                  key={s.tekst}
                  id={`locatie-suggestie-${i}`}
                  role="option"
                  aria-selected={i === actief}
                  // preventDefault houdt de focus in het invoerveld, zodat de blur de lijst
                  // niet sluit vóór de klik aankomt. Zo is er geen timeout meer nodig.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => kiesSuggestie(s.tekst)}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-hover ${i === actief ? 'bg-hover' : ''}`}
                >
                  {s.tekst}
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

      {/* Staat er altijd, ook leeg: een schermlezer kondigt een live region pas betrouwbaar aan
          als die al bestond vóór de tekst erin verscheen. */}
      <p role="status" className={melding ? 'mt-1.5 text-sm text-waarschuwing' : ''}>
        {melding}
      </p>

      {/* Op 375x667 besloeg deze tip vier regels en begon de eerste resultaatkaart pas op
          y=268 van 667 px: veertig procent van het eerste scherm ging op aan iets wat je pas
          nodig hebt zodra je typt. Hij verschijnt daarom op een telefoon pas bij de eerste
          aanslag. Vanaf md staat hij er meteen, want daar is de ruimte er wel.

          data-nosnippet: Google toonde deze tip als tekst onder het zoekresultaat, bij de
          zoekopdracht "scholen zoeker": het woord "zoekdienst" leek er het best op. Dit
          attribuut sluit de tip uit van snippets. Bewust een lege string en niet kaal: React
          schrijft een kaal attribuut uit als "true", en Google vraagt de booleaanse vorm. */}
      <p
        data-nosnippet=""
        className={`mt-1.5 text-xs text-zacht ${invoer.trim() ? '' : 'hidden md:block'}`}
      >
        Tip: typ een straatnaam voor de nauwkeurigste locatie. Deelgemeenten zoals Borsbeek, Vremde
        of Deurne worden door deze zoekdienst niet apart herkend en vallen terug op het centrum van
        de hoofdgemeente.
      </p>
    </div>
  )
}
