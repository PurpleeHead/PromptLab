import type { PromptCategory, PromptInput } from '../../types';

export const categories: PromptCategory[] = ['Writing', 'Development', 'Marketing', 'Research', 'Productivity', 'Design', 'General'];

export const blankPrompt: PromptInput = {
  title: '',
  description: '',
  body: '',
  category: 'General',
  tags: [],
};

export const relativeDate = (date: string) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
