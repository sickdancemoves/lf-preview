#!/usr/bin/env node
// One-time migration: split index.html into partials/, pages/, and assets/css|js.
// After this runs successfully and partials/ + pages/ are committed,
// this file can be deleted — build.js is the production build script.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');

const URLS = {
  home: '/',
  contapj: '/contapj/',
  about: '/about/',
  events: '/events/',
  blog: '/blog/',
  careers: '/careers/',
  faqs: '/faqs/',
  contact: '/contact/',
};

const PAGE_ORDER = ['home', 'contapj', 'about', 'events', 'blog', 'careers', 'faqs', 'contact'];

const src = fs.readFileSync(SRC, 'utf8');

function slice(start, end) {
  const a = src.indexOf(start);
  if (a < 0) throw new Error(`marker not found: ${start}`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`end marker not found after ${start}: ${end}`);
  return src.slice(a, b + end.length);
}

function inner(block, open, close) {
  const a = block.indexOf(open);
  const b = block.lastIndexOf(close);
  return block.slice(a + open.length, b);
}

// ---------- CSS ----------
const styleBlock = slice('<style>', '</style>');
let css = inner(styleBlock, '<style>', '</style>');

// Strip preview chrome rules (Lines 35-79 region in original).
// We detect by the leading comment and strip until just before "/* ==== Display type system ==== */".
css = css.replace(
  /\s*\/\* ==== Preview chrome \(NOT part of the site\) ==== \*\/[\s\S]*?(?=\/\* ==== Display type system ==== \*\/)/,
  '\n\n  '
);

// Strip .page display rules that only existed for the hash router.
css = css.replace(/\s*\.page\s*\{\s*display:\s*none;\s*\}\s*\n/, '\n');
css = css.replace(/\s*\.page\.active\s*\{\s*display:\s*block;\s*\}\s*\n/, '\n');

fs.mkdirSync(path.join(ROOT, 'assets/css'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets/css/site.css'), css.trim() + '\n');

// ---------- JS ----------
const scriptBlock = slice('<script>', '</script>');
let js = inner(scriptBlock, '<script>', '</script>');

// Strip the goTo() router and its event listeners. Keep everything from
// "// Scale the MacBook photo stage" onward (3648+ in original).
const macbookMarker = '// Scale the MacBook photo stage';
const mIdx = js.indexOf(macbookMarker);
if (mIdx < 0) throw new Error('macbook marker not found in JS');
js = js.slice(mIdx);

fs.mkdirSync(path.join(ROOT, 'assets/js'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets/js/site.js'), js.trim() + '\n');

// ---------- Transform goTo() onclicks ----------
function transformGoTo(html) {
  // <a ... onclick="goTo('X')" ...>  ->  <a ... href="/X/" ...>
  html = html.replace(
    /(<a\s[^>]*?)\s*onclick="goTo\('([^']+)'\)"/g,
    (_, before, page) => `${before} href="${URLS[page] || '/'}"`
  );
  // <button ... onclick="goTo('X')" ...>  ->  <button ... onclick="location.href='/X/'" ...>
  html = html.replace(
    /(<button\s[^>]*?)\s*onclick="goTo\('([^']+)'\)"/g,
    (_, before, page) => `${before} onclick="location.href='${URLS[page] || '/'}'"`
  );
  return html;
}

// ---------- Header (nav) partial ----------
const headerBlock = slice('<header class="header">', '</header>');
const navHtml = transformGoTo(headerBlock);
fs.mkdirSync(path.join(ROOT, 'partials'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'partials/nav.html'), navHtml + '\n');

// ---------- Footer partial ----------
const footerBlock = slice('<footer class="footer">', '</footer>');
const footerHtml = transformGoTo(footerBlock);
fs.writeFileSync(path.join(ROOT, 'partials/footer.html'), footerHtml + '\n');

// ---------- Page bodies ----------
fs.mkdirSync(path.join(ROOT, 'pages'), { recursive: true });
for (const name of PAGE_ORDER) {
  const openA = `<div class="page active" id="page-${name}">`;
  const openB = `<div class="page" id="page-${name}">`;
  const open = src.includes(openA) ? openA : openB;
  const openIdx = src.indexOf(open);
  if (openIdx < 0) throw new Error(`page section not found: ${name}`);

  // Find matching </div> by counting <div> nesting from openIdx.
  let i = openIdx + open.length;
  let depth = 1;
  const reDiv = /<\/?div\b[^>]*>/gi;
  reDiv.lastIndex = i;
  let m;
  while ((m = reDiv.exec(src)) !== null) {
    if (m[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        i = m.index;
        break;
      }
    } else {
      depth++;
    }
  }
  if (depth !== 0) throw new Error(`unbalanced div for page: ${name}`);

  const body = src.slice(openIdx + open.length, i);
  const transformed = transformGoTo(body).trim();
  fs.writeFileSync(path.join(ROOT, 'pages', `${name}.html`), transformed + '\n');
}

// ---------- head.html template ----------
const headTemplate = `<!DOCTYPE html>
<html lang="{{LANG}}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESCRIPTION}}">
<link rel="canonical" href="{{CANONICAL}}">
<meta property="og:type" content="website">
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{DESCRIPTION}}">
<meta property="og:url" content="{{CANONICAL}}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
`;
fs.writeFileSync(path.join(ROOT, 'partials/head.html'), headTemplate);

// ---------- Summary ----------
const sizes = {
  'assets/css/site.css': fs.statSync(path.join(ROOT, 'assets/css/site.css')).size,
  'assets/js/site.js': fs.statSync(path.join(ROOT, 'assets/js/site.js')).size,
  'partials/nav.html': fs.statSync(path.join(ROOT, 'partials/nav.html')).size,
  'partials/footer.html': fs.statSync(path.join(ROOT, 'partials/footer.html')).size,
  'partials/head.html': fs.statSync(path.join(ROOT, 'partials/head.html')).size,
};
for (const name of PAGE_ORDER) {
  sizes[`pages/${name}.html`] = fs.statSync(path.join(ROOT, 'pages', `${name}.html`)).size;
}
for (const [k, v] of Object.entries(sizes)) {
  console.log(`${k.padEnd(28)} ${String(v).padStart(8)} bytes`);
}
console.log('\nExtraction complete.');
