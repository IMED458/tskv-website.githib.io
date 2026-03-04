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

  const stripTags = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const cleanName = (item) => {
    const descText = stripTags(item.description_html || "");
    if (descText.includes("დამზადებულია")) {
      const left = descText.split("დამზადებულია")[0].trim();
      if (left.length > 2 && left.length < 140) return left.replace(/[.:-]+$/, "").trim();
    }
    const title = String(item.title || "").replace(/\(ფასი.*?\)/g, "").trim();
    const fromTitle = title.replace(/\s*\d.*?ლარი.*$/i, "").trim();
    return fromTitle || title || "პროდუქტი";
  };

  grid.innerHTML = products
    .map((item, idx) => {
      const title = cleanName(item);
      const img = item.img_local || item.img || "";

      return `
      <article class="card product-full">
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

  const modal = document.getElementById("product-modal");
  const modalOverlay = document.getElementById("product-modal-overlay");
  const modalClose = document.getElementById("product-modal-close");
  const modalTitle = document.getElementById("product-modal-title");
  const modalImage = document.getElementById("product-modal-image");
  const modalPrice = document.getElementById("product-modal-price");
  const modalDesc = document.getElementById("product-modal-description");

  if (!modal || !modalOverlay || !modalClose || !modalTitle || !modalImage || !modalPrice || !modalDesc) return;

  const openModal = (item) => {
    modalTitle.textContent = cleanName(item);
    modalImage.src = item.img_local || item.img || "";
    modalImage.alt = cleanName(item);
    modalPrice.textContent = (item.price_line || "").replace(/^ფასი:\s*/, "").trim();
    modalDesc.innerHTML = absolutizeHtml(item.description_html || "");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  grid.querySelectorAll(".product-open-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-product-index"));
      if (!Number.isNaN(idx) && products[idx]) openModal(products[idx]);
    });
  });

  modalOverlay.addEventListener("click", closeModal);
  modalClose.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });
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
