import { useEffect, useMemo, useState } from 'react'
import type { CampusMetAfstand, DatasetMeta, SchoolOpCampus } from '../types'
import {
  campusAanbod,
  groepeerPerGraad,
  FINALITEIT_CHIP,
  FINALITEIT_STYLES,
  FINALITEIT_TEKEN,
} from '../lib/aanbod'
import { NET_CHIP, NET_STYLES } from '../lib/net'
import { berekenFietsroute, orsKaartUrl, type FietsrouteResultaat } from '../lib/fietsroute'
import {
  berekenOvReis,
  transitousPlannerUrl,
  volgendeSchooldagOchtend,
  type OvReisResultaat,
} from '../lib/ov'
import { huisnummerLabel } from '../lib/adres'
import { datumLabel, KENMERKEN, percentageLabel } from '../lib/leerlingenkenmerken'

interface DetailPanelProps {
  campus: CampusMetAfstand | null
  school: SchoolOpCampus | null
  zoeklocatie: { lat: number; lon: number } | null
  /** Label van het gezochte adres, om in de dieplink naar de OV-planner te tonen. */
  zoeklocatieLabel: string | null
  /** Schooljaar waarop het aanbod slaat, uit meta.json. Null = onbekend, dan tonen we het niet. */
  schooljaarAanbod: number | null
  /** Schooljaar en teldatum van de leerlingenkenmerken. Null = geen publicatie, blok valt weg. */
  kenmerkenMeta: DatasetMeta['leerlingenkenmerken']
  onClose: () => void
}

