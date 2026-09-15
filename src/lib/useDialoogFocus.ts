import { useEffect, useRef } from 'react'

const FOCUSBAAR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/**
 * Focus voor een modaal venster, gedeeld door alle panelen.
 *
 * `role="dialog"` en `aria-modal` zeggen een schermlezer wát er open is, maar verplaatsen de
 * focus niet. Zonder deze hook bleef die na een klik op de knop of kaart achter het venster
 * staan: Tab liep door de pagina erachter, en na het sluiten wist niemand waar hij zat.
 *
 * Drie dingen:
 * - **Bij openen** gaat de focus naar het venster zelf. Niet naar de sluitknop: dan leest een
 *   schermlezer eerst "Sluiten" in plaats van de titel. Het venster heeft daarvoor
 *   `tabIndex={-1}` nodig, en `focus:outline-none`, anders tekent de globale focusring een
 *   gele rand rond het hele venster.
 * - **Tab blijft binnen het venster** en springt van de laatste knop terug naar de eerste.
 *   Onzichtbare elementen tellen niet mee: het vergelijkvenster tekent zijn rijen twee keer,
 *   als tabel en als stapel, en toont er maar één.
 * - **Bij sluiten** keert de focus terug naar wat het venster opende, als dat er nog is.
 */
export function useDialoogFocus<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const venster = ref.current
    if (!open || !venster) return

    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    venster.focus()

    function opToets(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !venster) return
      const focusbaar = [...venster.querySelectorAll<HTMLElement>(FOCUSBAAR)].filter(
        (el) => el.getClientRects().length > 0,
      )
      if (focusbaar.length === 0) {
        e.preventDefault()
        return
      }
      const eerste = focusbaar[0]
      const laatste = focusbaar[focusbaar.length - 1]
      const actief = document.activeElement
      if (e.shiftKey && (actief === eerste || actief === venster)) {
        e.preventDefault()
        laatste.focus()
      } else if (!e.shiftKey && actief === laatste) {
        e.preventDefault()
        eerste.focus()
      }
    }

    venster.addEventListener('keydown', opToets)
    return () => {
      venster.removeEventListener('keydown', opToets)
      if (vorige?.isConnected) vorige.focus()
    }
  }, [open])

  return ref
}
