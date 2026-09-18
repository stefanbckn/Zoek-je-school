import { useLayoutEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { CampusMetAfstand } from '../types'
import { huisnummerLabel } from '../lib/adres'
import { campusLabel, schoolLabel, schoolNamen, vraagtSchoolkeuze } from '../lib/vergelijking'
import {
  berekenUitslag,
  GEWICHTEN,
  gewichtVan,
  heeftInvoer,
  isIngevuld,
  klikAdres,
  LEEG_BLAD,
  notitieSleutel,
  ONDERWERPEN,
  PLAATS_LABEL,
  plaatsVan,
  PUNTEN,
  RUIS,
  SMAL,
  wisKeuze,
  zetGelijk,
  zetGewicht,
  zetNotitie,
  zetSchoolnaam,
} from '../lib/beslisblad'
import type { Beslisblad as BeslisbladStand, Onderwerp, Plaats } from '../lib/beslisblad'
import { KenmerkBalkje } from './KenmerkBalkje'

interface BeslisbladProps {
  campussen: CampusMetAfstand[]
  blad: BeslisbladStand
  onChange: Dispatch<SetStateAction<BeslisbladStand>>
}

/**
 * Een klassenaam per aantal adressen, voluit geschreven: Tailwind vindt enkel klassen die
 * letterlijk in de broncode staan, dus `sm:grid-cols-${n}` zou nooit gebouwd worden. Vier
 * kaartjes naast elkaar pas vanaf md; op sm werden ze te smal voor een notitie.
 */
const KOLOMMEN: Record<number, string> = {
  2: 'sm:grid-cols-2 print:grid-cols-2',
  3: 'sm:grid-cols-3 print:grid-cols-3',
  4: 'sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4',
}

/**
 * "Jullie keuze": de infodagvragen als beslisblad, met per onderwerp een gewicht, een notitie
 * per adres en een beste en tweede keuze. Onderaan de volgorde die daaruit volgt.
 *
 * De rekenregels en waarom dit geen ranglijst van de site is, staan in `lib/beslisblad.ts`.
 * Hier gaat het om de vorm: op het scherm invulvelden, op papier gewone tekst of een
 * stippellijn om met de pen in te vullen. Een `<textarea>` drukt slecht af, want wat buiten
 * zijn hoogte valt, wordt afgesneden.
 */
export function Beslisblad({ campussen, blad, onChange }: BeslisbladProps) {
  const ids = campussen.map((c) => c.id)
  const uitslag = berekenUitslag(blad, ids)
  const gerangschikt = [...uitslag.stand].sort((a, b) => b.punten - a.punten)
  const heeftUitslag = uitslag.ingevuld > 0
  const naamVan = (campus: CampusMetAfstand) => schoolLabel(campus, blad.schoolnaam[campus.id])
  const tekiezen = campussen.filter(vraagtSchoolkeuze)

  function allesWissen() {
    if (!window.confirm('Alle notities, gewichten en keuzes gaan weg. Dit kan niet ongedaan gemaakt worden.')) return
    onChange(LEEG_BLAD)
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-zacht print:hidden">
        Noteer per adres wat je op de infodag hoorde, zeg hoe zwaar elk onderwerp weegt en welk
        adres jullie daar het beste vinden. De volgorde onderaan komt uit jullie antwoorden, niet
        van deze site.{' '}
        <span className="text-inkt">
          Wat je invult, blijft staan zolang deze pagina openstaat, ook als je dit venster sluit.
        </span>{' '}
        Het wordt nergens bewaard of verstuurd: druk het af als je het wil houden.
      </p>
      <p className="hidden text-zacht print:block">
        Per onderwerp: wat we hoorden, hoe zwaar het weegt en welk adres we het beste vinden.
      </p>

      {/* Op een adres met meerdere scholen zonder gedeelde naam weet de site niet welke school
          de ouder bedoelt, dus vraagt ze het. Eén keer per adres, niet per onderwerp. Op papier
          staat de gekozen naam al in elk kaartje. */}
      {tekiezen.length > 0 && (
        <div className="mt-4 rounded-xl border border-rand p-3 sm:p-4 print:hidden">
          <h3 className="font-semibold text-inkt">Welke school bedoelen jullie?</h3>
          <p className="mt-0.5 text-sm text-zacht">
            Op {tekiezen.length === 1 ? 'dit adres staan' : 'deze adressen staan'} meerdere
            scholen. Kies de school die jullie bezoeken, dan staat die naam op het blad.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {tekiezen.map((campus) => (
              <label key={campus.id} className="flex flex-col gap-1 text-sm">
                <span className="text-zacht">{campusLabel(campus)}</span>
                <select
                  value={blad.schoolnaam[campus.id] ?? ''}
                  onChange={(e) => onChange((b) => zetSchoolnaam(b, campus.id, e.target.value))}
                  className="min-h-11 w-full rounded-md border border-rand bg-kaart px-2 text-base text-inkt sm:min-h-0 sm:py-1.5 sm:text-sm"
                >
                  <option value="">Nog niet gekozen</option>
                  {schoolNamen(campus).map((naam) => (
                    <option key={naam} value={naam}>
                      {naam}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {ONDERWERPEN.map((onderwerp) => (
          <OnderwerpKaart
            key={onderwerp.id}
            onderwerp={onderwerp}
            campussen={campussen}
            blad={blad}
            naamVan={naamVan}
            onChange={onChange}
          />
        ))}
      </div>

      <section
        aria-labelledby="volgorde-titel"
        aria-live="polite"
        className="beslisblad-blok mt-4 rounded-xl border-2 border-inkt p-4"
      >
        <h3 id="volgorde-titel" className="font-semibold text-inkt">
          Jullie volgorde
        </h3>
        <p className="mt-0.5 text-xs text-zacht">
          Beste levert {PUNTEN.beste} punten op, tweede {PUNTEN.tweede}, de rest {PUNTEN.rest},
          gelijk {PUNTEN.gelijk}. Alles maal het gewicht, herrekend naar 100.
        </p>

        <ol className="mt-3 flex flex-col gap-3">
          {gerangschikt.map((s) => {
            const campus = campussen.find((c) => c.id === s.campusId)
            if (!campus) return null
            return (
              <li key={s.campusId} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="w-5 shrink-0 font-semibold text-inkt tabular-nums">
                    {heeftUitslag ? s.plaats : '–'}
                  </span>
                  <span className="min-w-0 flex-1 text-inkt">
                    {naamVan(campus)}
                    <span className="block text-xs text-zacht">{campusLabel(campus)}</span>
                  </span>
                  <span className="font-semibold text-inkt tabular-nums">
                    {heeftUitslag ? Math.round(s.op100) : '–'}
                  </span>
                </div>
                {/* Hetzelfde neutrale grijs als bij de leerlingenkenmerken: geen kleur per
                    adres en geen groen of rood, het getal ernaast zegt het al. */}
                <KenmerkBalkje aandeel={heeftUitslag ? s.op100 / 100 : 0} className="ml-7 w-auto" />
                {heeftUitslag && (
                  <p className="mt-0.5 ml-7 text-xs text-zacht">
                    {s.punten} punten · beste bij {s.keerBeste} van {uitslag.ingevuld}
                  </p>
                )}
              </li>
            )
          })}
        </ol>

        <p className="mt-3 border-t border-rand pt-3 text-sm text-zacht">
          {vonnis(uitslag.ingevuld, uitslag.meewegend, gerangschikt, campussen, naamVan)}
        </p>

        {heeftInvoer(blad) && (
          <button
            type="button"
            onClick={allesWissen}
            className="mt-3 rounded-md border border-rand px-3 py-1.5 text-sm font-medium text-inkt hover:bg-hover print:hidden"
          >
            Alles wissen
          </button>
        )}
      </section>
    </div>
  )
}

function OnderwerpKaart({
  onderwerp,
  campussen,
  blad,
  naamVan,
  onChange,
}: {
  onderwerp: Onderwerp
  campussen: CampusMetAfstand[]
  blad: BeslisbladStand
  naamVan: (campus: CampusMetAfstand) => string
  onChange: Dispatch<SetStateAction<BeslisbladStand>>
}) {
  const ids = campussen.map((c) => c.id)
  const gewicht = gewichtVan(blad, onderwerp.id)
  const gelijk = blad.keuze[onderwerp.id]?.gelijk ?? false
  const aangeklikt = (blad.keuze[onderwerp.id]?.volgorde ?? []).filter((id) => ids.includes(id))
  const af = isIngevuld(blad, onderwerp.id, ids)
  const gewichtLabel = GEWICHTEN.find((g) => g.waarde === gewicht)?.label

  /*
   * "Telt niet mee" klapt het onderwerp in: elf onderwerpen maal drie of vier adressen is op
   * een telefoon anders een eindeloze lap. De titel en de gewichten blijven staan, zodat je het
   * met één klik terug openklapt. Notities en keuzes blijven in de stand staan, ook ingeklapt.
   */
  const dicht = gewicht === 0
  const heeftNotities = ids.some(
    (id) => (blad.notities[notitieSleutel(onderwerp.id, id)] ?? '').trim() !== '',
  )

  let hint = ''
  if (gelijk) hint = 'Alle adressen krijgen evenveel punten.'
  else if (af) hint = 'Ingevuld. Klik een keuze opnieuw om ze weg te halen.'
  else if (aangeklikt.length === 1) hint = 'Kies nu de tweede.'

  return (
    <article
      // Ingeklapt en zonder notities hoort het niet op papier: dat is een lege titel die inkt
      // kost. Met notities wel, dan blijft wat er geschreven werd niet achter op het scherm.
      className={`beslisblad-blok rounded-xl border border-rand ${
        dicht ? 'bg-grond p-3' : 'p-3 sm:p-4'
      } ${dicht && !heeftNotities ? 'print:hidden' : ''}`}
    >
      <div className={`flex flex-wrap justify-between gap-3 ${dicht ? 'items-center' : 'items-start'}`}>
        <div className="min-w-0 flex-[1_1_16rem]">
          <h3 className={`font-semibold ${dicht ? 'text-zacht' : 'text-inkt'}`}>{onderwerp.titel}</h3>
          {dicht ? (
            <p className="mt-0.5 text-xs text-zacht print:hidden">
              Telt niet mee en staat ingeklapt. Kies een gewicht om het open te klappen
              {heeftNotities ? '; je notities staan er nog.' : '.'}
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-zacht">{onderwerp.vraag}</p>
              {onderwerp.tip && (
                <p className="mt-0.5 text-xs text-zacht italic print:hidden">{onderwerp.tip}</p>
              )}
            </>
          )}
        </div>
        <div
          role="group"
          aria-label={`Gewicht van ${onderwerp.titel}`}
          className="flex flex-wrap gap-1 print:hidden"
        >
          {GEWICHTEN.map((g) => (
            <button
              key={g.waarde}
              type="button"
              aria-pressed={g.waarde === gewicht}
              onClick={() => onChange((b) => zetGewicht(b, onderwerp.id, g.waarde))}
              className="min-h-11 rounded-md border border-rand px-2.5 text-xs font-medium text-inkt hover:bg-hover aria-pressed:border-inkt aria-pressed:bg-inkt aria-pressed:text-kaart sm:min-h-0 sm:py-1"
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="hidden text-xs text-zacht print:block">Gewicht: {gewichtLabel}</p>
      </div>

      {!dicht && (
        <>
          <div className={`mt-3 grid grid-cols-1 gap-2 ${KOLOMMEN[campussen.length] ?? ''}`}>
            {campussen.map((campus) => {
              const plaats = plaatsVan(blad, onderwerp.id, campus.id, ids)
              return (
                <AdresVak
                  key={campus.id}
                  onderwerp={onderwerp}
                  campus={campus}
                  naam={naamVan(campus)}
                  plaats={plaats}
                  kiesLabel={aangeklikt.length === 0 ? 'Kies als beste' : 'Kies als tweede'}
                  notitie={blad.notities[notitieSleutel(onderwerp.id, campus.id)] ?? ''}
                  onNotitie={(tekst) => onChange((b) => zetNotitie(b, onderwerp.id, campus.id, tekst))}
                  onKies={() => onChange((b) => klikAdres(b, onderwerp.id, campus.id, ids))}
                />
              )
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zacht print:hidden">
            <button
              type="button"
              aria-pressed={gelijk}
              onClick={() => onChange((b) => zetGelijk(b, onderwerp.id))}
              className="min-h-11 rounded-md border border-rand px-2.5 font-medium text-inkt hover:bg-hover aria-pressed:border-inkt sm:min-h-0 sm:py-1"
            >
              Gelijkspel
            </button>
            {(aangeklikt.length > 0 || gelijk) && (
              <button
                type="button"
                onClick={() => onChange((b) => wisKeuze(b, onderwerp.id))}
                className="min-h-11 rounded-md border border-rand px-2.5 font-medium text-inkt hover:bg-hover sm:min-h-0 sm:py-1"
              >
                Keuze wissen
              </button>
            )}
            <span>{hint}</span>
          </div>
        </>
      )}
      {/* Ingeklapt met notities: op papier toch de notities, want die zijn geschreven. */}
      {dicht && heeftNotities && (
        <ul className="mt-2 hidden list-none p-0 print:block">
          {campussen.map((campus) => {
            const tekst = (blad.notities[notitieSleutel(onderwerp.id, campus.id)] ?? '').trim()
            if (!tekst) return null
            return (
              <li key={campus.id} className="mt-1">
                <span className="font-semibold text-inkt">{naamVan(campus)}:</span>{' '}
                <span className="whitespace-pre-wrap text-inkt">{tekst}</span>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

function AdresVak({
  onderwerp,
  campus,
  naam,
  plaats,
  kiesLabel,
  notitie,
  onNotitie,
  onKies,
}: {
  onderwerp: Onderwerp
  campus: CampusMetAfstand
  naam: string
  plaats: Plaats | null
  kiesLabel: string
  notitie: string
  onNotitie: (tekst: string) => void
  onKies: () => void
}) {
  const veldRef = useRef<HTMLTextAreaElement>(null)
  const adres = `${campus.straat} ${huisnummerLabel(campus.huisnummer)}, ${campus.gemeente}`
  const voluit = `${naam}, ${campusLabel(campus)}`

  // Het veld groeit mee met de tekst, ook wanneer het venster opnieuw opengaat met een
  // notitie die er al stond. `field-sizing: content` zou dit in CSS doen, maar Firefox en
  // oudere Safari kennen het niet.
  useLayoutEffect(() => {
    const veld = veldRef.current
    if (!veld) return
    veld.style.height = 'auto'
    veld.style.height = `${veld.scrollHeight}px`
  }, [notitie])

  const beste = plaats === 'beste'

  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-lg border p-2.5 ${
        beste ? 'border-2 border-inkt' : 'border-rand'
      }`}
    >
      <p className="text-sm leading-tight">
        <span className="font-semibold text-inkt">{naam}</span>
        <span className="block text-xs text-zacht">{adres}</span>
      </p>

      <textarea
        ref={veldRef}
        value={notitie}
        onChange={(e) => onNotitie(e.target.value)}
        rows={onderwerp.ruim ? 4 : 2}
        placeholder="Wat hoorden jullie?"
        aria-label={`Notitie over ${onderwerp.titel.toLowerCase()} bij ${voluit}`}
        className="w-full resize-none overflow-hidden rounded-md border border-rand bg-kaart px-2 py-1.5 text-base text-inkt placeholder:text-zacht sm:text-sm print:hidden"
      />
      {/* Op papier: de notitie als gewone tekst, of een lege lijn om met de pen in te vullen. */}
      {notitie.trim() ? (
        <p className="hidden whitespace-pre-wrap text-inkt print:block">{notitie}</p>
      ) : (
        <div
          aria-hidden="true"
          className={`hidden border-b border-dotted border-inkt print:block ${onderwerp.ruim ? 'h-16' : 'h-8'}`}
        />
      )}

      <button
        type="button"
        onClick={onKies}
        aria-pressed={plaats === 'beste' || plaats === 'tweede'}
        className={`min-h-11 self-start rounded-md border px-2.5 text-xs font-medium sm:min-h-0 sm:py-1 print:hidden ${
          beste
            ? 'border-inkt bg-inkt text-kaart'
            : plaats
              ? 'border-inkt text-inkt'
              : 'border-rand text-inkt hover:bg-hover'
        }`}
      >
        {plaats ? PLAATS_LABEL[plaats] : kiesLabel}
        <span className="sr-only">
          {' '}
          voor {onderwerp.titel.toLowerCase()}: {voluit}
        </span>
      </button>
      {plaats && <p className="hidden text-xs font-semibold text-inkt print:block">{PLAATS_LABEL[plaats]}</p>}
    </div>
  )
}

/**
 * De zin onder de balkjes. Bij een klein verschil zegt het blad uitdrukkelijk dat het niet
 * kiest: een voorsprong van twee punten op honderd hangt aan één gewicht, en dat mag niet als
 * een uitslag lezen.
 */
function vonnis(
  ingevuld: number,
  meewegend: number,
  gerangschikt: { campusId: string; op100: number }[],
  campussen: CampusMetAfstand[],
  naamVan: (campus: CampusMetAfstand) => string,
): string {
  if (meewegend === 0) return 'Alle onderwerpen staan op "Telt niet mee", dus er valt niets te tellen.'
  if (ingevuld === 0) {
    return 'Nog niets aangeduid. Zodra je bij één onderwerp een beste en een tweede kiest, beweegt de volgorde mee.'
  }
  const [eerste, tweede] = gerangschikt
  const campus = campussen.find((c) => c.id === eerste.campusId)
  const verschil = eerste.op100 - tweede.op100
  const teller = `${ingevuld} van ${meewegend} meewegende onderwerpen ingevuld.`
  if (verschil < RUIS) {
    return `De adressen liggen dicht bij elkaar. Dat is binnen de ruis: dit blad kiest hier niet voor jullie. ${teller}`
  }
  const voorop = `${campus ? naamVan(campus) : 'Eén adres'} staat voorop met ${Math.round(verschil)} punten voorsprong.`
  const duiding =
    verschil < SMAL
      ? 'Een smalle voorsprong die kan omslaan als je één gewicht verschuift.'
      : 'Een duidelijke voorsprong in jullie eigen antwoorden.'
  return `${voorop} ${duiding} ${teller}`
}
