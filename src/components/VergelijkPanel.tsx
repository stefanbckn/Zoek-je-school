import { useEffect } from 'react'
import type { CampusMetAfstand, Richting } from '../types'
import {
  campusAanbod,
  finaliteitenVan,
  groepeerPerGraad,
  sorteerGraden,
  FINALITEIT_CHIP,
  FINALITEIT_STYLES,
  FINALITEIT_TEKEN,
} from '../lib/aanbod'
import { NET_CHIP, NET_STYLES } from '../lib/net'

interface VergelijkPanelProps {
  campussen: CampusMetAfstand[]
  /** Schooljaar waarop het aanbod slaat, uit meta.json. Null = onbekend, dan tonen we het niet. */
  schooljaarAanbod: number | null
  onClose: () => void
}

/**
 * Twee tot vier adressen naast elkaar in één tabel.
 *
 * **De vergelijking gaat over adressen, niet over scholen.** Op 130 van de 303 adressen staat
 * meer dan één apart geregistreerde school, en die delen het gebouw, de ligging en — zoals de
 * rest van de app het al toont — het studieaanbod. Eén kolom per school zou hetzelfde gebouw
 * vier keer naast zichzelf zetten. De scholen staan daarom als rij ín de kolom.
 *
 * **Waarom dit ook op een telefoon bestaat.** Een tabel van vier kolommen past daar niet, maar
 * de alternatieven zijn slechter: onder elkaar zetten is geen vergelijking meer, en de functie
 * helemaal weglaten straft precies de bezoeker die geen laptop bij de hand heeft. De tabel
 * scrollt dus zijwaarts met de kenmerkkolom vastgezet, zodat je altijd ziet waar je naar kijkt.
 */
