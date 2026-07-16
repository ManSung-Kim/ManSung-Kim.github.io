document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  const year = document.querySelector('#year');
  const gameRoot = document.querySelector('#games');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open');
    });

    siteNav.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement && window.innerWidth <= 760) {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-open');
      }
    });
  }

  if (gameRoot && window.SnakeGame) {
    window.snakeGame = new window.SnakeGame(gameRoot);
  }
});
