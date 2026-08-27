import type { DatasetMeta } from '../types'

export function Footer({ meta }: { meta: DatasetMeta | null }) {
  if (!meta) return null
  const datum = new Date(meta.opgehaaldOp).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <footer className="border-t border-rand px-4 py-3 text-xs text-zacht">
      Data opgehaald op {datum} · Bron:{' '}
      <a href={meta.bron[0]} target="_blank" rel="noreferrer" className="underline">
        Onderwijs en Vorming
      </a>{' '}
      · {meta.aantalVestigingenAntwerpen} vestigingen op {meta.aantalCampussenAntwerpen} adressen
      in provincie Antwerpen
    </footer>
  )
}
