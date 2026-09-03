import { useEffect } from 'react'
import { MAX_VERGELIJK, MIN_VERGELIJK } from '../lib/vergelijking'

interface HelpPanelProps {
  open: boolean
  onClose: () => void
  /** Opent "Over deze site" vanuit de laatste alinea, zodat de herkomst hier niet herhaald hoeft. */
  onOverOpen: () => void
}

/**
 * "Hoe werkt deze site?" — de uitleg bij het gebruik.
 *
 * **Verhouding tot `OverPanel`.** Dat paneel beantwoordt "kan ik dit vertrouwen" (herkomst,
 * bewerking, disclaimer, privacy); dit paneel beantwoordt "hoe krijg ik hieruit wat ik zoek".
 * De bronnen worden hier bewust niet herhaald: onderaan staat één link naar het andere paneel.
 *
 * **Het gaat nooit vanzelf open**, ook niet bij een eerste bezoek. De site bewaart niets over
 * wie er langskomt, dus een eerste bezoek is niet van een tiende te onderscheiden. Onthouden
 * dat iemand de uitleg gezien heeft, zou precies het bijhouden van bezoekgedrag zijn dat deze
 * site niet doet. De knop staat daarom zichtbaar in de kop en de bezoeker beslist zelf.
 *
 * Het laatste blok ("Wat je hier niet vindt") is geen bijzaak: een helppaneel wordt zelden
 * uit nieuwsgierigheid geopend, meestal omdat iemand iets zoekt dat er niet is.
 */
