import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../src/features/settings/SettingsPage';
import { categoryLabel, getStoredLocale, localeStorageKey, translate, translations } from '../src/i18n';
import { readData } from '../src/services/storage';

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
