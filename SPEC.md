# PromptLab — AI Prompt Workspace

## Product Requirements & Technical Specification

**Project type:** Standalone web application
**Language:** English by default, Russian as an additional locale
**Frontend:** React, TypeScript, Vite, SCSS
**Storage:** Local-first with optional Supabase cloud integration
**Quality requirements:** Responsive UI, accessibility, automated tests, security, production build and deployment documentation.

---

## 1. Product Overview

PromptLab is a workspace for creating, editing, organizing, previewing, and versioning prompts used with large language models (LLMs).

The application helps users maintain a reusable prompt library, create dynamic prompt templates, manage collections, preview rendered prompts with variables, and export their work.

The application must be useful without a paid LLM API, mandatory registration, or a configured backend.

## 2. Product Goals

- Provide a complete prompt management workflow.
- Make prompt templates reusable through dynamic variables.
- Organize prompts with collections, tags, search, favorites, and filters.
- Support prompt version history and restoration.
- Provide import and export capabilities.
- Support English and Russian UI localization.
- Offer optional authentication and cloud synchronization.
- Maintain data integrity, secure configuration, and testable architecture.
- Be independently deployable as a public portfolio project.

## 3. Target Users

- Developers working with LLMs.
- Prompt engineers.
- Content creators and marketers.
- Product teams maintaining reusable AI instructions.
- Users who need a structured, searchable prompt library.

## 4. Required Routes

- `/` — Dashboard
- `/library` — Prompt Library
- `/prompts/new` — Create Prompt
- `/prompts/:id` — Prompt Editor and Details
- `/collections` — Collection Management
- `/favorites` — Favorite Prompts
- `/settings` — Application Settings
- `/auth` — Authentication
- `/feedback` — Feedback Form

All routes must work when opened directly. Configure the hosting provider to serve the SPA entry point for nested routes.

Unknown routes must display a proper Not Found page.

## 5. Core Features

### 5.1 Dashboard

Display:

- Total prompt count.
- Favorite count.
- Collection count.
- Recently updated prompts.
- Recently used prompts, if usage tracking is implemented.
- Quick actions for creating a prompt and opening the library.
- Useful empty states for new users.

Dashboard statistics must be derived from the actual data source.

### 5.2 Prompt Library

Implement:

- Search by title, description, tags, and prompt content.
- Filtering by collection, tags, favorites, and applicable categories.
- Sorting by updated date, created date, and alphabetical order.
- Responsive prompt cards or a list view.
- Favorite/unfavorite action.
- Create, edit, duplicate, and delete actions.
- Confirmation before destructive actions.
- Clear loading, empty, error, and success states.

Search, filters, and sorting must operate on real prompt data.

### 5.3 Prompt Editor

Provide editable fields for:

- Title (required).
- Description.
- System instructions.
- User prompt template.
- Tags.
- Collection.
- Favorite status.

Use clear labels, validation messages, and unsaved-change handling.

The user must be able to create, edit, duplicate, save, and delete prompts.

### 5.4 Dynamic Variables

Support template variables using the syntax `{{variableName}}`.

Example:

`Write a {{tone}} product description for {{productName}}. Target audience: {{audience}}.`

Requirements:

- Detect variables in the template.
- Generate input fields for detected variables.
- Allow users to provide variable values.
- Render a preview with values substituted.
- Handle repeated variables consistently.
- Preserve the original template.
- Display missing variables clearly.
- Avoid silently replacing missing values with misleading content.
- Support valid variable names and document the accepted syntax.
- Update the preview when the template or values change.

Variable substitution must be implemented locally and must not require an LLM API.

### 5.5 Prompt Preview

Display:

- The original template.
- Detected variables.
- Variable inputs.
- Rendered prompt.
- Missing-variable warnings.
- Copy-to-clipboard action.

If system instructions and a user template are both present, display them as separate sections. Do not imply that a real model response has been generated.

### 5.6 Version History

Save prompt snapshots when meaningful changes are made.

A version should contain:

- Unique identifier.
- Prompt identifier.
- Snapshot of the relevant prompt fields.
- Creation timestamp.
- Optional version note.

Allow users to:

- View previous versions.
- Compare the current prompt with a saved version.
- Restore a previous version.
- Cancel restoration before applying it.

