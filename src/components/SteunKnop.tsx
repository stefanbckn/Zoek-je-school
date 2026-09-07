/**
 * De steunknop staat op twee plaatsen (de footer en onderaan "Over deze site") en dus hier, in
 * één component. Anders lopen de twee kopieën uit elkaar zodra de tekst of de link wijzigt.
 *
 * Let op: `uitleg/index.html` draagt dezelfde knop als handgeschreven HTML, want een statische
 * pagina kan deze component niet gebruiken. Dit bestand is de waarheid; wijzigt hier de tekst,
 * de link of het kopje, pas die kopie dan mee aan.
 *
 * Bewust een gewone link en géén Ko-fi-widget: dat script van storage.ko-fi.com zou bij elke
 * paginaweergave een externe call doen en dus het IP van elke bezoeker naar Ko-fi sturen, ook
 * bij wie nooit klikt. Dat botst met de privacyregel in CLAUDE.md, en de CSP
 * (`script-src 'self'`) laat het sowieso niet toe.
 *
 * Het kopje is Ko-fi's officiële brand asset, lokaal in `public/` en ongewijzigd: niet
 * hertekend, niet van kleur veranderd, niet vervormd. Dat is een voorwaarde van hun merkregels.
 */
export function SteunKnop({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://ko-fi.com/n7b826hces"
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-inkt hover:opacity-90 ${className}`}
    >
      <img src="/kofi-symbool.svg" alt="" aria-hidden="true" className="h-4 w-auto" />
      Steun deze site op Ko-fi
    </a>
  )
}
