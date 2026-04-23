import { PageBlock, SectionLayout } from '@/types/pageBuilder';

export function getDefaultColumnWidths(layout: SectionLayout): number[] {
  const map: Record<SectionLayout, number[]> = {
    'full-width': [100],
    'two-50-50': [50, 50],
    'two-33-67': [33, 67],
    'two-67-33': [67, 33],
    'two-25-75': [25, 75],
    'two-75-25': [75, 25],
    'three-equal': [33.33, 33.33, 33.34],
    'four-equal': [25, 25, 25, 25],
    'custom': [50, 50],
  };
  return map[layout];
}

export function createPageBlockFromTemplate(blockTemplate: Partial<PageBlock>): PageBlock {
  const baseId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  let content = blockTemplate.content || {};

  if (blockTemplate.type === 'section' && (content as { layout?: SectionLayout }).layout) {
    const layout = (content as { layout: SectionLayout }).layout;
    const widths = getDefaultColumnWidths(layout);
    content = {
      ...content,
      columnWidths: widths,
      columns: widths.map((_, i) => ({
        id: `col-${baseId}-${i}`,
        blocks: [] as PageBlock[],
      })),
    };
  }

  return {
    ...blockTemplate,
    id: baseId,
    type: (blockTemplate.type || 'content') as PageBlock['type'],
    name: blockTemplate.name || 'Block',
    category: blockTemplate.category || 'content',
    content,
    styles: blockTemplate.styles || {},
    position: blockTemplate.position || { x: 0, y: 0, width: 400, height: 100 },
    order: blockTemplate.order ?? 0,
  } as PageBlock;
}

/** В какой колонке какой секции лежит блок (включая вложенные секции). */
export function findSectionColumnForNestedBlock(
  blocks: PageBlock[],
  targetId: string
): { sectionId: string; columnId: string } | null {
  for (const block of blocks) {
    if (block.type !== 'section' || !block.content?.columns) continue;
    for (const col of block.content.columns) {
      for (const child of col.blocks || []) {
        if (child.id === targetId) {
          return { sectionId: block.id, columnId: col.id };
        }
        const deeper = findSectionColumnForNestedBlock([child], targetId);
        if (deeper) return deeper;
      }
    }
  }
  return null;
}

export function findBlockById(blocks: PageBlock[], id: string | null | undefined): PageBlock | null {
  if (!id) return null;
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'section' && block.content?.columns) {
      for (const col of block.content.columns) {
        const found = findBlockById(col.blocks || [], id);
        if (found) return found;
      }
    }
  }
  return null;
}

/** Слияние правок с текущим блоком (важно при быстрых правках в панели — без потери полей content/styles). */
export function mergePartialPageBlock(current: PageBlock, updates: Partial<PageBlock>): Partial<PageBlock> {
  const out: Partial<PageBlock> = { ...updates };
  if (updates.content !== undefined) {
    out.content = { ...(current.content || {}), ...updates.content };
  }
  if (updates.styles !== undefined) {
    out.styles = { ...(current.styles || {}), ...updates.styles };
  }
  return out;
}

export function updateBlockInTree(blocks: PageBlock[], blockId: string, updates: Partial<PageBlock>): PageBlock[] {
  return blocks.map((block) => {
    if (block.id === blockId) return { ...block, ...updates } as PageBlock;
    if (block.type === 'section' && block.content?.columns) {
      return {
        ...block,
        content: {
          ...block.content,
          columns: block.content.columns.map((col) => ({
            ...col,
            blocks: updateBlockInTree(col.blocks || [], blockId, updates),
          })),
        },
      };
    }
    return block;
  });
}

export function deleteBlockFromTree(blocks: PageBlock[], blockId: string): PageBlock[] {
  return blocks
    .filter((b) => b.id !== blockId)
    .map((block) => {
      if (block.type === 'section' && block.content?.columns) {
        return {
          ...block,
          content: {
            ...block.content,
            columns: block.content.columns.map((col) => ({
              ...col,
              blocks: deleteBlockFromTree(col.blocks || [], blockId),
            })),
          },
        };
      }
      return block;
    });
}

export function addBlockToSectionInTree(
  blocks: PageBlock[],
  sectionId: string,
  columnId: string,
  newBlock: PageBlock
): PageBlock[] {
  return blocks.map((block) => {
    if (block.id === sectionId && block.type === 'section') {
      const columns = (block.content?.columns || []).map((col) =>
        col.id === columnId ? { ...col, blocks: [...(col.blocks || []), newBlock] } : col
      );
      return { ...block, content: { ...block.content, columns } };
    }
    if (block.type === 'section' && block.content?.columns) {
      return {
        ...block,
        content: {
          ...block.content,
          columns: block.content.columns.map((col) => ({
            ...col,
            blocks: addBlockToSectionInTree(col.blocks || [], sectionId, columnId, newBlock),
          })),
        },
      };
    }
    return block;
  });
}
