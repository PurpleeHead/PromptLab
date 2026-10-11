# PromptLab — Copilot Agent completion plan

Use these prompts **one at a time, in order**, with GitHub Copilot in **Agent mode** from the root of the existing PromptLab repository. Do not ask Copilot to rebuild the project from scratch. After each stage, review the diff and run the acceptance checks before proceeding.

## How to use this plan

1. Open the existing PromptLab repository in VS Code.
2. Switch Copilot Chat to **Agent** mode.
3. Paste Stage 0 and let it inspect the project.
4. Apply stages 1–8 sequentially. Start a new Agent request for each stage, but keep the same repository and conversation context if possible.
5. If a stage fails tests, fix that stage before moving on. Do not let Copilot claim a check passed unless it actually ran it and observed a successful result.
6. Keep commits small, ideally one commit per stage.

---

## Stage 0 — Audit the existing app and create a completion plan

```text
You are the senior engineer responsible for finishing the EXISTING PromptLab — AI Prompt Workspace repository. Work in the current repository; do not replace it with a new starter project and do not discard working features.

First inspect the full project: package.json, README.md, PROMPTS.md, all src files, tests, Supabase SQL/migrations/seed, Vite/TypeScript/Vitest/ESLint configuration, GitHub workflows, Netlify config, .env.example and .gitignore.

The app currently has a React + TypeScript + Vite + SCSS foundation; localStorage-backed prompts; search, categories/tags/favorites/sorting; create/edit/duplicate/delete; prompt variables and preview; collections; history snapshots; JSON import/export and CSV export; theme settings; feedback form; Supabase auth wiring and a starter database schema; basic tests and GitHub Pages/Netlify configuration. Some UI may be concentrated in src/app/App.tsx. Cloud CRUD/sync and feedback delivery are not yet complete. Verify this against the actual files rather than assuming every item works.

Tasks:
1. Inspect the code and report the actual current state, defects, incomplete paths, accessibility issues, security risks, duplicate logic and missing tests.
2. Run the available install/build/typecheck/lint/test commands if dependencies and network access permit. Record exact commands and actual results. Do not say a command passed if it was not run.
3. Identify existing local data formats and IDs. Plan backward-compatible migration so users do not lose local prompts, collections, versions, favorites, settings or feedback.
4. Propose a staged implementation plan covering architecture, complete English/Russian localization, persistence, Supabase authentication and cloud sync, feedback, tests, accessibility, deployment and documentation.
5. Do not implement the whole project in this stage. You may fix only clear, low-risk blockers needed to run the checks. Create or update a concise `PROJECT_STATUS.md` with verified findings, stage plan, commands run, outcomes and known limitations.

Acceptance criteria: the report matches the repository; existing features and data formats are documented; failures are clearly separated into code failures versus environment/network limitations; no feature is falsely described as complete.
```

## Stage 1 — Refactor into maintainable modules without changing behavior

```text
Refactor the existing PromptLab app into a clear, maintainable feature-based architecture. Preserve the current design, routes, behavior and stored data. Do not rewrite from scratch, remove features, or make unrelated visual changes.

Before editing, use the audit in PROJECT_STATUS.md and inspect all callers/types. Move code out of oversized components (especially src/app/App.tsx if it is still a monolith) into appropriately named modules. A reasonable structure is:
- src/app/ — app shell, router, providers
- src/components/ — reusable UI primitives and layout
- src/features/prompts/ — prompt library, prompt editor, prompt cards, variable parser/preview, prompt types and operations
- src/features/collections/
- src/features/history/
- src/features/auth/
- src/features/feedback/
- src/features/settings/
- src/i18n/ — added in a later stage
- src/services/ — storage, repositories, Supabase client, export/import
- src/hooks/
- src/types/
- src/styles/
- tests/ — unit, component and integration tests

Adapt names to the actual repository rather than creating empty folders for appearance. Keep components focused, use explicit TypeScript types, avoid `any`, avoid duplicated business logic, and keep UI state separate from persistence. Extract reusable logic into tested functions/hooks. Preserve routes, responsive layout, theme, animations and reduced-motion support. Do not change localStorage keys or serialized schemas unless a backward-compatible migration is included and tested.

Update imports and tests, remove dead code and unused dependencies only when verified safe. Add brief module-level comments only where they clarify non-obvious decisions. Run typecheck, lint, tests and production build if possible; fix regressions introduced by this stage.

Acceptance criteria: no lost feature; no broken route; no incompatible data migration; types and tests pass where the environment permits; architecture is easier to understand and extend. Record exact checks and outcomes in PROJECT_STATUS.md.
```

