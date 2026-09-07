import { useEffect } from 'react'
import type { CampusMetAfstand, DatasetMeta, Richting } from '../types'
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
import { huisnummerLabel } from '../lib/adres'
import { datumLabel, KENMERKEN, percentageLabel } from '../lib/leerlingenkenmerken'
import { KenmerkBalkje } from './KenmerkBalkje'

/** Eén rij van de vergelijking: het label plus één cel per adres, in dezelfde volgorde. */
interface TabelRij {
  kop: string
  className?: string
  cellen: React.ReactNode[]
}

interface VergelijkPanelProps {
  campussen: CampusMetAfstand[]
  /** Schooljaar waarop het aanbod slaat, uit meta.json. Null = onbekend, dan tonen we het niet. */
  schooljaarAanbod: number | null
  /** Schooljaar en teldatum van de leerlingenkenmerken. Null = geen publicatie, rijen vallen weg. */
  kenmerkenMeta: DatasetMeta['leerlingenkenmerken']
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
 * **Waarom dit op een telefoon anders is.** Een tabel van vier kolommen past daar niet: ze is
 * 668 px breed in een venster van 311 px, waarvan de kenmerkkolom er 115 neemt, dus je zag één
 * adres tegelijk en werd het bladeren in plaats van vergelijken. Onder de sm-grens staan de
 * adressen daarom onder elkaar, elk met dezelfde rijlabels in dezelfde volgorde; de tabel zelf
 * blijft vanaf sm en op papier. De functie helemaal weglaten op een telefoon zou precies de
 * bezoeker straffen die geen laptop bij de hand heeft.
 */
export function VergelijkPanel({
  campussen,
  schooljaarAanbod,
  kenmerkenMeta,
  onClose,
}: VergelijkPanelProps) {
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

  /**
   * De rijen staan één keer als gegevens en worden twee keer getekend: als tabel vanaf sm en op
   * papier, als stapel per adres op een telefoon. Twee losse JSX-blokken zouden onvermijdelijk
   * uit elkaar gaan lopen — dan staat een rij wel in de tabel en niet in de stapel.
   *
   * `cellen` loopt gelijk met `campussen`: één cel per adres, in dezelfde volgorde.
   */
  const rijen: TabelRij[] = [
    {
      // Zonder eigen adres staat hier in elke kolom "Vul je adres in bovenaan". Op het scherm
      // is dat een bruikbare hint; afgedrukt is het een lege rij met een instructie die op
      // papier niet meer uit te voeren is.
      kop: 'Afstand',
      className: heeftAfstand ? '' : 'print:hidden',
      cellen: campussen.map((campus) =>
        campus.afstandKm !== null ? (
          <span key={campus.id}>
            {campus.afstandKm.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} km
            <span className="block text-xs text-zacht">in vogelvlucht</span>
          </span>
        ) : (
          <span key={campus.id} className="text-zacht italic">
            Vul je adres in bovenaan
          </span>
        ),
      ),
    },
    {
      kop: 'Scholen op dit adres',
      cellen: campussen.map((campus) => (
        <ul key={campus.id} className="flex flex-col gap-1.5">
          {campus.scholen.map((school) => (
            <li key={school.id}>
              <span className="text-inkt">{school.naam}</span>
              <span className={`ml-1 ${NET_CHIP} ${NET_STYLES[school.net]}`}>{school.net}</span>
            </li>
          ))}
        </ul>
      )),
    },
    {
      kop: 'Aantal richtingen',
      cellen: campussen.map((campus, i) =>
        aanbodPerCampus[i].length > 0 ? (
          aanbodPerCampus[i].length
        ) : (
          <span key={campus.id} className="text-zacht italic">
            Geen aanbod geregistreerd
          </span>
        ),
      ),
    },
    {
      kop: 'Finaliteiten',
      cellen: campussen.map((campus, i) => {
        const finaliteiten = finaliteitenVan(aanbodPerCampus[i])
        if (finaliteiten.length === 0) return <span key={campus.id} className="text-zacht">—</span>
        return (
          <span key={campus.id} className="flex flex-wrap gap-1">
            {finaliteiten.map((f) => (
              <span key={f} className={`${FINALITEIT_CHIP} ${FINALITEIT_STYLES[f]}`}>
                <span aria-hidden="true" className="text-[0.62em] leading-none">
                  {FINALITEIT_TEKEN[f]}
                </span>
                {f}
              </span>
            ))}
          </span>
        )
      }),
    },
    // Eén rij per graad, over alle adressen heen dezelfde — ook als één adres die graad niet
    // aanbiedt. Dat lege vakje ís de vergelijking: zo zie je in één blik dat de ene school
    // geen derde graad heeft.
    ...graden.map((graad) => ({
      kop: graad,
      cellen: campussen.map((campus, i) => {
        const groep = graadGroepenPerCampus[i].find((g) => g.graad === graad)
        if (!groep) return <span key={campus.id} className="text-zacht">—</span>
        return (
          <ul key={campus.id} className="flex flex-col gap-0.5">
            {groep.richtingen.map((richting) => (
              <li key={`${richting.code}-${richting.naam}`} className="text-inkt">
                {richtingLabel(richting)}
              </li>
            ))}
          </ul>
        )
      }),
    })),
    /* Leerlingenkenmerken staan ná het aanbod: wie twee scholen vergelijkt, kijkt eerst naar
       wat er te studeren valt.

       **Met hetzelfde balkje als in het detailpaneel.** Een eerdere versie liet het hier weg om
       er geen grafiek van te maken, maar dat argument houdt geen steek: een percentage
       suggereert net zo goed een rangorde, en snel naast elkaar kunnen leggen is precies
       waarvoor deze tabel bestaat. Wat wél vastligt, is dat het balkje neutraal grijs blijft —
       geen kleurschaal van groen naar rood.

       **Per school, niet per adres** — anders dan elke andere rij hier. Dat staat er in de cel
       bij zodra er meer dan één school op het adres staat. */
    ...(kenmerkenMeta
      ? KENMERKEN.map((kenmerk) => ({
          kop: kenmerk.kortLabel,
          cellen: campussen.map((campus) => (
            <ul key={campus.id} className="flex flex-col gap-1">
              {campus.scholen.map((school) => (
                <li key={school.id}>
                  {campus.scholen.length > 1 && (
                    <span className="block text-xs text-zacht">{school.naam}</span>
                  )}
                  {school.leerlingenkenmerken ? (
                    <>
                      <span className="tabular-nums text-inkt">
                        {percentageLabel(school.leerlingenkenmerken[kenmerk.veld])}
                      </span>
                      {/* Vaste breedte, niet de celbreedte: de kolommen zijn niet even breed,
                          en een baan die meeloopt met de cel maakt een hoger percentage in een
                          smalle kolom korter dan een lager in een brede. Zie KenmerkBalkje. */}
                      <KenmerkBalkje
                        aandeel={school.leerlingenkenmerken[kenmerk.veld]}
                        className="w-28 max-w-full"
                      />
                    </>
                  ) : (
                    <span className="text-zacht">—</span>
                  )}
                </li>
              ))}
            </ul>
          )),
        }))
      : []),
    {
      kop: 'Contact',
      cellen: campussen.map((campus) => (
        <ul key={campus.id} className="flex flex-col gap-1.5">
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
              {!school.telefoon && !school.website && <span className="text-zacht">—</span>}
            </li>
          ))}
        </ul>
      )),
    },
    {
      kop: 'Officiële fiche',
      cellen: campussen.map((campus) => (
        <ul key={campus.id} className="flex flex-col gap-1">
          {campus.scholen.map((school) => (
            <li key={school.id}>
              <a
                href={school.linkFiche}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center underline text-inkt sm:min-h-0"
              >
                {school.naam} ↗
              </a>
            </li>
          ))}
        </ul>
      )),
    },
  ]

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
              className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center text-zacht hover:text-inkt"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Twee weergaven van dezelfde rijen. Vanaf sm en op papier de tabel: naast elkaar
            kijken is waarvoor deze functie bestaat. Op een telefoon werd dat bladeren — de
            tabel is 668 px breed in een venster van 311 px, waarvan de kenmerkkolom er 115
            neemt, dus je zag één adres tegelijk. Daar staat nu een stapel per adres, met
            dezelfde rijlabels. */}
        <div className="relative mt-4 hidden overflow-x-auto sm:block print:block print:overflow-visible">
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
                      {campus.straat} {huisnummerLabel(campus.huisnummer)}
                    </span>
                    <span className="block text-xs font-normal text-zacht">
                      {campus.postcode} {campus.gemeente}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rijen.map((rij) => (
                <Rij key={rij.kop} kop={rij.kop} className={rij.className}>
                  {campussen.map((campus, i) => (
                    <Cel key={campus.id}>{rij.cellen[i]}</Cel>
                  ))}
                </Rij>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:hidden print:hidden">
          {campussen.map((campus, i) => (
            <section key={campus.id} className="rounded-lg border border-rand">
              <h3 className="border-b border-rand bg-grond px-3 py-2 text-sm">
                <span className="font-semibold text-inkt">
                  {campus.straat} {huisnummerLabel(campus.huisnummer)}
                </span>
                <span className="block text-xs font-normal text-zacht">
                  {campus.postcode} {campus.gemeente}
                </span>
              </h3>
              {/* Vaste labelkolom, zodat de rijen van het ene adres verticaal uitlijnen met die
                  van het volgende: dat is wat er van het naast elkaar leggen overblijft wanneer
                  de adressen onder elkaar staan. */}
              <dl className="divide-y divide-rand text-sm">
                {rijen.map((rij) => (
                  <div key={rij.kop} className="grid grid-cols-[6.5rem_1fr] gap-3 px-3 py-2">
                    <dt className="text-xs font-medium text-zacht">{rij.kop}</dt>
                    <dd className="text-inkt">{rij.cellen[i]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <p className="mt-4 text-xs text-zacht">
          Richtingen zijn per graad samengevat: de brondata vermeldt elk leerjaar apart, hier
          staat elke richting één keer. Afstanden zijn in vogelvlucht, geen reisafstand. Controleer
          de officiële fiche voor het definitieve aanbod.
        </p>

        {kenmerkenMeta && (
          <p className="mt-2 text-xs text-zacht">
            De vier leerlingenkenmerken komen uit de leerlingentelling van{' '}
            {datumLabel(kenmerkenMeta.teldatum)} (schooljaar {kenmerkenMeta.schooljaar}) voor de
            berekening van de werkingstoelagen, en gelden per school in plaats van per adres. Het
            zijn indicatieve achtergrondcijfers over de leerlingengroep: ze zeggen niets over de
            kwaliteit van het onderwijs. Een streepje betekent dat de school niet in die
            publicatie staat.
          </p>
        )}
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
