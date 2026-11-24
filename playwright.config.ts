import { defineConfig, devices } from '@playwright/test'

/**
 * Rooktest op de live site: `npm run rooktest`.
 *
 * Bewust tegen zoekjeschool.be zelf en niet tegen een lokale build. De fouten die deze test moet
 * vangen, bestaan enkel live: een CSP-regel in netlify.toml die iets blokkeert, een API-key die
 * in Netlify ontbreekt, de Netlify Function voor de fietsroute, of een dieplink die bij een
 * andere dienst stil op een lege pagina uitkomt (zoals de kaart van HeiGIT, issue #83).
 *
 * ROOKTEST_URL laat dezelfde test op een deploy preview draaien, bijvoorbeeld
 * ROOKTEST_URL=https://deploy-preview-90--zoekjeschool.netlify.app npm run rooktest
 *
 * De test zelf staat in e2e/. De extensie .e2e.ts en niet .spec.ts: vitest pakt standaard elk
 * *.spec.ts-bestand op, en deze test hoort niet bij `npm test`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // Eén browser, één test, na elkaar: het gaat om een handvol calls per week naar diensten die
  // ons gratis helpen, niet om snelheid.
  workers: 1,
  fullyParallel: false,
  // Eén nieuwe poging in CI. Een trage Transitous op het verkeerde moment is geen fout van ons,
  // en een issue moet iets betekenen. Faalt het twee keer na elkaar, dan is het echt.
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.ROOKTEST_URL ?? 'https://zoekjeschool.be',
    locale: 'nl-BE',
    timezoneId: 'Europe/Brussels',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
