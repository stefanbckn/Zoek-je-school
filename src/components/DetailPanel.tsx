import { useEffect, useState } from 'react'
import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import { NET_STYLES } from '../lib/net'
import { berekenFietsroute, type FietsrouteResultaat } from '../lib/fietsroute'

interface DetailPanelProps {
  campus: CampusMetAfstand | null
  school: SchoolOpCampus | null
  zoeklocatie: { lat: number; lon: number } | null
  onClose: () => void
}

export function DetailPanel({ campus, school, zoeklocatie, onClose }: DetailPanelProps) {
  const [fietsroute, setFietsroute] = useState<FietsrouteResultaat | 'laden' | null>(null)

  useEffect(() => {
    if (!campus || !zoeklocatie || campus.lat === null || campus.lon === null) {
      setFietsroute(null)
      return
    }
    let actief = true
    setFietsroute('laden')
    berekenFietsroute(zoeklocatie, { lat: campus.lat, lon: campus.lon }).then((resultaat) => {
      if (actief) setFietsroute(resultaat)
    })
    return () => {
      actief = false
    }
  }, [campus, zoeklocatie])

  if (!campus || !school) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/30 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="mt-8 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{school.naam}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-slate-700"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <span
          className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${NET_STYLES[school.net]}`}
        >
          {school.net}
        </span>

        {campus.scholen.length > 1 && (
          <p className="mt-2 text-xs text-slate-500">
            Deelt dit adres met {campus.scholen.length - 1}{' '}
            {campus.scholen.length - 1 === 1 ? 'andere school' : 'andere scholen'}:{' '}
            {campus.scholen
              .filter((s) => s.id !== school.id)
              .map((s) => s.naam)
              .join(', ')}
          </p>
        )}

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Adres</dt>
            <dd className="text-slate-900">
              {campus.straat} {campus.huisnummer}, {campus.postcode} {campus.gemeente}
            </dd>
            {campus.lat === null && (
              <dd className="text-xs text-amber-600 mt-0.5">
                Geen coördinaten bekend in de brondata — niet op de kaart en geen afstand
                berekenbaar.
              </dd>
            )}
          </div>

          {campus.afstandKm !== null && (
            <div>
              <dt className="text-slate-500">Afstand</dt>
              <dd className="text-slate-900">
                {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
                hemelsbreed
              </dd>
            </div>
          )}

          {!zoeklocatie && (
            <div>
              <dt className="text-slate-500">Met de fiets</dt>
              <dd className="text-slate-400 italic">Vul je adres in bovenaan om dit te zien.</dd>
            </div>
          )}
          {fietsroute === 'laden' && (
            <div>
              <dt className="text-slate-500">Met de fiets</dt>
              <dd className="text-slate-400">Bezig met berekenen…</dd>
            </div>
          )}
          {fietsroute && fietsroute !== 'laden' && fietsroute.status === 'ok' && (
            <div>
              <dt className="text-slate-500">Met de fiets</dt>
              <dd className="text-slate-900">
                {fietsroute.route.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
                · {Math.round(fietsroute.route.duurMin)} min (fietsroute, geen
                verkeersinschatting)
              </dd>
            </div>
          )}
          {fietsroute && fietsroute !== 'laden' && fietsroute.status === 'onbeschikbaar' && (
            <div>
              <dt className="text-slate-500">Met de fiets</dt>
              <dd className="text-slate-400 italic">Momenteel niet beschikbaar, probeer later opnieuw.</dd>
            </div>
          )}

          {school.telefoon && (
            <div>
              <dt className="text-slate-500">Telefoon</dt>
              <dd className="text-slate-900">{school.telefoon}</dd>
            </div>
          )}

          {school.email && (
            <div>
              <dt className="text-slate-500">E-mail</dt>
              <dd>
                <a href={`mailto:${school.email}`} className="text-slate-900 underline">
                  {school.email}
                </a>
              </dd>
            </div>
          )}

          {school.website && (
            <div>
              <dt className="text-slate-500">Website</dt>
              <dd>
                <a
                  href={school.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 underline"
                >
                  {school.website}
                </a>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-slate-500">Studieaanbod</dt>
            <dd className="text-slate-500 italic">
              Nog niet beschikbaar in deze versie. Volledig actueel aanbod op de officiële fiche
              hieronder.
            </dd>
          </div>
        </dl>

        <a
          href={school.linkFiche}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Bekijk officiële fiche op data-onderwijs.vlaanderen.be
        </a>
      </div>
    </div>
  )
}
