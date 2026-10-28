// Docs navigation. Below 1024px the nav is a dropdown panel under the sticky bar.
// From 1024px up it is the side nav and none of this runs.
(function () {
  var button = document.querySelector('[data-menu-button]');
  var menu = document.querySelector('[data-menu]');
  var dim = document.querySelector('[data-menu-dim]');
  var FLAG = 'arche-focus-h1';

  // After a nav click the next page loads, so leave a note in sessionStorage.
  // On the new page, scroll to the top and move focus to the h1.
  var h1 = document.getElementById('page-title');
  try {
    if (sessionStorage.getItem(FLAG)) {
      sessionStorage.removeItem(FLAG);
      window.scrollTo(0, 0);
      if (h1) h1.focus({ preventScroll: true });
    }
  } catch (e) {
    // Storage can be blocked. The page still works.
  }

  if (!button || !menu) return;

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  function setOpen(open, returnFocus) {
    menu.classList.toggle('is-open', open);
    if (dim) dim.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open && returnFocus) button.focus();
  }

  button.addEventListener('click', function () {
    setOpen(!isOpen(), false);
  });

  if (dim) dim.addEventListener('click', function () { setOpen(false, false); });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false, true);
    }
  });

  // Links marked data-focus-h1 (the menu and the next-page band) leave the flag for the next page.
  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[data-focus-h1]') : null;
    if (!link) return;
    if (link.getAttribute('aria-current') === 'page') {
      // Already on this page: just close the menu.
      event.preventDefault();
      setOpen(false, true);
      return;
    }
    try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
    setOpen(false, false);
  });

  // If the window grows to the desktop layout, close the panel so it is not left open.
  if (window.matchMedia) {
    var wide = window.matchMedia('(min-width: 1024px)');
    var onChange = function () { if (wide.matches) setOpen(false, false); };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
  }
})();
