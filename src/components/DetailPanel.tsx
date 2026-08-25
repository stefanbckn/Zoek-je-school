import { useEffect, useState } from 'react'
import type { VestigingMetAfstand } from '../types'
import { NET_STYLES } from '../lib/net'
import { berekenFietsroute, type Fietsroute } from '../lib/fietsroute'

interface DetailPanelProps {
  vestiging: VestigingMetAfstand | null
  zoeklocatie: { lat: number; lon: number } | null
  onClose: () => void
}

export function DetailPanel({ vestiging, zoeklocatie, onClose }: DetailPanelProps) {
  const [fietsroute, setFietsroute] = useState<Fietsroute | null | 'laden'>(null)

  useEffect(() => {
    if (!vestiging || !zoeklocatie || vestiging.lat === null || vestiging.lon === null) {
      setFietsroute(null)
      return
    }
    let actief = true
    setFietsroute('laden')
    berekenFietsroute(zoeklocatie, { lat: vestiging.lat, lon: vestiging.lon }).then((route) => {
      if (actief) setFietsroute(route)
    })
    return () => {
      actief = false
    }
  }, [vestiging, zoeklocatie])

  if (!vestiging) return null

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
          <h2 className="text-lg font-semibold text-slate-900">{vestiging.naam}</h2>
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
          className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${NET_STYLES[vestiging.net]}`}
        >
          {vestiging.net}
        </span>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Adres</dt>
            <dd className="text-slate-900">
              {vestiging.straat} {vestiging.huisnummer}, {vestiging.postcode} {vestiging.gemeente}
            </dd>
            {vestiging.lat === null && (
              <dd className="text-xs text-amber-600 mt-0.5">
                Geen coördinaten bekend in de brondata — niet op de kaart en geen afstand
                berekenbaar.
              </dd>
            )}
          </div>

          {vestiging.afstandKm !== null && (
            <div>
              <dt className="text-slate-500">Afstand</dt>
              <dd className="text-slate-900">
                {vestiging.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
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
          {fietsroute && fietsroute !== 'laden' && (
            <div>
              <dt className="text-slate-500">Met de fiets</dt>
              <dd className="text-slate-900">
                {fietsroute.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km ·{' '}
                {Math.round(fietsroute.duurMin)} min (fietsroute, geen verkeersinschatting)
              </dd>
            </div>
          )}

          {vestiging.telefoon && (
            <div>
              <dt className="text-slate-500">Telefoon</dt>
              <dd className="text-slate-900">{vestiging.telefoon}</dd>
            </div>
          )}

          {vestiging.email && (
            <div>
              <dt className="text-slate-500">E-mail</dt>
              <dd>
                <a href={`mailto:${vestiging.email}`} className="text-slate-900 underline">
                  {vestiging.email}
                </a>
              </dd>
            </div>
          )}

          {vestiging.website && (
            <div>
              <dt className="text-slate-500">Website</dt>
              <dd>
                <a
                  href={vestiging.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 underline"
                >
                  {vestiging.website}
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
          href={vestiging.linkFiche}
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
