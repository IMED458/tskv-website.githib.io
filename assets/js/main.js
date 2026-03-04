async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function initMobileNav() {
  const navBtn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (!navBtn || !nav) return;

  navBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function renderRichHtmlBlocks(content) {
  const absolutize = (html) =>
    html
      .replace(/src="\/(?!\/)/g, 'src="https://tsiviskveli.ge/')
      .replace(/href="\/(?!\/)/g, 'href="https://tsiviskveli.ge/');

  document.querySelectorAll('[data-content-key]').forEach((node) => {
    const key = node.getAttribute('data-content-key');
    if (content[key]) node.innerHTML = absolutize(content[key]);
  });

  const mapFrame = document.querySelector('[data-map-frame]');
  if (mapFrame && content.map_src) mapFrame.src = content.map_src;
}

function absolutizeHtml(html) {
  return String(html || '')
    .replace(/src="\/(?!\/)/g, 'src="https://tsiviskveli.ge/')
    .replace(/href="\/(?!\/)/g, 'href="https://tsiviskveli.ge/');
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = products
    .map((item) => {
      const price = item.price_line || '';
      const title = item.title || '';
      const desc = absolutizeHtml(item.description_html || '');
      const img = item.img_local || item.img || '';
      const href = item.href || '#';

      return `
      <article class="card product-full">
        <img src="${img}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy" />
        <div class="card-body">
          <h3>${title}</h3>
          <div class="price-line"><strong>ფასი:</strong> ${price.replace(/^ფასი:\s*/,'')}</div>
          <div class="rich-text"><strong>აღწერა:</strong> ${desc}</div>
        </div>
      </article>`;
    })
    .join('');

  const total = document.getElementById('product-total');
  if (total) total.textContent = String(products.length);
}

function renderNews(newsItems) {
  const grid = document.getElementById('news-grid');
  if (!grid) return;
  grid.innerHTML = newsItems
    .map((item) => `
      <article class="card">
        <img src="${item.img}" alt="${item.title.replace(/"/g, '&quot;')}" loading="lazy" />
        <div class="card-body">
          <h3>${item.title}</h3>
          <div class="rich-text">${absolutizeHtml(item.description_html || '')}</div>
          <a class="btn btn-outline" href="${item.href}" target="_blank" rel="noopener">ვრცლად</a>
        </div>
      </article>
    `)
    .join('');
}

async function initDataDrivenContent() {
  try {
    const [content, products, news] = await Promise.all([
      fetchJson('assets/data/content.json'),
      fetchJson('assets/data/products.json'),
      fetchJson('assets/data/news.json').catch(() => []),
    ]);

    renderRichHtmlBlocks(content);
    renderProducts(products);
    renderNews(news);
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initDataDrivenContent();
});
