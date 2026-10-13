import type { AppData, FeedbackEntry, Prompt, PromptCategory, PromptCollection, PromptInput, PromptVersion } from '../types';

export const STORAGE_KEY = 'promptlab:data:v1';
export const STORAGE_BACKUP_KEY = 'promptlab:data:backup:v1';
export const SETTINGS_STORAGE_KEY = 'promptlab:settings:v1';
export const STORAGE_SCHEMA_VERSION = 1;

export type StorageImportMode = 'merge' | 'replace';

export interface AppSettings {
  theme: 'dark' | 'light';
  locale: 'en' | 'ru';
}

export interface StorageRepository {
  readData(): AppData;
  writeData(data: AppData): void;
  readSettings(): AppSettings;
  writeSettings(settings: Partial<AppSettings>): AppSettings;
  createPrompt(data: AppData, input: PromptInput, id?: string): AppData;
  importJson(raw: string, current: AppData, mode?: StorageImportMode): { data: AppData; imported: number; error?: string };
}

const now = () => new Date().toISOString();

const starterPrompts: Prompt[] = [
  { id: 'p-brand-voice', title: 'Brand Voice Architect', description: 'Build a clear, consistent voice guide for a growing brand.', body: 'Act as a senior brand strategist. Create a practical voice guide for {{brand_name}}, a {{business_type}} serving {{audience}}.\n\nVoice traits: {{voice_traits}}\nChannels: {{channels}}\n\nDeliver a concise guide with tone principles, do/don’t examples, vocabulary guidance, and three sample messages. Keep it actionable and specific.', category: 'Marketing', tags: ['branding', 'strategy', 'copywriting'], favorite: true, createdAt: now(), updatedAt: now(), versions: [] },
  { id: 'p-code-review', title: 'Thoughtful Code Reviewer', description: 'Review code for correctness, maintainability, and meaningful risks.', body: 'Act as a senior {{language}} engineer. Review the following code for {{review_focus}}.\n\nContext: {{context}}\nCode:\n```\n{{code}}\n```\n\nPrioritize verified defects, explain impact, suggest minimal fixes, and identify missing tests. Do not invent issues or rewrite unrelated code.', category: 'Development', tags: ['engineering', 'review', 'quality'], favorite: true, createdAt: now(), updatedAt: now(), versions: [] },
  { id: 'p-research-brief', title: 'Research Brief Builder', description: 'Turn a broad question into a structured research plan.', body: 'You are a rigorous research assistant. Help investigate {{research_question}} for {{target_audience}}.\n\nScope: {{scope}}\nConstraints: {{constraints}}\n\nProduce: key questions, competing hypotheses, evidence needed, likely source types, a step-by-step research plan, and uncertainties that must remain explicit. Separate facts from assumptions.', category: 'Research', tags: ['research', 'planning', 'analysis'], favorite: false, createdAt: now(), updatedAt: now(), versions: [] },
  { id: 'p-product-launch', title: 'Product Launch Planner', description: 'Create a launch plan with clear phases and measurable outcomes.', body: 'Act as a product marketing lead. Build a launch plan for {{product}} targeting {{audience}}.\n\nLaunch date: {{launch_date}}\nBudget: {{budget}}\nPrimary goal: {{goal}}\n\nInclude positioning, launch phases, channel plan, owners, dependencies, risks, success metrics, and a realistic first-week checklist. State assumptions instead of treating unknowns as facts.', category: 'Marketing', tags: ['launch', 'planning', 'growth'], favorite: false, createdAt: now(), updatedAt: now(), versions: [] },
  { id: 'p-learning-coach', title: 'Personal Learning Coach', description: 'Design a realistic learning plan around time and current skill level.', body: 'Act as a supportive learning designer. Create a {{duration}} learning plan for {{subject}}.\n\nCurrent level: {{current_level}}\nWeekly time: {{weekly_hours}}\nGoal: {{goal}}\n\nBreak the plan into weekly milestones, practice tasks, review sessions, and measurable outcomes. Prefer active recall and small projects. Include a fallback plan for busy weeks.', category: 'Productivity', tags: ['learning', 'habits', 'planning'], favorite: false, createdAt: now(), updatedAt: now(), versions: [] },
  { id: 'p-ux-audit', title: 'UX Audit Partner', description: 'Audit a digital flow and prioritize usability improvements.', body: 'Act as a senior UX designer. Audit {{product_or_flow}} for {{primary_task}}.\n\nUsers: {{user_group}}\nKnown issues: {{known_issues}}\n\nReturn a prioritized list of usability findings with evidence, user impact, severity, suggested improvements, and validation methods. Clearly label hypotheses that require user research.', category: 'Design', tags: ['ux', 'audit', 'product'], favorite: false, createdAt: now(), updatedAt: now(), versions: [] },
];

const defaultSettings: AppSettings = { theme: 'light', locale: 'en' };

