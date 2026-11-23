# Chrome Web Store listing

Everything the developer dashboard asks for, ready to paste. The same zip and text work for Microsoft Edge Add-ons.

## Before submitting

1. Register as a Chrome Web Store developer (one-time $5 fee) at https://chrome.google.com/webstore/devconsole.
2. Build the zip: push a version tag and take `kitty-extension-vX.Y.Z.zip` from the release, or run the `release` workflow by hand and download the artifact. Release builds don't include the localhost permission.
3. Check https://kitty-server.vercel.app/privacy is live.

## Store listing tab

**Name** (from the manifest): GitKitty: Learn Git and GitHub

**Summary** (from the manifest, 132 characters max): A pixel cat on github.com that tours any repo, explains commands, diffs and pull requests, and teaches Git step by step.

**Category:** Developer Tools

**Language:** English

**Description:**

```
GitKitty puts a small pixel cat on github.com that helps you understand what you're looking at and learn Git as you go.

Tour any repository
Open a repo and click "Tour this repo". Kitty picks the files that matter (entry points, configs, tests, CI) and walks you through them one by one, with a note on what each file does and why it matters. Useful before you hand a codebase to an AI, or before your first contribution.

Ask Git questions
The side panel chat answers Git and GitHub questions with the exact commands, why they work and how to undo them. Answers cite their sources (the Pro Git book and the official Git documentation). Paste an error message and Kitty explains it.

Explain anything on the page
Select a command, a diff or a pull request description and choose "Ask Kitty". Hover GitHub's own buttons (Fork, Sync fork, Squash and merge) to see what they do in Git terms.

Learn and practice
Short lessons, review quizzes and a practice repo that runs in your browser, so nothing you type can break a real project.

Make your first contribution
Find good first issues, get a walkthrough of the files to change for an issue, check your pull request for what maintainers usually ask about, and see why a CI run failed.

Free and open source: https://github.com/Krish6115/GitKitty
No account needed. Kitty only runs on github.com and never changes anything on GitHub for you.
```

**Screenshots** (1280x800, up to 5): a repo tour step with the highlighted file, the chat answering a Git question with sources, "Explain this" on a diff, Practice mode, the good first issue list.

**Promo video:** upload `docs/kitty-promo.mp4` to YouTube (unlisted is fine) and paste the link.

## Privacy tab

**Single purpose:**

```
Help developers understand GitHub repositories and learn Git while they browse github.com.
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| `sidePanel` | The chat, lessons and settings open in Chrome's side panel. |
| `storage` | Saves settings, learning progress, saved tours and the current chat in the browser. |
| `contextMenus` | Adds "Ask Kitty about this" to the right-click menu for selected text on GitHub. |
| Host `https://github.com/*` | Kitty only works on GitHub: it shows the cat, reads the page the user asks about, and lets the first pull request guide see which GitHub page is open. |
| Host `https://kitty-server.vercel.app/*` | Kitty's own server, which answers questions and builds repo tours. |
| Remote code | No. All code ships in the package. |

**Data usage:** tick these and nothing else.

- Website content: the GitHub page text or selection the user asks about is sent to Kitty's server to answer the question.
- Authentication information: only if the user adds their own BharatCode key or GitHub token, which is sent to Kitty's server with requests and not stored.

Then confirm all three statements (not sold to third parties, not used for unrelated purposes, not used for creditworthiness or lending).

**Privacy policy URL:** https://kitty-server.vercel.app/privacy

## After approval

- Replace the landing page's zip download with the store link, and add the store badge to the README.
- Restrict the server's CORS to the store's extension ID, so other extensions can't use the server.
- Submit the same zip to Microsoft Edge Add-ons (https://partner.microsoft.com/dashboard/microsoftedge), which is free.
