const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');
const header = document.querySelector('.site-header');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
  document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 16), { passive: true });

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
      navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-40% 0px -52%', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.product-card').forEach((card) => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
    });
  });
});

document.querySelector('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = new FormData(event.currentTarget).get('name').trim();
  event.currentTarget.querySelector('.form-status').textContent = `${name}님, 메시지를 잘 받았어요. 따뜻한 답장으로 찾아갈게요!`;
  event.currentTarget.reset();
});

document.querySelector('#year').textContent = new Date().getFullYear();
