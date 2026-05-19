(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function initNavbar() {
    const toggle = $('#nav-toggle');
    const links = $('#nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const isOpen = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    $$('a', links).forEach((link) => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const selector = link.getAttribute('href');
        if (!selector || selector === '#') return;

        const target = document.querySelector(selector);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initRipple() {
    $$('.btn').forEach((btn) => {
      if (btn.type === 'submit') return;

      btn.addEventListener('click', function (event) {
        const circle = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        circle.classList.add('ripple');
        circle.style.width = circle.style.height = `${size}px`;
        circle.style.left = `${event.clientX - rect.left - size / 2}px`;
        circle.style.top = `${event.clientY - rect.top - size / 2}px`;

        this.appendChild(circle);
        circle.addEventListener('animationend', () => circle.remove());
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initSmoothScroll();
    initRipple();
  });
})();
