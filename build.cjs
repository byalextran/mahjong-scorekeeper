const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = 'dist';

// Clean and create dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR);

// Remove 'export ' and 'export default ' from module code
function stripExports(code) {
  return code
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '');
}

// Remove import statements from code (handles multi-line imports)
function stripImports(code) {
  // Single-line imports
  code = code.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  // Multi-line imports: import { ... } from '...'
  code = code.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"].*?['"];?\s*$/gm, '');
  return code;
}

// Read and process a module file (strips imports and exports)
function processFullModule(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  return stripExports(stripImports(code));
}

// Bundle modules in dependency order
function bundle() {
  // constants.js - include everything (all are used by app.js)
  const constants = processFullModule('src/constants.js');

  // gameLogic.js - include everything (no naming conflicts after refactoring)
  const gameLogic = processFullModule('src/gameLogic.js');

  // version.js - include everything
  const version = processFullModule('version.js');

  // app.js - strip imports
  const app = stripImports(fs.readFileSync('app.js', 'utf8'));

  // Concatenate in dependency order
  return [
    '// Bundled for production',
    '',
    '// === src/constants.js ===',
    constants,
    '// === src/gameLogic.js ===',
    gameLogic,
    '',
    '// === version.js ===',
    version,
    '// === app.js ===',
    app,
  ].join('\n');
}

// Create bundled JS
const bundledJS = bundle();
const jsHash = crypto.createHash('md5').update(bundledJS).digest('hex').slice(0, 8);
const jsOutName = `app.${jsHash}.js`;

// Process CSS
const css = fs.readFileSync('styles.css');
const cssHash = crypto.createHash('md5').update(css).digest('hex').slice(0, 8);
const cssOutName = `styles.${cssHash}.css`;

// Write bundled JS and CSS
fs.writeFileSync(path.join(DIST_DIR, jsOutName), bundledJS);
fs.copyFileSync('styles.css', path.join(DIST_DIR, cssOutName));

// Update HTML references
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('href="styles.css"', `href="${cssOutName}"`);
html = html.replace('src="app.js"', `src="${jsOutName}"`);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);

console.log(`Built to ${DIST_DIR}/`);
console.log(`  ${cssOutName}`);
console.log(`  ${jsOutName} (bundled)`);
console.log(`  index.html`);
