export const EXTENSION_VERSION = '0.8.0';

export const HOME_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GitKitty</title>
<meta name="description" content="Kitty is a small pixel cat that walks on GitHub pages, gives guided repo tours and teaches Git.">
<style>
  :root { --bg:#ffffff; --fg:#1f2328; --muted:#59636e; --card:#f6f8fa; --line:#d1d9e0; --accent:#1f883d; --accent-fg:#fff; --code:#eff2f5; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0d1117; --fg:#e6edf3; --muted:#9198a1; --card:#151b23; --line:#3d444d; --accent:#238636; --accent-fg:#fff; --code:#1f2630; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  main { max-width: 820px; margin: 0 auto; padding: 48px 16px 64px; }
  h1 { font-size: 2.4rem; margin: 0 0 8px; letter-spacing: -0.02em; }
  h2 { font-size: 1.35rem; margin: 48px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
  .lead { font-size: 1.15rem; color: var(--muted); margin: 0 0 24px; }
  .btn { display:inline-block; background:var(--accent); color:var(--accent-fg); text-decoration:none; font-weight:600; padding:12px 20px; border-radius:8px; }
  .btn:hover { filter: brightness(1.1); }
  .meta { color: var(--muted); font-size: .9rem; margin-top: 8px; }
  video { width:100%; border-radius:10px; border:1px solid var(--line); margin-top: 32px; background:#000; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px; }
  .card h3 { margin:0 0 4px; font-size:1rem; }
  .card p { margin:0; color:var(--muted); font-size:.95rem; }
  ol.steps { padding-left: 1.3rem; }
  ol.steps li { margin-bottom: 10px; }
  code { background:var(--code); padding: 2px 6px; border-radius:5px; font-size:.9em; }
  footer { margin-top:56px; color:var(--muted); font-size:.85rem; }
</style>
</head>
<body>
<main>
  <h1>GitKitty</h1>
  <p class="lead">A small pixel cat that lives on github.com. Kitty walks you through any repository before you hand it to an AI, teaches Git with real scenarios, and explains commands, diffs and pull requests when you get stuck.</p>
  <a class="btn" href="/gitkitty-extension.zip" download>Download the Chrome extension (v${EXTENSION_VERSION})</a>
  <p class="meta">Free. Works in Chrome, Edge, Brave and other Chromium browsers. No account needed.</p>

  <video src="/kitty-promo.mp4" controls muted playsinline preload="metadata"></video>

  <h2>What Kitty does</h2>
  <div class="grid">
    <div class="card"><h3>Repo tours</h3><p>Open any repo and click "Tour this repo". Kitty walks to the files that matter and explains what each one does.</p></div>
    <div class="card"><h3>Git tutor</h3><p>Ask about any Git situation. You get the exact commands, why they work and how to undo them, with sources.</p></div>
    <div class="card"><h3>Explain this</h3><p>Select a command, a diff or a PR description on GitHub and ask Kitty what it means.</p></div>
    <div class="card"><h3>Lessons and practice</h3><p>Short lessons, review quizzes and a safe practice repo where nothing you type touches a real project.</p></div>
    <div class="card"><h3>First contribution</h3><p>Find good first issues, check CI failures, and get guided through opening your first pull request.</p></div>
    <div class="card"><h3>Show me how</h3><p>Kitty points at GitHub's own buttons (Fork, Pull requests, Actions) and walks you through them step by step.</p></div>
  </div>

  <h2>Install in 2 minutes</h2>
  <ol class="steps">
    <li>Click <strong>Download the Chrome extension</strong> above to get <code>gitkitty-extension.zip</code>.</li>
    <li>Unzip it. On Windows, right-click the file and choose <strong>Extract All</strong>. On Mac, double-click it. You now have a folder that contains <code>manifest.json</code>.</li>
    <li>Open <code>chrome://extensions</code> in a new tab.</li>
    <li>Turn on <strong>Developer mode</strong> (switch in the top-right corner).</li>
    <li>Click <strong>Load unpacked</strong> and select the unzipped folder (the one with <code>manifest.json</code> directly inside it).</li>
    <li>Pin Kitty from the puzzle-piece menu in the toolbar so it is easy to find.</li>
    <li>Open any repository on <code>github.com</code>. Kitty appears on the page. Click the toolbar icon to open the chat panel.</li>
  </ol>
  <p class="meta">Updating later: download the new zip, replace the folder, then press the reload icon on Kitty's card in <code>chrome://extensions</code>.</p>

  <h2>Optional settings</h2>
  <p>Kitty works out of the box. If you hit rate limits on large repos, you can add your own GitHub token in Kitty's settings. It stays in your browser and is only sent to GitHub's API through Kitty's server.</p>

  <footer>Kitty runs on the BharatCode model (qwen-3.8-27b). Git lessons draw on the Pro Git book (CC BY-NC-SA 3.0) and the official Git documentation.</footer>
</main>
</body>
</html>`;
