import type { AppData, FeedbackEntry, Prompt, PromptCollection, PromptVersion } from '../types';

const STORAGE_KEY = 'promptlab:data:v1';
const now = new Date().toISOString();
const starterPrompts: Prompt[] = [
  { id: 'p-brand-voice', title: 'Brand Voice Architect', description: 'Build a clear, consistent voice guide for a growing brand.', body: 'Act as a senior brand strategist. Create a practical voice guide for {{brand_name}}, a {{business_type}} serving {{audience}}.\n\nVoice traits: {{voice_traits}}\nChannels: {{channels}}\n\nDeliver a concise guide with tone principles, do/don’t examples, vocabulary guidance, and three sample messages. Keep it actionable and specific.', category: 'Marketing', tags: ['branding', 'strategy', 'copywriting'], favorite: true, createdAt: now, updatedAt: now, versions: [] },
  { id: 'p-code-review', title: 'Thoughtful Code Reviewer', description: 'Review code for correctness, maintainability, and meaningful risks.', body: 'Act as a senior {{language}} engineer. Review the following code for {{review_focus}}.\n\nContext: {{context}}\nCode:\n```\n{{code}}\n```\n\nPrioritize verified defects, explain impact, suggest minimal fixes, and identify missing tests. Do not invent issues or rewrite unrelated code.', category: 'Development', tags: ['engineering', 'review', 'quality'], favorite: true, createdAt: now, updatedAt: now, versions: [] },
  { id: 'p-research-brief', title: 'Research Brief Builder', description: 'Turn a broad question into a structured research plan.', body: 'You are a rigorous research assistant. Help investigate {{research_question}} for {{target_audience}}.\n\nScope: {{scope}}\nConstraints: {{constraints}}\n\nProduce: key questions, competing hypotheses, evidence needed, likely source types, a step-by-step research plan, and uncertainties that must remain explicit. Separate facts from assumptions.', category: 'Research', tags: ['research', 'planning', 'analysis'], favorite: false, createdAt: now, updatedAt: now, versions: [] },
  { id: 'p-product-launch', title: 'Product Launch Planner', description: 'Create a launch plan with clear phases and measurable outcomes.', body: 'Act as a product marketing lead. Build a launch plan for {{product}} targeting {{audience}}.\n\nLaunch date: {{launch_date}}\nBudget: {{budget}}\nPrimary goal: {{goal}}\n\nInclude positioning, launch phases, channel plan, owners, dependencies, risks, success metrics, and a realistic first-week checklist. State assumptions instead of treating unknowns as facts.', category: 'Marketing', tags: ['launch', 'planning', 'growth'], favorite: false, createdAt: now, updatedAt: now, versions: [] },
  { id: 'p-learning-coach', title: 'Personal Learning Coach', description: 'Design a realistic learning plan around time and current skill level.', body: 'Act as a supportive learning designer. Create a {{duration}} learning plan for {{subject}}.\n\nCurrent level: {{current_level}}\nWeekly time: {{weekly_hours}}\nGoal: {{goal}}\n\nBreak the plan into weekly milestones, practice tasks, review sessions, and measurable outcomes. Prefer active recall and small projects. Include a fallback plan for busy weeks.', category: 'Productivity', tags: ['learning', 'habits', 'planning'], favorite: false, createdAt: now, updatedAt: now, versions: [] },
  { id: 'p-ux-audit', title: 'UX Audit Partner', description: 'Audit a digital flow and prioritize usability improvements.', body: 'Act as a senior UX designer. Audit {{product_or_flow}} for {{primary_task}}.\n\nUsers: {{user_group}}\nKnown issues: {{known_issues}}\n\nReturn a prioritized list of usability findings with evidence, user impact, severity, suggested improvements, and validation methods. Clearly label hypotheses that require user research.', category: 'Design', tags: ['ux', 'audit', 'product'], favorite: false, createdAt: now, updatedAt: now, versions: [] },
];
const emptyData = (): AppData => ({ schemaVersion: 1, prompts: starterPrompts, collections: [{ id: 'c-starters', name: 'Starter Kit', description: 'A few useful prompts to get started.', promptIds: starterPrompts.slice(0, 3).map((prompt) => prompt.id), createdAt: now }], feedback: [] });

