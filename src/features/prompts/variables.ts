export interface VariableResult { name: string; value: string; }
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g);
  return [...new Set([...matches].map((match) => match[1]))];
}
export function renderTemplate(template: string, values: Record<string, string>): { output: string; missing: string[] } {
  const variables = extractVariables(template);
  const missing = variables.filter((name) => !(values[name] ?? '').trim());
  const output = template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_match, name: string) => {
    const value = values[name];
    return value === undefined || value.trim() === '' ? `{{${name}}}` : value;
  });
  return { output, missing };
}
