import { useEffect } from 'react'
import type { DatasetMeta } from '../types'

interface OverPanelProps {
  open: boolean
  /** Voor de ophaaldatum en de aantallen. Null = meta.json ontbreekt; dan valt dat blok weg. */
  meta: DatasetMeta | null
  onClose: () => void
}

/**
 * "Over deze site" — herkomst van de informatie, wat de site ermee doet, en de disclaimer.
 *
 * **Waarom een paneel en geen aparte pagina.** De app is bewust één pagina zonder router
 * (zie CLAUDE.md); een tweede HTML-bestand zou een bouwstap en een navigatiepatroon
 * introduceren voor één stuk tekst. Het paneel volgt hetzelfde patroon als DetailPanel en
 * VergelijkPanel: overlay, sluiten met Escape of met een klik ernaast.
 *
 * **Wel deelbaar.** De open stand staat als `?over=1` in de URL, in tegenstelling tot de
 * vergelijkselectie. Reden voor het verschil: een shortlist is een tussenstap in iemands
 * zoektocht, terwijl "waar komt deze informatie vandaan" precies het soort ding is dat je
 * doorstuurt aan wie de site wantrouwt.
 *
 * **De verplichte vermeldingen blijven in de footer staan** en zijn hier niet naartoe
 * verhuisd: de contactregel is een Transitous-voorwaarde en de broncodelink een AGPL-vereiste,
 * en allebei horen ze zichtbaar te zijn zonder dat iemand eerst iets moet openklikken.
 */
