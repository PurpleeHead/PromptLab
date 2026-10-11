# PromptLab — AI-assisted development log

This file documents the intended AI-assisted engineering workflow. Update it with the exact prompts used, actual changed files, manual decisions, and verification results during development. Do not treat planned checks as completed checks.

## Product specification

**Goal:** Build a local-first, responsive prompt workspace with prompt CRUD, search and filters, categories and tags, favorites, variable rendering, collections, version snapshots, JSON import, CSV export, settings, feedback capture, and optional Supabase authentication.

**Core constraints:** React + TypeScript + Vite + SCSS; English UI and documentation; no paid AI API requirement; no mandatory registration; no privileged secrets in frontend code; separate modules; automated tests; deployment instructions.

## Implementation phases

### 1. Foundation and visual system

**Prompt used:**

> Build a premium, responsive React + TypeScript + Vite application called PromptLab. Use SCSS, a feature-oriented structure, accessible controls, a graphite dark theme with violet accents, subtle motion, reduced-motion support, reusable components, and an English-only interface. Add build, typecheck, lint, and test scripts. Do not create decorative controls that imply functionality that does not exist.

**Manual review:** Inspect responsive layout, color contrast, keyboard focus, reduced-motion behavior, and actual control behavior.

**Verification:** Record actual commands and outcomes after running them.

### 2. Prompt library and editor

**Prompt used:**

> Implement prompt create, edit, duplicate, delete, favorite, search, combined category/tag/favorite filters, sorting, and grid/list views. Keep business logic in reusable modules. Implement a plain-text template engine for `{{variable_name}}` that deduplicates placeholders, preserves missing values, and never evaluates user content as HTML or code. Add tests for the core rules.

**Manual review:** Confirm that the raw template is preserved, rendered text is copied accurately, and missing variables remain visible.

### 3. Collections and version history

**Prompt used:**

> Add collections with create, rename, delete, and prompt membership management. Save snapshots when meaningful prompt edits occur. Restore a snapshot by loading its contents into the editor and preserving existing history. Add tests for version numbering, membership, and restoration.

**Manual review:** Check whether deleting a prompt removes collection references and whether restoring a version creates a safe new current state.

### 4. Import and export

**Prompt used:**

> Implement JSON backup import/export and CSV export. Validate untrusted JSON before applying changes, reject malformed or oversized files, preserve existing data on invalid input, handle duplicate IDs, and correctly quote CSV fields containing commas, quotes, newlines, and Unicode. Document that CSV import is not implemented.

**Manual review:** Test round trips and verify that CSV limitations are documented.

### 5. Optional cloud integration

**Prompt used:**

> Add optional Supabase client configuration, authentication, SQL migrations, and row-level security. Keep local mode working when environment variables are missing. Never place a service-role key in the browser. Do not claim cloud synchronization until repository operations and cross-user authorization have been implemented and tested.

**Manual review:** Authentication and database synchronization are separate features. Test with multiple accounts before making security claims.

### 6. Release audit

**Prompt used:**

> Inspect the repository for dead controls, data-loss risks, unsafe rendering, accessibility issues, missing tests, environment leaks, broken nested routes, and misleading documentation. Run type checking, lint, tests, and a production build. Report only checks that were actually executed.

**Manual review:** Record actual build/test output, deployment URL, direct-route checks, and remaining limitations.

## Current implementation notes

- Local prompt data is stored in a versioned browser-storage record.
- Prompt variable parsing and rendering are pure functions.
- The current account page can call Supabase Auth when configured.
- Supabase prompt CRUD and local/cloud synchronization are not implemented yet.
- Feedback is currently saved locally and is not sent to an external inbox.
- The SQL migration is a starter schema; review RLS and add server-side rate limiting before exposing public feedback submission.
