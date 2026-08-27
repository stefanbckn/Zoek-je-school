import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import { campusAanbod, finaliteitenVan, FINALITEIT_STYLES } from '../lib/aanbod'
import { NET_STYLES } from '../lib/net'

interface ResultCardProps {
  campus: CampusMetAfstand
  onSelect: (campus: CampusMetAfstand, school: SchoolOpCampus) => void
}

export function ResultCard({ campus, onSelect }: ResultCardProps) {
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
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${FINALITEIT_STYLES[f]}`}
        >
          {f}
        </span>
      ))}
      <span className="text-xs text-slate-500">
        {aanbod.length} {aanbod.length === 1 ? 'richting' : 'richtingen'}
      </span>
    </div>
  )

  const adresRegel = (
    <p className="mt-1 text-sm text-slate-500">
      {campus.straat} {campus.huisnummer}, {campus.postcode} {campus.gemeente}
    </p>
  )

  const afstandRegel = campus.afstandKm !== null && (
    <p className="mt-1 text-sm font-medium text-slate-700">
      {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km hemelsbreed
    </p>
  )

  if (enkeleSchool) {
    return (
      <button
        type="button"
        onClick={() => onSelect(campus, enkeleSchool)}
        className="w-full text-left rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm transition"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-900">{enkeleSchool.naam}</h3>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${NET_STYLES[enkeleSchool.net]}`}
          >
            {enkeleSchool.net}
          </span>
        </div>
        {adresRegel}
        {afstandRegel}
        {aanbodRegel}
      </button>
    )
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
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
              className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
            >
              <span className="text-sm text-slate-900">{school.naam}</span>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${NET_STYLES[school.net]}`}
              >
                {school.net}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
