// Docs-only "View this page in {mode}" button. Components never read this.
// The choice is not saved: it applies to this page only, and every other page opens in Canon.
// Canon is the default: no data-mode attribute means Canon.
(function () {
  var MODES = ['canon', 'klarheit', 'noktern', 'omtanke', 'ethos'];
  var root = document.documentElement;

  function current() {
    var m = root.getAttribute('data-mode');
    return MODES.indexOf(m) > -1 ? m : 'canon';
  }

  function sync() {
    var now = current();
    var buttons = document.querySelectorAll('[data-mode-set]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-mode-set') === now ? 'true' : 'false');
    }
  }

  function choose(mode) {
    if (MODES.indexOf(mode) === -1) mode = 'canon';
    if (mode === 'canon') root.removeAttribute('data-mode');
    else root.setAttribute('data-mode', mode);
    sync();
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest ? event.target.closest('[data-mode-set]') : null;
    if (btn) choose(btn.getAttribute('data-mode-set'));
  });

  sync();
})();
