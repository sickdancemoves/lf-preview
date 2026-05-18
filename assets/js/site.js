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
