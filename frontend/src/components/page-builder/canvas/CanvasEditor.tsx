import { Box } from '@mui/material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PageBlock, DeviceType, SectionLayout } from '@/types/pageBuilder';
import { BlockRenderer } from './BlockRenderer';
import { BlockCanvasToolbar } from './BlockCanvasToolbar';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CanvasEditorProps {
  blocks: PageBlock[];
  selectedBlockId: string | null;
  activeColumnTarget?: { sectionId: string; columnId: string } | null;
  deviceType: DeviceType;
  isPreview: boolean;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<PageBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (blockIds: string[]) => void;
  onAddBlockToSection?: (sectionId: string, columnId: string, block: Partial<PageBlock>) => void;
  onColumnActivate?: (sectionId: string, columnId: string) => void;
}

function SortableBlock({
  block,
  isSelected,
  activeColumnTarget,
  selectedBlockId,
  deviceType,
  isPreview,
  onSelect,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlockToSection,
  onColumnActivate,
  onBlockSelect,
}: {
  block: PageBlock;
  isSelected: boolean;
  activeColumnTarget?: { sectionId: string; columnId: string } | null;
  selectedBlockId: string | null;
  deviceType: DeviceType;
  isPreview: boolean;
  onSelect: () => void;
  onUpdateBlock: (id: string, updates: Partial<PageBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onAddBlockToSection?: (sectionId: string, columnId: string, block: Partial<PageBlock>) => void;
  onColumnActivate?: (sectionId: string, columnId: string) => void;
  onBlockSelect: (id: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={
        isPreview
          ? { position: 'relative' }
          : {
              position: 'relative',
              border: isSelected ? '2px solid #1976d2' : '2px dashed transparent',
              borderRadius: 1,
              '&:hover': {
                border: isSelected ? '2px solid #1976d2' : '2px dashed #1976d2',
              },
            }
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {!isPreview && (
        <BlockCanvasToolbar
          dragAttributes={attributes}
          dragListeners={listeners}
          onEdit={onSelect}
          onDelete={() => onDeleteBlock(block.id)}
        />
      )}
      <BlockRenderer
        block={block}
        deviceType={deviceType}
        isPreview={isPreview}
        onUpdateBlock={onUpdateBlock}
        onDeleteBlock={onDeleteBlock}
        onAddBlockToSection={onAddBlockToSection}
        onColumnActivate={onColumnActivate}
        activeColumnTarget={activeColumnTarget}
        onBlockSelect={onBlockSelect}
        selectedBlockId={selectedBlockId}
      />
    </Box>
  );
}

const COLUMN_WIDTHS: Record<SectionLayout, number[]> = {
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

/** Ширина «вьюпорта» редактора под кнопки Desktop / Tablet / Mobile в тулбаре */
export const DEVICE_CANVAS_MAX_PX: Record<DeviceType, number> = {
  desktop: 1920,
  tablet: 768,
  mobile: 375,
};

export function CanvasEditor({
  blocks,
  selectedBlockId,
  activeColumnTarget,
  deviceType,
  isPreview,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  onAddBlockToSection,
  onColumnActivate,
}: CanvasEditorProps) {
  /* Только PointerSensor: KeyboardSensor подписывается на клавиатуру и может мешать фокусу в панели справа. */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      onReorderBlocks(newBlocks.map((b) => b.id));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        backgroundColor: '#f5f5f5',
        backgroundImage: `
          linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
          linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
          linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        display: 'flex',
        justifyContent: 'center',
        p: 0,
      }}
      onClick={() => onSelectBlock(null)}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: `min(100%, ${DEVICE_CANVAS_MAX_PX[deviceType]}px)`,
          minHeight: '100vh',
          backgroundColor: '#fff',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          position: 'relative',
          transition: 'max-width 0.2s ease',
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '50vh',
                  color: 'text.secondary',
                }}
              >
                Перетащите блоки из библиотеки
              </Box>
            ) : (
              blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  activeColumnTarget={activeColumnTarget}
                  selectedBlockId={selectedBlockId}
                  deviceType={deviceType}
                  isPreview={isPreview}
                  onSelect={() => onSelectBlock(block.id)}
                  onUpdateBlock={onUpdateBlock}
                  onDeleteBlock={onDeleteBlock}
                  onAddBlockToSection={onAddBlockToSection}
                  onColumnActivate={onColumnActivate}
                  onBlockSelect={onSelectBlock}
                />
              ))
            )}
          </SortableContext>
        </DndContext>
      </Box>
    </Box>
  );
}
