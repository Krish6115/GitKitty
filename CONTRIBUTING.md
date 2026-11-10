# Contributing

Small fixes are as welcome as features.

## Ideas

- Fix a typo or an unclear explanation in the notes or scenarios
- Add a missing command or scenario
- Add Windows examples (most examples assume macOS or Linux)
- Pick up an open [issue](https://github.com/Krish6115/GitKitty/issues), especially ones labelled `good first issue`

## Workflow

```bash
git clone https://github.com/YOUR_USERNAME/GitKitty.git   # after forking on GitHub
cd GitKitty
git switch -c fix/short-description
# make your change
git commit -am "docs: clarify the rebase scenario"
git push -u origin fix/short-description
```

Then open a pull request against `main`. Every PR needs a review from the maintainer before it's merged.

## Working on Kitty

Setup is in [kitty/README.md](kitty/README.md). Before opening a PR, run:

```bash
cd kitty
npm run build && npm test && npm run eval -w ingest
```

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`), one change per commit.
- TypeScript is strict. Validate anything from outside (request bodies, model output, GitHub responses) with zod.
- If you change the PDFs or `*/references/`, run `npm run ingest` and commit the updated `kitty/server/data/index.json`. CI checks that it's current.
- Don't commit API keys or `.env` files.

Contributions are licensed under the [MIT License](LICENSE). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
