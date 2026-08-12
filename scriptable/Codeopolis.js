// Codeopolis Scriptable launcher
// Set CODEOPOLIS_URL to your deployed HTTPS URL (GitHub Pages or other static host).
const CODEOPOLIS_URL = 'https://neffer77.github.io/l33t-interview-code/';
const fm = FileManager.iCloud();
const dir = fm.joinPath(fm.documentsDirectory(), 'Codeopolis');
if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
const configPath = fm.joinPath(dir, 'launcher.json');
let config = { url: CODEOPOLIS_URL };
if (fm.fileExists(configPath)) {
  try { config = { ...config, ...JSON.parse(fm.readString(configPath)) }; } catch (_) {}
} else {
  fm.writeString(configPath, JSON.stringify(config, null, 2));
}
const wv = new WebView();
await wv.loadURL(config.url + (config.url.includes('?') ? '&' : '?') + 'source=scriptable');
await wv.present(true);
Script.complete();