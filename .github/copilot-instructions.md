---
name: mona-mayhem
description: "Workspace instructions for Mona Mayhem (Astro-based GitHub contribution battle app)."
---

# Mona Mayhem - Copilot Instructions

## Project overview
- Astro v5 static/server-rendered app.
- Main UI: `src/pages/index.astro`.
- API route: `src/pages/api/contributions/[username].ts` returns GitHub contributions data.
- Designed as workshop starter template for GitHub Copilot coding flow. Keep new features focused and incremental.

## Key files and directories
- `astro.config.mjs` – Astro config and integrations.
- `package.json` – scripts, dependencies (`astro`, `@astrojs/node`).
- `src/pages/index.astro` – main page markup and component wiring.
- `src/pages/api/contributions/[username].ts` – serverless data endpoint; watch edge cases (rate limits, missing users).
- `docs/` – supporting documentation and CSS styling guide.
- `workshop/` – educational tasks; not required for runtime behavior.

## Build & development commands
- `npm run dev` – start Astro dev server (default port 4321 in devcontainer).
- `npm run build` – production build.
- `npm run preview` – preview built app.
- `npm run astro` – Astro CLI.

## Astro best practices
- Keep UI in `.astro` components; use server-only logic in `src/pages/api/**` and server routes.
- Avoid client-side bundling unless needed; prefer Astro islands where interactivity is required.
- Type checked Node environment: use `import` style and ESM from `package.json`.
- Use `astro lint`/`eslint` if added (not in baseline yet), run after code changes.
- For new pages, add routes in `src/pages/` with simple SSR or static rendering as appropriate.

## Agent-specific guidance
- Prioritize minimal, workshop-aligned changes.
- Share edits as small PR-friendly commits (one feature at a time).
- Always link to README and docs for context, avoid duplication.
- Discover data flow via `src/pages/api/contributions/[username].ts` and `src/pages/index.astro` first.

## Links
- README: `/README.md`
- Workshop docs: `/workshop/`
- Astro docs: https://docs.astro.build/
