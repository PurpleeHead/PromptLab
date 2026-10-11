import { describe, expect, it } from 'vitest';
import { mapPromptToRemote, mapRemotePrompt } from '../src/services/supabase';

describe('Supabase prompt mapping', () => {
  it('keeps local prompt identity stable when mapping to a cloud payload', () => {
    const prompt = {
      id: 'p-local-123',
      title: 'Brand Voice Architect',
      description: 'Build a clear voice guide.',
      body: 'Use {{brand_name}} with a {{tone}} voice.',
      category: 'Marketing' as const,
      tags: ['branding', 'copywriting'],
      favorite: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      versions: [],
    };

    const mapped = mapPromptToRemote(prompt);

    expect(mapped.local_id).toBe('p-local-123');
    expect(mapped.title).toBe('Brand Voice Architect');
    expect(mapped.tags).toEqual(['branding', 'copywriting']);
    expect(mapped.is_favorite).toBe(true);
  });

  it('uses local_id as the app identity when reading cloud rows', () => {
    const row = {
      id: '8d4d2af6-9db6-4e6d-a9be-449975717b5e',
      owner_id: 'user-123',
      local_id: 'p-local-123',
      title: 'Remote title',
      description: 'Remote description',
      body: 'Remote body',
      category: 'Research',
      tags: ['external'],
      is_favorite: false,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
    };

    const mapped = mapRemotePrompt(row);

    expect(mapped.id).toBe('p-local-123');
    expect(mapped.title).toBe('Remote title');
    expect(mapped.favorite).toBe(false);
    expect(mapped.versions).toEqual([]);
  });
});
