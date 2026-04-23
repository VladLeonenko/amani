import { SectionLayout } from '@/types/pageBuilder';

/** 12-колоночная сетка → fr для CSS grid (как в BlockRenderer) */
export const COLUMN_WIDTHS: Record<SectionLayout, number[]> = {
  'full-width': [12],
  'two-50-50': [6, 6],
  'two-33-67': [4, 8],
  'two-67-33': [8, 4],
  'two-25-75': [3, 9],
  'two-75-25': [9, 3],
  'three-equal': [4, 4, 4],
  'four-equal': [3, 3, 3, 3],
  'custom': [6, 6],
};

export function equalFrWidths(n: number): number[] {
  if (n <= 0) return [100];
  return Array.from({ length: n }, () => 100 / n);
}

/** fr для grid: сохранённые %, пресет 12-кол. или поровну */
export function getSectionGridFrWidths(
  layout: SectionLayout,
  columnCount: number,
  columnWidths?: number[]
): number[] {
  const cw = columnWidths;
  if (cw && cw.length === columnCount) return cw;
  const preset = COLUMN_WIDTHS[layout];
  if (preset && preset.length === columnCount) return preset;
  return equalFrWidths(columnCount);
}

export function frWidthsToLabelPercents(fr: number[]): number[] {
  const sum = fr.reduce((a, b) => a + b, 0);
  if (sum <= 0) return fr.map(() => Math.round(100 / fr.length));
  return fr.map((w) => (w / sum) * 100);
}
