/**
 * build.js
 * Genera dist/migrador.html incrustando:
 *   1. SheetJS (xlsx) desde CDN o node_modules
 *   2. config/tablas-universales.json como window.TABLAS_UNIVERSALES
 *   3. config/valores-fijos.json    como window.VALORES_FIJOS
 *   4. src/xlsx-io.js, src/codificacion.js, src/catalogos.js, src/transformar.js
 *
 * Uso:
 *   node build.js
 *
 * El HTML resultante funciona como file:// sin necesidad de servidor.
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const ROOT    = __dirname;
const DIST    = path.join(ROOT, 'dist');
const OUT     = path.join(DIST, 'migrador.html');
// Copia publicable por GitHub Pages (sirve desde la carpeta /docs de la rama)
const DOCS        = path.join(ROOT, 'docs');
const OUT_PAGES   = path.join(DOCS, 'index.html');

// ── Fuentes ────────────────────────────────────────────────────────
const TEMPLATE  = path.join(ROOT, 'src', 'index.html');
const JS_MODS   = [
  path.join(ROOT, 'src', 'xlsx-io.js'),
  path.join(ROOT, 'src', 'codificacion.js'),
  path.join(ROOT, 'src', 'catalogos.js'),
  path.join(ROOT, 'src', 'transformar.js'),
];
const TABLAS_JSON  = path.join(ROOT, 'config', 'tablas-universales.json');
const FIJOS_JSON   = path.join(ROOT, 'config', 'valores-fijos.json');

// URL de SheetJS (CDN) — fallback a node_modules si existe
const SHEETJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const SHEETJS_LOCAL = path.join(ROOT, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js');

// ── Helpers ────────────────────────────────────────────────────────
function readFile(p) {
  return fs.readFileSync(p, 'utf-8');
}
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function getSheetJS() {
  if (fs.existsSync(SHEETJS_LOCAL)) {
    console.log('  SheetJS: usando node_modules local');
    return readFile(SHEETJS_LOCAL);
  }
  console.log('  SheetJS: descargando desde CDN…');
  return await fetchUrl(SHEETJS_CDN);
}

// ── Build ──────────────────────────────────────────────────────────
/** Inyecta los módulos JS y JSON en un HTML base. */
function injectModules(html, sheetjsBlock, tablas, fijos) {
  const modNames = ['XLSX_IO', 'CODIFICACION', 'CATALOGOS', 'TRANSFORMAR'];
  html = html
    .replace('<!-- {{SHEETJS_PLACEHOLDER}} -->',      sheetjsBlock)
    .replace('<!-- {{TABLAS_PLACEHOLDER}} -->',        `<script>\nwindow.TABLAS_UNIVERSALES = ${tablas};\n</script>`)
    .replace('<!-- {{VALORES_FIJOS_PLACEHOLDER}} -->', `<script>\nwindow.VALORES_FIJOS = ${fijos};\n</script>`);
  JS_MODS.forEach((modPath, i) => {
    html = html.replace(
      `<!-- {{${modNames[i]}_PLACEHOLDER}} -->`,
      `<script>\n${readFile(modPath)}\n</script>`
    );
  });
  return html;
}

async function build() {
  console.log('\n🔨  Migrador Meta4→AXTON — Build\n');

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS);

  const template = readFile(TEMPLATE);
  const tablas   = readFile(TABLAS_JSON);
  const fijos    = readFile(FIJOS_JSON);

  // ── dist/migrador.html: SheetJS embebido inline (funciona offline) ──
  const sheetjs = await getSheetJS();
  const htmlOffline = injectModules(
    template,
    `<script>\n${sheetjs}\n</script>`,
    tablas, fijos
  );
  fs.writeFileSync(OUT, htmlOffline, 'utf-8');
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`  ✓ dist/migrador.html generado (${kb} KB, offline-ready)`);

  // ── docs/index.html: SheetJS via CDN <script src> (GitHub Pages) ──
  // Cargar via CDN es más confiable que embeber 800 KB inline en HTTPS.
  const sheetjsCdnTag = `<script src="${SHEETJS_CDN}" crossorigin="anonymous"></script>`;
  const htmlPages = injectModules(template, sheetjsCdnTag, tablas, fijos);
  fs.writeFileSync(OUT_PAGES, htmlPages, 'utf-8');
  const kbP = (fs.statSync(OUT_PAGES).size / 1024).toFixed(1);
  console.log(`  ✓ docs/index.html generado (${kbP} KB, CDN SheetJS para GitHub Pages)`);

  console.log('\n✅  Build completo\n');
  console.log('  Offline:      dist/migrador.html  (abrir como file://)');
  console.log('  GitHub Pages: docs/index.html     (requiere internet)\n');
}

build().catch(err => {
  console.error('❌  Build fallido:', err.message);
  process.exit(1);
});
