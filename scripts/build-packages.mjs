import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const buildDir = path.join(root, 'build');
const iconsDir = path.join(root, 'assets', 'icons');
const sitePng = '/opt/mmmsearch/frontend/public/icon-512.png';
const siteSvg = '/opt/mmmsearch/frontend/public/icon.svg';
const sizes = [16, 32, 48, 64, 96, 128, 192, 512];
const chromeManifest = path.join(root, 'manifest.json');
const firefoxManifest = path.join(root, 'manifest.firefox.json');
const version = JSON.parse(fs.readFileSync(chromeManifest, 'utf8')).version;
const commonFiles = ['background.js', 'bridge.js', 'page-extractor.js'];

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });
fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(buildDir, { recursive: true });

for (const size of sizes) {
  execFileSync('convert', [sitePng, '-resize', `${size}x${size}`, path.join(iconsDir, `icon-${size}.png`)]);
}
fs.copyFileSync(siteSvg, path.join(iconsDir, 'icon.svg'));

function prepareTarget(name, manifestPath) {
  const targetDir = path.join(buildDir, name);
  fs.mkdirSync(path.join(targetDir, 'assets', 'icons'), { recursive: true });
  for (const file of commonFiles) fs.copyFileSync(path.join(root, file), path.join(targetDir, file));
  for (const size of sizes) {
    fs.copyFileSync(path.join(iconsDir, `icon-${size}.png`), path.join(targetDir, 'assets', 'icons', `icon-${size}.png`));
  }
  fs.copyFileSync(path.join(iconsDir, 'icon.svg'), path.join(targetDir, 'assets', 'icons', 'icon.svg'));
  fs.copyFileSync(manifestPath, path.join(targetDir, 'manifest.json'));
  return targetDir;
}

const chromeDir = prepareTarget('chrome', chromeManifest);
const firefoxDir = prepareTarget('firefox', firefoxManifest);

const stableChromeZip = path.join(distDir, 'mmmsearch-social-helper-chrome.zip');
const stableFirefoxXpi = path.join(distDir, 'mmmsearch-social-helper-firefox.xpi');
const versionedChromeZip = path.join(distDir, `mmmsearch-social-helper-chrome-v${version}.zip`);
const versionedFirefoxXpi = path.join(distDir, `mmmsearch-social-helper-firefox-v${version}.xpi`);

for (const file of [stableChromeZip, stableFirefoxXpi, versionedChromeZip, versionedFirefoxXpi]) {
  fs.rmSync(file, { force: true });
}

execFileSync('zip', ['-qr', stableChromeZip, '.'], { cwd: chromeDir });
execFileSync('zip', ['-qr', stableFirefoxXpi, '.'], { cwd: firefoxDir });
fs.copyFileSync(stableChromeZip, versionedChromeZip);
fs.copyFileSync(stableFirefoxXpi, versionedFirefoxXpi);

console.log(`Built Chrome package: ${stableChromeZip}`);
console.log(`Built Firefox package: ${stableFirefoxXpi}`);
console.log(`Version: ${version}`);