## Stage 2 — Add complete English/Russian localization with a language flag

```text
Implement complete English and Russian localization in the existing PromptLab application. This is a product requirement, not just a translation of the landing page. Inspect every route, component, modal, toast, form, empty state, validation message, tooltip, settings screen, authentication screen and error/loading state.

Requirements:
1. English (`en`) is the default locale. Russian (`ru`) is the second locale.
2. Add a compact, accessible language switch in the global header, visibly showing flags and language labels, e.g. `🇬🇧 EN` and `🇷🇺 RU`. Also expose the setting in Settings if that page exists. The control must work by mouse, keyboard and screen reader; do not rely on a flag emoji alone to convey its meaning.
3. Persist the chosen locale in localStorage using a versioned or namespaced key. Restore it on refresh. Validate stored values and safely fall back to English. Avoid a visible flash of the wrong locale where practical.
4. Use a real localization layer, such as a small typed dictionary and `useTranslation` helper, or a lightweight established i18n library if it fits the current dependency/tooling setup. Do not scatter ternaries throughout components. Type translation keys so missing keys are caught during development/tests. Avoid adding a heavy dependency without a reason.
5. Translate all fixed UI copy into natural Russian: navigation, page titles, labels, buttons, categories that are fixed UI labels, filters, sort options, placeholders, form labels, validation, confirmation dialogs, toasts, errors, empty states, tooltips, onboarding, settings, authentication and accessibility labels. Translate date/number formatting appropriately using Intl where applicable. Ensure both languages have the same complete key set.
6. CRITICAL DATA RULE: changing the interface language must NEVER translate, rewrite, normalize, or replace prompt content. Preserve each prompt's original title, description, body/template, variable names, tag text, collection names, notes, history snapshots and imported/exported values exactly. Do not send prompt text to a translation API. Do not localize user-created content. The language toggle changes only fixed application UI and locale-sensitive formatting. Seed prompt examples remain exactly as stored, regardless of selected UI language.
7. Keep English as the original language of developer documentation unless documentation specifically explains Russian support. The UI language setting must not silently change the content of README, PROMPTS.md or prompt records.
8. Use consistent key names and interpolation parameters for dynamic values. Do not concatenate translated sentences in ways that break Russian grammar; use placeholders/interpolation.
9. Add tests for default locale, switching, persistence after reload (where testable), invalid stored locale fallback, dictionary key parity, dynamic interpolation and the invariant that prompt objects are unchanged when locale changes.
10. Check all routes in both languages, including narrow mobile layouts. Fix text overflow, clipped buttons and layout breaks caused by longer Russian strings. Keep the current visual style and support reduced motion.

Acceptance criteria: every fixed UI string is localized; no user prompt data changes when toggling languages; locale persists; switch is accessible; tests cover the critical behavior. Update README and PROJECT_STATUS.md with usage and actual test results.
```

## Stage 3 — Create a reliable persistence/repository layer and protect local data

```text
Make PromptLab persistence reliable and testable while retaining local-first behavior. Inspect current storage schemas and existing users' data before changing anything.

Requirements:
1. Define typed repository interfaces for prompts, collections, prompt versions/history, settings and feedback. Separate domain operations from React components.
2. Keep localStorage as the default/offline repository so the app works without an account, paid service or network. Use safe JSON parsing, schema validation (use an existing validation dependency if appropriate), error handling and explicit storage versioning.
3. Add a backward-compatible migration strategy for existing localStorage records. Do not silently erase malformed or legacy data. If migration fails, show a useful localized error and preserve a recoverable copy where possible.
4. Preserve all current operations: create/edit/duplicate/delete/favorite, search/filter/sort, template variables and preview, collections, history restore, JSON backup import/export, CSV export, settings and theme. Ensure updates remain consistent across pages and after refresh.
5. Prevent data loss during import: validate file size/type/schema, preview or clearly explain replacement/merge behavior, reject malformed files safely and require confirmation before destructive replacement. Never execute imported content as HTML or code. Escape user content in the UI.
6. Handle storage quota/errors with useful English/Russian messages. Do not report a save as successful if persistence failed.
7. Keep prompt bodies and user data out of logs/analytics. Add tests for CRUD, malformed storage, migrations, import/export round trips, CSV escaping, duplicate IDs and storage failures.
8. Do not add cloud sync in this stage; keep the repository interface ready for a remote implementation.

Acceptance criteria: the app remains usable offline and without registration; existing data survives upgrades; all data operations use the repository layer; tests verify persistence and failure cases. Update docs and PROJECT_STATUS.md.
```