function detectBrowserLocale(): AppSettings['locale'] {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function emptyData(): AppData {
  const createdAt = now();
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    prompts: starterPrompts,
    collections: [{ id: 'c-starters', name: 'Starter Kit', description: 'A few useful prompts to get started.', promptIds: starterPrompts.slice(0, 3).map((prompt) => prompt.id), createdAt }],
    feedback: [],
  };
}

function isPromptCategory(value: unknown): value is PromptCategory {
  return value === 'Writing' || value === 'Development' || value === 'Marketing' || value === 'Research' || value === 'Productivity' || value === 'Design' || value === 'General';
}

function normalizePromptVersion(value: unknown): PromptVersion | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PromptVersion> & Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.createdAt !== 'string' || typeof candidate.title !== 'string' || typeof candidate.description !== 'string' || typeof candidate.body !== 'string' || typeof candidate.version !== 'number') return null;
  const category = isPromptCategory(candidate.category) ? candidate.category : 'General';
  return {
    id: candidate.id,
    version: candidate.version,
    title: candidate.title,
    description: candidate.description,
    body: candidate.body,
    category,
    tags: Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    createdAt: candidate.createdAt,
  };
}

function normalizePrompt(value: unknown): Prompt | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Prompt> & Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.title !== 'string' || typeof candidate.body !== 'string') return null;

  const category = isPromptCategory(candidate.category) ? candidate.category : 'General';

  return {
    id: candidate.id,
    title: candidate.title,
    description: typeof candidate.description === 'string' ? candidate.description : '',
    body: candidate.body,
    category,
    tags: Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    favorite: Boolean(candidate.favorite),
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : now(),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now(),
    versions: Array.isArray(candidate.versions) ? candidate.versions.map(normalizePromptVersion).filter((version): version is PromptVersion => version !== null) : [],
  };
}

function normalizeCollection(value: unknown): PromptCollection | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PromptCollection> & Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || !Array.isArray(candidate.promptIds)) return null;
  return {
    id: candidate.id,
    name: candidate.name,
    description: typeof candidate.description === 'string' ? candidate.description : '',
    promptIds: candidate.promptIds.filter((promptId): promptId is string => typeof promptId === 'string'),
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : now(),
  };
}

function normalizeFeedback(value: unknown): FeedbackEntry | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<FeedbackEntry> & Record<string, unknown>;
  if (typeof candidate.id !== 'string' || (candidate.type !== 'bug' && candidate.type !== 'feature' && candidate.type !== 'general') || typeof candidate.subject !== 'string' || typeof candidate.message !== 'string' || typeof candidate.email !== 'string' || typeof candidate.createdAt !== 'string') return null;
  return {
    id: candidate.id,
    type: candidate.type,
    subject: candidate.subject,
    message: candidate.message,
    email: candidate.email,
    createdAt: candidate.createdAt,
  };
}

function persistRecoveryCopy(raw: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify({ createdAt: now(), payload: raw }));
  } catch {
    // The browser may reject backup persistence; keep the app usable anyway.
  }
}

function parseStorageValue<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function normalizeData(value: unknown): AppData {
  if (!value || typeof value !== 'object') return emptyData();
  const candidate = value as Partial<AppData> & Record<string, unknown>;
  if (!Array.isArray(candidate.prompts)) return emptyData();

  const prompts = candidate.prompts.map(normalizePrompt).filter((prompt): prompt is Prompt => prompt !== null);
  const collections = Array.isArray(candidate.collections) ? candidate.collections.map(normalizeCollection).filter((collection): collection is PromptCollection => collection !== null) : [];
  const feedback = Array.isArray(candidate.feedback) ? candidate.feedback.map(normalizeFeedback).filter((entry): entry is FeedbackEntry => entry !== null) : [];

  if (prompts.length === 0 && candidate.prompts.length > 0) return emptyData();

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    prompts: prompts.length > 0 ? prompts : emptyData().prompts,
    collections,
    feedback,
  };
}

export function readData(): AppData {
  if (typeof window === 'undefined') return emptyData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = emptyData();
      writeData(initial);
      return initial;
    }

    const parsed = parseStorageValue<unknown>(raw);
    const normalized = normalizeData(parsed);

    if (parsed === null) {
      persistRecoveryCopy(raw);
      return normalized;
    }

    return normalized;
  } catch {
    const fallback = emptyData();
    try {
      writeData(fallback);
    } catch {
      // Storage may be unavailable; keep the app responsive.
    }
    return fallback;
  }
}

export function writeData(data: AppData): void {
  if (typeof window === 'undefined') return;

  const cleanData: AppData = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    prompts: data.prompts.map((prompt) => ({ ...prompt, versions: prompt.versions.map((version) => ({ ...version, category: version.category })) })),
    collections: data.collections.map((collection) => ({ ...collection })),
    feedback: data.feedback.map((entry) => ({ ...entry })),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
  } catch {
    throw new Error('Storage is unavailable. Export your prompts to avoid losing changes.');
  }
}

