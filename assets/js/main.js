document.addEventListener('DOMContentLoaded', () => {
  const navBtn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (navBtn && nav) {
    navBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }
});
