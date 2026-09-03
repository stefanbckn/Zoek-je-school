import { useEffect, useState } from 'react'
import type { Campus, DatasetMeta, Studierichting } from '../types'

interface VestigingenState {
  campussen: Campus[]
  /**
   * De catalogus achter `Richting.studierichtingCode`. Meegeladen in plaats van pas bij het
   * openen van de matrix: 152 kB naast de 14 MB van de vestigingen valt in het niet, en de
   * chips van de actieve filters hebben de namen ook nodig zonder dat de matrix open staat.
   */
  studierichtingen: Studierichting[]
  meta: DatasetMeta | null
  loading: boolean
  error: string | null
}

export function useVestigingen(): VestigingenState {
  const [state, setState] = useState<VestigingenState>({
    campussen: [],
    studierichtingen: [],
    meta: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [campussenRes, richtingenRes, metaRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/vestigingen.json`),
          fetch(`${import.meta.env.BASE_URL}data/richtingen.json`),
          fetch(`${import.meta.env.BASE_URL}data/meta.json`),
        ])
        if (!campussenRes.ok || !richtingenRes.ok || !metaRes.ok) {
          throw new Error('Kon de scholendata niet laden.')
        }
        const campussen: Campus[] = await campussenRes.json()
        const studierichtingen: Studierichting[] = await richtingenRes.json()
        const meta: DatasetMeta = await metaRes.json()
        if (!cancelled) {
          setState({ campussen, studierichtingen, meta, loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            campussen: [],
            studierichtingen: [],
            meta: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Onbekende fout bij laden.',
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