export function DetailPanel({
  campus,
  school,
  zoeklocatie,
  zoeklocatieLabel,
  schooljaarAanbod,
  kenmerkenMeta,
  onClose,
}: DetailPanelProps) {
  const [fietsroute, setFietsroute] = useState<FietsrouteResultaat | 'laden' | null>(null)
  const [ovReis, setOvReis] = useState<OvReisResultaat | 'laden' | null>(null)

  // Eén keer vastleggen, zodat de API-call en de dieplink naar de planner over exact hetzelfde
  // moment gaan. Zou de link z'n eigen moment berekenen, dan kan die net over de grens van 8u30
  // vallen en een andere dag tonen dan het resultaat ernaast.
  const aankomstmoment = useMemo(() => volgendeSchooldagOchtend(), [])

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

  // Net als de fietsroute enkel voor de geselecteerde school, niet voor elke kaart in de lijst.
  // Transitous vraagt expliciet om licht om te springen met routing-calls.
  useEffect(() => {
    if (!campus || !zoeklocatie || campus.lat === null || campus.lon === null) {
      setOvReis(null)
      return
    }
    let actief = true
    setOvReis('laden')
    berekenOvReis(zoeklocatie, { lat: campus.lat, lon: campus.lon }, aankomstmoment).then((resultaat) => {
      if (actief) setOvReis(resultaat)
    })
    return () => {
      actief = false
    }
  }, [campus, zoeklocatie, aankomstmoment])

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

  // Dieplink naar de webplanner van Transitous, met van/naar en de aankomsttijd al ingevuld.
  // Alleen zinvol als we allebei de punten kennen — zonder eigen adres is er niets te plannen.
  const routePunten =
    zoeklocatie && campus.lat !== null && campus.lon !== null
      ? {
          van: zoeklocatie,
          naar: { lat: campus.lat, lon: campus.lon },
          namen: {
            van: zoeklocatieLabel ?? 'Mijn adres',
            naar: `${school.naam}, ${campus.straat} ${huisnummerLabel(campus.huisnummer)}, ${campus.gemeente}`,
          },
        }
      : null
  const plannerUrl = routePunten
    ? transitousPlannerUrl(routePunten.van, routePunten.naar, routePunten.namen, aankomstmoment)
    : null
  const fietskaartUrl = routePunten
    ? orsKaartUrl(routePunten.van, routePunten.naar, routePunten.namen)
    : null

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

        {/* Adres en contact staan bovenaan en apart van de reisinformatie. Wie een school
            aanklikt, wil eerst weten wáár ze ligt en hoe je ze bereikt; die vier gegevens
            stonden eerder als gewone regels tussen de (veel wijdlopiger) fiets- en OV-blokken,
            waardoor ze wegvielen. */}
        <address className="mt-4 not-italic">
          <p className="text-base font-medium text-inkt">
            {campus.straat} {huisnummerLabel(campus.huisnummer)}
          </p>
          <p className="text-sm text-zacht">
            {campus.postcode} {campus.gemeente}
            {campus.afstandKm !== null && (
              <>
                {' · '}
                {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
                in vogelvlucht
              </>
            )}
          </p>
          {campus.lat === null && (
            <p className="mt-0.5 text-xs text-waarschuwing">
              Geen coördinaten bekend in de brondata — niet op de kaart en geen afstand
              berekenbaar.
            </p>
          )}
        </address>

        {/* Elke rij is volledig aanklikbaar: bellen op een telefoon, mailen, of naar de site.
            De labels links houden de kolom scanbaar zonder dat er iconen bij moeten. */}
        {(school.telefoon || school.email || school.website) && (
          <ul className="mt-3 divide-y divide-rand overflow-hidden rounded-md border border-rand text-sm">
            {school.telefoon && (
              <li>
                <a
                  href={`tel:${school.telefoon.replace(/[^\d+]/g, '')}`}
                  className="flex items-baseline justify-between gap-3 px-3 py-2 hover:bg-hover"
                >
                  <span className="text-zacht">Telefoon</span>
                  <span className="text-right text-inkt">{school.telefoon}</span>
                </a>
              </li>
            )}
            {school.email && (
              <li>
                <a
                  href={`mailto:${school.email}`}
                  className="flex items-baseline justify-between gap-3 px-3 py-2 hover:bg-hover"
                >
                  <span className="shrink-0 text-zacht">E-mail</span>
                  <span className="break-all text-right text-inkt">{school.email}</span>
                </a>
              </li>
            )}
            {school.website && (
              <li>
                <a
                  href={school.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline justify-between gap-3 px-3 py-2 hover:bg-hover"
                >
                  <span className="shrink-0 text-zacht">Website</span>
                  {/* Enkel het domein tonen: de volledige URL is vaak een lange padnaam die
                      de rij laat overlopen, en zegt niets extra. */}
                  <span className="break-all text-right text-inkt">{toonUrl(school.website)}</span>
                </a>
              </li>
            )}
          </ul>
        )}

        <h3 className="mt-6 border-t border-rand pt-4 text-sm font-medium text-inkt">
          Hoe geraak je er?
        </h3>

        <dl className="mt-3 space-y-3 text-sm">
          {!zoeklocatie && (
            <div>
              <dt className="text-zacht">Met de fiets of het openbaar vervoer</dt>
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
              {/* Zelfde idee als bij het openbaar vervoer: rechtstreeks naar de kaart met déze
                  route erop, in plaats van naar de homepage van openrouteservice — die staat al
                  in de footer. Een hyperlink is geen API-gebruik, dus dit kost geen quota. */}
              {fietskaartUrl && (
                <dd className="text-xs">
                  <a
                    href={fietskaartUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-inkt"
                  >
                    Bekijk de fietsroute op de kaart ↗
                  </a>
                </dd>
              )}
              {/* De vermelding zelf is contractueel verplicht (HeiGIT-voorwaarden), de link
                  erin niet. Zie CLAUDE.md. */}
              <dd className="text-zacht text-xs">
                Route © openrouteservice by HeiGIT, data van OpenStreetMap
              </dd>
            </div>
          )}
          {fietsroute && fietsroute !== 'laden' && fietsroute.status === 'onbeschikbaar' && (
            <div>
              <dt className="text-zacht">Met de fiets</dt>
              <dd className="text-zacht italic">Momenteel niet beschikbaar, probeer later opnieuw.</dd>
            </div>
          )}

          {ovReis === 'laden' && (
            <div>
              <dt className="text-zacht">Met het openbaar vervoer</dt>
              <dd className="text-zacht">Bezig met zoeken…</dd>
            </div>
          )}
          {ovReis && ovReis !== 'laden' && ovReis.status === 'ok' && (
            <div>
              <dt className="text-zacht">Met het openbaar vervoer</dt>
              <dd className="text-inkt">
                {ovReis.reis.duurMin} min ·{' '}
                {ovReis.reis.overstappen === 0
                  ? 'rechtstreeks'
                  : `${ovReis.reis.overstappen}× overstappen`}
                {ovReis.reis.lijnen.length > 0 && (
                  <>
                    {' '}
                    · {ovReis.reis.lijnen.length === 1 ? 'lijn' : 'lijnen'}{' '}
                    {ovReis.reis.lijnen.join(', ')}
                  </>
                )}
              </dd>
              {/* Een reistijd zonder het moment erbij is misleidend: de dienstregeling van een
                  woensdagochtend is een andere dan die van een zondagavond, en in een
                  vakantieweek klopt ze sowieso niet voor een schooldag. Toon dus waarvoor
                  gerekend is. */}
              <dd className="text-zacht text-xs">
                Aankomst{' '}
                {ovReis.reis.aankomst.toLocaleString('nl-BE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                , met {ovReis.reis.wandelMin} min stappen. Vakantiedagen zitten er niet in.
              </dd>
              {/* Verplichte attributie: de footer draagt ze ook, maar dit paneel ligt daar als
                  modaal venster overheen. Zelfde reden als bij de fietsroute. */}
              {/* Rechtstreeks naar de webplanner met déze route al ingevuld — daar staan de
                  haltes, de vertrekuren en de alternatieven die hier niet passen. De algemene
                  link naar Transitous staat al in de footer, dus die hoeft hier niet nog eens.
                  Een hyperlink is geen API-gebruik; zie CLAUDE.md. */}
              {plannerUrl && (
                <dd className="text-xs">
                  <a href={plannerUrl} target="_blank" rel="noreferrer" className="underline text-inkt">
                    Bekijk de rit stap voor stap ↗
                  </a>
                </dd>
              )}
              <dd className="text-zacht text-xs">
                Reisadvies via Transitous, op basis van de dienstregeling van De Lijn en NMBS
              </dd>
            </div>
          )}
          {ovReis && ovReis !== 'laden' && ovReis.status === 'te-voet' && (
            <div>
              <dt className="text-zacht">Met het openbaar vervoer</dt>
              <dd className="text-inkt">
                Niet nodig: {ovReis.wandelMin} min te voet, sneller dan met bus of trein.
              </dd>
            </div>
          )}
          {ovReis && ovReis !== 'laden' && ovReis.status === 'geen-verbinding' && (
            <div>
              <dt className="text-zacht">Met het openbaar vervoer</dt>
              <dd className="text-zacht italic">
                Geen verbinding gevonden voor de ochtendspits.
              </dd>
            </div>
          )}
          {ovReis && ovReis !== 'laden' && ovReis.status === 'onbeschikbaar' && (
            <div>
              <dt className="text-zacht">Met het openbaar vervoer</dt>
              <dd className="text-zacht italic">Momenteel niet beschikbaar, probeer later opnieuw.</dd>
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

        {/* Leerlingenkenmerken staan ná het studieaanbod: wie een school bekijkt, zoekt eerst
            wat je er kan studeren. Ze staan er wel bij, want ze zeggen iets over de groep waarin
            je kind terechtkomt — met de nodige omkadering, zie de voetnoot onderaan het blok. */}
        {kenmerkenMeta && (
          <section className="mt-6 border-t border-rand pt-4">
            <h3 className="text-sm font-medium text-inkt">
              Leerlingenkenmerken
              <span className="ml-1 font-normal text-zacht">
                schooljaar {kenmerkenMeta.schooljaar}
              </span>
            </h3>

            {school.leerlingenkenmerken === null ? (
              <p className="mt-2 text-sm text-zacht italic">
                Deze school staat niet in de publicatie van schooljaar {kenmerkenMeta.schooljaar}.
                Dat gebeurt bij scholen die geen werkingstoelagen krijgen en bij scholen die pas
                onlangs zijn opgesplitst of opgericht.
              </p>
            ) : (
              <>
                {/* Het aanbod hierboven geldt voor het hele adres, deze cijfers niet. Dat
                    verschil moet er staan, anders leest iemand ze als kenmerken van de campus. */}
                <p className="mt-1 text-xs text-zacht">
                  {campus.scholen.length > 1
                    ? `Alleen van ${school.naam}, niet van de andere scholen op dit adres.`
                    : 'Van deze school, over al haar vestigingen samen.'}
                </p>

                <dl className="mt-3 flex flex-col gap-3">
                  {KENMERKEN.map((kenmerk) => (
                    <Kenmerkbalk
                      key={kenmerk.veld}
                      label={kenmerk.label}
                      uitleg={kenmerk.uitleg}
                      aandeel={school.leerlingenkenmerken![kenmerk.veld]}
                    />
                  ))}
                </dl>

                <p className="mt-4 text-xs text-zacht">
                  Geteld op {datumLabel(kenmerkenMeta.teldatum)} voor de berekening van de
                  werkingstoelagen. Het zijn indicatieve achtergrondcijfers over de
                  leerlingengroep: ze zeggen niets over de kwaliteit van het onderwijs of over hoe
                  je kind het er zou doen. Baseer er dus geen schoolkeuze op.
                </p>
              </>
            )}
          </section>
        )}

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

/**
 * Eén indicator als percentage met een balk erbij. De balk is bewust neutraal grijs: een
 * kleurschaal van groen naar rood zou er een oordeel van maken, en dat is het niet.
 */
function Kenmerkbalk({
  label,
  uitleg,
  aandeel,
}: {
  label: string
  uitleg: string
  aandeel: number | null
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="text-inkt">{label}</dt>
        <dd className="shrink-0 tabular-nums text-inkt">
          {percentageLabel(aandeel)}
        </dd>
      </div>
      {aandeel !== null && (
        // De balk herhaalt enkel het percentage ernaast; schermlezers hebben er niets aan.
        <div aria-hidden="true" className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-rand">
          <div className="h-full rounded-full bg-zacht" style={{ width: `${aandeel * 100}%` }} />
        </div>
      )}
      <p className="mt-1 text-xs text-zacht">{uitleg}</p>
    </div>
  )
}

/**
 * Toont een website als kaal domein ("sintjozef.be" in plaats van
 * "https://www.sintjozef.be/secundair/"). Valt terug op de ruwe waarde als het geen geldige URL
 * is — de brondata bevat af en toe een adres zonder protocol.
 */
function toonUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