## Stage 4 — Finish Supabase schema, authentication and secure cloud repository

```text
Complete the existing optional Supabase integration end-to-end, based on the current code and SQL migrations. Do not expose service-role keys or secrets in the browser. The app must still work without Supabase configuration and without signing in.

First inspect the current SQL schema, RLS policies, auth flow, types and local IDs. Design and implement a consistent mapping between local IDs (which may be slugs such as `p-brand-voice`) and Supabase UUIDs. Do not assume local IDs are UUIDs. Prefer a migration adding stable `local_id` fields with uniqueness constraints scoped to owner where appropriate, or another explicitly documented safe mapping. Apply the same care to collections and prompt-version relationships.

Requirements:
1. Provide `.env.example` with only public client configuration names (e.g. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). Never commit real secrets. Validate missing/invalid configuration and show a clear localized optional-feature status instead of crashing.
2. Implement sign up, sign in, sign out, session restoration, auth state changes, loading states, user-friendly localized errors and email confirmation/password reset if supported by the chosen configuration. Avoid race conditions and duplicate auth subscriptions. Never log credentials or access tokens.
3. Implement a typed Supabase repository for authenticated CRUD on prompts, collections, prompt versions/history and relationships. Map rows to domain models; validate remote data; handle pagination/order where appropriate; handle unique conflicts and errors. Respect RLS. Ensure every user can access only their own data.
4. Keep local-only behavior available. Do not silently upload private local content when a user signs in. Add an explicit, understandable “Sync to cloud” or “Import local data to account” flow with a preview, conflict strategy, progress, success/error states and confirmation. Explain what will be uploaded. Avoid accidental duplicate imports and support retry after partial failure.
5. Define conflict behavior for edits made on multiple devices. Use `updated_at`/revision metadata or another documented strategy. Never silently overwrite newer remote data. Present a conflict choice or clearly documented last-write-wins behavior if that is deliberately selected.
6. On sign out, do not unexpectedly erase local data. Clearly distinguish local data from cloud data and document how switching accounts works. Prevent one account's cached data from being displayed to another account.
7. Create/update SQL migrations with constraints, indexes, foreign keys and RLS policies for every table. Review policies against anonymous and authenticated access. Do not rely only on UI checks for security. Ensure users cannot set another user's `user_id`/owner. Test SQL/RLS as far as available tooling permits and document manual Supabase verification steps.
8. Keep secrets and admin operations server-side; do not create a service-role key in frontend code. If any operation requires trusted server logic, explain and implement an appropriate server-side/Edge Function path rather than bypassing RLS.
9. Add unit tests for mapping and repository behavior using mocked Supabase responses, plus integration tests where feasible.

Acceptance criteria: with valid Supabase environment values and migrations applied, an authenticated user can explicitly sync and then create/edit/delete prompts and collections in the cloud; another user cannot read or change those rows; without configuration the local app still works. Do not claim real cloud integration was tested unless a configured Supabase project was actually used. Document required dashboard setup and manual tests.
```

## Stage 5 — Finish feedback, settings and user-facing error handling

