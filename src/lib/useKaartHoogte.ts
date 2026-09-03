import { useEffect, useState } from 'react'

/**
 * Ruimte die onder de kaart vrij blijft, zodat de rand van de kaart niet tegen de onderkant
 * van het venster plakt en zichtbaar is dat de pagina daar verdergaat.
 */
const MARGE = 16

/**
 * Onder deze hoogte wordt een kaart onbruikbaar. Op een laag venster (of een liggende telefoon)
 * mag de kaart dus buiten beeld lopen — dat is beter dan een strook van honderd pixels.
 */
const MINIMUM = 400

/**
 * Geeft de kaart de hoogte van wat er nog van het venster over is, in plaats van de hoogte van
 * de filterkolom ernaast. Die kolom groeit met elke filter erbij, en als flex-item nam de kaart
 * die hoogte over: op een venster van 1440 × 800 was de kaart 1305px hoog en liep hij 765px
 * onder de vouw door.
 *
 * Het aftrekgetal wordt gemeten en niet ingeschat: wat er boven de kaart staat (de kop, de
 * zoekbalk, de rij met actieve filters) wrapt op smallere schermen, dus elke vaste constante in
 * een `calc()` klopt maar bij één vensterbreedte. De kaart staat onderaan zijn kolom, dus zijn
 * eigen hoogte verandert niets aan waar hij begint: terugmeten levert geen lus op.
 */
export function useKaartHoogte(actief: boolean) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [hoogte, setHoogte] = useState<number | null>(null)

  useEffect(() => {
    if (!actief || !element) {
      setHoogte(null)
      return
    }

    const meet = () => {
      const top = element.getBoundingClientRect().top + window.scrollY
      setHoogte(Math.max(MINIMUM, Math.round(window.innerHeight - top - MARGE)))
    }

    meet()
    window.addEventListener('resize', meet)
    // Meet ook opnieuw wanneer er boven de kaart iets bij komt of wegvalt zonder dat het venster
    // verandert: een filter erbij, de melding over verborgen adressen, een rij die gaat wrappen.
    const waarnemer = new ResizeObserver(meet)
    waarnemer.observe(document.body)

    return () => {
      window.removeEventListener('resize', meet)
      waarnemer.disconnect()
    }
  }, [actief, element])

  return { ref: setElement, hoogte }
}