export function VergelijkPanel({ campussen, schooljaarAanbod, onClose }: VergelijkPanelProps) {
  const open = campussen.length > 0

  // Zelfde afspraak als in DetailPanel: een modaal venster hoort met Escape te sluiten.
  useEffect(() => {
    if (!open) return
    function opToets(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opToets)
    return () => document.removeEventListener('keydown', opToets)
  }, [open, onClose])

  if (!open) return null

  // Eén keer per campus berekenen, niet per tabelrij: de graadrijen hieronder lopen er
  // allemaal doorheen.
  const aanbodPerCampus = campussen.map((c) => campusAanbod(c))
  const graadGroepenPerCampus = aanbodPerCampus.map((aanbod) => groepeerPerGraad(aanbod))
  const heeftAfstand = campussen.some((campus) => campus.afstandKm !== null)
  const graden = sorteerGraden(
    aanbodPerCampus.flatMap((aanbod) => aanbod.map((r) => r.graad ?? 'Overige')),
  )

  return (
    <div
      // print:* haalt het venster uit z'n modale opmaak: op papier is er geen schermrand om
      // binnen te blijven, en een grijze overlay met een schaduwrand kost enkel inkt.
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/30 p-4 print:static print:block print:overflow-visible print:bg-transparent print:p-0"
      onClick={onClose}
    >
      <div
        className="vergelijk-afdruk mt-4 w-full max-w-5xl rounded-lg bg-kaart p-4 shadow-xl sm:mt-8 sm:p-6 print:m-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-inkt">
              {campussen.length} adressen vergeleken
            </h2>
            <p className="mt-0.5 text-xs text-zacht">
              Studieaanbod
              {schooljaarAanbod !== null && ` van schooljaar ${schooljaarAanbod}-${schooljaarAanbod + 1}`}
              , per adres samengevoegd over alle scholen die er staan.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-rand px-3 py-1.5 text-sm font-medium text-inkt hover:bg-hover"
            >
              Afdrukken
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zacht hover:text-inkt"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Op een telefoon past er anderhalve kolom op het scherm. De kolombreedtes zijn zo
            gekozen dat de vólgende kolom net aankijkt — dat is de aanzet om te scrollen — en
            deze regel zegt het er nog eens bij, want een half zichtbare kolom kan ook
            overzien worden. */}
        <p className="mt-3 text-xs text-zacht sm:hidden print:hidden">
          Scrol de tabel zijwaarts om de andere adressen te zien.
        </p>

        {/* Zijwaarts scrollen met de kenmerkkolom vastgezet. `min-w` per kolom, want een kolom
            die smaller wordt dan een schoolnaam maakt de tabel juist onleesbaar. Bij het
            afdrukken vervalt het scrollgebied: papier heeft geen overflow. */}
        <div className="mt-4 overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Vergelijking van {campussen.length} adressen op ligging, scholen en studieaanbod
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-24 min-w-24 border-r border-rand bg-kaart p-2 text-left align-bottom text-xs font-medium text-zacht sm:w-32 sm:min-w-32 print:static"
                >
                  <span className="sr-only">Kenmerk</span>
                </th>
                {campussen.map((campus) => (
                  <th
                    key={campus.id}
                    scope="col"
                    className="min-w-44 border-b-2 border-rand p-2 text-left align-bottom text-inkt sm:min-w-52"
                  >
                    <span className="font-semibold">
                      {campus.straat} {campus.huisnummer}
                    </span>
                    <span className="block text-xs font-normal text-zacht">
                      {campus.postcode} {campus.gemeente}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Zonder eigen adres staat hier in elke kolom "Vul je adres in bovenaan". Op het
                  scherm is dat een bruikbare hint; afgedrukt is het een lege rij met een
                  instructie die op papier niet meer uit te voeren is. */}
              <Rij kop="Afstand" className={heeftAfstand ? '' : 'print:hidden'}>
                {campussen.map((campus) => (
                  <Cel key={campus.id}>
                    {campus.afstandKm !== null ? (
                      <>
                        {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
                        <span className="block text-xs text-zacht">hemelsbreed</span>
                      </>
                    ) : (
                      <span className="text-zacht italic">Vul je adres in bovenaan</span>
                    )}
                  </Cel>
                ))}
              </Rij>

              <Rij kop="Scholen op dit adres">
                {campussen.map((campus) => (
                  <Cel key={campus.id}>
                    <ul className="flex flex-col gap-1.5">
                      {campus.scholen.map((school) => (
                        <li key={school.id}>
                          <span className="text-inkt">{school.naam}</span>
                          <span className={`ml-1 ${NET_CHIP} ${NET_STYLES[school.net]}`}>
                            {school.net}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Cel>
                ))}
              </Rij>

              <Rij kop="Aantal richtingen">
                {campussen.map((campus, i) => (
                  <Cel key={campus.id}>
                    {aanbodPerCampus[i].length > 0 ? (
                      aanbodPerCampus[i].length
                    ) : (
                      <span className="text-zacht italic">Geen aanbod geregistreerd</span>
                    )}
                  </Cel>
                ))}
              </Rij>

              <Rij kop="Finaliteiten">
                {campussen.map((campus, i) => {
                  const finaliteiten = finaliteitenVan(aanbodPerCampus[i])
                  return (
                    <Cel key={campus.id}>
                      {finaliteiten.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {finaliteiten.map((f) => (
                            <span key={f} className={`${FINALITEIT_CHIP} ${FINALITEIT_STYLES[f]}`}>
                              <span aria-hidden="true" className="text-[0.62em] leading-none">
                                {FINALITEIT_TEKEN[f]}
                              </span>
                              {f}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-zacht">—</span>
                      )}
                    </Cel>
                  )
                })}
              </Rij>

              {/* Eén rij per graad, over alle kolommen heen dezelfde — ook als één adres die
                  graad niet aanbiedt. Dat lege vakje ís de vergelijking: zo zie je in één blik
                  dat de ene school geen derde graad heeft. */}
              {graden.map((graad) => (
                <Rij key={graad} kop={graad}>
                  {campussen.map((campus, i) => {
                    const groep = graadGroepenPerCampus[i].find((g) => g.graad === graad)
                    return (
                      <Cel key={campus.id}>
                        {groep ? (
                          <ul className="flex flex-col gap-0.5">
                            {groep.richtingen.map((richting) => (
                              <li key={`${richting.code}-${richting.naam}`} className="text-inkt">
                                {richtingLabel(richting)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-zacht">—</span>
                        )}
                      </Cel>
                    )
                  })}
                </Rij>
              ))}

              <Rij kop="Contact">
                {campussen.map((campus) => (
                  <Cel key={campus.id}>
                    <ul className="flex flex-col gap-1.5">
                      {campus.scholen.map((school) => (
                        <li key={school.id}>
                          {campus.scholen.length > 1 && (
                            <span className="block text-xs text-zacht">{school.naam}</span>
                          )}
                          {school.telefoon && <span className="block">{school.telefoon}</span>}
                          {school.website && (
                            <a
                              href={school.website}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all underline text-inkt"
                            >
                              {toonUrl(school.website)}
                            </a>
                          )}
                          {!school.telefoon && !school.website && (
                            <span className="text-zacht">—</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Cel>
                ))}
              </Rij>

              <Rij kop="Officiële fiche">
                {campussen.map((campus) => (
                  <Cel key={campus.id}>
                    <ul className="flex flex-col gap-1">
                      {campus.scholen.map((school) => (
                        <li key={school.id}>
                          <a
                            href={school.linkFiche}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-inkt"
                          >
                            {school.naam} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Cel>
                ))}
              </Rij>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zacht">
          Richtingen zijn per graad samengevat: de brondata vermeldt elk leerjaar apart, hier
          staat elke richting één keer. Afstanden zijn hemelsbreed, geen reisafstand. Controleer
          de officiële fiche voor het definitieve aanbod.
        </p>
      </div>
    </div>
  )
}

/** Eén rij van de tabel: het kenmerk links vastgezet, de campussen ernaast. */
function Rij({
  kop,
  children,
  className = '',
}: {
  kop: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <tr className={`border-b border-rand align-top ${className}`}>
      {/* sticky left: de kenmerkkolom blijft staan terwijl je zijwaarts scrollt. Zonder dat
          weet je op een telefoon na twee kolommen niet meer waar je naar kijkt. */}
      <th
        scope="row"
        className="sticky left-0 z-10 w-24 min-w-24 border-r border-rand bg-kaart p-2 text-left text-xs font-medium text-zacht sm:w-32 sm:min-w-32 print:static"
      >
        {kop}
      </th>
      {children}
    </tr>
  )
}

function Cel({ children }: { children: React.ReactNode }) {
  return <td className="p-2 text-inkt">{children}</td>
}

/**
 * Richtingnaam zoals ze in de tabel staat. `campusAanbod` heeft het leerjaar-voorvoegsel er al
 * af gehaald, dus hier komt enkel de duaal-aanduiding er nog bij.
 */
function richtingLabel(richting: Richting): string {
  return richting.duaal ? `${richting.naam} (duaal)` : richting.naam
}

/** Zelfde behandeling als in DetailPanel: een kaal domein leest beter dan een lange URL. */
function toonUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