export function OverPanel({ open, meta, onClose }: OverPanelProps) {
  useEffect(() => {
    if (!open) return
    function opToets(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opToets)
    return () => document.removeEventListener('keydown', opToets)
  }, [open, onClose])

  if (!open) return null

  const datum = meta
    ? new Date(meta.opgehaaldOp).toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

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
        aria-labelledby="over-titel"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="over-titel" className="text-lg font-semibold text-inkt">
            Over deze site
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

        <div className="mt-4 space-y-6 text-sm text-inkt">
          <section>
            <h3 className="font-semibold">Wat is dit?</h3>
            <p className="mt-1 text-zacht">
              Een website waar je middelbare scholen (voltijds gewoon secundair onderwijs) in
              de provincie Antwerpen kan opzoeken. Je vult je adres in en ziet welke scholen in
              de buurt liggen, wat ze aanbieden en hoe je er geraakt. Meer niet: geen ranglijst,
              geen scores, geen advies over welke school de beste is. Die keuze is aan jou en aan
              je kind.
            </p>
            <p className="mt-2 text-zacht">
              De site is gratis, staat er zonder advertenties en wordt in de vrije tijd gemaakt.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Waar komt de informatie vandaan?</h3>
            <p className="mt-1 text-zacht">
              De scholen, adressen en het studieaanbod komen uit de officiële API's van{' '}
              <a
                href="https://onderwijs-api-portaal.vlaanderen.be/documentatie/instellingsgegevens"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Onderwijs en Vorming
              </a>{' '}
              (Vlaamse overheid).
              {datum && meta && (
                <>
                  {' '}
                  Die data is hier opgehaald op {datum} en gaat over{' '}
                  {meta.aantalVestigingenAntwerpen} vestigingen op{' '}
                  {meta.aantalCampussenAntwerpen} adressen
                  {meta.schooljaarAanbod !== null &&
                    `, met het studieaanbod van schooljaar ${meta.schooljaarAanbod}-${meta.schooljaarAanbod + 1}`}
                  .
                </>
              )}{' '}
              Ze wordt niet live opgehaald, dus wat je ziet is een momentopname.
            </p>
            <p className="mt-2 text-zacht">
              De reistijd met bus of trein komt van{' '}
              <a
                href="https://transitous.org/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Transitous
              </a>
              , de fietsafstand van{' '}
              <a
                href="https://openrouteservice.org/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                openrouteservice
              </a>{' '}
              (HeiGIT), en de kaart en het zoeken op adres van OpenStreetMap en de
              geolocatiedienst van de Vlaamse overheid.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Wat deze site met die gegevens doet</h3>
            <p className="mt-1 text-zacht">
              De ruwe data is niet zomaar bruikbaar, dus ze wordt hier bewerkt. Drie dingen die
              het verschil maken met wat er in de bron staat:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zacht">
              <li>
                <strong className="font-medium text-inkt">Scholen worden per adres samengevoegd.</strong>{' '}
                Op heel wat campussen staan meerdere apart geregistreerde scholen. Die tonen als
                losse resultaten is verwarrend, dus je krijgt één kaartje per adres, met de
                scholen erin. Het studieaanbod wordt dan ook per adres samengeteld.
              </li>
              <li>
                <strong className="font-medium text-inkt">Richtingen staan één keer per graad.</strong>{' '}
                De bron vermeldt elk leerjaar apart; dat is hier samengevat tot één regel per
                richting per graad.
              </li>
              <li>
                <strong className="font-medium text-inkt">De afstand is in vogelvlucht.</strong>{' '}
                Dat is de rechte lijn tussen twee punten, geen reisafstand. Voor de echte weg
                staan de fiets- en OV-tijden in het detailpaneel.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold">Waarvoor je deze site niet moet gebruiken</h3>
            <p className="mt-1 text-zacht">
              Dit is geen officiële bron. De informatie wordt met zorg samengesteld, maar ze is
              bewerkt, samengevoegd en mogelijk verouderd, en er kunnen fouten in staan.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zacht">
              <li>
                Voor een inschrijving, een aanmelding of een beslissing telt altijd wat de school
                zelf en de officiële fiche van Onderwijs en Vorming zeggen. De link naar die
                fiche staat bij elke school in het detailpaneel.
              </li>
              <li>
                Aan de gegevens op deze site kunnen geen rechten ontleend worden, en er wordt geen
                aansprakelijkheid aanvaard voor schade door het gebruik ervan.
              </li>
              <li>
                Gebruik deze site niet als brondata voor onderzoek, publicaties of andere
                toepassingen. Haal de cijfers dan rechtstreeks bij Onderwijs en Vorming; de
                originele data is van hen en valt niet onder de licentie van deze site.
              </li>
            </ul>
            <p className="mt-2 text-zacht">
              Een fout gezien? Laat het weten, dat is de snelste manier om het recht te zetten.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Privacy</h3>
            <p className="mt-1 text-zacht">
              Er is geen account, geen login en geen database: alles gebeurt in je browser. Je
              adres wordt niet bewaard. Wel wordt het naar de geolocatiedienst van de Vlaamse
              overheid gestuurd om er coördinaten van te maken, en gaan die coördinaten naar
              Transitous en openrouteservice om een route te berekenen, anders is er geen
              reistijd te tonen.
            </p>
            <p className="mt-2 text-zacht">
              Bezoekersaantallen worden geteld met{' '}
              <a
                href="https://www.simpleanalytics.com/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Simple Analytics
              </a>
              : zonder cookies, zonder profielen, en wie "Do Not Track" aan heeft staan wordt niet
              geteld. Je zoekopdracht en je thema-keuze blijven in je eigen browser.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Contact en broncode</h3>
            <p className="mt-1 text-zacht">
              Vragen, fouten of suggesties:{' '}
              <a href="mailto:info@bckn.be" className="underline">
                info@bckn.be
              </a>
              . De volledige broncode staat onder AGPL-3.0 op{' '}
              <a
                href="https://github.com/stefanbckn/Zoek-je-school"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                GitHub
              </a>
              , samen met{' '}
              <a
                href="https://github.com/stefanbckn/Zoek-je-school/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                de lijst van wat er per versie veranderde
              </a>
              . Je draait versie {__APP_VERSION__}.
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
