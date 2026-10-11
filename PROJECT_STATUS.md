# PromptLab Project Status

## Architecture summary
- Vite + React + TypeScript app for a local-first prompt library and workspace.
- Data is stored in the browser with `localStorage` using the existing schema (`promptlab:data:v1` style storage). The app preserves the current prompt/collection/feedback data model.
- The root shell is in `src/app/App.tsx`; feature modules for prompts, collections, auth, feedback, and settings are being extracted into `src/features/*` while the core route and app state remain in the main app shell.
- Shared types live under `src/types/index.ts`; reusable UI primitives and layout pieces live under `src/components/*`.
- Supabase support is optional and guarded so the app continues to work without cloud credentials.

## Risks and watchpoints
- The app is still partially monolithic; refactoring must preserve route behavior, local storage schema, and UI interactions.
- Cloud auth and sync are intentionally optional; the app must not assume Supabase is configured.
- Large production bundles are acceptable for this project but a Vite chunk-size warning remains in place; it is a performance warning, not a build failure.
- Prompt text, tags, and template variables must remain unchanged when UI language or flow changes are introduced later.

## Work completed in this pass
- Fixed TypeScript strict-mode issues introduced by recent feature extraction work.
- Removed unused imports and safe, unused variables without changing runtime behavior.
- Kept the app structure intact while making the feature-oriented modules compile cleanly.
- Hardened the optional Supabase path by validating config, guarding auth state, and requiring explicit cloud-sync actions rather than background uploads.
- Added a stable `local_id` mapping in the SQL migration so remote records can reconcile with local prompt IDs without losing the original local identity.

## Stage 6 QA coverage and validation
- Added focused i18n and locale persistence tests covering default locale fallback, invalid stored values, key parity, interpolation, and the invariant that prompt content remains unchanged when locale state changes.
- Added a browser-accessible language selector in Settings with screen-reader-friendly labels and a persisted locale choice.
- Confirmed the current implementation remains local-first and that storage settings are used for locale persistence without altering prompt records.

