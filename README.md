<div align="center">

# GitKitty

Git and GitHub notes, real-world scenarios, and Kitty: a Chrome extension that tours repositories and answers Git questions on github.com.

[![Release](https://img.shields.io/github/v/release/Krish6115/GitKitty)](https://github.com/Krish6115/GitKitty/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<a href="docs/kitty-promo.mp4"><img src="docs/kitty-promo.gif" alt="Kitty touring a repository, answering a Git question, finding an issue and checking a pull request" width="820"></a>

</div>

## Kitty

Kitty is a Chrome extension for github.com. It works on the page you already have open:

- **Repo tours.** Click the cat on any repository and it walks you through the files worth reading first: README, build setup, entry point, core modules, tests and CI.
- **Ask Kitty.** A side-panel chat for Git questions. Answers cite the notes and docs they come from. Paste a Git error and it tells you what happened and how to recover.
- **Explain this.** Select a command, diff or PR text and get a short explanation. Commands are labelled *safe*, *rewrites history* or *can lose work*.
- **Learn tab.** Short lessons, quizzes, and a practice mode where you can run `reset`, `rebase` or a force push against a simulated repo and watch the commit graph.
- **Contributing help.** Find beginner-friendly issues, get the files and git commands for fixing one, and check your pull request for the usual review comments before you open it.
- **On GitHub pages.** Hover buttons like *Sync fork* or *Squash and merge* to see the git equivalent, ask why a CI run failed, or let the cat point out where things are on the page.

Kitty explains and guides; it doesn't write code. When you ask for code, it hands the request to GitHub Copilot.

**Install:** download the zip from the [latest release](https://github.com/Krish6115/GitKitty/releases/latest), unzip it, open `chrome://extensions`, turn on Developer mode and choose **Load unpacked**.

Architecture, local setup and self-hosting are in [kitty/README.md](kitty/README.md).

## Learning material

| File | Contents |
|---|---|
| [`Git/Git_GitHub_101.pdf`](Git/Git_GitHub_101.pdf) | Basics: CLI, init/clone/commit/push, branching, PRs |
| [`Git/Git_Github Notes.pdf`](Git/Git_Github%20Notes.pdf) | Workflow notes and command reference |
| [`Git/git-cheat-sheet-education.pdf`](Git/git-cheat-sheet-education.pdf) | GitHub's cheat sheet |
| [`Git/git_missing_topics.pdf`](Git/git_missing_topics%28other%20than%20101%2Cnotes%2Ccheatsheet%29.pdf) | Reflog, cherry-pick, bisect, blame, amend, `gh`, SSH, `.gitignore` |
| [`Scenario-Based_Guide/git_scenarios.pdf`](Scenario-Based_Guide/git_scenarios.pdf) | Ten real-world scenarios, from first setup to bisect |
| [`*/references/`](Git/references/) | Excerpts from Pro Git, GitHub Docs and the git docs (each keeps its license) |

## Quick reference

```bash
git add .
git commit -m "feat: your change"
git pull --rebase    # if someone pushed first
git push
```

`git restore <file>` drops unsaved edits, `git reset --soft HEAD~1` undoes the last commit but keeps its changes, and `git revert <sha>` undoes a commit that's already pushed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues labelled [good first issue](https://github.com/Krish6115/GitKitty/labels/good%20first%20issue) are a good place to start.

## License

MIT. The reference excerpts keep their own licenses; see [`Git/references/SOURCES.md`](Git/references/SOURCES.md).
