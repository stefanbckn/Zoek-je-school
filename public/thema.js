/**
 * Zet het themakeuze-attribuut vóór React mount, anders zie je bij het laden kort het
 * verkeerde thema opflitsen. Bewust een apart bestand en geen inline <script>: de CSP in
 * netlify.toml staat enkel script-src 'self' toe, en dat willen we zo houden.
 * Moet synchroon in <head> staan, dus vóór de stylesheet wordt toegepast.
 */
(function () {
  try {
    var t = localStorage.getItem('zjs-thema')
    if (t === 'donker') document.documentElement.setAttribute('data-theme', 'dark')
    else if (t === 'licht') document.documentElement.setAttribute('data-theme', 'light')
    // 'systeem' of niets: geen attribuut, prefers-color-scheme beslist.
  } catch (e) {
    // Geblokkeerde opslag: val terug op het systeemthema.
  }
})()
