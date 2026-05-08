/* Public site interactions shared by all non-admin pages. */
(function (window, document) {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function initRipple() {
    $$('.btn').forEach((btn) => {
      if (btn.type === 'submit') return;
      btn.addEventListener('click', function (e) {
        const circle = document.createElement('span');
        circle.classList.add('ripple');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = `${size}px`;
        circle.style.left = `${e.clientX - rect.left - size / 2}px`;
        circle.style.top = `${e.clientY - rect.top - size / 2}px`;
        this.appendChild(circle);
        circle.addEventListener('animationend', () => circle.remove());
      });
    });
  }

  function initNavbar() {
    const toggle = $('#nav-toggle');
    const links = $('#nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const isOpen = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    $$('a', links).forEach((a) => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function onReady(callback) {
    document.addEventListener('DOMContentLoaded', callback);
  }

  window.LGPublic = Object.freeze({
    $,
    $$,
    onReady,
  });

  onReady(() => {
    initNavbar();
    initSmoothScroll();
    initRipple();
  });
})(window, document);
