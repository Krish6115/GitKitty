import { htmlPage } from './page-style.js';

export const EXTENSION_VERSION = '0.10.0';

export const HOME_HTML = htmlPage(
  'GitKitty',
  'Kitty is a small pixel cat that walks on GitHub pages, gives guided repo tours and teaches Git.',
  `  <h1>GitKitty</h1>
  <p class="lead">A small pixel cat that lives on github.com. Kitty walks you through any repository before you hand it to an AI, teaches Git with real scenarios, and explains commands, diffs and pull requests when you get stuck.</p>
  <a class="btn" href="/gitkitty-extension.zip" download>Download the Chrome extension (v${EXTENSION_VERSION})</a>
  <a class="btn ghost" href="https://github.com/Krish6115/GitKitty" target="_blank" rel="noopener">View on GitHub</a>
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

  <h2>Open source</h2>
  <p>GitKitty is open source. Read the code, report a bug or pick up a good first issue on <a href="https://github.com/Krish6115/GitKitty" target="_blank" rel="noopener">github.com/Krish6115/GitKitty</a>. Stars help other developers find it.</p>

  <footer>Kitty answers with Qwen 3.8 on Groq, and with BharatCode's GLM 5.3 Flash when Groq is at its limit. Git lessons draw on the Pro Git book (CC BY-NC-SA 3.0) and the official Git documentation. <a href="/privacy">Privacy policy</a></footer>`,
);
