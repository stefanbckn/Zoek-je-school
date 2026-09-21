/**
 * Maakt de themaknop op de statische pagina's werkend. Op de zoeker doet ThemaToggle.tsx dit
 * in React; hier is er geen React, dus een paar regels gewone JavaScript.
 *
 * Bewust een apart bestand en geen inline script: de CSP in netlify.toml staat enkel
 * `script-src 'self'` toe. Staat los van thema.js, dat het opgeslagen thema al toepast vóór de
 * pagina getekend wordt — dit script zet alleen de knop in de juiste stand en bewaart een klik.
 *
 * De sleutel en de waarden komen overeen met src/lib/thema.ts. Wijzigt daar iets, pas het hier
 * dan mee aan. De twee klassenreeksen staan op de groep zelf (data-actief/data-inactief), die
 * komen uit scripts/paginakop.ts.
 */
;(function () {
  var SLEUTEL = 'zjs-thema'
  // Twee groepen: één in de rij voor brede schermen en één in het uitklapmenu, net zoals
  // App.tsx de ingangen twee keer tekent. Ze moeten dezelfde stand tonen.
  var groepen = document.querySelectorAll('[data-themaknop]')
  if (groepen.length === 0) return

  var actief = groepen[0].getAttribute('data-actief') || ''
  var inactief = groepen[0].getAttribute('data-inactief') || ''
  var basis = 'rounded-full px-2.5 py-1 transition-colors'
  var knoppen = document.querySelectorAll('[data-thema]')

  function lees() {
    try {
      var opgeslagen = localStorage.getItem(SLEUTEL)
      if (opgeslagen === 'licht' || opgeslagen === 'donker' || opgeslagen === 'systeem') {
        return opgeslagen
      }
    } catch {
      // Privémodus of geblokkeerde opslag: dan volgen we gewoon het systeem.
    }
    return 'systeem'
  }

  // Zelfde gedrag als pasThemaToe() in src/lib/thema.ts: bij 'systeem' verdwijnt het attribuut,
  // zodat prefers-color-scheme het weer overneemt.
  function pasToe(thema) {
    var root = document.documentElement
    if (thema === 'systeem') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', thema === 'donker' ? 'dark' : 'light')
  }

  function teken(thema) {
    for (var i = 0; i < knoppen.length; i++) {
      var knop = knoppen[i]
      var aan = knop.getAttribute('data-thema') === thema
      knop.setAttribute('aria-checked', aan ? 'true' : 'false')
      knop.className = basis + ' ' + (aan ? actief : inactief)
    }
  }

  teken(lees())

  for (var i = 0; i < knoppen.length; i++) {
    knoppen[i].addEventListener('click', function () {
      var gekozen = this.getAttribute('data-thema')
      pasToe(gekozen)
      try {
        localStorage.setItem(SLEUTEL, gekozen)
      } catch {
        // Niet kunnen bewaren is geen reden om de keuze niet toe te passen.
      }
      teken(gekozen)
      // Een menu dat open blijft staan nadat je iets gekozen hebt, is nooit wat je bedoelde.
      // Zelfde gedrag als op de zoeker, waar App.tsx het <details> sluit na een klik.
      var menu = this.closest('details')
      if (menu) menu.open = false
    })
  }
})()
