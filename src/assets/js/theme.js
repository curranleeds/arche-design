// Theme controls: the nav toggle (data-theme-toggle) and the Light | Dark switch
// (data-theme-switch). The head script in base.njk has already applied any saved
// choice before the page painted; this file handles clicks and keeps the controls in sync.
(function () {
  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  // The saved or chosen theme if there is one, otherwise the browser's setting.
  function currentTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }

  // Make every toggle and switch on the page match the current theme.
  function sync() {
    var theme = currentTheme();
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    var radios = document.querySelectorAll('[data-theme-switch] input[type="radio"]');
    for (var j = 0; j < radios.length; j++) {
      radios[j].checked = radios[j].value === theme;
    }
  }

  function choose(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // Storage can be blocked. The theme still applies for this visit.
    }
    sync();
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest ? event.target.closest('[data-theme-toggle]') : null;
    if (toggle) choose(currentTheme() === 'dark' ? 'light' : 'dark');
  });

  document.addEventListener('change', function (event) {
    var input = event.target;
    if (input && input.matches && input.matches('[data-theme-switch] input[type="radio"]') && input.checked) {
      choose(input.value);
    }
  });

  // With no saved choice the page follows the browser, so follow it when it changes.
  if (darkQuery) {
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', sync);
    else if (darkQuery.addListener) darkQuery.addListener(sync);
  }

  sync();
})();
