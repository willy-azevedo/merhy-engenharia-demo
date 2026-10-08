(() => {
  if (new URLSearchParams(location.search).get('revisao') !== '1') return;
  const config = window.MERHY_REVIEW_CONFIG || {};
  const storageKey = 'merhy-home-review-token';
  let token = new URLSearchParams(location.hash.slice(1)).get('chave') || '';
  let author = '';
  try {
    if (token) sessionStorage.setItem(storageKey, token);
    else token = sessionStorage.getItem(storageKey) || '';
    author = localStorage.getItem('merhy-review-author') || '';
  } catch {}
  function publicKey(key) {
    if (typeof key !== 'string') return false;
    if (key.startsWith('sb_publishable_')) return true;
    try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { return false; }
  }
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || '') && publicKey(config.publishableKey) && /^[a-f0-9]{64}$/.test(token);
  const icons = {
    chat: '<path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 8h8M8 12h5"/>',
    pin: '<circle cx="12" cy="10" r="3"/><path d="M18 10c0 5-6 11-6 11S6 15 6 10a6 6 0 1 1 12 0Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
  const ui = document.createElement('div');
  ui.className = 'mr-ui'; ui.dataset.reviewUi = '';
  ui.innerHTML = `
    <div class="mr-dock">
      <button id="mr-launch" type="button">${icon('chat')}Comentários</button>
      <div class="mr-tools" hidden>
        <button type="button" id="mr-browse" aria-pressed="true" aria-label="Navegar pela página">${icon('eye')}<span class="mr-tool-label">Navegar</span></button>
        <button type="button" id="mr-pick" aria-pressed="false">${icon('pin')}Comentar</button>
        <button type="button" id="mr-history" aria-label="Ver comentários (0)" aria-expanded="false" aria-controls="mr-panel">${icon('chat')}<span id="mr-count">0</span></button>
        <button type="button" id="mr-stop" aria-label="Fechar ferramenta de comentários">${icon('close')}</button>
      </div>
    </div>
    <aside class="mr-panel" id="mr-panel" aria-label="Comentários da página inicial" hidden>
      <div class="mr-panel-head">
        <div><h2>Comentários · Merhy</h2><p id="mr-total">0 comentários</p></div>
        <button type="button" id="mr-close-panel" aria-label="Recolher comentários">${icon('close')}</button>
      </div>
      <div class="mr-panel-content">
        <p class="mr-notice" id="mr-notice" role="status" hidden></p>
        <form class="mr-form" id="mr-form" hidden>
          <h3>Novo comentário</h3><p id="mr-form-location"></p>
          <label>Seu nome<input id="mr-author" name="author" required maxlength="80" autocomplete="name"></label>
          <label>Comentário<textarea id="mr-body" name="body" required maxlength="2000" placeholder="Escreva seu comentário sobre este ponto da página."></textarea></label>
          <div class="mr-form-actions">
            <button class="mr-primary" type="submit" id="mr-submit">Enviar comentário</button>
            <button type="button" id="mr-cancel">Cancelar</button>
          </div>
        </form>
        <div id="mr-list"></div>
      </div>
    </aside>
    <div class="mr-markers"></div><div class="mr-outline" hidden></div>
    <div class="mr-hint" role="status" hidden>Clique no ponto da página que você quer comentar.</div>`;
  document.body.append(ui);
  const $ = id => ui.querySelector(`#${id}`);
  const panel = $('mr-panel'), form = $('mr-form'), list = $('mr-list'), markers = ui.querySelector('.mr-markers'), outline = ui.querySelector('.mr-outline');
  let active = false, picking = false, draft = null, selected = null, comments = [], busy = false, refreshPromise = null, positionFrame = null, saveVersion = 0;
  $('mr-author').value = author;
  function notice(message, error = false) { $('mr-notice').textContent = message; $('mr-notice').dataset.error = String(error); $('mr-notice').hidden = !message; }
  function motionState() { document.body.classList.toggle('review-picking', picking); document.body.classList.toggle('review-drafting', !!draft); document.body.classList.toggle('review-focusing', active && !panel.hidden && !!selected); document.dispatchEvent(new Event('merhy-review-mode')); }
  function setPicking(value) {
    picking = value; $('mr-pick').setAttribute('aria-pressed', String(value)); $('mr-browse').setAttribute('aria-pressed', String(!value)); ui.querySelector('.mr-hint').hidden = !value; outline.hidden = true; motionState();
  }
  function setPanel(open) { panel.hidden = !open; $('mr-history').setAttribute('aria-expanded', String(open)); motionState(); }
  function cancelDraft() { draft = null; form.hidden = true; $('mr-body').value = ''; motionState(); }
  function openDraft(value) {
    draft = value; setPicking(false); setPanel(true); form.hidden = false;
    $('mr-form-location').textContent = value.anchor.section;
    $('mr-submit').disabled = !ready;
    $('mr-body').value = ''; notice(''); motionState(); (author ? $('mr-body') : $('mr-author')).focus();
    panel.querySelector('.mr-panel-content').scrollTop = 0;
  }
  async function rpc(name, args) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/merhy_review_${name}`, { method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: token, ...args }), signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível acessar os comentários. Confira o link ou tente novamente.');
      return await response.json();
    } catch (error) { if (error.name === 'AbortError') throw new Error('A conexão demorou. Seu texto continua aqui; tente enviar novamente.'); throw error; }
    finally { clearTimeout(timeout); }
  }
  function roots() { return comments.filter(comment => !comment.parent_id); }
  function numbered(comment) { return roots().findIndex(root => root.id === comment.id) + 1; }
  function elementFor(anchor) {
    if (anchor.livingPhoto && (innerWidth <= 600 || matchMedia('(prefers-reduced-motion: reduce)').matches)) return [...document.querySelectorAll('.living-scene img:not(.living-slide)')].find(image => image.getAttribute('src') === anchor.livingPhoto)?.closest('button') || null;
    try { return document.querySelector(anchor.selector); } catch { return null; }
  }
  function positionMarkers() {
    positionFrame = null;
    for (const pin of markers.children) {
      const comment = comments.find(item => item.id === pin.dataset.id), element = comment && elementFor(comment.anchor);
      const matchesHero = !comment?.anchor.heroProject || comment.anchor.heroProject === document.getElementById('hero-cta').dataset.project && (!comment.anchor.image || comment.anchor.image === document.getElementById('hero-image').getAttribute('src'));
      const matchesLiving = !comment?.anchor.livingPhoto || innerWidth <= 600 || matchMedia('(prefers-reduced-motion: reduce)').matches || comment.anchor.livingPhoto === document.querySelector('.living-stage').dataset.activeImage;
      if (!element || !active || !matchesHero || !matchesLiving) { pin.hidden = true; continue; }
      const rect = element.getBoundingClientRect(), x = rect.left + rect.width * comment.anchor.x, y = rect.top + rect.height * comment.anchor.y;
      pin.hidden = !rect.width || !rect.height || x < 0 || x > innerWidth || y < 0 || y > innerHeight;
      pin.style.left = `${x}px`; pin.style.top = `${y}px`;
    }
  }
  function queuePosition() { if (!positionFrame) positionFrame = requestAnimationFrame(positionMarkers); }
  function goTo(comment) {
    selected = comment.id; setPicking(false); cancelDraft(); setPanel(true);
    if (comment.anchor.heroProject) document.dispatchEvent(new CustomEvent('merhy-review-project', { detail: { project: comment.anchor.heroProject, image: comment.anchor.image } }));
    const element = elementFor(comment.anchor);
    if (comment.anchor.livingPhoto) document.dispatchEvent(new CustomEvent('merhy-review-living', { detail: { image: comment.anchor.livingPhoto } }));
    else if (element) { const top = scrollY + element.getBoundingClientRect().top - 125; window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
    render();
  }
  function textElement(tag, content, className) { const element = document.createElement(tag); element.textContent = content; if (className) element.className = className; return element; }
  function details(comment, node) {
    node.append(textElement('strong', comment.author));
    const date = new Date(comment.created_at), time = textElement('time', Number.isNaN(date.valueOf()) ? '' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
    if (!Number.isNaN(date.valueOf())) time.dateTime = date.toISOString(); node.append(time);
  }
  function render() {
    const count = roots().length;
    $('mr-count').textContent = count;
    $('mr-total').textContent = `${count} ${count === 1 ? 'comentário' : 'comentários'}`;
    $('mr-history').setAttribute('aria-label', `Ver comentários (${count})`);
    list.replaceChildren(); markers.replaceChildren();
    for (const comment of roots()) {
      const pin = textElement('button', String(numbered(comment)), 'mr-marker'); pin.type = 'button'; pin.dataset.id = comment.id; pin.setAttribute('aria-label', `Comentário ${numbered(comment)}: ${comment.anchor.section}`); pin.addEventListener('click', () => goTo(comment)); markers.append(pin);
      const item = document.createElement('article'); item.className = `mr-item${selected === comment.id ? ' mr-selected' : ''}`;
      const head = document.createElement('div'); head.className = 'mr-item-head'; details(comment, head); item.append(head);
      const locationButton = textElement('button', `${numbered(comment)} · ${comment.anchor.section}`, 'mr-location'); locationButton.type = 'button'; locationButton.addEventListener('click', () => goTo(comment)); item.append(locationButton, textElement('p', comment.body));
      for (const reply of comments.filter(child => child.parent_id === comment.id)) { const node = document.createElement('div'); node.className = 'mr-reply'; details(reply, node); node.append(textElement('p', reply.body)); item.append(node); }
      list.append(item);
    }
    if (!list.children.length) list.append(textElement('p', 'Clique em Comentar e marque um ponto da página para deixar seu comentário.', 'mr-empty'));
    queuePosition();
  }
  async function refresh() {
    if (!ready || refreshPromise || busy || draft) return refreshPromise;
    const version = saveVersion;
    refreshPromise = (async () => {
      try { const data = await rpc('list', {}); if (!busy && version === saveVersion) { comments = data.comments; render(); if ($('mr-notice').dataset.error === 'true' && !draft) notice(''); } }
      catch (error) { if (!busy && !draft) notice(error.message, true); }
      finally { refreshPromise = null; }
    })();
    return refreshPromise;
  }
  function selectorFor(element) {
    const path = [];
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      if (node.id) { path.unshift(`#${CSS.escape(node.id)}`); break; }
      const siblings = [...node.parentElement.children].filter(sibling => sibling.tagName === node.tagName);
      path.unshift(`${node.localName}:nth-of-type(${siblings.indexOf(node) + 1})`);
    }
    return path.join(' > ');
  }
  function pickElement(event) {
    const overlay = event.target.closest('.launch-card-action,.portfolio-card-action,.journal-card-action');
    if (overlay) return document.elementsFromPoint(event.clientX, event.clientY).find(element => /^(IMG|H[1-6]|P|SPAN)$/.test(element.tagName) && !element.closest('[data-review-ui]')) || overlay.parentElement;
    return event.target.closest('img,h1,h2,h3,p,button,a,figure,label,input,textarea,select') || event.target;
  }
  function pickedAnchor(element, event) {
    const rect = element.getBoundingClientRect(), section = element.closest('section'), names = { inicio: 'Abertura', lancamentos: 'Lançamentos', 'a-merhy': 'A Merhy', diferenciais: 'Nosso jeito de construir', espacos: 'Tempo para o que importa', portfolio: 'Obras entregues', blog: 'Blog', contato: 'Contato' };
    const heroProject = element.closest('.hero') ? document.getElementById('hero-cta').dataset.project : null;
    const livingPhoto = element.closest('.scene-home') && element.closest('.living-stage.sequencing') ? document.querySelector('.living-stage').dataset.activeImage : null;
    return { selector: selectorFor(element), x: Math.max(0, Math.min(1, (event.clientX - rect.left) / (rect.width || 1))), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / (rect.height || 1))), section: names[section?.id] || (element.closest('.site-header') ? 'Menu principal' : 'Rodapé'), viewportWidth: innerWidth, heroProject, livingPhoto, image: heroProject ? document.getElementById('hero-image').getAttribute('src') : element.tagName === 'IMG' ? element.getAttribute('src') : null };
  }
  $('mr-launch').addEventListener('click', () => { active = true; $('mr-launch').hidden = true; ui.querySelector('.mr-tools').hidden = false; setPanel(true); render(); refresh(); });
  $('mr-stop').addEventListener('click', () => { active = false; cancelDraft(); setPicking(false); setPanel(false); $('mr-launch').hidden = false; ui.querySelector('.mr-tools').hidden = true; positionMarkers(); });
  $('mr-browse').addEventListener('click', () => { cancelDraft(); setPicking(false); });
  $('mr-pick').addEventListener('click', () => { cancelDraft(); setPicking(!picking); setPanel(false); });
  $('mr-history').addEventListener('click', () => { setPicking(false); setPanel(panel.hidden); if (!panel.hidden) refresh(); });
  $('mr-close-panel').addEventListener('click', () => setPanel(false));
  $('mr-cancel').addEventListener('click', cancelDraft);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!ready || !draft || busy) return;
    author = $('mr-author').value.trim(); const body = $('mr-body').value.trim(); if (!author || !body) return;
    try { localStorage.setItem('merhy-review-author', author); } catch {}
    busy = true; $('mr-submit').disabled = true; notice('Enviando…');
    try {
      const saved = await rpc('add', { p_author: author, p_body: body, p_anchor: draft.anchor, p_parent: null });
      saveVersion++; comments = [...comments.filter(comment => comment.id !== saved.id), saved]; selected = saved.id; cancelDraft(); render(); notice('Comentário salvo.');
    } catch (error) { notice(error.message, true); }
    finally { busy = false; $('mr-submit').disabled = !ready; }
  });
  document.addEventListener('click', event => { if (!picking || event.target.closest('[data-review-ui]')) return; event.preventDefault(); event.stopImmediatePropagation(); const element = pickElement(event); openDraft({ anchor: pickedAnchor(element, event) }); }, true);
  document.addEventListener('pointermove', event => { if (!picking || event.target.closest('[data-review-ui]')) { outline.hidden = true; return; } const rect = pickElement(event).getBoundingClientRect(); outline.hidden = false; Object.assign(outline.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { setPicking(false); cancelDraft(); setPanel(false); } });
  window.addEventListener('scroll', queuePosition, { passive: true }); window.addEventListener('resize', queuePosition); new ResizeObserver(queuePosition).observe(document.body); document.addEventListener('load', queuePosition, true);
  setInterval(() => { if (active && !document.hidden && !busy) refresh(); }, 10000);
  $('mr-pick').disabled = !ready;
  if (!ready) notice('Não foi possível abrir os comentários. Solicite o link completo ao Studio Artemis.', true);
  render();
})();
