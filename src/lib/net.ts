import type { Net } from '../types'

/**
 * Alle mogelijke netten. Dient óók als validatielijst voor de URL-state, dus deze lijst is
 * bewust volledig — niet afgeleid uit de dataset. Welke netten de filter tóónt, hangt wél van
 * de data af (zie `netOpties` in App.tsx): een categorie zonder scholen als vinkje aanbieden
 * levert enkel een filter op die gegarandeerd 0 resultaten geeft.
 */
export const NET_OPTIONS: Net[] = [
  'GO!',
  'Provinciaal',
  'Gemeentelijk',
  'Officieel gesubsidieerd',
  'Vrij gesubsidieerd',
  'Onafhankelijk',
]

export const NET_STYLES: Record<Net, string> = {
  'GO!': 'bg-emerald-100 text-emerald-800',
  Provinciaal: 'bg-amber-100 text-amber-800',
  Gemeentelijk: 'bg-violet-100 text-violet-800',
  'Officieel gesubsidieerd': 'bg-yellow-100 text-yellow-800',
  'Vrij gesubsidieerd': 'bg-sky-100 text-sky-800',
  Onafhankelijk: 'bg-slate-200 text-slate-700',
}

/** Korte uitleg bij de netten die verwarring geven. Niet elk net heeft er een nodig. */
export const NET_UITLEG: Partial<Record<Net, string>> = {
  'GO!': 'onderwijs van de Vlaamse Gemeenschap',
  Provinciaal: 'ingericht door de provincie',
  Gemeentelijk: 'ingericht door stad of gemeente',
  'Officieel gesubsidieerd': 'ander openbaar bestuur (OCMW, intercommunale)',
  'Vrij gesubsidieerd': 'meestal katholiek, of methodeschool',
}