function normalizeData(value: unknown): AppData {
  if (!value || typeof value !== 'object') return emptyData();
  const candidate = value as Partial<AppData>;
  if (!Array.isArray(candidate.prompts) || !Array.isArray(candidate.collections) || !Array.isArray(candidate.feedback)) return emptyData();
  return { schemaVersion: 1, prompts: candidate.prompts as Prompt[], collections: candidate.collections as PromptCollection[], feedback: candidate.feedback as FeedbackEntry[] };
}
export function readData(): AppData {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { const initial = emptyData(); writeData(initial); return initial; } return normalizeData(JSON.parse(raw) as unknown); }
  catch { const initial = emptyData(); try { writeData(initial); } catch { /* Storage can be disabled. */ } return initial; }
}
export function writeData(data: AppData): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
export function createId(): string { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
export function savePrompt(data: AppData, input: Pick<Prompt, 'title' | 'description' | 'body' | 'category' | 'tags'>, id?: string): AppData {
  const timestamp = new Date().toISOString();
  if (id) {
    const existing = data.prompts.find((prompt) => prompt.id === id);
    if (!existing) return data;
    const changed = existing.title !== input.title || existing.description !== input.description || existing.body !== input.body || existing.category !== input.category || JSON.stringify(existing.tags) !== JSON.stringify(input.tags);
    const versions: PromptVersion[] = changed ? [...existing.versions, { id: createId(), version: existing.versions.length + 1, title: existing.title, description: existing.description, body: existing.body, category: existing.category, tags: [...existing.tags], createdAt: timestamp }] : existing.versions;
    return { ...data, prompts: data.prompts.map((prompt) => prompt.id === id ? { ...prompt, ...input, tags: [...input.tags], updatedAt: timestamp, versions } : prompt) };
  }
  const prompt: Prompt = { ...input, id: createId(), tags: [...input.tags], favorite: false, createdAt: timestamp, updatedAt: timestamp, versions: [] };
  return { ...data, prompts: [prompt, ...data.prompts] };
}
export function exportJson(data: AppData): string { return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2); }
function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
export function exportCsv(prompts: Prompt[]): string {
  const headers = ['title', 'description', 'body', 'category', 'tags', 'favorite', 'createdAt', 'updatedAt'];
  return [headers.join(','), ...prompts.map((p) => [p.title, p.description, p.body, p.category, p.tags.join('|'), String(p.favorite), p.createdAt, p.updatedAt].map(csvCell).join(','))].join('\r\n');
}
export function importJson(raw: string, current: AppData): { data: AppData; imported: number; error?: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    const candidate = parsed && typeof parsed === 'object' && 'data' in parsed ? (parsed as { data: unknown }).data : parsed;
    if (!candidate || typeof candidate !== 'object' || !Array.isArray((candidate as Partial<AppData>).prompts)) return { data: current, imported: 0, error: 'The file does not contain a valid PromptLab prompts array.' };
    const importedPrompts = (candidate as Partial<AppData>).prompts;
    if (!importedPrompts || importedPrompts.length > 2000 || importedPrompts.some((p) => !p || typeof p !== 'object' || typeof p.title !== 'string' || typeof p.body !== 'string')) return { data: current, imported: 0, error: 'The file contains invalid prompt records or exceeds the 2,000 prompt limit.' };
    const existingIds = new Set(current.prompts.map((p) => p.id));
    const prompts = importedPrompts.map((prompt) => ({ ...prompt, id: existingIds.has(prompt.id) ? createId() : prompt.id, tags: Array.isArray(prompt.tags) ? prompt.tags.filter((tag): tag is string => typeof tag === 'string') : [], versions: Array.isArray(prompt.versions) ? prompt.versions : [], category: typeof prompt.category === 'string' ? prompt.category : 'General', description: typeof prompt.description === 'string' ? prompt.description : '', favorite: Boolean(prompt.favorite), createdAt: typeof prompt.createdAt === 'string' ? prompt.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() })) as Prompt[];
    return { data: { ...current, prompts: [...prompts, ...current.prompts] }, imported: prompts.length };
  } catch { return { data: current, imported: 0, error: 'Unable to read this JSON file. Check its format and try again.' }; }
}
