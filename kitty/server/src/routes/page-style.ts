// Shared look for the server's public HTML pages (landing page, privacy policy).

const CSS = `
  :root { --bg:#ffffff; --fg:#1f2328; --muted:#59636e; --card:#f6f8fa; --line:#d1d9e0; --accent:#1f883d; --accent-fg:#fff; --code:#eff2f5; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0d1117; --fg:#e6edf3; --muted:#9198a1; --card:#151b23; --line:#3d444d; --accent:#238636; --accent-fg:#fff; --code:#1f2630; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  main { max-width: 820px; margin: 0 auto; padding: 48px 16px 64px; }
  a { color: inherit; }
  h1 { font-size: 2.4rem; margin: 0 0 8px; letter-spacing: -0.02em; }
  h2 { font-size: 1.35rem; margin: 48px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
  .lead { font-size: 1.15rem; color: var(--muted); margin: 0 0 24px; }
  .btn { display:inline-block; background:var(--accent); color:var(--accent-fg); text-decoration:none; font-weight:600; padding:12px 20px; border-radius:8px; }
  .btn.ghost { background:transparent; color:var(--fg); border:1px solid var(--line); margin-left:8px; }
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
`;

/** A complete HTML document with the shared styles. `body` is trusted HTML written in this repo. */
export function htmlPage(title: string, description: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<style>${CSS}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}