```text
Finish the feedback and settings flows in PromptLab, using the localization system and repository interfaces already implemented.

Feedback requirements:
1. Decide and implement clearly documented behavior: if Supabase is configured, submit feedback through a safe, validated insert into the feedback table; if cloud feedback is unavailable, either allow an explicitly labelled local draft or show that sending is unavailable. Do not show “sent” when feedback only exists in localStorage.
2. Validate required fields and reasonable length limits on both client and database side. Trim accidental whitespace, preserve meaningful user text, and prevent HTML/script execution. Do not collect more personal data than necessary.
3. Add loading, success, retry and failure states in English and Russian. Prevent duplicate submissions. Do not expose stack traces or database details to end users.
4. Review feedback RLS. Decide whether anonymous feedback is allowed. If it is, restrict insertable columns and status values, deny public reads, and document rate-limiting/abuse mitigations. If a safe policy cannot be achieved with direct browser inserts, use a suitable server/Edge Function. Never expose a service-role key.

Settings requirements:
- Language selector works and persists.
- Theme selector works and persists.
- Storage/cloud status is accurate.
- Sign in/out state is accurate.
- Import/export options have clear descriptions and destructive-action confirmation.
- Privacy copy accurately states where data is stored and what is transmitted. Do not claim encryption, privacy guarantees or cloud delivery that are not implemented.

Add tests for form validation, success/failure behavior, duplicate-submit prevention, localization and privacy-related copy. Update README, `.env.example`, SQL migrations and PROJECT_STATUS.md.

Acceptance criteria: feedback status is truthful, validation and access policies are safe, settings match actual app state, and all user-facing states are localized.
```

## Stage 6 — Complete automated tests and accessibility QA

```text
Perform a comprehensive QA pass on the existing PromptLab app. Add meaningful tests rather than superficial tests that only assert a component renders. Use the repository's existing Vitest/Testing Library setup unless it is demonstrably unsuitable.

Cover at least:
- prompt CRUD, duplicate/favorite/delete confirmation and search/filter/sort;
- template variable parsing, valid/invalid variable names, missing variables, interpolation and preview;
- collections and prompt membership;
- history snapshots and restore;
- JSON import/export round trip, invalid imports, CSV escaping and special characters;
- localStorage migrations, corruption, quota/write failures and offline use;
- English/Russian locale switching, persistence, missing-key detection and prompt-content immutability;
- theme persistence and reduced-motion behavior where testable;
- auth loading/error/success states and session changes with mocked Supabase;
- cloud repository row mapping, RLS-dependent errors, conflict behavior and explicit-sync flow;
- feedback validation and truthful submission states;
- router navigation and direct nested-route refresh behavior.

Add end-to-end browser tests if the current dependencies/environment allow (Playwright is a reasonable choice, but do not add it blindly if it cannot be installed). Include a deterministic smoke test for the main user journey: open app → create prompt → add template variable → preview → favorite → create collection/add prompt → export JSON → reload and verify data. Test both languages and mobile-sized layout if browser automation is available.

Accessibility: semantic headings/landmarks, keyboard navigation, visible focus, labels for every input, accessible dialogs, sensible focus restoration, accessible status announcements, sufficient contrast, no color-only information, proper button names and language-switch semantics. Respect `prefers-reduced-motion`. Check for console errors and React key warnings.

Run and fix all available checks: `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`. If scripts differ, inspect package.json and use the correct commands. Report every command and exit status honestly; distinguish code failures from missing dependencies/network issues. Do not suppress lint errors or weaken tests merely to obtain green checks.

Acceptance criteria: important workflows have meaningful automated coverage; all checks that can run in the environment pass; remaining environment limitations are explicit; PROJECT_STATUS.md lists residual risks.
```

## Stage 7 — Production build, routing, GitHub Pages/Netlify and documentation

```text
Prepare the existing PromptLab repository for a reliable public deployment. Inspect current Vite base-path configuration, React Router basename, GitHub Actions, Netlify config, package scripts and documentation before changing them.

Requirements:
1. Ensure the app builds for both root hosting (e.g. Netlify) and GitHub Pages project subpaths. Avoid hardcoding one base path into source code. Use Vite's BASE_URL and correct router basename. Verify static assets and favicon paths.
2. Ensure direct refresh/deep links work on every route. Configure GitHub Pages SPA fallback correctly (including 404.html if that is the selected strategy) and Netlify redirects where needed. Do not claim nested-route support without testing it.
3. Make CI run a clean dependency install, typecheck, lint, unit tests and production build. Use `npm ci` only when a committed lockfile exists and is kept in sync; otherwise generate and commit a lockfile with a successful install, then use `npm ci`. Do not change CI to `npm install` merely to hide a missing lockfile without explaining why.
4. Inspect workflow permissions, branch triggers, secrets and deployment environment. Use least privilege. Do not print secrets to logs. Avoid deploying on untrusted pull requests with secrets available.
5. Check production environment variable setup and document Supabase redirect URLs, allowed origins and email-confirmation behavior. Ensure no private keys are bundled into `dist`.
6. Update README.md with: project overview, screenshots only if real screenshots exist, features, architecture, requirements, local setup, scripts, environment variables, Supabase setup/migration order, local vs cloud data behavior, localization, tests, deployment, troubleshooting and known limitations. Keep PROMPTS.md aligned with the actual implementation. Update PROJECT_STATUS.md with verified results.
7. Add sensible metadata (title, description, theme color, favicon, Open Graph metadata if appropriate) and verify no broken links or placeholder content remain.
8. Do not claim a live demo exists unless deployment actually completed and the URL was verified. If deployment credentials or external setup are unavailable, leave reproducible instructions and state what the user must configure.

Acceptance criteria: clean install and production build pass in a network-enabled environment; CI reflects the actual scripts; root and subpath deployment settings are coherent; docs match the real product; no secret is exposed.
```

