# PromptLab — AI Prompt Workspace

**PromptLab** is a responsive, local-first workspace for writing, organizing, previewing, and reusing prompt templates. It is built with React and TypeScript and supports English and Russian interface languages.

- **Live demo:** https://purpleehead.github.io/PromptLab/
- **Repository:** https://github.com/PurpleeHead/PromptLab

> PromptLab is an independent portfolio project. It is not affiliated with or endorsed by any AI provider. The core workflow does not require an AI API key or paid AI service.

## Features

- Create, edit, duplicate, favorite, and delete prompts.
- Search and filter the prompt library; sort prompts and organize them into collections.
- Reuse templates with variables such as `{{topic}}` and preview the rendered result.
- Keep prompt edit-history snapshots.
- Import validated JSON data and export workspace backups as JSON or prompts as CSV.
- Switch between English and Russian; the interface language does not translate or rewrite saved prompts.
- Choose a dark or light theme.
- Use the core workspace without creating an account.
- Access an optional Supabase sign-in/sign-up flow when configured.
- Use a responsive layout with mobile navigation and reduced-motion support.

## Tech stack

- React 19, TypeScript, Vite
- React Router
- SCSS
- Lucide React
- Vitest, Testing Library, jsdom
- Optional Supabase client and SQL migration

## Getting started

### Requirements

- Node.js 22 or a compatible current LTS release
- npm

### Install and run

```bash
git clone https://github.com/PurpleeHead/PromptLab.git
cd PromptLab
npm ci
npm run dev
```

Open the local URL printed by Vite.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run the test suite once |
| `npm run test` | Start Vitest in watch mode |
| `npm run build` | Typecheck and create a production build |
| `npm run preview` | Preview the production build locally |

## Data and privacy

The core workspace stores prompts, collections, settings, and feedback in the current browser's `localStorage`. This keeps the basic workflow local and available without an account, but browser storage is **not a cloud backup** and can be cleared. Export a JSON backup regularly if your prompts matter to you.

Feedback is saved locally in this version and is not automatically sent to the project owner. Prompt content stays in the browser unless you export it or explicitly use a configured cloud feature. Avoid storing passwords, private information, or secret API keys in prompts.

## Optional Supabase configuration

Supabase is optional; local mode does not require it. The repository includes an authentication flow, a client helper, and an initial SQL migration. Cloud synchronization of ordinary prompt and collection changes is not currently a complete, release-verified workflow, so do not treat Supabase as an automatic backup.

1. Create a Supabase project and apply `supabase/migrations/0001_initial_schema.sql`.
2. Configure the project's authentication Site URL and allowed redirect URLs for your local and deployed origins.
3. Copy `.env.example` to `.env.local` and set the public project URL and anon/publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
   ```

4. Restart the development server after changing environment variables.

Only public client configuration belongs in `VITE_*` variables. **Never expose a Supabase `service_role` key, database password, or other private credential in frontend code or a client-side environment variable.** Review row-level security policies and verify authentication redirects against your own Supabase project before using it publicly.

## Tests and verification

The test suite covers template variable parsing/rendering, local storage operations and imports/exports, Supabase row mapping, and translation helpers.

Local verification performed for the current repository version:

- `npm ci` — completed successfully.
- Vitest — 23 tests passed across 4 test files.
- `npm run build` — completed successfully.

Vite reports a non-blocking warning that the minified JavaScript chunk is larger than 500 kB. Code splitting can be added as a future optimization. Local checks do not guarantee every production hosting, authentication, or cloud workflow is configured correctly.

## Deployment

### GitHub Pages

The repository includes GitHub Actions workflows for checks and Pages deployment. Enable **GitHub Actions** as the Pages source in the repository settings. Pushes to `main` trigger the configured workflow; check the Actions tab for the actual result.

### Netlify

Use the repository root as the base directory, `npm run build` as the build command, and `dist` as the publish directory. The repository includes a `netlify.toml` SPA fallback configuration.

After deploying, open the live URL and refresh the page to verify that assets and navigation work on the hosting provider.

## Project status and limitations

PromptLab is a portfolio project and is still evolving. The main local prompt-management workflow, bilingual UI, theme switch, import/export utilities, and test suite are implemented. Optional authentication depends on external Supabase configuration; automatic cloud synchronization, real feedback delivery, and a full end-to-end browser test suite are not currently release-verified.

## License

No open-source license has been selected yet. Unless a license is added, the code is not granted the broad reuse permissions that an open-source license provides.
