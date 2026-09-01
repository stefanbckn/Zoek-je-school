/**
 * Het balkje bij één leerlingenkenmerk, gebruikt in het detailpaneel én in de
 * vergelijkingstabel.
 *
 * **Neutraal grijs, geen kleurschaal.** Groen-naar-rood zou er een oordeel van maken; dat zit
 * niet in deze cijfers. Dat is de regel die overeind blijft — niet "of er een balk mag staan".
 *
 * **Het percentage staat er altijd naast**, en dit balkje is `aria-hidden`: het herhaalt enkel
 * dat getal, dus een schermlezer heeft er niets aan. Valt de vulling weg bij het afdrukken,
 * dan blijft de volledige informatie dus staan.
 *
 * ⚠️ **De baan moet even breed zijn overal waar balkjes naast elkaar staan.** In de
 * vergelijkingstabel zijn de kolommen niet even breed — een adres met lange schoolnamen krijgt
 * een bredere kolom. Loopt de baan mee met de cel, dan wordt 66,7% in een smalle kolom kórter
 * getekend dan 57,7% in een brede, en dan liegt de tabel. Daarom geeft `VergelijkPanel` een
 * vaste breedte mee via `className`. Doorgemeten in de browser, niet ingeschat.
 */
export function KenmerkBalkje({
  aandeel,
  className = 'w-full',
}: {
  aandeel: number | null
  className?: string
}) {
  if (aandeel === null) return null
  return (
    <div
      aria-hidden="true"
      className={`kenmerkbalk mt-1 h-1.5 overflow-hidden rounded-full bg-rand ${className}`}
    >
      <div className="h-full rounded-full bg-zacht" style={{ width: `${aandeel * 100}%` }} />
    </div>
  )
}
