# Extension end-to-end checks

Real-browser checks that load `kitty/extension/dist` unpacked into a throwaway Chromium profile and drive github.com.
They are not part of `npm test`: they need a browser, network access and the Kitty server.

```bash
cd kitty
npm run build:e2e -w extension   # talks to the server on localhost
npm run dev -w server            # in another terminal (mock model by default; LLM_PROVIDER=bharatcode for the real one)
npm run e2e -w extension -- all  # or a single suite, e.g. tour
```

| Suite | What it checks |
|---|---|
| `cat` | The cat renders on github.com and survives GitHub's in-page navigation. |
| `drag` | The cat follows the pointer while dragged, lands where it's dropped, and stays there after a reload. |
| `onboarding` | The welcome tab opens on install, asks for no server URL, and the connection test passes. |
| `tour` | A tour from the cat menu: Next/Back across files, the browser back button, leaving and resuming. `--repo owner/name` |
| `tour-ask` | "Ask" on a tour step opens the chat pointed at that step. |
| `chat` | A question in the side panel streams an answer with citations and a Copy button. `--question "..."` |
| `chat-action` | The chat finds an issue, "Show me" opens it, and the cat explains it. |
| `contrib` | Good first issues, the "Help me fix this" walkthrough with git commands, and the PR check. |
| `explain` | Selecting a git command shows the pill, the explanation streams, follow-up and the (simulated) right-click path work. |
| `features` | "Why did this fail?" on a failed CI run (`--run owner/repo/actions/runs/N`), a PR tour, the AI context copy, the PR description draft and the quiz. |
| `learn` | Practice mode, a lesson, the first-PR checklist, a pasted Git error, the Fork button hint, a show-me-how walkthrough and the Copilot hand-off. |

**Browser:** branded Chrome no longer loads unpacked extensions from the command line, so a Playwright Chromium is used.
Install one with `npx playwright install chromium`, or point `KITTY_E2E_CHROME` at a Chromium executable.

Screenshots are written to `e2e/out/` (gitignored).
