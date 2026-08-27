import type { DatasetMeta } from '../types'

export function Footer({ meta }: { meta: DatasetMeta | null }) {
  const datum = meta
    ? new Date(meta.opgehaaldOp).toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <footer className="border-t border-rand px-4 py-3 text-xs text-zacht">
      {meta && (
        <p>
          Data opgehaald op {datum} · Bron:{' '}
          <a href={meta.bron[0]} target="_blank" rel="noreferrer" className="underline">
            Onderwijs en Vorming
          </a>{' '}
          · {meta.aantalVestigingenAntwerpen} vestigingen op {meta.aantalCampussenAntwerpen} adressen
          in provincie Antwerpen
        </p>
      )}
      {/* Verplichte attributie voor de fietsroute. De voorwaarden van HeiGIT eisen deze
          vermelding letterlijk, en hun routeresultaten staan onder CC-BY-SA 4.0. Staat
          buiten de meta-check: ontbreekt meta.json, dan verdwijnt de bronvermelding wel maar
          deze niet. Zie CLAUDE.md. */}
      <p className={meta ? 'mt-1' : undefined}>
        Fietsroutes ©{' '}
        <a href="https://openrouteservice.org/" target="_blank" rel="noreferrer" className="underline">
          openrouteservice
        </a>{' '}
        by HeiGIT · Kaart en routes op basis van data van{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>
      </p>
      {/* Contactgegevens staan hier niet voor de sier. Transitous vraagt bij browsergebruik
          contactinfo op de site zelf, omdat een browser geen eigen User-Agent kan meesturen en
          de Referer dus de enige manier is waarop zij ons herkennen. De broncodelink is de
          "way to get the source" die artikel 13 van de AGPL van een webapp vraagt. Beide dus
          niet weghalen. Zie CLAUDE.md. */}
      <p className="mt-1">
        Vragen of een fout gezien?{' '}
        <a href="mailto:info@bckn.be" className="underline">
          info@bckn.be
        </a>{' '}
        ·{' '}
        <a
          href="https://github.com/stefanbckn/Zoek-je-school"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Broncode
        </a>{' '}
        onder AGPL-3.0 · © 2026 Stefan Bocken
      </p>
    </footer>
  )
}
