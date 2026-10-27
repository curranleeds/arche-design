// Docs-only color mode switcher. Components never read this.
// The head script in base.njk has already applied any saved mode before first paint.
// This file wires up the header <select> and any [data-mode-set] buttons.
// Canon is the default: no data-mode attribute means Canon.
(function () {
  var KEY = 'arche-mode';
  var MODES = ['canon', 'klarheit', 'noktern', 'omtanke', 'ethos'];
  var root = document.documentElement;

  function current() {
    var m = root.getAttribute('data-mode');
    return MODES.indexOf(m) > -1 ? m : 'canon';
  }

  function sync() {
    var now = current();
    var selects = document.querySelectorAll('[data-mode-select]');
    for (var i = 0; i < selects.length; i++) selects[i].value = now;
    var buttons = document.querySelectorAll('[data-mode-set]');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute('aria-pressed', buttons[j].getAttribute('data-mode-set') === now ? 'true' : 'false');
    }
  }

  function choose(mode) {
    if (MODES.indexOf(mode) === -1) mode = 'canon';
    if (mode === 'canon') root.removeAttribute('data-mode');
    else root.setAttribute('data-mode', mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch (e) {
      // Storage can be blocked. The mode still applies for this visit.
    }
    sync();
  }

  document.addEventListener('change', function (event) {
    var el = event.target;
    if (el && el.matches && el.matches('[data-mode-select]')) choose(el.value);
  });
  document.addEventListener('click', function (event) {
    var btn = event.target.closest ? event.target.closest('[data-mode-set]') : null;
    if (btn) choose(btn.getAttribute('data-mode-set'));
  });

  sync();
})();
