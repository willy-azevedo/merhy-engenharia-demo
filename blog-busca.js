(() => {
  const data = window.MERHY_BLOG;
  const form = document.querySelector('.blog-search');
  const input = form.querySelector('[name="q"]');
  const summary = document.querySelector('.blog-results-summary');
  const count = document.querySelector('[data-search-count]');
  const queryLabel = document.querySelector('[data-search-query]');
  const grid = document.querySelector('[data-search-results]');
  const empty = document.querySelector('.blog-empty');
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
  const query = (new URLSearchParams(location.search).get('q') || '').trim().slice(0, 160);
  input.value = query;
  if (queryLabel) queryLabel.textContent = query;
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
  function link(url, text, className) {
    const element = node('a', className, text);
    element.href = url;
    return element;
  }
  if (!terms.length) {
    if (count) count.hidden = true;
    summary.textContent = 'Digite uma palavra ou um assunto para encontrar artigos.';
    empty.querySelector('h2').textContent = 'O que você quer ler?';
    empty.querySelector('p').textContent = 'Experimente buscar por varanda, localização ou espaços integrados.';
    empty.hidden = false;
    return;
  }
  document.title = `Busca por “${query}” — Blog Merhy`;
  const results = data.articles.map(article => {
    const title = normalize(article.title);
    const description = normalize(article.excerpt);
    const metadata = normalize(`${article.categoryName} ${article.authorName}`);
    const all = `${title} ${description} ${metadata} ${normalize(article.body)}`;
    if (!terms.every(term => all.includes(term))) return null;
    return { article, score: terms.reduce((score, term) => score + (title.includes(term) ? 10 : 0) + (description.includes(term) ? 4 : 0) + (metadata.includes(term) ? 3 : 0), 0) };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  if (count) {
    count.textContent = `${String(results.length).padStart(2, '0')} ${results.length === 1 ? 'artigo' : 'artigos'}`;
    count.hidden = false;
  }
  summary.textContent = count
    ? `Resultados para “${query}”.`
    : `${results.length} ${results.length === 1 ? 'artigo encontrado' : 'artigos encontrados'} para “${query}”.`;
  for (const { article } of results) {
    const card = node('article', 'blog-card');
    const imageLink = link(article.url, '', 'blog-image');
    imageLink.setAttribute('aria-label', `Ler: ${article.title}`);
    const image = node('img');
    image.src = article.image;
    image.alt = article.imageAlt;
    image.loading = 'lazy';
    imageLink.append(image);
    const category = node('p', 'eyebrow');
    category.append(link(article.categoryUrl, article.categoryName));
    const heading = node('h3');
    heading.append(link(article.url, article.title));
    const byline = node('p', 'blog-byline', 'Por ');
    const authorLink = link(article.authorUrl, article.authorName);
    authorLink.rel = 'author';
    byline.append(authorLink);
    const read = link(article.url, 'Ler artigo ', 'text-link');
    const arrow = node('span', '', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    read.append(arrow);
    card.append(imageLink, category, heading, byline, node('p', 'blog-card-excerpt', article.excerpt), read);
    grid.append(card);
  }
  empty.hidden = results.length > 0;
})();
