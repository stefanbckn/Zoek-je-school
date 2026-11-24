import { expect, test, type Page } from '@playwright/test'

/**
 * Rooktest: één keer door de live site zoals een ouder dat doet. Zie playwright.config.ts voor
 * waarom dit tegen zoekjeschool.be draait en niet lokaal.
 *
 * Drie afspraken die deze test vasthoudt:
 *
 * - Geen schoolnaam en geen richting in de code. De test neemt het eerste adres in de lijst dat
 *   ver genoeg ligt; welke school dat is, maakt niet uit. Het vertrekadres is het stadhuis van
 *   Mechelen, een publiek adres.
 * - Niets naar Simple Analytics. Elk verzoek naar hun domeinen wordt in de browser afgebroken
 *   voor het vertrekt, dus een run telt nooit mee als bezoek, ook niet op de live site.
 * - Weinig belasting voor anderen: per run één fietsroute via onze eigen function, één
 *   reisadvies bij Transitous en één keer hun planner.
 */

const VERTREKADRES = 'Grote Markt 21 Mechelen'

/**
 * Dichter dan dit toont de fiche "te voet sneller" in plaats van een rit met bus of trein, en dan
 * is er geen link naar de planner om na te kijken. Zie .claude/rules/reistijd.md.
 */
const MINIMALE_AFSTAND_KM = 3

test.beforeEach(async ({ context }) => {
  await context.route(/simpleanalytics/, (route) => route.abort())
})

/** Een CSP die iets blokkeert, geeft geen zichtbare fout maar wel een melding in de console. */
function volgCspMeldingen(page: Page): string[] {
  const meldingen: string[] = []
  page.on('console', (bericht) => {
    if (bericht.type() === 'error' && /Content Security Policy/i.test(bericht.text())) {
      meldingen.push(bericht.text())
    }
  })
  return meldingen
}

test('zoeken, fiche, fietsroute en dieplink naar Transitous', async ({ page, context }) => {
  const cspMeldingen = volgCspMeldingen(page)

  await test.step('adres zoeken via de geolocatiedienst', async () => {
    await page.goto('/')
    await page.getByRole('combobox', { name: 'Gemeente of adres' }).fill(VERTREKADRES)
    const suggestie = page.getByRole('listbox', { name: 'Suggesties' }).getByRole('option').first()
    await expect(suggestie).toBeVisible()
    await suggestie.click()
    await expect(page).toHaveURL(/[?&]lat=.*&lon=/)
  })

  await test.step('resultaten in de lijst en op de kaart', async () => {
    await expect(page.getByText(/^\d+ resultaten?$/)).toBeVisible()
    await expect(page.getByText(/km in vogelvlucht/).first()).toBeVisible()

    await page.getByRole('button', { name: 'Kaart', exact: true }).click()
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()
    await page.getByRole('button', { name: 'Lijst', exact: true }).click()
  })

  await test.step(`fiche van het eerste adres op ${MINIMALE_AFSTAND_KM} km of meer`, async () => {
    let gekozen = false
    for (const afstand of await page.getByText(/km in vogelvlucht/).all()) {
      const km = parseFloat((await afstand.innerText()).replace(',', '.'))
      if (km >= MINIMALE_AFSTAND_KM) {
        // Het kaartje is de dichtste rounded-xl rond de afstand; de eerste knop erin opent de
        // fiche, ook bij een adres met meerdere scholen.
        await afstand
          .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
          .getByRole('button')
          .first()
          .click()
        gekozen = true
        break
      }
    }
    expect(gekozen, `geen adres op ${MINIMALE_AFSTAND_KM} km of meer in de eerste resultaten`).toBe(true)
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toBeVisible()
  })

  const fiche = page.getByRole('dialog')

  await test.step('fietsafstand via onze Netlify Function', async () => {
    await expect(fiche.getByText(/\d km · \d+ min \(fietsroute/)).toBeVisible()
  })

  await test.step('reistijd met openbaar vervoer via Transitous', async () => {
    await expect(fiche.getByText(/\d+ min · (rechtstreeks|\d+× overstappen)/)).toBeVisible()
  })

  await test.step('fietsroute getekend op de kaart', async () => {
    await fiche.getByRole('button', { name: 'Bekijk de fietsroute' }).click()
    const venster = page.getByRole('dialog', { name: /^Fietsroute naar / })
    await expect(venster).toBeVisible()
    const lijn = venster.locator('path.fietsroute-lijn')
    await expect(lijn).toHaveCount(1)
    // Een lijn met maar een paar punten is geen route. Een leeg traject geeft een `d` van een
    // handvol tekens; een echte route van enkele km loopt in de honderden.
    const d = (await lijn.getAttribute('d')) ?? ''
    expect(d.length, 'het traject van de fietsroute is (bijna) leeg').toBeGreaterThan(50)
    await expect(venster.locator('.leaflet-tile-loaded').first()).toBeVisible()
    await venster.getByRole('button', { name: 'Sluiten' }).click()
  })

  await test.step('dieplink opent de planner van Transitous met de rit ingevuld', async () => {
    const link = fiche.getByRole('link', { name: /Bekijk de rit stap voor stap/ })
    const href = await link.getAttribute('href')
    expect(href).toBeTruthy()
    const params = new URL(href!).searchParams

    const planner = await context.newPage()
    await planner.goto(href!)
    // Het HeiGIT-scenario: de link werkt, maar de pagina neemt de rit niet over. Dus niet enkel
    // kijken of de pagina laadt, wel of van en naar ingevuld staan en er een rit getoond wordt.
    await expect(planner.getByLabel('From', { exact: true }).first()).toHaveValue(params.get('fromName')!)
    await expect(planner.getByLabel('To', { exact: true }).first()).toHaveValue(params.get('toName')!)
    // Een getoonde rit heeft een duur van minstens een minuut; de planner heeft ook verborgen
    // "0 min"-velden in sjablonen staan, vandaar de filter op zichtbaar.
    await expect(planner.getByText(/^[1-9]\d* min$/).filter({ visible: true }).first()).toBeVisible()
    await planner.close()
  })

  expect(cspMeldingen, 'de CSP blokkeerde iets op de site').toEqual([])
})
