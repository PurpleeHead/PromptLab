import { createClient, type Session } from '@supabase/supabase-js';
import type { AppData, Prompt, PromptCollection } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type SupabaseConfigStatus = {
  configured: boolean;
  message: string;
  url?: string;
};

export type CloudPromptRow = {
  id: string;
  owner_id: string;
  local_id: string | null;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type CloudCollectionRow = {
  id: string;
  owner_id: string;
  local_id: string | null;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type CloudSyncResult = {
  uploaded: number;
  updated: number;
  skipped: number;
  conflicts: number;
  error?: string;
};

export const supabaseConfigStatus: SupabaseConfigStatus = (() => {
  if (url && key) {
    return { configured: true, message: 'Cloud sync is ready.', url };
  }

  if (!url && !key) {
    return { configured: false, message: 'Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable optional account sync.' };
  }

  return { configured: false, message: 'Cloud sync is incomplete. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.' };
})();

export const isCloudConfigured = supabaseConfigStatus.configured;
export const supabase = isCloudConfigured ? createClient(url!, key!) : null;

export function mapPromptToRemote(prompt: Prompt): Omit<CloudPromptRow, 'id' | 'owner_id' | 'created_at' | 'updated_at'> & { owner_id?: string; id?: string; local_id: string; created_at?: string; updated_at?: string } {
  return {
    local_id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    body: prompt.body,
    category: prompt.category,
    tags: [...prompt.tags],
    is_favorite: prompt.favorite,
    updated_at: prompt.updatedAt,
  };
}

export function mapCollectionToRemote(collection: PromptCollection): Omit<CloudCollectionRow, 'id' | 'owner_id' | 'created_at' | 'updated_at'> & { owner_id?: string; id?: string; local_id: string; created_at?: string; updated_at?: string } {
  return {
    local_id: collection.id,
    name: collection.name,
    description: collection.description,
    updated_at: new Date().toISOString(),
  };
}

export function mapRemotePrompt(row: CloudPromptRow): Prompt {
  return {
    id: row.local_id ?? row.id,
    title: row.title,
    description: row.description,
    body: row.body,
    category: row.category as Prompt['category'],
    tags: row.tags ?? [],
    favorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    versions: [],
  };
}

export function mapRemoteCollection(row: CloudCollectionRow): PromptCollection {
  return {
    id: row.local_id ?? row.id,
    name: row.name,
    description: row.description,
    promptIds: [],
    createdAt: row.created_at,
  };
}

export async function getSignedInSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data.session ?? null;
}

export async function listRemotePrompts(): Promise<Prompt[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return [];

  const { data, error } = await supabase.from('prompts').select('*').eq('owner_id', userId).order('updated_at', { ascending: false });
  if (error || !data) return [];

  return (data as CloudPromptRow[]).map(mapRemotePrompt);
}

export async function listRemoteCollections(): Promise<PromptCollection[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return [];

  const { data, error } = await supabase.from('collections').select('*').eq('owner_id', userId).order('updated_at', { ascending: false });
  if (error || !data) return [];

  return (data as CloudCollectionRow[]).map(mapRemoteCollection);
}

export async function syncLocalWorkspace(localData: AppData): Promise<CloudSyncResult> {
  if (!supabase) {
    return { uploaded: 0, updated: 0, skipped: 0, conflicts: 0, error: 'Cloud sync is not configured.' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    return { uploaded: 0, updated: 0, skipped: 0, conflicts: 0, error: 'Sign in to sync your local prompts to the cloud.' };
  }

  const { data: remotePromptRows } = await supabase.from('prompts').select('*').eq('owner_id', user.id);
  const remotePromptMap = new Map<string, CloudPromptRow>();
  for (const entry of (remotePromptRows ?? []) as CloudPromptRow[]) {
    if (entry.local_id) {
      remotePromptMap.set(entry.local_id, entry);
    }
  }

  const { data: remoteCollectionRows } = await supabase.from('collections').select('*').eq('owner_id', user.id);
  const remoteCollectionMap = new Map<string, CloudCollectionRow>();
  for (const entry of (remoteCollectionRows ?? []) as CloudCollectionRow[]) {
    if (entry.local_id) {
      remoteCollectionMap.set(entry.local_id, entry);
    }
  }

  let uploaded = 0;
  let updated = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const prompt of localData.prompts) {
    const remoteRecord = remotePromptMap.get(prompt.id);
    if (remoteRecord) {
      const remoteTimestamp = new Date(remoteRecord.updated_at).getTime();
      const localTimestamp = new Date(prompt.updatedAt).getTime();
      if (Number.isFinite(remoteTimestamp) && remoteTimestamp > localTimestamp) {
        conflicts += 1;
        skipped += 1;
        continue;
      }
    }

    const payload = {
      owner_id: user.id,
      local_id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      body: prompt.body,
      category: prompt.category,
      tags: prompt.tags,
      is_favorite: prompt.favorite,
      updated_at: prompt.updatedAt,
    };

    const { error } = await supabase.from('prompts').upsert(payload, { onConflict: 'owner_id,local_id' });
    if (error) {
      return { uploaded, updated, skipped, conflicts, error: error.message };
    }

    uploaded += 1;
  }

  for (const collection of localData.collections) {
    const remoteRecord = remoteCollectionMap.get(collection.id);
    if (remoteRecord) {
      const remoteTimestamp = new Date(remoteRecord.updated_at).getTime();
      const localTimestamp = new Date(collection.createdAt).getTime();
      if (Number.isFinite(remoteTimestamp) && remoteTimestamp > localTimestamp) {
        conflicts += 1;
        skipped += 1;
        continue;
      }
    }

    const payload = {
      owner_id: user.id,
      local_id: collection.id,
      name: collection.name,
      description: collection.description,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('collections').upsert(payload, { onConflict: 'owner_id,local_id' });
    if (error) {
      return { uploaded, updated, skipped, conflicts, error: error.message };
    }

    updated += 1;
  }

  return { uploaded, updated, skipped, conflicts };
}

export async function loadRemoteWorkspaceFromCloud(): Promise<{ data: AppData; imported: number; error?: string }> {
  if (!supabase) {
    return { data: { schemaVersion: 1, prompts: [], collections: [], feedback: [] }, imported: 0, error: 'Cloud sync is not configured.' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    return { data: { schemaVersion: 1, prompts: [], collections: [], feedback: [] }, imported: 0, error: 'Sign in to load cloud data.' };
  }

  const [{ data: promptRows }, { data: collectionRows }] = await Promise.all([
    supabase.from('prompts').select('*').eq('owner_id', user.id),
    supabase.from('collections').select('*').eq('owner_id', user.id),
  ]);

  const nextData: AppData = {
    schemaVersion: 1,
    prompts: (promptRows ?? []).map((row) => mapRemotePrompt(row as CloudPromptRow)),
    collections: (collectionRows ?? []).map((row) => mapRemoteCollection(row as CloudCollectionRow)),
    feedback: [],
  };

  return { data: nextData, imported: nextData.prompts.length + nextData.collections.length };
}
