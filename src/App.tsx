import { useState } from 'react'
import { Footer } from './components/Footer'
import { ResultList } from './components/ResultList'
import { useVestigingen } from './lib/useVestigingen'
import type { Vestiging } from './types'

function App() {
  const { vestigingen, meta, loading, error } = useVestigingen()
  const [, setGeselecteerd] = useState<Vestiging | null>(null)

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-slate-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-slate-900">Zoek je school</h1>
        <p className="text-sm text-slate-500">
          Middelbare scholen in provincie Antwerpen
        </p>
      </header>

      <main className="flex-1">
        {loading && <p className="p-4 text-sm text-slate-500">Bezig met laden…</p>}
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <ResultList vestigingen={vestigingen} onSelect={setGeselecteerd} />
        )}
      </main>

      <Footer meta={meta} />
    </div>
  )
}

export default App
