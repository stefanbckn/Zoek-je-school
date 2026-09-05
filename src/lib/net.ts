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

/**
 * Net = een gevúlde chip. Finaliteit (zie aanbod.ts) = een omlijnde chip met vormteken.
 * Die twee visuele families dragen het onderscheid, niet de kleur — anders zouden er zeven
 * betekenisdragende kleuren op één kaartje staan, wat voor kleurenblinde bezoekers onleesbaar is.
 */
export const NET_STYLES: Record<Net, string> = {
  'GO!': 'bg-net-go-bg text-net-go-inkt',
  Provinciaal: 'bg-net-prov-bg text-net-prov-inkt',
  Gemeentelijk: 'bg-net-gem-bg text-net-gem-inkt',
  'Officieel gesubsidieerd': 'bg-net-off-bg text-net-off-inkt',
  'Vrij gesubsidieerd': 'bg-net-vrij-bg text-net-vrij-inkt',
  Onafhankelijk: 'bg-net-onaf-bg text-net-onaf-inkt',
}

/** Gedeelde vormgeving van een net-chip. Rondingen bewust tussen strak en pilvormig in. */
export const NET_CHIP = 'chip shrink-0 rounded-md px-2 py-0.5 text-xs font-medium'

/** Korte uitleg bij de netten die verwarring geven. Niet elk net heeft er een nodig. */
export const NET_UITLEG: Partial<Record<Net, string>> = {
  'GO!': 'onderwijs van de Vlaamse Gemeenschap',
  Provinciaal: 'ingericht door de provincie',
  Gemeentelijk: 'ingericht door stad of gemeente',
  'Officieel gesubsidieerd': 'ander openbaar bestuur (OCMW, intercommunale)',
  'Vrij gesubsidieerd': 'meestal katholiek, of methodeschool',
}
