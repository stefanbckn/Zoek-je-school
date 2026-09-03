import type { SearchState } from '../lib/useSearchState'
import type { FinaliteitKeuze } from '../lib/aanbod'
import { domeinLabel } from '../lib/domein'
import type { Net, Provincie } from '../types'

interface ActieveFiltersProps {
  state: SearchState
  /** Studierichtingcode → naam, uit `richtingen.json`. Voor de chip van een klik in de matrix. */
  richtingNamen: Map<string, string>
  onUpdate: (patch: Partial<SearchState>) => void
  onWisAlles: () => void
}

/** Eén weggeklikbaar filter: wat er staat, en wat het wissen ervan betekent. */
interface Chip {
  sleutel: string
  label: string
  /** Wat er voorgelezen wordt; het kruisje alleen zegt niets. */
  wisLabel: string
  wis: () => void
}

/**
 * Toont onder de zoekbalk wélke filters actief zijn. Zonder dit staat een gekozen richting of
 * net alleen in de linkerkolom, en op mobiel zit die achter de knop "Filters (n)" — je ziet dan
 * niet waarop je filtert, en dus ook niet waarom je zo weinig resultaten hebt.
 *
 * De locatie en de straal horen hier bewust niet bij: die staan al zichtbaar in de zoekbalk zelf.
 */
export function ActieveFilters({
  state,
  richtingNamen,
  onUpdate,
  onWisAlles,
}: ActieveFiltersProps) {
  const chips: Chip[] = []

  if (state.tekst.trim()) {
    chips.push({
      sleutel: 'tekst',
      label: `Naam: ${state.tekst.trim()}`,
      wisLabel: `Zoekterm ${state.tekst.trim()} wissen`,
      wis: () => onUpdate({ tekst: '' }),
    })
  }

  if (state.richting.trim()) {
    chips.push({
      sleutel: 'richting',
      label: `Richting: ${state.richting.trim()}`,
      wisLabel: `Richting ${state.richting.trim()} wissen`,
      wis: () => onUpdate({ richting: '' }),
    })
  }

  // Aangeklikt in de matrix. De naam staat er voluit, niet de code: "rcode=1271" zegt niemand
  // iets, ook niet in een gedeelde link. De graad staat erbij omdat dezelfde richting in de
  // tweede en de derde graad bestaat, en de chip anders twee verschillende filters even noemt.
  if (state.richtingCode !== null) {
    const naam = richtingNamen.get(state.richtingCode) ?? state.richtingCode
    const label = state.richtingGraad ? `${naam} (${state.richtingGraad.toLowerCase()})` : naam
    chips.push({
      sleutel: 'rcode',
      label: `Richting: ${label}`,
      wisLabel: `Richting ${label} wissen`,
      wis: () => onUpdate({ richtingCode: null, richtingGraad: null }),
    })
  }

  for (const domein of state.domeinen) {
    chips.push({
      sleutel: `domein-${domein}`,
      label: domeinLabel(domein),
      wisLabel: `Studiedomein ${domeinLabel(domein)} wissen`,
      wis: () => onUpdate({ domeinen: state.domeinen.filter((d) => d !== domein) }),
    })
  }

  for (const net of state.netten) {
    chips.push({
      sleutel: `net-${net}`,
      label: net,
      wisLabel: `Net ${net} wissen`,
      wis: () => onUpdate({ netten: state.netten.filter((n: Net) => n !== net) }),
    })
  }

  for (const finaliteit of state.finaliteiten) {
    chips.push({
      sleutel: `fin-${finaliteit}`,
      label: finaliteit,
      wisLabel: `Finaliteit ${finaliteit} wissen`,
      wis: () =>
        onUpdate({
          finaliteiten: state.finaliteiten.filter((f: FinaliteitKeuze) => f !== finaliteit),
        }),
    })
  }

  for (const provincie of state.provincies) {
    chips.push({
      sleutel: `prov-${provincie}`,
      label: provincie,
      wisLabel: `Provincie ${provincie} wissen`,
      wis: () =>
        onUpdate({ provincies: state.provincies.filter((p: Provincie) => p !== provincie) }),
    })
  }

  for (const gemeente of state.gemeenten) {
    chips.push({
      sleutel: `gem-${gemeente}`,
      label: gemeente,
      wisLabel: `Gemeente ${gemeente} wissen`,
      wis: () => onUpdate({ gemeenten: state.gemeenten.filter((g: string) => g !== gemeente) }),
    })
  }

  // Dit filter staat standaard áán (lege adressen verborgen); de chip verschijnt dus wanneer
  // het uitgezet is. Zonder die chip zie je nergens waarom er plots 50 adressen bij staan.
  if (state.toonZonderAanbod) {
    chips.push({
      sleutel: 'zonder-aanbod',
      label: 'Ook zonder aanbod',
      wisLabel: 'Adressen en scholen zonder studieaanbod weer verbergen',
      wis: () => onUpdate({ toonZonderAanbod: false }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-rand px-4 py-2.5">
      <span className="text-xs font-medium text-zacht">Gefilterd op:</span>

      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <li key={chip.sleutel}>
            <button
              type="button"
              onClick={chip.wis}
              aria-label={chip.wisLabel}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-rand bg-kaart py-1 pr-1.5 pl-2.5 text-xs text-inkt transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {chip.label}
              <span
                aria-hidden="true"
                className="grid size-4 place-items-center rounded-sm text-zacht group-hover:text-inkt"
              >
                ✕
              </span>
            </button>
          </li>
        ))}
      </ul>

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onWisAlles}
          className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-accent underline underline-offset-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Alles wissen
        </button>
      )}
    </div>
  )
}
