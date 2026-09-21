import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { haalFietsroute, parsePunt } from './shared/ors.js'
import { paginakop, type KopIngang } from './scripts/paginakop.ts'
import { STEDEN, UITVOERMAP } from './scripts/steden.ts'

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

/**
 * Zet de scripts die op elke pagina horen in alle HTML-entry points: de zoeker en de
 * uitlegpagina's. Zo staan ze op één plaats, en wordt een pagina die er later bijkomt vanzelf
 * geteld en krijgt ze vanzelf het juiste thema.
 *
 * `order: 'pre'`, zodat Vite de tags daarna nog verwerkt zoals een tag die in de HTML zelf
 * staat: `/thema.js` wordt dan per pagina een relatief pad (`./`, `../`, `../../`), wat `base:
 * './'` vraagt.
 */
function gedeeldeScripts(): Plugin {
  return {
    name: 'gedeelde-scripts',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        // Synchroon in de head, vóór de pagina getekend wordt: voorkomt dat het verkeerde thema
        // kort opflitst. Een apart bestand en geen inline script, omdat de CSP geen inline
        // scripts toestaat (zie netlify.toml). Dus geen async of defer toevoegen.
        { tag: 'script', attrs: { src: '/thema.js' }, injectTo: 'head' },
        // Simple Analytics, de enige meting op de site. Bewust ZONDER data-collect-dnt="true":
        // met dat attribuut worden bezoekers die Do Not Track aan hebben staan alsnog geteld.
        // Standaard slaat Simple Analytics die over, en dat respecteert het signaal dat mensen
        // bewust aanzetten. Vereist de CSP-regels naar *.simpleanalyticscdn.com in netlify.toml;
        // zonder die regels wordt het script stil geblokkeerd.
        {
          tag: 'script',
          attrs: { async: true, src: 'https://scripts.simpleanalyticscdn.com/latest.js' },
          injectTo: 'body',
        },
      ],
    },
  }
}

/**
 * Zet de kopbalk in de statische pagina's, op de plaats van `<!--kop-->`.
 *
 * Eén bron voor alle vier: de twee uitlegpagina's en de stadspagina's. Zonder dit zou de balk
 * vier keer met de hand gekopieerd staan, en dan lopen ze uit elkaar — dat is met de footer al
 * bijna gebeurd (zie het commentaar in uitleg/index.html).
 *
 * `index.html` draagt de markering niet: daar tekent React de echte balk, met knoppen die de
 * panelen ter plaatse openen in plaats van links naar `?matrix=1` en co.
 *
 * Een string-transform en geen tag-injectie: de balk is een stuk opmaak met een SVG erin, en
 * dat in de tagbeschrijvingen van Vite gieten levert onleesbare code op.
 */
function gedeeldeKop(): Plugin {
  const MARKERING = '<!--kop-->'
  return {
    name: 'gedeelde-kop',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => {
        if (!html.includes(MARKERING)) return html
        // De uitlegpagina markeert haar eigen ingang in de balk.
        const huidige: KopIngang = ctx.path.startsWith('/uitleg/') ? 'uitleg' : null
        return {
          html: html.replace(MARKERING, paginakop(huidige)),
          // Enkel op de pagina's mét de balk: dit script zet de themaknop in de juiste stand
          // en bewaart een klik. Mag defer zijn — thema.js in de head heeft het thema dan al
          // toegepast, dus er flitst niets op; dit gaat alleen over de knop zelf.
          tags: [{ tag: 'script', attrs: { defer: true, src: '/thema-knop.js' }, injectTo: 'body' as const }],
        }
      },
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
    plugins: [
      react(),
      tailwindcss(),
      fietsrouteDevProxy(env.ORS_API_KEY),
      gedeeldeScripts(),
      gedeeldeKop(),
    ],
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
          inschrijven: resolve(__dirname, 'uitleg/inschrijven/index.html'),
          // De stadspagina's staan niet in git: `npm run prebuild` schrijft ze net vóór deze
          // build weg in gemeente/<slug>/index.html. Ontbreken ze, dan faalt de build hier
          // met een duidelijke fout, en dat is beter dan stil een pagina minder deployen.
          ...Object.fromEntries(
            STEDEN.map((stad) => [
              `gemeente-${stad.slug}`,
              resolve(__dirname, UITVOERMAP, stad.slug, 'index.html'),
            ]),
          ),
        },
      },
    },
    server: {
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
    },
  }
})
