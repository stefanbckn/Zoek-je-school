import { useEffect, useState } from 'react'
import type { DatasetMeta, Vestiging } from '../types'

interface VestigingenState {
  vestigingen: Vestiging[]
  meta: DatasetMeta | null
  loading: boolean
  error: string | null
}

export function useVestigingen(): VestigingenState {
  const [state, setState] = useState<VestigingenState>({
    vestigingen: [],
    meta: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [vestigingenRes, metaRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/vestigingen.json`),
          fetch(`${import.meta.env.BASE_URL}data/meta.json`),
        ])
        if (!vestigingenRes.ok || !metaRes.ok) {
          throw new Error('Kon de scholendata niet laden.')
        }
        const vestigingen: Vestiging[] = await vestigingenRes.json()
        const meta: DatasetMeta = await metaRes.json()
        if (!cancelled) {
          setState({ vestigingen, meta, loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            vestigingen: [],
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