export function HelpPanel({ open, onClose, onOverOpen }: HelpPanelProps) {
  useEffect(() => {
    if (!open) return
    function opToets(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opToets)
    return () => document.removeEventListener('keydown', opToets)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mt-4 w-full max-w-2xl rounded-lg bg-kaart p-6 shadow-xl sm:mt-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-titel"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="help-titel" className="text-lg font-semibold text-inkt">
            Hoe werkt deze site?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-zacht hover:text-inkt"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-zacht">
          Zoek middelbare scholen in Vlaanderen en Brussel, vergelijk ze op afstand en
          studieaanbod, en beslis daarna zelf verder.
        </p>

        <div className="mt-4 space-y-6 text-sm text-inkt">
          <section>
            <h3 className="font-semibold">Begin bij je adres</h3>
            <p className="mt-1 text-zacht">
              Typ je gemeente of adres in de balk bovenaan. Zodra je een adres kiest, krijgt elk
              resultaat er de afstand bij en gaat de lijst van dichtbij naar ver. Met de straal
              ernaast beperk je de zoekopdracht tot wat je haalbaar vindt.
            </p>
            <p className="mt-2 text-zacht">
              Alle afstanden zijn in vogelvlucht: de rechte lijn tussen je adres en de
              schoolpoort, niet de weg die je fietst. Voor de echte reistijd open je een school
              en kijk je bij "Hoe geraak je er?".
            </p>
            <p className="mt-2 text-zacht">
              Vind je je deelgemeente niet? Zoek dan op je straat, die staat er altijd in.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Maak de lijst kleiner</h3>
            <p className="mt-1 text-zacht">
              Links staan de filters, in volgorde van wat het meest oplevert:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zacht">
              <li>
                <strong className="font-medium text-inkt">Studierichting.</strong> Het snelste
                pad naar een korte lijst. Typ waar je zoon of dochter naartoe wil (Latijn,
                verzorging, STEM) en je houdt de adressen over waar minstens één richting
                daarop matcht.
              </li>
              <li>
                <strong className="font-medium text-inkt">Finaliteit.</strong> Doorstroom,
                dubbel of arbeidsmarkt. Dit is de opvolger van ASO, TSO en BSO, en zegt waar een
                richting je op voorbereidt: verder studeren, allebei, of meteen aan het werk.
              </li>
              <li>
                <strong className="font-medium text-inkt">Studiedomein.</strong> Waarover een
                richting gaat: STEM, sport, taal en cultuur, en zo verder. Acht domeinen, ook
                pas vanaf de tweede graad.
              </li>
              <li>
                <strong className="font-medium text-inkt">Net.</strong> Wie de school inricht:
                GO!, provinciaal, gemeentelijk of vrij gesubsidieerd.
              </li>
              <li>
                <strong className="font-medium text-inkt">Provincie en gemeente.</strong> De
                site toont heel Vlaanderen en Brussel, dus dit is de snelste weg naar je eigen
                streek als je geen adres wil invullen. De gemeentelijst toont enkel gemeenten
                die na je andere filters nog resultaten hebben, met het aantal adressen erachter,
                en heeft een zoekveldje omdat het er 245 zijn.
              </li>
              <li>
                <strong className="font-medium text-inkt">Schoolnaam</strong>, als je al weet
                welke school je zoekt.
              </li>
              <li>
                <strong className="font-medium text-inkt">Zonder studieaanbod.</strong> Staat
                standaard uit. Vink aan als je ook de adressen en de scholen wil zien waarvoor
                geen aanbod bekend is.
              </li>
            </ul>
            <p className="mt-2 text-zacht">
              Wat je aangevinkt hebt, staat als knopjes onder de zoekbalk. Daar zet je een filter
              weer af, of alles in één keer met "wis filters".
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Weet je nog niet wat je zoekt?</h3>
            <p className="mt-1 text-zacht">
              Klik bovenaan op "Alle richtingen". Daar staat de matrix: de indeling van het
              secundair onderwijs in acht studiedomeinen tegen drie finaliteiten, per graad.
              Achter elke richting staat op hoeveel adressen ze te vinden is, geteld binnen de
              gemeente of de straal die je al gekozen hebt. Staat er nul, dan bestaat de
              richting wel maar niet daar. Klik op een richting en je krijgt meteen de adressen
              die ze aanbieden.
            </p>
            <p className="mt-2 text-zacht">
              Wat er niet in staat: welke richting van de derde graad op welke van de tweede
              volgt. Die doorstroom staat in geen enkele bron die wij kunnen ophalen, en we
              gaan ze niet zelf verzinnen.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Bekijk één adres</h3>
            <p className="mt-1 text-zacht">
              Elk kaartje is een adres, geen school. Op veel campussen staan meerdere scholen met
              een eigen naam en een eigen schoolnummer, en die zie je dan als aparte regels in
              hetzelfde kaartje. Het studieaanbod dat we tonen, geldt voor het hele adres.
            </p>
            <p className="mt-2 text-zacht">
              Klik door voor contactgegevens, het volledige aanbod, en onder "Hoe geraak je er?"
              de fietstijd en de reistijd met bus of trein, berekend voor aankomst om 8u30 op de
              eerstvolgende weekdag. De links ernaast brengen je naar de echte routeplanner, waar
              je zelf een ander uur kan kiezen.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">
              Zet {MIN_VERGELIJK} tot {MAX_VERGELIJK} adressen naast elkaar
            </h3>
            <p className="mt-1 text-zacht">
              Klik op "Vergelijk dit adres" bij de kaartjes die je overweegt. Onderaan verschijnt
              een balk met je selectie, en vanaf {MIN_VERGELIJK} adressen open je de
              vergelijkingstabel: afstand, net en aanbod in kolommen naast elkaar. Die tabel is
              gemaakt om af te drukken op A4, zodat je ze mee kan nemen naar een infomoment of
              aan tafel kan leggen.
            </p>
            <p className="mt-2 text-zacht">
              Je selectie zit niet in de link die je deelt. Wil je iemand hetzelfde laten zien,
              stuur dan de link met je filters erin en klik samen opnieuw.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Wat je hier niet vindt</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zacht">
              <li>
                <strong className="font-medium text-inkt">Infodagen en opendeurdagen.</strong>{' '}
                Die staan in geen enkele officiële databron die we mogen gebruiken. Kijk op de
                website van de school zelf.
              </li>
              <li>
                <strong className="font-medium text-inkt">Aanmelden en inschrijven.</strong> Dat
                loopt via de school of het aanmeldsysteem van je gemeente. Vanuit elke school
                link je door naar de officiële fiche van Onderwijs en Vorming.
              </li>
              <li>
                <strong className="font-medium text-inkt">Een oordeel over kwaliteit.</strong>{' '}
                Geen sterren, geen ranglijst, geen leerlingenaantallen. Deze site zegt welke
                scholen er zijn en wat ze aanbieden, de rest beslis je zelf.
              </li>
            </ul>
          </section>

          <section>
            <p className="text-zacht">
              Waar de gegevens vandaan komen en hoe recent ze zijn, staat bij{' '}
              <button type="button" onClick={onOverOpen} className="underline">
                Over deze site
              </button>
              .
            </p>
          </section>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-inkt hover:opacity-90"
        >
          Sluiten
        </button>
      </div>
    </div>
  )
}
