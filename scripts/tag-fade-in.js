#!/usr/bin/env node
// One-shot: tag elements with .fade-in-on-scroll (and data-stagger inside
// multi-card groups) across pages/. Safe to run multiple times — it skips
// elements that already carry the class.

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'pages');
const FADE = 'fade-in-on-scroll';

function addClassToTag(html, tagPattern) {
  // tagPattern is a regex; first capture group must be the existing class value.
  return html.replace(tagPattern, (match, classes) => {
    if (classes.split(/\s+/).includes(FADE)) return match;
    return match.replace(`class="${classes}"`, `class="${classes} ${FADE}"`);
  });
}

function addClassToBareTag(html, openRe) {
  // For bare tags with no class attribute (e.g. <h2><span...>).
  return html.replace(openRe, (match) => match.replace(/^</, '<').replace(/>$/, ` class="${FADE}">`));
}

// Stagger: inside a container, number occurrences of an opening tag.
// We rewrite each <article class="..."> with class+data-stagger.
function staggerInsideContainer(html, containerStart, containerEnd, itemOpenRe) {
  // Find each container block, then number items within.
  // containerStart and containerEnd are literal substrings, e.g. '<div class="intro-cards">' / '</div>'.
  // We do a careful slice-and-rebuild.
  let out = '';
  let i = 0;
  while (i < html.length) {
    const startIdx = html.indexOf(containerStart, i);
    if (startIdx < 0) { out += html.slice(i); break; }
    out += html.slice(i, startIdx);
    // Find the matching close by counting nested same-named tags.
    const openTagName = containerStart.match(/^<(\w+)/)[1];
    const reSame = new RegExp(`<\\/?${openTagName}\\b[^>]*>`, 'gi');
    reSame.lastIndex = startIdx + containerStart.length;
    let depth = 1;
    let endIdx = -1;
    let m;
    while ((m = reSame.exec(html)) !== null) {
      if (m[0].startsWith('</')) {
        depth--;
        if (depth === 0) { endIdx = m.index + m[0].length; break; }
      } else {
        depth++;
      }
    }
    if (endIdx < 0) {
      out += html.slice(startIdx);
      break;
    }
    let block = html.slice(startIdx, endIdx);
    let n = 0;
    block = block.replace(itemOpenRe, (match, classes) => {
      n++;
      if (classes.split(/\s+/).includes(FADE)) return match;
      return match.replace(`class="${classes}"`, `class="${classes} ${FADE}" data-stagger="${n}"`);
    });
    out += block;
    i = endIdx;
  }
  return out;
}

function transform(html) {
  // --- Section h2s with known classes ---
  html = addClassToTag(html, /<h2\s+class="(home-block__title[^"]*)"/g);
  html = addClassToTag(html, /<h2\s+class="(events-head__title[^"]*)"/g);
  html = addClassToTag(html, /<h2\s+class="(section-title[^"]*)"/g);
  // Note: cta-banner__title is NOT tagged — its parent <section class="cta-banner">
  // already fades in, and double-fading would compound the transform offset.

  // --- Bare h2s (no class) — about.html, events.html, careers.html ---
  html = html.replace(/<h2>(<span data-lang)/g, `<h2 class="${FADE}">$1`);
  html = html.replace(/<h2>(?!<span data-lang)/g, (m, offset, full) => {
    // Don't double-add if a class was added above
    return m;
  });

  // --- Special blocks ---
  html = addClassToTag(html, /<div\s+class="(laptop-photo)"/g);
  html = addClassToTag(html, /<section\s+class="(cta-banner[^"]*)"/g);

  // --- Card groups with stagger ---
  // intro-cards (3 on home, 6 on contapj)
  html = staggerInsideContainer(
    html,
    '<div class="intro-cards">',
    '</div>',
    /<article\s+class="(intro-card)"/g
  );
  // forwho-cards (4 on contapj)
  html = staggerInsideContainer(
    html,
    '<div class="forwho-cards">',
    '</div>',
    /<article\s+class="(forwho-card)"/g
  );
  // Review cards in the reviews carousel — they live inside .reviews-carousel__track
  html = staggerInsideContainer(
    html,
    '<div class="reviews-carousel__track">',
    '</div>',
    /<article\s+class="(review-card)"/g
  );
  // Event rows on events.html
  html = staggerInsideContainer(
    html,
    '<div class="events-rows">',
    '</div>',
    /<article\s+class="(event-row[^"]*)"/g
  );
  // List rows on blog.html / careers.html (these are <div>, not <article>).
  // \b after "list-row" prevents matching the plural "list-rows" container.
  html = staggerInsideContainer(
    html,
    '<div class="list-rows">',
    '</div>',
    /<div\s+class="(list-row\b[^"]*)"/g
  );

  return html;
}

// ---- Run on every page file ----
let totalAdded = 0;
for (const file of fs.readdirSync(PAGES_DIR)) {
  if (!file.endsWith('.html')) continue;
  const p = path.join(PAGES_DIR, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = transform(before);
  if (before === after) {
    console.log(`${file.padEnd(20)} (no change)`);
    continue;
  }
  fs.writeFileSync(p, after);
  const added = (after.match(/fade-in-on-scroll/g) || []).length - (before.match(/fade-in-on-scroll/g) || []).length;
  totalAdded += added;
  console.log(`${file.padEnd(20)} +${added} fade tags`);
}
console.log(`\nTotal fade tags added: ${totalAdded}`);
