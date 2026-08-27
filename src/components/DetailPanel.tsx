import { useEffect, useState } from 'react'
import type { CampusMetAfstand, SchoolOpCampus } from '../types'
import {
  campusAanbod,
  groepeerPerGraad,
  FINALITEIT_CHIP,
  FINALITEIT_STYLES,
  FINALITEIT_TEKEN,
} from '../lib/aanbod'
import { NET_CHIP, NET_STYLES } from '../lib/net'
import { berekenFietsroute, type FietsrouteResultaat } from '../lib/fietsroute'

interface DetailPanelProps {
  campus: CampusMetAfstand | null
  school: SchoolOpCampus | null
  zoeklocatie: { lat: number; lon: number } | null
  /** Schooljaar waarop het aanbod slaat, uit meta.json. Null = onbekend, dan tonen we het niet. */
  schooljaarAanbod: number | null
  onClose: () => void
}

export function DetailPanel({
  campus,
  school,
  zoeklocatie,
  schooljaarAanbod,
  onClose,
}: DetailPanelProps) {
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

  // Een modaal venster hoort met Escape te sluiten; dat ontbrak. Zonder dit kun je het paneel
  // met het toetsenbord alleen kwijtraken door naar de sluitknop te tabben.
  useEffect(() => {
    if (!campus || !school) return
    function opToets(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opToets)
    return () => document.removeEventListener('keydown', opToets)
  }, [campus, school, onClose])

  if (!campus || !school) return null

  // Aanbod van het hele adres, niet enkel van de geselecteerde school: scholen die een campus
  // delen vullen elkaars aanbod aan. Zo afgesproken, zie CLAUDE.md.
  const aanbod = campusAanbod(campus)
  const perGraad = groepeerPerGraad(aanbod)

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/30 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="mt-8 w-full max-w-lg rounded-lg bg-kaart p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-inkt">{school.naam}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-zacht hover:text-inkt"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <span
          className={`mt-2 inline-block ${NET_CHIP} ${NET_STYLES[school.net]}`}
        >
          {school.net}
        </span>

        {campus.scholen.length > 1 && (
          <p className="mt-2 text-xs text-zacht">
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
            <dt className="text-zacht">Adres</dt>
            <dd className="text-inkt">
              {campus.straat} {campus.huisnummer}, {campus.postcode} {campus.gemeente}
            </dd>
            {campus.lat === null && (
              <dd className="text-xs text-waarschuwing mt-0.5">
                Geen coördinaten bekend in de brondata — niet op de kaart en geen afstand
                berekenbaar.
              </dd>
            )}
          </div>

          {campus.afstandKm !== null && (
            <div>
              <dt className="text-zacht">Afstand</dt>
              <dd className="text-inkt">
                {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
                hemelsbreed
              </dd>
            </div>
          )}

          {!zoeklocatie && (
            <div>
              <dt className="text-zacht">Met de fiets</dt>
              <dd className="text-zacht italic">Vul je adres in bovenaan om dit te zien.</dd>
            </div>
          )}
          {fietsroute === 'laden' && (
            <div>
              <dt className="text-zacht">Met de fiets</dt>
              <dd className="text-zacht">Bezig met berekenen…</dd>
            </div>
          )}
          {fietsroute && fietsroute !== 'laden' && fietsroute.status === 'ok' && (
            <div>
              <dt className="text-zacht">Met de fiets</dt>
              <dd className="text-inkt">
                {fietsroute.route.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
                · {Math.round(fietsroute.route.duurMin)} min (fietsroute, geen
                verkeersinschatting)
              </dd>
              {/* De footer draagt dezelfde attributie, maar dit paneel ligt er als modaal
                  venster overheen. Vermeld het dus ook hier, naast het resultaat zelf. */}
              <dd className="text-zacht text-xs">
                Route ©{' '}
                <a
                  href="https://openrouteservice.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  openrouteservice
                </a>{' '}
                by HeiGIT, data van OpenStreetMap
              </dd>
            </div>
          )}
          {fietsroute && fietsroute !== 'laden' && fietsroute.status === 'onbeschikbaar' && (
            <div>
              <dt className="text-zacht">Met de fiets</dt>
              <dd className="text-zacht italic">Momenteel niet beschikbaar, probeer later opnieuw.</dd>
            </div>
          )}

          {school.telefoon && (
            <div>
              <dt className="text-zacht">Telefoon</dt>
              <dd className="text-inkt">{school.telefoon}</dd>
            </div>
          )}

          {school.email && (
            <div>
              <dt className="text-zacht">E-mail</dt>
              <dd>
                <a href={`mailto:${school.email}`} className="text-inkt underline">
                  {school.email}
                </a>
              </dd>
            </div>
          )}

          {school.website && (
            <div>
              <dt className="text-zacht">Website</dt>
              <dd>
                <a
                  href={school.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-inkt underline"
                >
                  {school.website}
                </a>
              </dd>
            </div>
          )}

        </dl>

        <section className="mt-6 border-t border-rand pt-4">
          <h3 className="text-sm font-medium text-inkt">
            Studieaanbod
            {schooljaarAanbod !== null && (
              <span className="ml-1 font-normal text-zacht">
                schooljaar {schooljaarAanbod}-{schooljaarAanbod + 1}
              </span>
            )}
          </h3>

          {campus.scholen.length > 1 && aanbod.length > 0 && (
            <p className="mt-1 text-xs text-zacht">
              Alle richtingen op dit adres samen, over de {campus.scholen.length} scholen heen.
            </p>
          )}

          {aanbod.length === 0 ? (
            <p className="mt-2 text-sm text-zacht italic">
              Geen studieaanbod geregistreerd op dit adres. Kijk op de officiële fiche hieronder.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-4">
              {perGraad.map((groep) => (
                <div key={groep.graad}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zacht">
                    {groep.graad}
                  </h4>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {groep.richtingen.map((richting) => (
                      <li
                        key={`${richting.code}-${richting.naam}`}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <span className="text-inkt">
                          {richting.naam}
                          {richting.duaal && (
                            <span className="ml-1 text-xs text-zacht">(duaal leren)</span>
                          )}
                        </span>
                        {richting.finaliteit !== null && (
                          <span
                            className={`shrink-0 ${FINALITEIT_CHIP} ${FINALITEIT_STYLES[richting.finaliteit]}`}
                          >
                            <span aria-hidden="true" className="text-[0.62em] leading-none">
                              {FINALITEIT_TEKEN[richting.finaliteit]}
                            </span>
                            {richting.finaliteit}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-zacht">
            Richtingen zijn per graad samengevat: de brondata vermeldt elk leerjaar apart, hier
            staat elke richting één keer. Controleer de officiële fiche voor het definitieve
            aanbod.
          </p>
        </section>

        <a
          href={school.linkFiche}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-inkt hover:bg-accent"
        >
          Bekijk officiële fiche op data-onderwijs.vlaanderen.be
        </a>
      </div>
    </div>
  )
}