Restoration must create a new current state without silently deleting historical snapshots.

### 5.7 Collections

Users must be able to:

- Create and rename collections.
- Delete collections with a clear explanation of what happens to associated prompts.
- Assign prompts to collections.
- Filter the library by collection.
- View collection counts.

Deleting a collection must not accidentally delete its prompts.

### 5.8 Favorites and Recent Activity

- Toggle favorite status.
- Open a dedicated Favorites page.
- Track recent prompt usage or editing locally where appropriate.
- Do not record sensitive prompt contents in analytics or console logs.

### 5.9 Import and Export

Support:

- Exporting prompts as JSON.
- Importing prompts from validated JSON.
- Exporting a suitable tabular representation as CSV.
- Clear validation and error messages for invalid files.
- Duplicate handling and import previews where practical.
- Safe parsing of untrusted input.
- Preservation of supported metadata.

Importing must not overwrite existing data without an explicit decision.

### 5.10 Settings

Provide:

- Language selection.
- Theme selection if implemented.
- Local data management.
- Export and import access.
- Cloud sync status when configured.
- Account controls when authenticated.
- Clear confirmation before destructive data operations.

### 5.11 Feedback

Provide a feedback form with:

- Feedback category.
- Message.
- Optional contact information.
- Validation and submission states.

Without a backend, do not falsely report that feedback has been sent to a server. Use an honest local demonstration state or provide a clearly documented backend integration.

## 6. Localization

English is the default locale. Russian is the additional supported locale.

Requirements:

- Translate the entire application interface.
- Use a language selector with recognizable language flags and accessible text labels.
- Persist the selected locale.
- Restore the selected locale after refresh.
- Provide translations for navigation, buttons, forms, validation, empty states, dialogs, errors, and accessibility labels.
- Avoid hardcoded UI strings inside feature components.

Important content preservation rule:

Changing the interface language must not translate or mutate user-created prompt titles, descriptions, tags, templates, system instructions, variable names, or variable values.

Prompt content must remain exactly as authored.

## 7. Data Model

### Prompt

- `id`
- `title`
- `description`
- `systemPrompt`
- `template`
- `tags`
- `collectionId`
- `isFavorite`
- `createdAt`
- `updatedAt`

### Collection

- `id`
- `name`
- `description`
- `createdAt`
- `updatedAt`

### PromptVersion

- `id`
- `promptId`
- `snapshot`
- `note`
- `createdAt`

### User Preferences

- `locale`
- `theme`, if supported
- Other non-sensitive application preferences

Use stable IDs and consistent timestamp formats. Define TypeScript interfaces or types for all persisted entities.

## 8. Storage and Repository Architecture

Use repository interfaces to separate application logic from persistence.

Required concepts:

- `PromptRepository`
- `CollectionRepository`
- `PromptVersionRepository`
- Local implementations using browser storage.
- Optional remote implementations using Supabase.

Choose IndexedDB for larger or more complex persistent datasets, or localStorage for a simpler implementation. Encapsulate the chosen technology behind repositories.

Requirements:

- The core application works without Supabase configuration.
- Data survives page refreshes.
- Errors are handled rather than silently discarded.
- Storage initialization is predictable.
- Import and export preserve supported fields.
- Cloud integration must not be required to build or run the application.

If local and remote storage are both supported, define explicit synchronization rules and conflict handling.

## 9. Optional Supabase Integration

Implement only as an optional capability.

Potential functionality:

- Authentication.
- User-owned prompt records.
- User-owned collections.
- Version history.
- Cloud synchronization.

Use database migrations or documented SQL schema.

Apply Row Level Security policies so authenticated users can access only their authorized records.

Never expose service-role keys, private API keys, or privileged secrets in browser code.

Public client configuration may be provided through documented environment variables when appropriate. Secrets must be handled by a trusted server-side environment.

Unauthenticated local use must continue working when Supabase is not configured.

## 10. Technical Architecture

Use a feature-based structure. Keep components, hooks, services, repository interfaces, types, and validation close to the feature that owns them.

Suggested structure:

