'use strict';

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initSmoothScroll();
    initRipple();
  });

  function initNavbar() {
    const toggle = $('#nav-toggle');
    const links = $('#nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });

    $$('a', links).forEach((link) => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initRipple() {
    $$('.btn').forEach((btn) => {
      if (btn.type === 'submit') return;

      btn.addEventListener('click', function addRipple(event) {
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
})();
