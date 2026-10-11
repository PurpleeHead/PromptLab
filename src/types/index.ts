export type PromptCategory = 'Writing' | 'Development' | 'Marketing' | 'Research' | 'Productivity' | 'Design' | 'General';
export interface PromptVersion { id: string; version: number; title: string; description: string; body: string; category: PromptCategory; tags: string[]; createdAt: string; }
export interface Prompt { id: string; title: string; description: string; body: string; category: PromptCategory; tags: string[]; favorite: boolean; createdAt: string; updatedAt: string; versions: PromptVersion[]; }
export interface PromptCollection { id: string; name: string; description: string; promptIds: string[]; createdAt: string; }
export interface FeedbackEntry { id: string; type: 'bug' | 'feature' | 'general'; subject: string; message: string; email: string; createdAt: string; }
export type PromptSort = 'updated' | 'newest' | 'oldest' | 'title';
export interface PromptFilters { query: string; category: string; tags: string[]; favoritesOnly: boolean; sort: PromptSort; }
export interface AppData { schemaVersion: number; prompts: Prompt[]; collections: PromptCollection[]; feedback: FeedbackEntry[]; }
