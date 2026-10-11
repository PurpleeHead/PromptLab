import { beforeEach, describe, expect, it } from 'vitest';
import { exportCsv, importJson, readData, savePrompt, writeData } from '../src/services/storage';
import type { AppData } from '../src/types';

beforeEach(() => localStorage.clear());

describe('local data persistence', () => {
  it('seeds a useful workspace and persists it', () => {
    const data = readData();
    expect(data.prompts.length).toBeGreaterThan(0);
    expect(readData().prompts.length).toBe(data.prompts.length);
  });
  it('creates a prompt and records a previous snapshot on edits', () => {
    const initial = readData();
    const created = savePrompt(initial, { title: 'Test', description: 'Desc', body: 'Hello {{name}}', category: 'General', tags: ['test'] });
    const prompt = created.prompts[0];
    expect(prompt.title).toBe('Test');
    const edited = savePrompt(created, { title: 'Test edited', description: 'Desc', body: 'Hello {{name}}', category: 'General', tags: ['test'] }, prompt.id);
    expect(edited.prompts[0].versions).toHaveLength(1);
    expect(edited.prompts[0].versions[0].title).toBe('Test');
  });
  it('returns a starter workspace when stored JSON is corrupted', () => {
    localStorage.setItem('promptlab:data:v1', '{broken');
    expect(readData().prompts.length).toBeGreaterThan(0);
  });
  it('rejects invalid imports without mutating existing data', () => {
    const current = readData();
    const result = importJson('{"prompts":[{"title":4,"body":false}]}', current);
    expect(result.error).toBeTruthy();
    expect(result.data).toBe(current);
  });
  it('imports valid prompt records', () => {
    const current = readData();
    const result = importJson(JSON.stringify({ prompts: [{ id: 'external', title: 'Imported', body: 'Test', tags: [] }] }), current);
    expect(result.imported).toBe(1);
    expect(result.data.prompts.some((p) => p.title === 'Imported')).toBe(true);
  });
  it('quotes CSV fields that contain commas and quotes', () => {
    const data: AppData = { schemaVersion: 1, prompts: [{ id: '1', title: 'Hello, "world"', description: '', body: 'a\nb', category: 'General', tags: [], favorite: false, createdAt: '2026-01-01', updatedAt: '2026-01-01', versions: [] }], collections: [], feedback: [] };
    const csv = exportCsv(data.prompts);
    expect(csv).toContain('"Hello, ""world"""');
    expect(csv).toContain('"a\nb"');
  });
  it('writes and reads data without losing prompt records', () => {
    const data = readData(); writeData(data);
    expect(JSON.parse(localStorage.getItem('promptlab:data:v1') ?? '{}').prompts).toHaveLength(data.prompts.length);
  });
});
