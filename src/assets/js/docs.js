// Collapses the side menu on small screens. On wide screens it stays open.
(function () {
  var details = document.querySelector('.docs-nav__details');
  if (!details || !window.matchMedia) return;
  var wide = window.matchMedia('(min-width: 1024px)');
  function sync() {
    if (wide.matches) details.setAttribute('open', '');
    else details.removeAttribute('open');
  }
  sync();
  if (wide.addEventListener) wide.addEventListener('change', sync);
})();
