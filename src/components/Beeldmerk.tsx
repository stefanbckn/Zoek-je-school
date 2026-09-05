/**
 * Het beeldmerk: een schoolgebouw met een klok. Inline en niet als <img>, om twee redenen.
 * De ramen en de deur moeten de kleur van hun ondergrond aannemen — op de kopbalk is dat teal,
 * in het donker de kaartkleur — en dat kan een los SVG-bestand niet weten. En het scheelt een
 * netwerkverzoek voor een tekening van nog geen 600 bytes.
 *
 * Drie detailniveaus, exact de geometrie uit het logopakket (favicon.svg, favicon-32.svg,
 * favicon-16.svg): vier ramen vanaf 48 px, twee vanaf 24, en daaronder alleen de klok, het blok
 * en de deur. Kleiner tekenen laat de ramen in elkaar lopen tot een grijze vlek. De grens ligt
 * bij 48 en niet bij 34, want daar houdt het pakket ze ook: op de kopbalk staat dus de versie
 * met twee ramen.
 *
 * De inkt komt uit `currentColor`, de ramen uit --c-kop, de klok uit --c-signaal. Nooit een
 * vaste hexwaarde, anders volgt het merk het thema niet mee.
 */
export function Beeldmerk({ grootte = 34 }: { grootte?: number }) {
  const niveau = grootte >= 48 ? 'vol' : grootte >= 24 ? 'twee' : 'klein'

  return (
    <svg
      width={grootte}
      height={grootte}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {niveau === 'klein' ? (
        <>
          <circle cx="32" cy="11" r="8" fill="var(--c-signaal)" />
          <rect x="4" y="20" width="56" height="36" rx="2" fill="currentColor" />
          <rect x="26" y="38" width="12" height="18" fill="var(--c-kop)" />
        </>
      ) : (
        <>
          {/* dak, balk en romp vormen samen het gebouw */}
          <path
            d="M25 21h14v-8.5a1.5 1.5 0 00-1.5-1.5h-11A1.5 1.5 0 0025 12.5z"
            fill="currentColor"
          />
          <rect x="7" y="21" width="50" height="4.6" rx="1.3" fill="currentColor" />
          <rect x="10" y="25.6" width="44" height="26.4" rx="1.4" fill="currentColor" />
          {/* de klok is het enige gele in de interface, samen met jouw adres op de kaart */}
          <circle cx="32" cy="16.2" r={niveau === 'vol' ? 3.6 : 3.8} fill="var(--c-signaal)" />
          {niveau === 'vol' ? (
            <>
              {[14, 23.5, 33, 42.5].map((x) => (
                <rect key={x} x={x} y="30" width="7.5" height="7.5" rx="1" fill="var(--c-kop)" />
              ))}
              <path d="M27.8 52v-8.4a4.2 4.2 0 018.4 0V52z" fill="var(--c-kop)" />
            </>
          ) : (
            <>
              {[15, 40].map((x) => (
                <rect key={x} x={x} y="31" width="9" height="9" rx="1" fill="var(--c-kop)" />
              ))}
              <path d="M27 52v-9a5 5 0 0110 0v9z" fill="var(--c-kop)" />
            </>
          )}
        </>
      )}
    </svg>
  )
}