## Stage 8 — Final release gate: prove it works and list anything that still needs human setup

```text
Act as the release engineer for PromptLab. Do not add new features in this stage unless required to fix a verified release blocker. Review the whole repository and verify that each feature promised by the README actually works.

Run a final clean install from the committed lockfile, typecheck, lint, unit tests, production build and available end-to-end tests. Inspect the final diff and Git status. Check for secrets, accidental environment files, debug logs, TODO placeholders, dead links, unused dependencies, console errors, broken imports and uncommitted generated artifacts. Inspect the production bundle for accidentally embedded service-role keys or other secrets.

Manually or through browser tests verify:
1. App opens with no Supabase env values and local-only features work.
2. Main prompt CRUD, variables/preview, favorites, filters, collections, history and import/export work and persist after reload.
3. English/Russian switch works across all routes and remains selected after reload; switching language does not change any prompt/user content.
4. Theme and reduced-motion behavior work.
5. Sign-up/sign-in/sign-out and cloud CRUD work with a real configured Supabase test project if credentials are available; verify RLS between two test users. If no project is available, report these checks as NOT RUN and provide exact manual verification steps.
6. Feedback only reports success when it has really been delivered to its documented destination.
7. Direct route refresh and deployment base paths work for the configured target.
8. Mobile viewport, keyboard-only navigation, form errors and loading states are usable.

Fix all verified release-blocking defects, rerun affected checks and then rerun the full available suite. Do not fabricate screenshots, deployment URLs, cloud test results or green CI status. Provide a concise final report with: completed features, exact commands/results, actual deployment URL only if verified, required environment/dashboard setup, tests not run and why, known limitations, and the commit hash if available. Update PROJECT_STATUS.md and README.md to match the truth.

Release gate: do not call PromptLab “finished” if a core advertised feature is broken or if the report hides an unrun test. Clearly separate “implemented”, “verified locally”, “verified against real Supabase”, and “requires user configuration”.
```

---

## Optional Stage 9 — Visual polish after functional completion

```text
Only after the functional release gate passes, perform a focused UI polish pass on PromptLab. Preserve the established premium dark/lavender visual direction and current information architecture. Do not sacrifice usability for decoration.

Check spacing, typography hierarchy, cards, dialogs, forms, responsive navigation, hover/focus/pressed/disabled/loading states, skeletons, empty states, errors and success feedback in both English and Russian. Ensure long prompt names, large prompt bodies, long tags and Russian labels do not overflow. Check 320px mobile width, tablet and desktop. Ensure keyboard focus is visible, contrast is sufficient, animation is restrained and reduced-motion preferences are respected. Do not add gratuitous animations, heavy dependencies or fake dashboard metrics. Add or update visual regression/smoke tests if tooling is already available. Run the complete test suite and build after changes.

Acceptance criteria: visual changes are consistent, responsive, accessible, and do not regress any behavior or localization invariant.
```

## Important implementation decisions to keep consistent

- Local-first operation must remain available without an account or Supabase credentials.
- Do not silently upload local data on sign-in; cloud sync requires explicit user consent.
- Prompt content is user data. Never translate or mutate it when changing UI language.
- Never put a Supabase service-role key or other secret in frontend environment variables.
- A local feedback record is not the same as successfully sent feedback.
- Do not claim tests, Supabase behavior or deployment were verified unless they were actually run against the relevant environment.
- Prefer small, reviewable diffs and one commit per stage.
