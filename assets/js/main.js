async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

let revealObserver = null;

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

function initHeaderScrollState() {
  const header = document.getElementById('site-header') || document.querySelector('.site-header');
  if (!header) return;

  const applyState = () => {
    if (window.scrollY > 24) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  applyState();
  window.addEventListener('scroll', applyState, { passive: true });
}

function initRevealAnimations() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach((node) => {
      node.classList.add('inview');
    });
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('inview');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  observeReveals();
}

function observeReveals() {
  if (!revealObserver) return;
  document.querySelectorAll('[data-reveal]').forEach((node) => {
    if (node.dataset.revealBound === '1') return;
    node.dataset.revealBound = '1';
    revealObserver.observe(node);
  });
}

function renderRichHtmlBlocks(content) {
  const absolutize = (html) =>
    String(html || '')
      .replace(/src="\/(?!\/)/g, 'src="https://tsiviskveli.ge/')
      .replace(/href="\/(?!\/)/g, 'href="https://tsiviskveli.ge/');

  document.querySelectorAll('[data-content-key]').forEach((node) => {
    const key = node.getAttribute('data-content-key');
    if (key && content[key]) {
      node.innerHTML = absolutize(content[key]);
    }
  });

  const mapFrame = document.querySelector('[data-map-frame]');
  if (mapFrame && content.map_src) {
    mapFrame.src = content.map_src;
  }
}

function absolutizeHtml(html) {
  return String(html || '')
    .replace(/src="\/(?!\/)/g, 'src="https://tsiviskveli.ge/')
    .replace(/href="\/(?!\/)/g, 'href="https://tsiviskveli.ge/');
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanProductName(item) {
  const descText = stripTags(item.description_html || '');
  if (descText.includes('დამზადებულია')) {
    const left = descText.split('დამზადებულია')[0].trim();
    if (left.length > 2 && left.length < 140) {
      return left.replace(/[.:-]+$/, '').trim();
    }
  }

  const title = String(item.title || '').replace(/\(ფასი.*?\)/g, '').trim();
  const fromTitle = title.replace(/\s*\d.*?ლარი.*$/i, '').trim();
  return fromTitle || title || 'პროდუქტი';
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = products
    .map((item, idx) => {
      const title = cleanProductName(item);
      const img = item.img_local || item.img || '';

      return `
      <article class="card product-full" data-reveal>
        <img src="${img}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy" />
        <div class="card-body">
          <h3>${title}</h3>
          <div class="meta">
            <button class="btn btn-primary product-open-btn" type="button" data-product-index="${idx}">ვრცლად</button>
          </div>
        </div>
      </article>`;
    })
    .join('');

  const total = document.getElementById('product-total');
  if (total) total.textContent = String(products.length);

  const modal = document.getElementById('product-modal');
  const modalOverlay = document.getElementById('product-modal-overlay');
  const modalClose = document.getElementById('product-modal-close');
  const modalTitle = document.getElementById('product-modal-title');
  const modalImage = document.getElementById('product-modal-image');
  const modalPrice = document.getElementById('product-modal-price');
  const modalDesc = document.getElementById('product-modal-description');

  if (!modal || !modalOverlay || !modalClose || !modalTitle || !modalImage || !modalPrice || !modalDesc) {
    observeReveals();
    return;
  }

  const openModal = (item) => {
    const name = cleanProductName(item);
    modalTitle.textContent = name;
    modalImage.src = item.img_local || item.img || '';
    modalImage.alt = name;
    modalPrice.textContent = (item.price_line || '').replace(/^ფასი:\s*/, '').trim() || '-';
    modalDesc.innerHTML = absolutizeHtml(item.description_html || '');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  grid.querySelectorAll('.product-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-product-index'));
      if (!Number.isNaN(idx) && products[idx]) {
        openModal(products[idx]);
      }
    });
  });

  modalOverlay.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  observeReveals();
}

function renderNews(newsItems) {
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  const limit = Number(grid.dataset.newsLimit || '0');
  const list = Number.isFinite(limit) && limit > 0 ? newsItems.slice(0, limit) : newsItems;

  grid.innerHTML = list
    .map(
      (item) => `
      <article class="card" data-reveal>
        <img src="${item.img}" alt="${String(item.title || '').replace(/"/g, '&quot;')}" loading="lazy" />
        <div class="card-body">
          <h3>${item.title || ''}</h3>
          <div class="rich-text">${absolutizeHtml(item.description_html || '')}</div>
          <a class="btn btn-outline" href="${item.href}" target="_blank" rel="noopener">ვრცლად</a>
        </div>
      </article>
    `
    )
    .join('');

  observeReveals();
}

function initServiceButtons(content) {
  const buttons = document.querySelectorAll('[data-service-key]');
  if (!buttons.length) return;

  const modal = document.getElementById('service-modal');
  const overlay = document.getElementById('service-modal-overlay');
  const closeBtn = document.getElementById('service-modal-close');
  const titleNode = document.getElementById('service-modal-title');
  const contentNode = document.getElementById('service-modal-content');

  if (!modal || !overlay || !closeBtn || !titleNode || !contentNode) return;

  const openModal = (title, html) => {
    titleNode.textContent = title;
    contentNode.innerHTML = absolutizeHtml(html || '');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-service-key');
      const title = btn.getAttribute('data-service-title') || btn.textContent.trim();
      openModal(title, key ? content[key] : '');
    });
  });

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function initContactForm() {
  const form = document.querySelector('form[action="#"]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('მადლობა, თქვენი შეტყობინება მიღებულია.');
    form.reset();
  });
}

async function initDataDrivenContent() {
  try {
    const [content, products, news] = await Promise.all([
      fetchJson('assets/data/content.json').catch(() => ({})),
      fetchJson('assets/data/products.json').catch(() => []),
      fetchJson('assets/data/news.json').catch(() => []),
    ]);

    renderRichHtmlBlocks(content);
    renderProducts(products);
    renderNews(news);
    initServiceButtons(content);
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeaderScrollState();
  initRevealAnimations();
  initContactForm();
  initDataDrivenContent();
});
