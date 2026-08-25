import { useEffect, useState } from 'react'
import type { Campus, DatasetMeta } from '../types'

interface VestigingenState {
  campussen: Campus[]
  meta: DatasetMeta | null
  loading: boolean
  error: string | null
}

export function useVestigingen(): VestigingenState {
  const [state, setState] = useState<VestigingenState>({
    campussen: [],
    meta: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [campussenRes, metaRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/vestigingen.json`),
          fetch(`${import.meta.env.BASE_URL}data/meta.json`),
        ])
        if (!campussenRes.ok || !metaRes.ok) {
          throw new Error('Kon de scholendata niet laden.')
        }
        const campussen: Campus[] = await campussenRes.json()
        const meta: DatasetMeta = await metaRes.json()
        if (!cancelled) {
          setState({ campussen, meta, loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            campussen: [],
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
