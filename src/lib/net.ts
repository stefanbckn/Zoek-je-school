import type { Net } from '../types'

export const NET_OPTIONS: Net[] = [
  'GO!',
  'Officieel gesubsidieerd',
  'Vrij gesubsidieerd',
  'Onafhankelijk',
]

export const NET_STYLES: Record<Net, string> = {
  'GO!': 'bg-emerald-100 text-emerald-800',
  'Officieel gesubsidieerd': 'bg-amber-100 text-amber-800',
  'Vrij gesubsidieerd': 'bg-sky-100 text-sky-800',
  Onafhankelijk: 'bg-slate-200 text-slate-700',
}
