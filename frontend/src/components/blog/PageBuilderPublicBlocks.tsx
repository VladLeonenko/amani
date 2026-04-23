import { Box } from '@mui/material';
import { PageBlock } from '@/types/pageBuilder';
import { BlockRenderer } from '@/components/page-builder/canvas/BlockRenderer';

const noopUpdate = () => {};
const noopDelete = () => {};

/**
 * Публичный рендер статей с Page Builder: те же компоненты, что в превью (слайдер до/после и т.д.).
 */
export function PageBuilderPublicBlocks({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <Box
          key={block.id}
          className="page-builder-public-root"
          sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          <BlockRenderer
            block={block}
            deviceType="desktop"
            isPreview
            onUpdateBlock={noopUpdate}
            onDeleteBlock={noopDelete}
          />
        </Box>
      ))}
    </>
  );
}
