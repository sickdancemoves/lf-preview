#!/usr/bin/env node
// Static-site build. Stitches partials/ + pages/ into dist/<route>/index.html.
// Run with: node build.js   (BASE_URL=https://staging.example.com node build.js)

const fs = require('fs');
const path = require('path');
const { baseUrl, defaultLang, pages } = require('./pages.config.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

const headTpl = read('partials/head.html');
const navTpl = read('partials/nav.html');
const footerTpl = read('partials/footer.html');
const siteJs = read('assets/js/site.js');

function markActiveNav(nav, pageName) {
  // Mark <a data-page="X"> as active when X === pageName.
  return nav.replace(
    /<a\s([^>]*?)data-page="([^"]+)"([^>]*)>/g,
    (m, before, dp, after) => {
      if (dp !== pageName) return m;
      // If a class attribute already exists, append "active"; otherwise add one.
      const all = before + after;
      if (/\sclass="/.test(all)) {
        return `<a ${(before + after).replace(/\sclass="([^"]*)"/, ' class="$1 active"')} data-page="${dp}">`;
      }
      return `<a class="active" ${before}data-page="${dp}"${after}>`;
    }
  );
}

function renderHead(page) {
  const canonical = `${baseUrl}${page.route}`;
  return headTpl
    .replace(/\{\{LANG\}\}/g, defaultLang)
    .replace(/\{\{TITLE\}\}/g, escapeAttr(page.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeAttr(page.description))
    .replace(/\{\{CANONICAL\}\}/g, canonical);
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ---------- Clean and prepare dist/ ----------
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
ensureDir(DIST);

// ---------- Copy static assets ----------
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
// Root-level logo (has spaces in filename — keep as-is so existing src="Main%20logo..." resolves)
const logo = 'Main logo white (1).svg';
if (fs.existsSync(path.join(ROOT, logo))) {
  fs.copyFileSync(path.join(ROOT, logo), path.join(DIST, logo));
}

// ---------- Build each page ----------
for (const page of pages) {
  const body = read(`pages/${page.name}.html`);
  const nav = markActiveNav(navTpl, page.name);
  const head = renderHead(page);

  const html = `${head}<body data-lang="${defaultLang}">
${nav}
<main id="page-${page.name}">
${body}
</main>
${footerTpl}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;

  const outDir = page.route === '/' ? DIST : path.join(DIST, page.route);
  ensureDir(outDir);
  const outFile = path.join(outDir, 'index.html');
  fs.writeFileSync(outFile, html);
  const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`${page.route.padEnd(12)} -> ${path.relative(ROOT, outFile).padEnd(36)} ${sizeKb} KB`);
}

console.log(`\nBuilt ${pages.length} pages -> ${path.relative(ROOT, DIST)}/`);
console.log(`Base URL: ${baseUrl}`);
