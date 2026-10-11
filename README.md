# PromptLab — AI Prompt Workspace

PromptLab is a local-first workspace for creating, organizing, previewing, and reusing prompt templates. It includes a premium responsive interface, prompt library filters, collections, favorites, variable rendering, version snapshots, JSON backup, CSV export, optional Supabase authentication, and feedback capture.

## Features

- Create, edit, duplicate, favorite, and delete prompts
- Search across prompt titles, descriptions, bodies, and tags
- Filter by category, tag, and favorite status; sort and switch grid/list views
- Use `{{variable_name}}` placeholders and preview rendered prompt text
- Save previous prompt snapshots and restore them in the editor
- Organize prompts into collections
- Export all workspace data to JSON and prompt records to CSV
- Import validated PromptLab JSON backups
- Switch between dark and light themes
- Use the app without an account or paid AI API
- Optional Supabase sign-up/sign-in shell and SQL migration
- Responsive layout, keyboard focus states, reduced-motion support, and automated tests

## Technology

React, TypeScript, Vite, SCSS, React Router, Supabase JS, Vitest, and React Testing Library.

## Requirements

- Node.js 22 or a compatible current LTS release
- npm

## Getting started

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. The first visit seeds a starter library in browser storage. Data stays in the current browser profile and device unless you export it.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run preview
```

## Data model and storage

The initial application uses a versioned browser-storage record for prompts, collections, and locally captured feedback. Starter prompts are inserted only when no usable saved workspace exists. JSON import validates prompt records and preserves existing prompts; CSV export is intended for spreadsheets and does not preserve version history or collection membership.

Local storage is not cloud backup. Clearing browser storage or changing browser/device may make local data unavailable. Export a JSON backup regularly.

## Optional Supabase setup

The local-first app works without Supabase. To configure the optional authentication screen:

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql` using the Supabase SQL Editor or CLI.
3. Configure authentication providers and allowed redirect URLs in Supabase.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or the current Supabase publishable key supported by your project).
5. Restart the development server.

Only public client configuration belongs in frontend environment variables. Never expose a `service_role` key or database password. RLS is enabled in the initial migration, but review and test the policies before public production use.

**Current limitation:** authentication is wired to Supabase, but the app does not yet synchronize the local prompt repository to PostgreSQL. Signing in does not upload or download prompts. Feedback is stored locally and is not transmitted to the project team. The included SQL migration is a foundation for the cloud implementation, not a claim that cloud CRUD or secure public feedback delivery is complete.

## Deployment

### Netlify / Cloudflare Pages

Use the repository root, build command `npm run build`, and publish directory `dist`. `netlify.toml` includes an SPA fallback so direct nested-route navigation serves the app shell.

### GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`. Enable GitHub Pages with **GitHub Actions** as the source in repository settings. The workflow builds with base `/promptlab/` and copies the app shell to `404.html` to support client-side route fallback. Rename the repository or update the base path in the workflow if you use a different repository name.

Always verify direct navigation and refresh on the actual published URL. A successful local build is not proof that the live deployment works.

## Tests

Tests cover variable extraction and rendering, duplicate placeholders, missing values, safe plain-text handling, local persistence, snapshot creation, malformed imports, valid JSON imports, and CSV escaping.

## License

No license has been selected yet. Add a license file only after choosing terms appropriate for your intended distribution.
