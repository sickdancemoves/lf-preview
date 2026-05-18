// Scale the MacBook photo stage (fixed 1200×800 with matrix3d) to fit its responsive wrapper
(function () {
  const wraps = document.querySelectorAll('.laptop-photo');
  if (!wraps.length) return;
  function sync(wrap) {
    const stage = wrap.querySelector('.laptop-photo__stage');
    if (!stage) return;
    const scale = wrap.offsetWidth / 1200;
    stage.style.transform = 'scale(' + scale + ')';
  }
  const ro = new ResizeObserver(entries => entries.forEach(e => sync(e.target)));
  wraps.forEach(w => { sync(w); ro.observe(w); });
})();

// Header dropdown menus — JS-driven open/close (hover + click + ESC + click-outside)
(function () {
  const items = document.querySelectorAll('.header__menu-item.has-submenu');
  if (items.length === 0) return;
  const CLOSE_DELAY = 120;

  function closeAll(except) {
    items.forEach(i => { if (i !== except) i.classList.remove('is-open'); });
  }

  items.forEach(item => {
    const trigger = item.querySelector(':scope > a');
    let timer = null;
    function open() { clearTimeout(timer); closeAll(item); item.classList.add('is-open'); }
    function close() { clearTimeout(timer); item.classList.remove('is-open'); }
    function closeSoon() { clearTimeout(timer); timer = setTimeout(close, CLOSE_DELAY); }

    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', closeSoon);
    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (item.classList.contains('is-open')) close();
      else open();
    });
    // Close after picking a submenu item
    item.querySelectorAll('.submenu a').forEach(a => {
      a.addEventListener('click', () => setTimeout(close, 0));
    });
  });

  document.addEventListener('click', e => {
    if (![...items].some(i => i.contains(e.target))) closeAll(null);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll(null);
  });
})();

