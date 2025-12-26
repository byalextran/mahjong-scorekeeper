const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = 'dist';

// Clean and create dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR);

// Hash file contents and return first 8 chars
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

// Process assets
const jsHash = hashFile('app.js');
const cssHash = hashFile('styles.css');

const jsOutName = `app.${jsHash}.js`;
const cssOutName = `styles.${cssHash}.css`;

// Copy assets with hashed names
fs.copyFileSync('app.js', path.join(DIST_DIR, jsOutName));
fs.copyFileSync('styles.css', path.join(DIST_DIR, cssOutName));

// Update HTML references
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('href="styles.css"', `href="${cssOutName}"`);
html = html.replace('src="app.js"', `src="${jsOutName}"`);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);

console.log(`Built to ${DIST_DIR}/`);
console.log(`  ${cssOutName}`);
console.log(`  ${jsOutName}`);
console.log(`  index.html`);