export function readSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...defaultSettings, locale: detectBrowserLocale() };

    const parsed = parseStorageValue<Partial<AppSettings>>(raw);
    const next: AppSettings = {
      theme: parsed?.theme === 'dark' || parsed?.theme === 'light' ? parsed.theme : defaultSettings.theme,
      locale: parsed?.locale === 'en' || parsed?.locale === 'ru' ? parsed.locale : detectBrowserLocale(),
    };
    return next;
  } catch {
    return { ...defaultSettings, locale: detectBrowserLocale() };
  }
}

export function writeSettings(settings: Partial<AppSettings>): AppSettings {
  const current = readSettings();
  const next: AppSettings = {
    theme: settings.theme === 'dark' || settings.theme === 'light' ? settings.theme : current.theme,
    locale: settings.locale === 'en' || settings.locale === 'ru' ? settings.locale : current.locale,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures here; the app keeps working with in-memory settings.
    }
  }

  return next;
}

export function createId(): string { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export function savePrompt(data: AppData, input: Pick<Prompt, 'title' | 'description' | 'body' | 'category' | 'tags'>, id?: string): AppData {
  const timestamp = now();
  if (id) {
    const existing = data.prompts.find((prompt) => prompt.id === id);
    if (!existing) return data;

    const changed = existing.title !== input.title || existing.description !== input.description || existing.body !== input.body || existing.category !== input.category || JSON.stringify(existing.tags) !== JSON.stringify(input.tags);
    const versions: PromptVersion[] = changed ? [...existing.versions, { id: createId(), version: existing.versions.length + 1, title: existing.title, description: existing.description, body: existing.body, category: existing.category, tags: [...existing.tags], createdAt: timestamp }] : existing.versions;

    return {
      ...data,
      prompts: data.prompts.map((prompt) => prompt.id === id ? { ...prompt, ...input, tags: [...input.tags], updatedAt: timestamp, versions } : prompt),
    };
  }

  const prompt: Prompt = { ...input, id: createId(), tags: [...input.tags], favorite: false, createdAt: timestamp, updatedAt: timestamp, versions: [] };
  return { ...data, prompts: [prompt, ...data.prompts] };
}

export function exportJson(data: AppData): string { return JSON.stringify({ ...data, exportedAt: now() }, null, 2); }

function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"`; }

export function exportCsv(prompts: Prompt[]): string {
  const headers = ['title', 'description', 'body', 'category', 'tags', 'favorite', 'createdAt', 'updatedAt'];
  return [headers.join(','), ...prompts.map((prompt) => [prompt.title, prompt.description, prompt.body, prompt.category, prompt.tags.join('|'), String(prompt.favorite), prompt.createdAt, prompt.updatedAt].map(csvCell).join(','))].join('\r\n');
}

export function importJson(raw: string, current: AppData, mode: StorageImportMode = 'merge'): { data: AppData; imported: number; error?: string } {
  const parsed = parseStorageValue<unknown>(raw);
  if (!parsed || typeof parsed !== 'object') return { data: current, imported: 0, error: 'Unable to read this JSON file. Check its format and try again.' };

  const candidate = 'data' in parsed && parsed && typeof parsed === 'object' ? (parsed as { data?: unknown }).data : parsed;
  if (!candidate || typeof candidate !== 'object' || !Array.isArray((candidate as Partial<AppData>).prompts)) return { data: current, imported: 0, error: 'The file does not contain a valid PromptLab prompts array.' };

  const importedPrompts = (candidate as Partial<AppData>).prompts;
  if (!importedPrompts || importedPrompts.length > 2000 || importedPrompts.some((prompt) => !prompt || typeof prompt !== 'object' || typeof prompt.title !== 'string' || typeof prompt.body !== 'string')) return { data: current, imported: 0, error: 'The file contains invalid prompt records or exceeds the 2,000 prompt limit.' };

  const importedData = normalizeData(candidate);
  const uniquePromptIds = new Set(current.prompts.map((prompt) => prompt.id));
  const prompts = importedData.prompts.map((prompt) => {
    const duplicateId = uniquePromptIds.has(prompt.id);
    return { ...prompt, id: duplicateId ? createId() : prompt.id, tags: [...prompt.tags], versions: [...prompt.versions] };
  });

  const nextData: AppData = mode === 'replace'
    ? { schemaVersion: STORAGE_SCHEMA_VERSION, prompts, collections: importedData.collections, feedback: importedData.feedback }
    : { ...current, prompts: [...prompts, ...current.prompts], collections: current.collections.concat(importedData.collections.filter((collection) => !current.collections.some((c) => c.id === collection.id))), feedback: [...current.feedback, ...importedData.feedback] };

  return { data: nextData, imported: prompts.length };
}

export const localStorageRepository: StorageRepository = {
  readData,
  writeData,
  readSettings,
  writeSettings,
  createPrompt: savePrompt,
  importJson,
};
