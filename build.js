#!/usr/bin/env node
// Static-site build. Stitches partials/ + pages/ into dist/<route>/index.html.
//
// Usage:
//   node build.js
//   BASE_URL=https://example.com node build.js
//   BASE_URL=https://sickdancemoves.github.io/lf-preview node build.js   (GH Pages subpath)
//
// BASE_URL drives two things:
//   1) canonical / og:url in <head>
//   2) path prefix for all internal href/src/url() references (if BASE_URL has a path)
//      e.g. BASE_URL=https://x.com/sub  -> all internal links get '/sub' prefix

const fs = require('fs');
const path = require('path');
const { baseUrl, defaultLang, pages } = require('./pages.config.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Derive base path from BASE_URL. '' for root deployment, '/lf-preview' for subpath.
const basePath = (() => {
  try {
    const u = new URL(baseUrl);
    const p = u.pathname.replace(/\/$/, '');
    return p === '' ? '' : p;
  } catch {
    return '';
  }
})();

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

const headTpl = read('partials/head.html');
const navTpl = read('partials/nav.html');
const footerTpl = read('partials/footer.html');

function markActiveNav(nav, pageName) {
  return nav.replace(
    /<a\s([^>]*?)data-page="([^"]+)"([^>]*)>/g,
    (m, before, dp, after) => {
      if (dp !== pageName) return m;
      const all = before + after;
      if (/\sclass="/.test(all)) {
        return `<a ${(before + after).replace(/\sclass="([^"]*)"/, ' class="$1 active"')} data-page="${dp}">`;
      }
      return `<a class="active" ${before}data-page="${dp}"${after}>`;
    }
  );
}

function renderHead(page) {
  const canonical = `${baseUrl}${page.route}`.replace(/\/+$/, page.route === '/' ? '/' : '/');
  return headTpl
    .replace(/\{\{LANG\}\}/g, defaultLang)
    .replace(/\{\{TITLE\}\}/g, escapeAttr(page.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeAttr(page.description))
    .replace(/\{\{CANONICAL\}\}/g, canonical);
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// Rewrite internal URLs in HTML to honor basePath.
//   href="/X/"               -> href="{base}/X/"
//   src="/assets/X"          -> src="{base}/assets/X"
//   src="assets/X"           -> src="{base}/assets/X"   (relative refs that assumed root)
//   src="Main%20logo..."     -> src="{base}/Main%20logo..."
// Skips external (http://, https://, //, mailto:, tel:, #anchor) and the canonical/og:url tags (already absolute).
function rewriteHtmlUrls(html, base) {
  if (!base) {
    // Even with no base, normalize relative -> root-absolute so subroutes don't break.
    base = '';
  }
  // Root-absolute paths
  html = html.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${base}/`);
  // Common relative assets that we know live at the dist root
  html = html.replace(/(\s(?:href|src)=")(assets\/)/g, `$1${base}/$2`);
  html = html.replace(/(\s(?:href|src)=")(Main%20)/g, `$1${base}/$2`);
  // window.location.href='/X/' inside onclick attributes (CTA buttons)
  html = html.replace(/(location\.href=')\/(?!\/)/g, `$1${base}/`);
  return html;
}

// Rewrite CSS url() refs that assumed root. Output CSS lives at dist/assets/css/site.css.
function rewriteCssUrls(css, base) {
  return css.replace(/url\((['"]?)(assets\/)/g, `url($1${base}/$2`);
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
// Rewrite CSS url() refs after copy.
const cssOut = path.join(DIST, 'assets/css/site.css');
fs.writeFileSync(cssOut, rewriteCssUrls(fs.readFileSync(cssOut, 'utf8'), basePath));

// Root-level logo (has spaces in filename)
const logo = 'Main logo white (1).svg';
if (fs.existsSync(path.join(ROOT, logo))) {
  fs.copyFileSync(path.join(ROOT, logo), path.join(DIST, logo));
}

// .nojekyll prevents GitHub Pages from running Jekyll on the output.
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// ---------- Build each page ----------
for (const page of pages) {
  const body = read(`pages/${page.name}.html`);
  const nav = markActiveNav(navTpl, page.name);
  const head = renderHead(page);

  let html = `${head}<body data-lang="${defaultLang}">
${nav}
<main id="page-${page.name}">
${body}
</main>
${footerTpl}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;

  html = rewriteHtmlUrls(html, basePath);

  const outDir = page.route === '/' ? DIST : path.join(DIST, page.route);
  ensureDir(outDir);
  const outFile = path.join(outDir, 'index.html');
  fs.writeFileSync(outFile, html);
  const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`${page.route.padEnd(12)} -> ${path.relative(ROOT, outFile).padEnd(36)} ${sizeKb} KB`);
}

console.log(`\nBuilt ${pages.length} pages -> ${path.relative(ROOT, DIST)}/`);
console.log(`Base URL:  ${baseUrl}`);
console.log(`Base path: ${basePath || '(root)'}`);
