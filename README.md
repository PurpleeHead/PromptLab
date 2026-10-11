# PromptLab — AI Prompt Workspace

PromptLab is a local-first workspace for creating, organizing, previewing, and reusing prompt templates. It runs without an account, cloud service, or paid AI API. Prompt content remains user data: changing the interface language does not translate or rewrite prompts.

## Features

- Create, edit, duplicate, favorite, and delete prompts
- Search prompt titles, descriptions, bodies, and tags; filter and sort the library
- Use `{{variable_name}}` placeholders and preview rendered text
- Organize prompts into collections and retain edit history snapshots
- Export workspace JSON backups and prompt CSV; import validated JSON
- Select a dark or light theme
- Capture feedback as a local record; this does not send it to the PromptLab team
- Optional Supabase sign-up/sign-in screen
- Responsive layout and reduced-motion styles

**Localization limitation:** English and Russian dictionaries and locale state exist in the code, but the routed application currently has no user-accessible language selector and does not apply the dictionaries across its screens. The interface is effectively English-only. Do not rely on a Russian UI until this is completed. Prompt and other user-created content is not modified by locale state.

## Architecture

- `src/app/App.tsx` — app shell, route table, most route screens, and shared workspace state (still monolithic)
- `src/components/` — reusable UI modules
- `src/features/` — partial feature extractions; some screen modules are not the components currently mounted by the route table
- `src/features/prompts/variables.ts` — plain-text variable parsing and rendering
- `src/i18n/` — locale dictionaries and locale helpers not yet wired into the routed UI
- `src/services/storage.ts` — local persistence and JSON/CSV import/export
- `src/services/supabase.ts` — optional Supabase auth and explicit sync helpers
- `supabase/migrations/` — database schema and row-level security policies
- `tests/` — Vitest unit and component tests

## Requirements and local setup

- Node.js 22 or a compatible current LTS release
- npm

Install the exact dependency versions from the lockfile and start the development server:

```bash
npm ci
npm run dev
```

Open the URL Vite prints. On first use, PromptLab creates starter data in this browser profile. Data is stored locally unless you export it or explicitly choose a cloud action.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run typecheck` | Run TypeScript project checks |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run unit and component tests once |
| `npm run build` | Typecheck and build the production app into `dist/` |
| `npm run preview` | Serve the production build locally |

## Environment variables and Supabase

Supabase is optional. The routed account screen provides an authentication UI when configured. Database schema and mapping/sync helper code exist, but the current routed Settings screen does not expose cloud upload/download actions, and ordinary local changes are not synchronized:

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql` to that project.
3. In Supabase Authentication settings, configure the Site URL and allowed redirect URLs for each development and production origin. Include the app URL at the root and any confirmation redirect URL you configure.
4. Configure Supabase API allowed origins for the local development origin and the deployed site origin where that setting is available.
5. Copy `.env.example` to `.env.local` and provide the public project URL and anon/publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
   ```

6. Restart Vite after changing environment values. In Supabase Auth settings, choose whether email confirmation is required. When confirmation is enabled, sign-up displays a check-your-email message; the user returns to the app to sign in after confirming. The app does not implement password reset or a dedicated confirmation callback route.

Only public client configuration belongs in `VITE_*` variables. Never put a `service_role` key, database password, or other private credential in `.env.local` or a frontend build. The Supabase SQL migration enables RLS; review it and verify policies in a real project before public use.

Cloud behavior is not release-verified: sign-in is optional; there is no active user-facing sync action in the routed app, and prompt/collection CRUD is not automatically mirrored. The helper layer does not sync prompt history, collection membership relationships, or feedback. Do not assume local content is backed up remotely. No real Supabase project was used for the checks recorded in this repository.

## Data, privacy, and backups

Prompt records, collections, settings, and feedback are stored in browser `localStorage`. Local storage is not a cloud backup and may be cleared by the browser or lost with the browser profile/device; regularly export a JSON backup. JSON import validates prompt records and merges by default in the current interface. CSV is an export format and does not preserve version history or collection membership.

Feedback is stored locally and is not transmitted. Prompt text remains local unless the user explicitly exports it or starts a cloud upload. Avoid placing passwords, API keys, or other secrets in prompts or feedback. Imported content is treated as data, not executable HTML or code.

## Localization status

English is the effective language of the routed UI. Locale dictionaries and a persisted locale field exist, but there is currently no active selector in the routed header or Settings screen, and translation helpers are not applied to the route screens. The i18n module has not completed product localization. User prompt text, tags, collection names, history, and imported/exported content remain user-owned values.

## Tests

The Vitest/Testing Library suite covers variable extraction and rendering, local persistence, prompt snapshot creation, malformed and valid JSON imports, CSV escaping, Supabase row mapping, and locale helper/key-parity behavior. The locale selector component test targets a feature Settings module that is not currently mounted by the route table. The suite does not provide comprehensive component coverage for all routed workflows, and there is no configured automated end-to-end suite. The Stage 8 browser smoke checks are manual/local only.

## Deployment

### Netlify and other root-hosted static sites

Use the repository root as the base directory, `npm run build` as the build command, and `dist` as the publish directory. `netlify.toml` rewrites unmatched paths to `index.html` for SPA navigation. The default Vite base is `/`.

### GitHub Pages

The GitHub Actions workflow builds with a base path derived from the repository name (or `/` for a `*.github.io` repository), copies the built app shell to `dist/404.html`, and deploys via the Pages artifact flow. Keep `BrowserRouter` using `import.meta.env.BASE_URL`; do not hardcode a repository name into source code. Enable **GitHub Actions** as the Pages source in repository settings.

Local checks establish build output and route handling but do not prove a public deployment works. After enabling deployment, open and refresh a nested route on the published site and confirm assets load under its base path.

The CI workflow runs `npm ci`, typecheck, lint, unit tests, and a production build on pushes and pull requests targeting `main`. It has read-only repository permissions and no deployment secrets. Pages deployment only runs on `main` pushes or manual dispatch and grants Pages write/ID-token permissions to the deployment job.

## Troubleshooting and limitations

- **Local data seems missing:** check the same browser profile/origin; use a previously exported JSON backup if available.
- **Cloud controls are unavailable:** verify both public Supabase values in `.env.local` and restart the dev server. Without them, local mode remains available.
- **Sign-up requires confirmation:** check the email and the Supabase Auth confirmation URL configuration; confirmation behavior is controlled by the project.
- **Nested route is not found after deployment:** confirm the hosting provider uses the configured SPA fallback and that the build base matches the deployed path.
- **Build reports a large chunk:** Vite currently warns about the client JavaScript bundle exceeding its default size threshold; this is non-fatal and code splitting has not yet been added.
- Supabase auth/sync, RLS isolation, email delivery, and production redirects require manual verification against a configured project.
- There is no verified public demo URL and no Playwright end-to-end suite.

## License

No license has been selected. Add a license only after choosing terms for the project.
