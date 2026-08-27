import { useCallback, useEffect, useState } from 'react'

export type Thema = 'systeem' | 'licht' | 'donker'

const SLEUTEL = 'zjs-thema'

export function isThema(waarde: unknown): waarde is Thema {
  return waarde === 'systeem' || waarde === 'licht' || waarde === 'donker'
}

/**
 * Zet (of wist) het attribuut waarop de CSS-variabelen in index.css reageren.
 * Bij 'systeem' wordt het attribuut verwijderd, zodat `prefers-color-scheme` het weer overneemt.
 */
export function pasThemaToe(thema: Thema) {
  const root = document.documentElement
  if (thema === 'systeem') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', thema === 'donker' ? 'dark' : 'light')
}

export function leesOpgeslagenThema(): Thema {
  try {
    const opgeslagen = localStorage.getItem(SLEUTEL)
    return isThema(opgeslagen) ? opgeslagen : 'systeem'
  } catch {
    // Privémodus of geblokkeerde opslag: dan volgen we gewoon het systeem.
    return 'systeem'
  }
}

export function useThema() {
  const [thema, setThemaState] = useState<Thema>(() => leesOpgeslagenThema())

  const setThema = useCallback((nieuw: Thema) => {
    setThemaState(nieuw)
    pasThemaToe(nieuw)
    try {
      localStorage.setItem(SLEUTEL, nieuw)
    } catch {
      // Niet kunnen bewaren is geen reden om de keuze niet toe te passen.
    }
  }, [])

  // Houd het attribuut in sync als er buiten deze hook om iets wijzigt (bv. een tweede tabblad).
  useEffect(() => {
    pasThemaToe(thema)
  }, [thema])

  return { thema, setThema }
}
