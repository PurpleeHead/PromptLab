import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../src/features/settings/SettingsPage';
import { categoryLabel, getStoredLocale, localeStorageKey, pluralizeCount, translate, translateText, translations } from '../src/i18n';
import { readData, readSettings, writeSettings } from '../src/services/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('locale system', () => {
  it('defaults to English and falls back for invalid stored values', () => {
    expect(getStoredLocale()).toBe('en');

    localStorage.setItem(localeStorageKey, 'ru');
    expect(getStoredLocale()).toBe('ru');

    localStorage.setItem(localeStorageKey, 'fr');
    expect(getStoredLocale()).toBe('en');
  });

  it('keeps key parity across locales and interpolates placeholders', () => {
    const enKeys = Object.keys(translations.en).sort();
    const ruKeys = Object.keys(translations.ru).sort();

    expect(ruKeys).toEqual(enKeys);
    expect(translate('page.dashboard.tipText', 'en', { placeholder: '{{goal}}' })).toContain('{{goal}}');
    expect(translate('page.dashboard.tipText', 'ru', { placeholder: '{{goal}}' })).toContain('{{goal}}');
    expect(categoryLabel('Marketing', 'ru')).toBe('Маркетинг');
    expect(translateText('Delete “Example prompt”? This cannot be undone.', 'ru')).toBe('Удалить «Example prompt»? Это нельзя отменить.');
  });

  it('keeps prompt content stable while changing locale state', () => {
    const prompt = readData().prompts[0];
    const before = JSON.stringify(prompt);

    expect(prompt.title).toBe('Brand Voice Architect');
    expect(prompt.body).toContain('{{brand_name}}');
    expect(categoryLabel('Marketing', 'en')).toBe('Marketing');
    expect(JSON.stringify(prompt)).toBe(before);
  });
});

describe('settings accessibility', () => {
  it('exposes an accessible locale switch', async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();

    render(
      createElement(SettingsPage, {
        data: readData(),
        onToggleFavorite: vi.fn(),
        onDeletePrompt: vi.fn(),
        onDuplicatePrompt: vi.fn(),
        onSavePrompt: vi.fn(),
        onToast: vi.fn(),
        onAddCollection: vi.fn(),
        onDataChange: vi.fn(),
        theme: 'dark',
        onThemeChange: vi.fn(),
        locale: 'en',
        onLocaleChange,
      }),
    );

    const russianButton = screen.getByRole('button', { name: /русский/i });
    await user.click(russianButton);

    expect(onLocaleChange).toHaveBeenCalledWith('ru');
  });
});


describe('persisted application settings', () => {
  it('detects Russian browser language when no preference has been saved', () => {
    Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'ru-RU' });
    expect(readSettings().locale).toBe('ru');
  });

  it('preserves theme when only locale changes and preserves locale when only theme changes', () => {
    localStorage.setItem('promptlab:settings:v1', JSON.stringify({ theme: 'light', locale: 'en' }));
    expect(writeSettings({ locale: 'ru' })).toEqual({ theme: 'light', locale: 'ru' });
    expect(writeSettings({ theme: 'dark' })).toEqual({ theme: 'dark', locale: 'ru' });
  });

  it('prefers a valid saved settings locale over browser detection', () => {
    Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'ru-RU' });
    localStorage.setItem('promptlab:settings:v1', JSON.stringify({ theme: 'dark', locale: 'en' }));
    expect(readSettings().locale).toBe('en');
  });
});


describe('locale-aware formatting', () => {
  it('uses Russian plural forms for prompt counts', () => {
    expect(pluralizeCount(1, 'ru', 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])).toBe('промпт');
    expect(pluralizeCount(2, 'ru', 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])).toBe('промпта');
    expect(pluralizeCount(5, 'ru', 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])).toBe('промптов');
    expect(pluralizeCount(21, 'ru', 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])).toBe('промпт');
    expect(pluralizeCount(1, 'en', 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])).toBe('prompt');
    expect(pluralizeCount(2, 'en', 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])).toBe('prompts');
  });
});


describe('application localization integration', () => {
  it('switches the active application UI immediately without changing prompt data', async () => {
    const user = userEvent.setup();
    localStorage.setItem('promptlab:settings:v1', JSON.stringify({ theme: 'dark', locale: 'en' }));
    const before = JSON.stringify(readData());

    render(createElement(MemoryRouter, { initialEntries: ['/settings'] }, createElement(App)));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /русский/i }));
    expect(await screen.findByRole('heading', { name: 'Настройки' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ru');
    expect(screen.getByRole('link', { name: /обзор/i })).toBeInTheDocument();
    expect(JSON.stringify(readData())).toBe(before);

    await user.click(screen.getByRole('button', { name: /english/i }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(JSON.stringify(readData())).toBe(before);
  });
});
