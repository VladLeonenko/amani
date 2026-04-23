import type { PageBlock } from '@/types/pageBuilder';

/** Типы content-блоков с отдельной формой (без универсальных Текст/HTML внизу). */
export const STRUCTURED_CONTENT_VARIANTS = new Set([
  'faq',
  'steps',
  'team',
  'pricing',
  'table',
  'list',
  'accordion',
  'quote',
  'features',
]);

export function shouldHideGenericForContentVariant(v: string | undefined): boolean {
  if (!v) return false;
  return STRUCTURED_CONTENT_VARIANTS.has(v);
}

/**
 * Явный content.type или эвристика по полям (старые страницы без type).
 */
export function inferContentVariant(block: PageBlock): string | undefined {
  if (block.type !== 'content') return undefined;
  const c = block.content as Record<string, unknown> | undefined;
  if (!c) return undefined;
  const explicit = c.type as string | undefined;
  if (explicit) return explicit;

  if (Array.isArray(c.steps) && (c.steps as unknown[]).length) return 'steps';
  if (Array.isArray(c.plans) && (c.plans as unknown[]).length) return 'pricing';
  if (Array.isArray(c.tableHeaders) || Array.isArray(c.tableRows)) return 'table';
  if (Array.isArray(c.listItems) && (c.listItems as unknown[]).length) return 'list';
  if (Array.isArray(c.accordionItems) && (c.accordionItems as unknown[]).length) return 'accordion';

  if (Array.isArray(c.items) && (c.items as unknown[]).length) {
    const first = (c.items as Record<string, unknown>[])[0];
    if (first && ('question' in first || 'answer' in first)) return 'faq';
    if (first && ('name' in first || 'role' in first || 'photo' in first || 'imageUrl' in first)) return 'team';
    if (first && ('icon' in first || 'title' in first) && 'description' in first) return 'features';
  }

  if (typeof c.quoteText === 'string' || typeof c.quoteAuthor === 'string') return 'quote';

  return undefined;
}
