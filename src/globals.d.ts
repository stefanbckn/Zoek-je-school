/**
 * Het versienummer uit package.json, door Vite ingevuld op buildtijd (zie vite.config.ts).
 * Bewust via `define` en niet via een import van package.json: dan belandt enkel dit ene
 * veld in de bundel in plaats van het volledige bestand met dependencies en scripts erin.
 */
declare const __APP_VERSION__: string
