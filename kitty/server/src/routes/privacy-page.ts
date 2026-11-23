import { htmlPage } from './page-style.js';

export const PRIVACY_UPDATED = '23 November 2026';

export const PRIVACY_HTML = htmlPage(
  'GitKitty privacy policy',
  'What the Kitty browser extension sends, what its server does with it, and what stays in your browser.',
  `  <h1>Privacy policy</h1>
  <p class="meta">GitKitty (the Kitty browser extension and its server). Last updated ${PRIVACY_UPDATED}.</p>

  <p class="lead">Kitty has no accounts, no ads and no analytics. It only sends something off your computer when you use a feature that needs the language model or GitHub's API, and only what that feature needs.</p>

  <h2>What stays in your browser</h2>
  <ul>
    <li>Your settings, including your own BharatCode API key or GitHub token if you add one.</li>
    <li>Your chat with Kitty, until you close the browser.</li>
    <li>Your learning progress: lessons, quiz results, practice and saved tours.</li>
  </ul>
  <p>This data is stored by Chrome on your computer. Removing the extension deletes it.</p>
  <p>To offer <strong>Resume tour</strong>, the extension asks GitHub's public API (<code>api.github.com</code>) for the repository's latest commit, directly from your browser. Nothing else is sent with that request.</p>

  <h2>What is sent to Kitty's server</h2>
  <p>Kitty's server runs at <code>kitty-server.vercel.app</code>. The extension contacts it only when you use one of these features:</p>
  <ul>
    <li><strong>Repo tours:</strong> the repository name, and the issue or pull request number for those walkthroughs.</li>
    <li><strong>Chat:</strong> your question, the last few messages of the conversation, and the relevant text of the GitHub page you're on when you ask about it.</li>
    <li><strong>Explain this:</strong> the text you selected and what kind of page it came from (for example a diff or a pull request description).</li>
    <li><strong>Issue search, PR checks and CI explanations:</strong> your search words, or the repository and the pull request or CI run number.</li>
    <li><strong>Your own key or token</strong>, if you added one, so the server can use it for that request. It isn't stored.</li>
  </ul>

  <h2>What the server does with it</h2>
  <ul>
    <li>Reads public data from GitHub's API: files, issues, pull requests and CI logs.</li>
    <li>Sends your question and the repository or page context to BharatCode's model API (<a href="https://bharatcode.ai" target="_blank" rel="noopener">bharatcode.ai</a>), which writes the answer.</li>
    <li>Keeps generated repo tours and issue search results in a short-lived cache so the next request for the same repository is faster. These hold repository information, not your questions.</li>
    <li>Keeps answers to general questions (the first question in a chat, asked without page or tour context) for up to 14 days, so the next person asking the same thing gets the answer at once. They are stored under a fingerprint of the question's wording, with nothing that identifies who asked.</li>
    <li>Logs how many tokens each request used, to track cost. It doesn't log questions, page text, keys or tokens.</li>
    <li>Counts requests per IP address in memory to apply a rate limit. The count isn't saved.</li>
  </ul>
  <p>The server is hosted on Vercel, which processes requests and keeps its own standard logs. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Vercel's privacy policy</a>.</p>

  <h2>What Kitty never does</h2>
  <ul>
    <li>Sell or share your data, show ads, or track you across websites.</li>
    <li>Run on websites other than github.com.</li>
    <li>Change anything on GitHub for you. Kitty reads pages and can fill in a text box, but you press every button yourself.</li>
  </ul>
  <p>Kitty's use of information received through Chrome extension APIs follows the <a href="https://developer.chrome.com/docs/webstore/program-policies/limited-use" target="_blank" rel="noopener">Chrome Web Store User Data Policy</a>, including the Limited Use requirements.</p>

  <h2>Running your own server</h2>
  <p>If you point Kitty at your own server under Settings, Advanced, requests go to that server instead, and this policy doesn't cover it.</p>

  <h2>Questions</h2>
  <p>Open an issue or a discussion at <a href="https://github.com/Krish6115/GitKitty" target="_blank" rel="noopener">github.com/Krish6115/GitKitty</a>. If this policy changes, the date at the top changes too.</p>

  <footer><a href="/">GitKitty home</a></footer>`,
);