- `src/app/` — application setup and routing.
- `src/components/` — shared UI components.
- `src/features/dashboard/`
- `src/features/prompts/`
- `src/features/collections/`
- `src/features/favorites/`
- `src/features/settings/`
- `src/features/auth/`
- `src/features/feedback/`
- `src/features/i18n/`
- `src/lib/` — shared utilities.
- `src/repositories/` — persistence abstractions and implementations.
- `src/styles/` — global styles, variables, and design tokens.
- `src/types/` — shared domain types where appropriate.
- `tests/` — tests, organized consistently with the project.

Do not introduce unnecessary abstractions or dependencies. Keep modules small, cohesive, and easy to maintain.

## 11. Design Requirements

Create a polished, premium SaaS interface with a dark-first visual identity.

The visual direction should feel like a modern developer productivity tool rather than a generic admin template.

Requirements:

- Dark navy or charcoal backgrounds.
- Clear contrast between background, panels, borders, and text.
- Consistent spacing and typography.
- Reusable design tokens.
- Sidebar navigation on desktop.
- Responsive navigation on mobile.
- Thoughtful prompt cards, editor fields, dialogs, and preview panels.
- Consistent hover, focus, active, disabled, loading, and error states.
- Subtle transitions and restrained animations.
- No excessive gradients, decorative clutter, or unnecessary motion.
- Accessible keyboard navigation and visible focus indicators.
- Responsive layouts for desktop, tablet, and mobile.

Use SCSS modules or a consistent SCSS organization. Avoid duplicated styles and uncontrolled global selectors.

## 12. Validation and Security

- Validate user input before persistence.
- Validate imported JSON and CSV.
- Render user content as text by default.
- Avoid unsafe HTML injection.
- Handle malformed storage data.
- Do not store private API secrets in frontend code.
- Do not commit `.env` files containing secrets.
- Provide `.env.example` containing placeholders only.
- Do not log complete prompt content unnecessarily.
- Confirm destructive actions.
- Handle rejected promises and storage errors.
- Keep dependencies and permissions minimal.

## 13. Testing

Use Vitest and React Testing Library where appropriate.

Required coverage:

- Variable detection and substitution.
- Missing-variable handling.
- Prompt validation.
- Repository CRUD operations.
- Persistence after reload, where testable.
- Favorites and collection assignment.
- Import validation and export serialization.
- Locale persistence and interface translation.
- Version snapshot creation and restoration.
- Critical route rendering.
- Key user workflows.

Add end-to-end tests for the most important flows if practical.

Tests must verify actual behavior rather than implementation details.

## 14. Developer Experience

Provide scripts for:

- Development.
- Production build.
- Type checking.
- Linting.
- Unit tests.
- Test coverage, if configured.

Use strict TypeScript settings and fix unused variables, imports, and type errors.

Do not disable strict compiler checks merely to make the build pass.

## 15. Documentation

The repository must contain:

- `README.md` — overview, features, setup, scripts, architecture, configuration, and deployment.
- `SPEC.md` — this technical specification.
- `PROMPTS.md` — development prompts and instructions used with AI coding tools.
- `.env.example` — safe configuration template.
- Database schema or migrations if Supabase is implemented.
- Test and deployment instructions.

Documentation must be written in English.

## 16. Deployment

The application must be deployable independently.

Document a supported static hosting workflow, such as GitHub Pages, Vercel, or Netlify.

Requirements:

- Successful production build.
- Correct base path where required.
- Correct SPA routing behavior for nested URLs.
- No hardcoded development-only URLs.
- No mandatory backend for core features.
- Documented environment variables.
- Live demo instructions and known limitations.

## 17. Definition of Done

The project is complete when:

1. The app installs and starts using the documented commands.
2. Type checking passes.
3. Linting passes.
4. The production build succeeds.
5. Core routes work on direct navigation.
6. Prompts can be created, edited, duplicated, searched, filtered, and deleted.
7. Prompt data persists across reloads.
8. Dynamic variables and preview work correctly.
9. Collections and favorites work.
10. Version history and restoration work.
11. Import and export are validated and usable.
12. English and Russian UI translations work and persist.
13. User-authored prompt content remains unchanged during locale switching.
14. The core app works without paid APIs or mandatory registration.
15. Tests pass.
16. No private secrets are exposed.
17. README and development prompts are complete.
18. Deployment instructions have been verified.

Do not claim a requirement is complete until it has been implemented and tested.