// Language switcher
(function () {
  const root = document.getElementById('langSwitch');
  if (!root) return;
  const toggle = root.querySelector('.lang-switch__toggle');
  const current = document.getElementById('langCurrent');
  const options = root.querySelectorAll('.lang-switch__option');

  const stored = localStorage.getItem('lf-lang');
  setLang(stored === 'en' ? 'en' : 'pt');

  function setLang(lang) {
    document.body.dataset.lang = lang;
    current.textContent = lang.toUpperCase();
    options.forEach(o => o.classList.toggle('is-active', o.dataset.langSet === lang));
    toggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    document.querySelectorAll('[data-placeholder-' + lang + ']').forEach(el => {
      el.placeholder = el.dataset['placeholder' + lang.charAt(0).toUpperCase() + lang.slice(1)];
    });
    localStorage.setItem('lf-lang', lang);
  }

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const open = root.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  options.forEach(o => o.addEventListener('click', () => setLang(o.dataset.langSet)));
  document.addEventListener('click', e => {
    if (!root.contains(e.target)) {
      root.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// FAQs page: search + topic filtering
(function () {
  const list = document.getElementById('faqs-list');
  const search = document.getElementById('faqs-search-input');
  const topics = document.getElementById('faqs-topics');
  if (!list || !search || !topics) return;

  let activeTopic = 'all';

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    const items = list.querySelectorAll('.faq-item');
    let visible = 0;
    items.forEach(item => {
      const topic = (item.dataset.topic || '').toLowerCase();
      const text = item.textContent.toLowerCase();
      const matchesTopic = activeTopic === 'all' || topic === activeTopic.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      const show = matchesTopic && matchesQuery;
      item.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    list.classList.toggle('is-empty', visible === 0);
  }

  search.addEventListener('input', applyFilter);
  topics.addEventListener('click', e => {
    const btn = e.target.closest('.faqs-topic');
    if (!btn) return;
    topics.querySelectorAll('.faqs-topic').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeTopic = btn.dataset.topic || 'all';
    applyFilter();
  });
})();

// Reviews carousel — auto-rotating with arrows + dots
(function () {
  document.querySelectorAll('.js-reviews-carousel').forEach(root => {
    const viewport = root.querySelector('.reviews-carousel__viewport');
    const track = root.querySelector('.reviews-carousel__track');
    const cards = Array.from(track.children);
    const dotsHost = root.querySelector('.reviews-carousel__dots');
    const arrows = root.querySelectorAll('.reviews-carousel__arrow');
    if (!viewport || !track || cards.length === 0) return;

    let current = 0;
    let timer = null;
    const INTERVAL = 5000;

    function pageCount() {
      const cardWidth = cards[0].getBoundingClientRect().width;
      const visible = Math.max(1, Math.round(viewport.getBoundingClientRect().width / cardWidth));
      return Math.max(1, cards.length - visible + 1);
    }

    function renderDots() {
      const count = pageCount();
      dotsHost.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'reviews-carousel__dot' + (i === current ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Página ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsHost.appendChild(dot);
      }
    }

    function goTo(index) {
      const count = pageCount();
      current = ((index % count) + count) % count;
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = 16;
      track.style.transform = `translateX(-${current * (cardWidth + gap)}px)`;
      dotsHost.querySelectorAll('.reviews-carousel__dot').forEach((d, i) => {
        d.classList.toggle('is-active', i === current);
      });
    }

    function start() { stop(); timer = setInterval(() => goTo(current + 1), INTERVAL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    arrows.forEach(btn => btn.addEventListener('click', () => {
      goTo(current + Number(btn.dataset.dir));
      start();
    }));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { renderDots(); goTo(0); }, 150);
    });

    renderDots();
    goTo(0);
    start();
  });
})();

// Scroll-triggered animations: fade-in for tagged elements + dashboard
// count-up sequence. Single IntersectionObserver handles both, with
// per-element thresholds. Each target fires once and is unobserved.
(function () {
  const fadeEls = document.querySelectorAll('.fade-in-on-scroll');
  const dash = document.querySelector('.dash-mock');
  if (!fadeEls.length && !dash) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  // Brazilian currency formatter (created once, reused per frame).
  const BRL = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ---- Dashboard helpers ----
  function setBalanceTo(rootEl, value) {
    const intEl = rootEl.querySelector('.dash-mock__balance-int');
    const centsEl = rootEl.querySelector('.dash-mock__cents');
    const fixed = value.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    if (intEl) intEl.textContent = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (centsEl) centsEl.textContent = ',' + decPart;
  }

  function setStatTo(el, value) {
    const prefix = el.dataset.prefix || '';
    el.textContent = prefix + BRL.format(value);
  }

  // ease-out cubic
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function countUp(el, target, duration, writeFn) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      writeFn(el, target * easeOut(t));
      if (t < 1) requestAnimationFrame(tick);
      else writeFn(el, target); // snap to exact final value
    }
    requestAnimationFrame(tick);
  }

  function runDashboardSequence(root) {
    const balance = root.querySelector('.dash-mock__balance');
    const stats = root.querySelectorAll('.dash-mock__stat[data-count-up]');
    const rows = root.querySelector('.dash-mock__rows');

    if (reduced) {
      // Show final values instantly, skip pulse (handled by reduced-motion CSS).
      if (balance) {
        setBalanceTo(balance, parseFloat(balance.dataset.countUp));
        balance.classList.add('is-counting');
      }
      stats.forEach(s => {
        setStatTo(s, parseFloat(s.dataset.countUp));
        s.classList.add('is-counting');
      });
      if (rows) rows.classList.add('is-revealed');
      return;
    }

    // Balance: start at zero, count up over 1.2s, then add .is-live for pulse.
    if (balance) {
      setBalanceTo(balance, 0);
      balance.classList.add('is-counting');
      countUp(balance, parseFloat(balance.dataset.countUp), 1200, setBalanceTo);
      setTimeout(() => balance.classList.add('is-live'), 1200);
    }

    // Transaction rows: CSS handles the per-child 150ms stagger.
    if (rows) rows.classList.add('is-revealed');

    // Stat cards: kick off 800ms after dashboard enters viewport.
    setTimeout(() => {
      stats.forEach(s => {
        setStatTo(s, 0);
        s.classList.add('is-counting');
        countUp(s, parseFloat(s.dataset.countUp), 1200, setStatTo);
      });
    }, 800);
  }

  // ---- Fallbacks (reduced-motion or no IntersectionObserver) ----
  if (reduced || !hasIO) {
    fadeEls.forEach(el => el.classList.add('is-visible'));
    if (dash) runDashboardSequence(dash);
    return;
  }

  // ---- Single observer with multiple thresholds ----
  const viewportH = window.innerHeight;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const required = parseFloat(entry.target.dataset.observeThreshold || '0.15');
      if (entry.intersectionRatio < required) return;
      if (entry.target === dash) {
        runDashboardSequence(entry.target);
      } else {
        entry.target.classList.add('is-visible');
      }
      obs.unobserve(entry.target);
    });
  }, { threshold: [0.15, 0.3] });

  // Observe fade-in elements (default threshold 0.15).
  fadeEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportH * 0.9) {
      el.classList.remove('fade-in-on-scroll');
      return;
    }
    observer.observe(el);
  });

  // Observe dashboard (threshold 0.3).
  if (dash) {
    dash.dataset.observeThreshold = '0.3';
    observer.observe(dash);
  }
})();
