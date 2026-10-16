document.documentElement.classList.add('js');

const revealGroups = ['.about-number-grid', '.purpose-grid', '.about-care-list', '.team-roster', '.team-method-list'];
revealGroups.forEach(selector => {
  const group = document.querySelector(selector);
  group?.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${index * 110}ms`);
  });
});

const revealElements = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  revealElements.forEach(element => revealObserver.observe(element));
} else {
  revealElements.forEach(element => element.classList.add('visible'));
}

// Every card follows the same arc. Recycling occurs beyond the viewport,
// so both its position and perspective stay continuous across the loop.
(() => {
  const carousel = document.querySelector('.cta-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.cta-carousel-track');
  const originals = [...track.children];
  const toggle = document.querySelector('.cta-motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cards = [...originals];
  let width = 0;
  let cardWidth = 0;
  let step = 0;
  let phase = 0;
  let frame = null;
  let previousTime = null;
  let visible = false;
  let paused = false;

  function render() {
    const halfSpan = width / 2 + step * 0.4;
    const curve = width < 600 ? 55 : 130;
    cards.forEach((card, index) => {
      const slot = ((index + phase + cards.length / 2) % cards.length + cards.length) % cards.length - cards.length / 2;
      const x = slot * step;
      const position = Math.max(-1.5, Math.min(1.5, x / halfSpan));
      const y = curve * position * position;
      const scale = 1 - Math.min(Math.abs(position), 1) * 0.08;
      card.style.transform = `translate3d(${(x - cardWidth / 2).toFixed(2)}px, ${y.toFixed(2)}px, 0) perspective(1000px) rotateY(${-position * 38}deg) rotateZ(${-position * 3}deg) scale(${scale})`;
      card.style.zIndex = String(100 - Math.round(Math.abs(position) * 20));
    });
  }

  function layout() {
    width = carousel.clientWidth;
    cardWidth = originals[0].getBoundingClientRect().width;
    // Measure the untransformed CSS width after the initial layout as well.
    cardWidth = parseFloat(getComputedStyle(originals[0]).width) || cardWidth;
    step = cardWidth + (width < 600 ? 20 : 30);
    const required = Math.ceil((Math.ceil(width / step) + 4) / originals.length) * originals.length;
    while (track.children.length < required) {
      track.append(originals[track.children.length % originals.length].cloneNode(true));
    }
    while (track.children.length > required) track.lastElementChild.remove();
    cards = [...track.children];
    phase %= cards.length;
    carousel.classList.add('is-ready');
    render();
  }

  function tick(time) {
    if (previousTime !== null) {
      const elapsed = Math.min(time - previousTime, 64) / 1000;
      phase = (phase - elapsed * (width < 600 ? 24 : 34) / step) % cards.length;
    }
    previousTime = time;
    render();
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    const shouldPlay = visible && !paused && !reducedMotion.matches && !document.hidden;
    if (shouldPlay && frame === null) {
      previousTime = null;
      frame = requestAnimationFrame(tick);
    } else if (!shouldPlay && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    }
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('span').textContent = paused ? 'Retomar animação' : 'Pausar animação';
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(carousel);
  else window.addEventListener('resize', layout, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }, { rootMargin: '100px 0px' }).observe(carousel);
  } else {
    visible = true;
  }
  syncPlayback();
})();
