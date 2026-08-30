import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import {
  campusAanbod,
  finaliteitenVan,
  FINALITEIT_CHIP,
  FINALITEIT_STYLES,
  FINALITEIT_TEKEN,
} from '../lib/aanbod'
import { NET_CHIP, NET_STYLES } from '../lib/net'
import { MAX_VERGELIJK } from '../lib/vergelijking'
import { huisnummerLabel } from '../lib/adres'

interface ResultCardProps {
  campus: CampusMetAfstand
  onSelect: (campus: CampusMetAfstand, school: SchoolOpCampus) => void
  /** Staat dit adres in de vergelijking? */
  vergeleken: boolean
  /** Zit de vergelijking vol? Dan kan er niets meer bij, maar wél iets uit. */
  vergelijkVol: boolean
  onVergelijkToggle: (campus: CampusMetAfstand) => void
}

export function ResultCard({
  campus,
  onSelect,
  vergeleken,
  vergelijkVol,
  onVergelijkToggle,
}: ResultCardProps) {
  const enkeleSchool = campus.scholen.length === 1 ? campus.scholen[0] : null

  // Finaliteiten van het hele adres samen: scholen die een campus delen vullen elkaars
  // aanbod aan, en dat is wat iemand die dit lijstje scant wil weten.
  const aanbod = campusAanbod(campus)
  const finaliteiten = finaliteitenVan(aanbod)

  const aanbodRegel = aanbod.length > 0 && (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {finaliteiten.map((f) => (
        <span
          key={f}
          className={`${FINALITEIT_CHIP} ${FINALITEIT_STYLES[f]}`}
        >
          <span aria-hidden="true" className="text-[0.62em] leading-none">
            {FINALITEIT_TEKEN[f]}
          </span>
          {f}
        </span>
      ))}
      <span className="text-xs text-zacht">
        {aanbod.length} {aanbod.length === 1 ? 'richting' : 'richtingen'}
      </span>
    </div>
  )

  const adresRegel = (
    <p className="mt-1 text-sm text-zacht">
      {campus.straat} {huisnummerLabel(campus.huisnummer)}, {campus.postcode} {campus.gemeente}
    </p>
  )

  const afstandRegel = campus.afstandKm !== null && (
    <p className="mt-1 text-sm font-medium text-inkt">
      {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km in vogelvlucht
    </p>
  )

  const vol = vergelijkVol && !vergeleken

  // Het vinkje staat op de kaart en niet in het detailpaneel: een shortlist bouw je terwijl je
  // de lijst doorneemt, niet door vier keer een venster te openen en weer te sluiten. Bewust
  // een aparte regel onder een scheidingslijn — een aanvinkvakje ín de klikbare kaart zou een
  // knop in een knop zijn, en dat is zowel HTML-onzin als verwarrend om aan te tikken.
  const vergelijkRij = (
    <label
      className={`mt-3 flex items-center gap-2 border-t border-rand pt-2.5 text-xs ${
        vol ? 'cursor-not-allowed text-zacht' : 'cursor-pointer text-zacht hover:text-inkt'
      }`}
    >
      <input
        type="checkbox"
        checked={vergeleken}
        disabled={vol}
        onChange={() => onVergelijkToggle(campus)}
        className="rounded border-rand"
      />
      {/* Zeggen waaróm het vinkje uit staat. Een grijs vakje zonder uitleg leest als een fout. */}
      {vol ? `Vergelijken (maximum van ${MAX_VERGELIJK} bereikt)` : 'Vergelijk dit adres'}
    </label>
  )

  if (enkeleSchool) {
    return (
      <div className="w-full rounded-lg border border-rand bg-kaart p-4">
        <button
          type="button"
          onClick={() => onSelect(campus, enkeleSchool)}
          className="-m-2 block w-full rounded-md p-2 text-left hover:bg-hover"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-inkt">{enkeleSchool.naam}</h3>
            <span
              className={`${NET_CHIP} ${NET_STYLES[enkeleSchool.net]}`}
            >
              {enkeleSchool.net}
            </span>
          </div>
          {adresRegel}
          {afstandRegel}
          {aanbodRegel}
        </button>
        {vergelijkRij}
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border border-rand bg-kaart p-4">
      <p className="text-xs font-medium text-zacht uppercase tracking-wide">
        {campus.scholen.length} scholen op dit adres
      </p>
      {adresRegel}
      {afstandRegel}
      {aanbodRegel}
      <ul className="mt-2 flex flex-col gap-1.5">
        {campus.scholen.map((school) => (
          <li key={school.id}>
            <button
              type="button"
              onClick={() => onSelect(campus, school)}
              className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-hover"
            >
              <span className="text-sm text-inkt">{school.naam}</span>
              <span
                className={`${NET_CHIP} ${NET_STYLES[school.net]}`}
              >
                {school.net}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {vergelijkRij}
    </div>
  )
}