## Validation results
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run test:run` — PASS (18/18 tests)
- `npm run build` — PASS with a non-blocking Vite chunk-size warning for the client bundle

## Stage 7 deployment readiness
- Removed the redundant fixed `base: '/'` from Vite config; default builds remain rooted at `/`, while deployment can select a different base at build time. `BrowserRouter` already uses `import.meta.env.BASE_URL`.
- GitHub Pages derives the project base path from `GITHUB_REPOSITORY` (and uses `/` for `*.github.io` repositories), copies `dist/index.html` to `dist/404.html`, grants Pages read permission to the build job, and scopes Pages write/ID-token permissions to the deploy job. The workflow runs `npm ci`, typecheck, lint, tests, and build.
- Netlify's existing `/* -> /index.html` SPA rewrite remains in place. `index.html` includes title, description, theme-color, base-aware favicon, and Open Graph metadata.
- README and PROMPTS.md now document the actual local/cloud boundary, current incomplete translation coverage, auth redirect/confirmation setup, build/deployment settings, and manual limitations.

### Stage 7 checks run
- `npm ci` — PASS in an isolated clean copy of the repository using `package-lock.json`. An in-place attempt was blocked by Windows `EPERM` unlinking the esbuild executable while a local Vite process was active; missing dependency files were restored from the clean install, and subsequent checks in the actual worktree passed.
- `npm run typecheck` — PASS in the actual worktree.
- `npm run lint` — PASS in the actual worktree.
- `npm run test:run` — PASS (18/18 tests) in the actual worktree.
- `npm run build` — PASS in the actual worktree with the existing non-blocking >500 kB chunk warning.
- Root and `/promptlab/` production builds — PASS in the clean install copy. The subpath output references `/promptlab/assets/...` and `/promptlab/favicon.svg`; its `404.html` was verified byte-identical to `index.html`.
- Browser route smoke test — PASS for all declared application routes at root-hosted production preview; also passed a direct `/promptlab/prompts/p-brand-voice` load and refresh against a local Pages-style base-path/fallback simulation. This is not a live GitHub Pages deployment.
- Browser console and page-error check — no errors observed during route navigation or deep-link reloads.
- GitHub Actions YAML — PASS syntax parsing for both CI and deployment workflows.
- Production bundle secret-pattern scan — no service-role variable, credential assignment, Supabase secret-token pattern, or private-key PEM marker found.
- `git diff --check` — PASS; Git emitted only line-ending conversion warnings for LF files on this Windows worktree.
- `package-lock.json` — clean install verified and committed separately as `cea9e1e` (`chore: add npm lockfile for reproducible installs`).

## Changed files from earlier implementation passes
- `src/features/auth/AuthPage.tsx`
- `src/features/settings/SettingsPage.tsx`
- `src/services/supabase.ts`
- `supabase/migrations/0001_initial_schema.sql`
- `.env.example`
- `README.md`

## Remaining manual steps
- Configure a real Supabase project and apply the SQL migration to validate the cloud flow end-to-end.
- Run the sign-in, explicit sync, and conflict-validation flows in a live Supabase dashboard before claiming production readiness.
- If a later stage requires full route/module extraction to a feature-based architecture, review the remaining app shell and move shared logic carefully while preserving the storage schema and user flows.
- Enable GitHub Actions as the Pages source, then verify the deployed URL and refresh a nested route in the actual GitHub Pages deployment.
- Configure production Supabase Site URL, allowed redirect URLs, allowed origins, and email-confirmation behavior for the real host; these were documented but not verified against a live project.
- No public deployment URL or remote CI run was available to verify in this environment.

## Stage 7 changed files
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `PROMPTS.md`
- `README.md`
- `index.html`
- `vite.config.ts`
- `PROJECT_STATUS.md`
- `package-lock.json` (committed separately)

## Stage 8 — Final release gate

### Verified locally
- The committed `package-lock.json` was installed with `npm ci` in a separate clean copy because an in-place install first encountered Windows `EPERM` while an existing Vite process held esbuild files. `npm ci` completed successfully in the clean copy.
- In that clean copy, `npm run typecheck`, `npm run lint`, `npm run test:run` (18/18), and `npm run build` all passed. The build retains the Vite non-blocking chunk-size warning.
- Production browser checks at root verified direct navigation of the dashboard, library, collections, favorites, settings, feedback, auth, new-prompt, and edit-prompt routes. Unknown paths showed the in-app not-found state.
- Local browser journey (with no Supabase configuration): created a prompt with two template variables; verified rendered preview; favorited it; searched for it and verified empty results for a non-match; duplicated it; deleted the duplicate through the confirmation dialog; edited the prompt and confirmed a history snapshot was created; restored the earlier snapshot; created a collection and added the prompt; reloaded and verified prompt, favorite, collection membership, and history snapshot persisted.
- Settings checks verified theme selection persists after reload and that the reduced-motion media rule reduces button transition duration. At 320px viewport width the tested library page had no horizontal document overflow.
- A valid JSON file was selected through the Settings file picker and the imported prompt appeared in local storage. Feedback submission stored a local record and displayed explicit text that it was not sent to the PromptLab team.
- Root and `/promptlab/` builds and a simulated Pages-style direct nested route + refresh were verified during Stage 7. These are local simulations, not a live deployment.
- `dist` bundle scan found no service-role variable/credential pattern, Supabase secret token pattern, or private-key PEM marker. No `.env`/`.env.local` file is present in the project directory; `.env.example` contains public variable names only.
- No Playwright or other automated E2E test suite is configured. Browser workflows above were executed manually through the local browser session.

### Release blockers / not verified
- **Localization is not shipped:** the active routed UI has no language selector and does not apply the English/Russian dictionaries. Locale-related helpers/settings state and a standalone feature Settings module are not wired to the route UI. README now accurately records this. The previous locale selector unit test covers that standalone module, not the active Settings screen.
- **Cloud sync UI is not shipped:** the active Settings route has no upload/download action. Supabase auth and sync helper code is present, but successful account-based CRUD/sync has not been verified, and sync helpers omit history and collection membership relationships.
- **Core workflow test automation is incomplete:** 18 unit/component tests pass, but there is no automated smoke/E2E suite and no comprehensive route-component tests.
- **JSON/CSV browser downloads were not confirmed as downloaded browser artifacts in this run.** JSON import was manually exercised with a valid file. Existing unit tests cover import validation and CSV escaping, but this is not a full browser import/export round-trip.
- **Accessibility is not fully audited:** keyboard-only navigation, full focus restoration, and screen-reader behavior across routes were not completed. Responsive check only measured horizontal overflow for the library at 320px.
- No live Supabase project, two-user RLS verification, hosted deployment, public URL, or remote CI run was available. These remain NOT RUN.
- Dependency scan found `react-hook-form` listed in `package.json` without a source import; it was left untouched as it is not a release blocker and Stage 8 avoided unrelated dependency changes.

### Stage 8 actual commands
- `npm ci` — PASS in an isolated clean copy from the committed lockfile. In-place attempt — FAIL (`EPERM` unlinking existing `node_modules/@esbuild/win32-x64/esbuild.exe`); subsequent actual-worktree checks passed after restoring missing dependency files from the clean install.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run test:run` — PASS (4 files, 18 tests).
- `npm run build` — PASS with the non-blocking bundle-size warning.
- Browser assertions and paths above were exercised on the local production preview; no public URL was accessed.
- Git status still contains the pre-existing/uncommitted stage implementation and documentation files. Only `package-lock.json` was committed during these stages: `cea9e1e` (`chore: add npm lockfile for reproducible installs`). No final feature implementation commit exists.
