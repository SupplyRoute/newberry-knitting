const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');
const header = document.querySelector('.site-header');

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
  document.body.classList.remove('menu-open');
}

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

if (header) {
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
}

const heroScrubVideo = document.querySelector('[data-hero-scrub]');
if (heroScrubVideo) {
  const syncHeroVideo = () => {
    if (!Number.isFinite(heroScrubVideo.duration) || heroScrubVideo.duration <= 0) return;
    const hero = heroScrubVideo.closest('.hero');
    if (!hero) return;
    const start = hero.offsetTop;
    const distance = Math.max(hero.offsetHeight, 1);
    const progress = Math.min(Math.max((window.scrollY - start) / distance, 0), 1);
    const targetTime = progress * heroScrubVideo.duration;
    if (Math.abs(heroScrubVideo.currentTime - targetTime) > 0.035) {
      heroScrubVideo.currentTime = targetTime;
    }
  };

  let scrubFrame = 0;
  let lastScrubY = -1;
  let lastScrubWidth = -1;
  const requestHeroSync = () => {
    if (scrubFrame) return;
    scrubFrame = window.requestAnimationFrame(() => {
      scrubFrame = 0;
      syncHeroVideo();
    });
  };
  const watchHeroScroll = () => {
    if (window.scrollY !== lastScrubY || window.innerWidth !== lastScrubWidth) {
      lastScrubY = window.scrollY;
      lastScrubWidth = window.innerWidth;
      syncHeroVideo();
    }
    window.requestAnimationFrame(watchHeroScroll);
  };

  heroScrubVideo.addEventListener('loadedmetadata', syncHeroVideo);
  heroScrubVideo.addEventListener('loadeddata', syncHeroVideo);
  window.addEventListener('scroll', requestHeroSync, { passive: true });
  window.addEventListener('resize', requestHeroSync);
  syncHeroVideo();
  watchHeroScroll();
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.site-nav a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => {
        if (!link.hasAttribute('aria-current')) {
          link.classList.toggle('active', link.hash === `#${entry.target.id}`);
        }
      });
    }
  });
}, { rootMargin: '-40% 0px -52%', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

const formatPrice = (price) => `${new Intl.NumberFormat('ko-KR').format(Number(price) || 0)}원`;
const formatDate = (date) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(`${date}T00:00:00`));

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card reveal visible';

  const imageLink = document.createElement('a');
  imageLink.className = 'product-image';
  imageLink.href = product.url;
  imageLink.target = '_blank';
  imageLink.rel = 'noopener noreferrer';
  imageLink.setAttribute('aria-label', `${product.name} 구매 페이지 열기`);

  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.name;
  image.loading = 'lazy';
  image.width = 900;
  image.height = 1200;
  imageLink.append(image);

  if (product.soldOut) {
    const badge = document.createElement('span');
    badge.className = 'badge sold-out';
    badge.textContent = 'SOLD OUT';
    imageLink.append(badge);
  }

  const info = document.createElement('div');
  info.className = 'product-info';
  const details = document.createElement('div');
  const kind = document.createElement('p');
  kind.className = 'product-kind';
  kind.textContent = 'NEWBERRY KNITTING';
  const name = document.createElement('h3');
  name.textContent = product.name;
  const price = document.createElement('p');
  price.className = 'price';
  price.textContent = formatPrice(product.price);
  details.append(kind, name, price);

  const buyButton = document.createElement('a');
  buyButton.className = 'buy-button';
  buyButton.href = product.url;
  buyButton.textContent = '장바구니 담기';
  buyButton.dataset.cartAdd = '';
  buyButton.dataset.name = product.name;
  buyButton.dataset.price = String(product.price || 0);
  buyButton.dataset.url = product.url;
  buyButton.setAttribute('aria-label', `${product.name} 장바구니 담기`);
  info.append(details, buyButton);
  card.append(imageLink, info);
  return card;
}

async function loadProducts() {
  const grids = [...document.querySelectorAll('[data-products-grid]')];
  if (!grids.length) return;

  try {
    const response = await fetch('products.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Invalid products data');

    grids.forEach((grid) => {
      const limit = Number(grid.dataset.limit) || products.length;
      const featured = grid.dataset.featured === 'true';
      let selected = featured ? products.filter((product) => product.featured) : products;
      if (featured && !selected.length) selected = products;
      selected.slice(0, limit).forEach((product) => grid.append(createProductCard(product)));
      const status = grid.parentElement.querySelector('[data-products-status]');
      if (status) status.hidden = true;
      const count = grid.parentElement.querySelector('[data-product-count]');
      if (count) count.textContent = `${products.length} PRODUCTS`;
    });
  } catch (error) {
    document.querySelectorAll('[data-products-status]').forEach((status) => {
      status.textContent = '제품을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
    });
  }
}

function createHomeStoryCard(post) {
  const article = document.createElement('article');
  article.className = 'home-story-card reveal visible';
  const link = document.createElement('a');
  link.href = post.url ? `story/${post.url}` : `story/post.html?id=${encodeURIComponent(post.id || '')}`;
  if (post.image) {
    const media = document.createElement('div');
    media.className = 'home-story-media';
    const image = document.createElement('img');
    image.src = post.image;
    image.alt = post.imageAlt || post.title || '';
    image.loading = 'lazy';
    image.width = 1170;
    image.height = 2532;
    media.append(image);
    link.append(media);
  }
  const copy = document.createElement('div');
  copy.className = 'home-story-copy';
  const time = document.createElement('time');
  time.dateTime = post.date || '';
  time.textContent = formatDate(post.date);
  const title = document.createElement('h3');
  title.textContent = post.title || '(제목 없음)';
  const summary = document.createElement('p');
  summary.textContent = post.summary || '';
  const readMore = document.createElement('span');
  readMore.className = 'home-story-link';
  readMore.textContent = '읽어보기 →';
  copy.append(time, title, summary, readMore);
  link.append(copy);
  article.append(link);
  return article;
}

async function loadHomeStories() {
  const grid = document.querySelector('[data-home-stories]');
  if (!grid) return;
  const status = document.querySelector('[data-home-stories-status]');
  try {
    const response = await fetch('story/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const posts = await response.json();
    posts.slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 3)
      .forEach((post) => grid.append(createHomeStoryCard(post)));
    if (status) status.hidden = true;
  } catch (error) {
    if (status) status.textContent = '최신 이야기를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }
}

loadProducts();
loadHomeStories();

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') || '').trim();
    event.currentTarget.querySelector('.form-status').textContent = `${name}님, 메시지를 잘 받았어요. 따뜻한 답장으로 찾아갈게요!`;
    event.currentTarget.reset();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
