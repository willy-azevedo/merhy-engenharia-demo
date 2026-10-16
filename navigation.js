(() => {
  const dropdowns = [...document.querySelectorAll('.nav-dropdown')];
  const setOpen = (dropdown, open) => {
    dropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', String(open));
    dropdown.querySelector('.nav-dropdown-panel').hidden = !open;
  };
  const closeAll = () => dropdowns.forEach(dropdown => setOpen(dropdown, false));
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      closeAll();
      setOpen(dropdown, open);
    });
    dropdown.addEventListener('focusout', event => {
      if (!dropdown.contains(event.relatedTarget)) setOpen(dropdown, false);
    });
    dropdown.querySelectorAll('a').forEach(link => link.addEventListener('click', closeAll));
  });
  document.addEventListener('click', event => {
    if (!dropdowns.some(dropdown => dropdown.contains(event.target))) closeAll();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = dropdowns.find(dropdown => dropdown.querySelector('.nav-dropdown-toggle').getAttribute('aria-expanded') === 'true');
    if (!open) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(open, false);
    open.querySelector('.nav-dropdown-toggle').focus();
  }, true);
  window.matchMedia('(max-width: 800px)').addEventListener('change', closeAll);
})();
