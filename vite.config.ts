import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { haalFietsroute, parsePunt } from './shared/ors.js'

// package.json is de enige plek waar de versie staat; de footer toont ze via __APP_VERSION__.
// createRequire in plaats van een gewone import, zodat we geen resolveJsonModule nodig hebben.
const __dirname = dirname(fileURLToPath(import.meta.url))

const { version } = createRequire(import.meta.url)('./package.json') as { version: string }

/**
 * Bootst de Netlify Function /api/fietsroute na tijdens `npm run dev`, zodat de fietsafstand
 * lokaal werkt zonder `netlify dev`. Gebruikt dezelfde gedeelde logica als de echte functie,
 * dus validatie en aanroep kunnen niet uit elkaar lopen.
 * De key wordt hier server-side gelezen (ORS_API_KEY, géén VITE_-prefix) en bereikt de browser dus niet.
 */
function fietsrouteDevProxy(apiKey: string | undefined): Plugin {
  return {
    name: 'fietsroute-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/fietsroute', async (req, res) => {
        const stuur = (body: unknown, status: number) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        const params = new URL(req.url ?? '', 'http://localhost').searchParams
        const van = parsePunt(params.get('van'))
        const naar = parsePunt(params.get('naar'))
        if (!van || !naar) return stuur({ fout: 'Ongeldige coördinaten.' }, 400)
        if (!apiKey) return stuur({ fout: 'Route-service niet geconfigureerd.' }, 503)
        try {
          stuur(await haalFietsroute(van, naar, apiKey), 200)
        } catch (err) {
          console.error('[dev] fietsroute mislukt:', err)
          stuur({ fout: 'Route momenteel niet beschikbaar.' }, 502)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Laadt .env-bestanden zonder prefix-filter, zodat we ORS_API_KEY server-side kunnen lezen.
  // Belangrijk: deze waarde wordt NIET in de client-bundle geïnjecteerd — ze wordt enkel in de
  // dev-middleware hierboven gebruikt, die in Node draait.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), fietsrouteDevProxy(env.ORS_API_KEY)],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    base: './',
    build: {
      rollupOptions: {
        // Twee entry points. `uitleg/index.html` is een echte tweede pagina en geen route in
        // de app: de zoeker heeft geen path-based routing (zie netlify.toml), en de uitleg
        // moet leesbaar en indexeerbaar zijn zonder dat er JavaScript aan te pas komt.
        // De map in het pad blijft behouden in dist/, dus de pagina komt op /uitleg/ te staan
        // zonder dat er een redirect of hostinstelling voor nodig is.
        input: {
          main: resolve(__dirname, 'index.html'),
          uitleg: resolve(__dirname, 'uitleg/index.html'),
        },
      },
    },
    server: {
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
    },
  }
})
