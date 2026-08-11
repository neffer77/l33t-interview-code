// Codeopolis launcher for the Scriptable iOS app.
// Change GAME_URL after publishing index.html (for example with GitHub Pages).
const GAME_URL = "https://neffer77.github.io/l33t-interview-code/";

const web = new WebView();
await web.loadURL(GAME_URL);
await web.present(true);
Script.complete();
