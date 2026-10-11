import { describe, expect, it } from 'vitest';
import { extractVariables, renderTemplate } from '../src/features/prompts/variables';

describe('extractVariables', () => {
  it('returns unique variable names in order', () => {
    expect(extractVariables('Hi {{name}}, from {{ city }}. {{name}}')).toEqual(['name', 'city']);
  });
  it('ignores invalid names and text without placeholders', () => {
    expect(extractVariables('{{first-name}} {{_valid2}} plain text')).toEqual(['_valid2']);
  });
});

describe('renderTemplate', () => {
  it('renders provided values and preserves missing placeholders', () => {
    expect(renderTemplate('Write for {{audience}} in {{tone}}', { audience: 'designers', tone: '' })).toEqual({ output: 'Write for designers in {{tone}}', missing: ['tone'] });
  });
  it('does not interpret markup or special characters', () => {
    expect(renderTemplate('Say {{message}}', { message: '<script>alert(1)</script>' }).output).toBe('Say <script>alert(1)</script>');
  });
  it('replaces repeated placeholders with the same value', () => {
    expect(renderTemplate('{{x}} + {{x}}', { x: '2' }).output).toBe('2 + 2');
  });
});
