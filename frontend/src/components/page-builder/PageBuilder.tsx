import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Box, Paper } from '@mui/material';
import { BlockLibrary } from './library/BlockLibrary';
import { CanvasEditor } from './canvas/CanvasEditor';
import { SettingsPanel } from './panels/SettingsPanel';
import { Toolbar } from './Toolbar';
import { PageBlock, DeviceType } from '@/types/pageBuilder';
import {
  addBlockToSectionInTree,
  createPageBlockFromTemplate,
  deleteBlockFromTree,
  findBlockById,
  findSectionColumnForNestedBlock,
  mergePartialPageBlock,
  updateBlockInTree,
} from '@/utils/pageBuilderTree';

interface PageBuilderProps {
  pageId?: string;
  initialPage?: any;
  onSave?: (page: any) => void;
  onPublish?: (page: any) => void;
  /** Встроен в сетку (блог и т.д.) — не занимает весь viewport */
  embedded?: boolean;
}

export function PageBuilder({ pageId, initialPage, onSave, onPublish, embedded = false }: PageBuilderProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(initialPage?.blocks || []);

  // Не синхронизируем blocks из initialPage при каждом ре-рендере родителя:
  // родитель часто передаёт устаревший pageBuilderBlocks (до «Сохранить» в PB), а refetch
  // React Query даёт новый объект initialPage и затирает правки. Состояние — только внутри
  // PageBuilder; смена страницы — через key={pageId} на странице-обёртке.

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  /** Колонка, в которую добавлять блоки из библиотеки (при клике на колонку секции) */
  const [activeColumnTarget, setActiveColumnTarget] = useState<{ sectionId: string; columnId: string } | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isPreview, setIsPreview] = useState(false);
  const historyRef = useRef<PageBlock[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  /** Тяжёлый JSON-клон на каждый символ в TextField блокирует UI — пишем снимок в историю с задержкой */
  const historyDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHistoryBlocksRef = useRef<PageBlock[] | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const selectedBlock = useMemo(() => findBlockById(blocks, selectedBlockId), [blocks, selectedBlockId]);

  /** Меняется только при смене выбора или структуры секций/колонок — не при каждом символе в инпутах панели. */
  const selectedBlockStructureKey =
    selectedBlockId == null
      ? ''
      : (() => {
          const sel = findBlockById(blocks, selectedBlockId);
          if (!sel) return 'missing';
          if (sel.type === 'section') {
            const cols = sel.content?.columns || [];
            return `sec:${sel.id}:${cols.map((c: { id: string }) => c.id).join(',')}`;
          }
          const loc = findSectionColumnForNestedBlock(blocks, selectedBlockId);
          return loc ? `nest:${loc.sectionId}:${loc.columnId}` : `leaf:${sel.id}`;
        })();

  const saveToHistory = (newBlocks: PageBlock[]) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(newBlocks)));
    historyIndexRef.current = historyRef.current.length - 1;
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  };

  const flushHistoryDebounce = useCallback(() => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
    }
    if (pendingHistoryBlocksRef.current) {
      saveToHistory(pendingHistoryBlocksRef.current);
      pendingHistoryBlocksRef.current = null;
    }
  }, []);

  const scheduleHistorySave = useCallback((newBlocks: PageBlock[]) => {
    pendingHistoryBlocksRef.current = newBlocks;
    if (historyDebounceTimerRef.current) clearTimeout(historyDebounceTimerRef.current);
    historyDebounceTimerRef.current = setTimeout(() => {
      if (pendingHistoryBlocksRef.current) {
        saveToHistory(pendingHistoryBlocksRef.current);
        pendingHistoryBlocksRef.current = null;
      }
      historyDebounceTimerRef.current = null;
    }, 280);
  }, []);

  // Целевая колонка для дропа из библиотеки. НЕ завязывать на selectedBlock (новая ссылка при каждом символе в инпуте) —
  // иначе эффект крутится на каждый keystroke, setActiveColumnTarget даёт лишние ререндеры и ломает фокус в TextField.
  useEffect(() => {
    if (!selectedBlockId) {
      setActiveColumnTarget(null);
      return;
    }
    const tree = blocksRef.current;
    const sel = findBlockById(tree, selectedBlockId);
    if (!sel) return;

    if (sel.type === 'section') {
      const cols = sel.content?.columns || [];
      setActiveColumnTarget((prev) => {
        if (prev && prev.sectionId === sel.id && cols.some((c: { id: string }) => c.id === prev.columnId)) return prev;
        if (cols.length > 0) return { sectionId: sel.id, columnId: cols[0].id };
        return null;
      });
    } else {
      setActiveColumnTarget((prev) => {
        const loc = findSectionColumnForNestedBlock(tree, selectedBlockId);
        if (prev === null && loc === null) return prev;
        if (
          prev &&
          loc &&
          prev.sectionId === loc.sectionId &&
          prev.columnId === loc.columnId
        ) {
          return prev;
        }
        return loc;
      });
    }
  }, [selectedBlockId, selectedBlockStructureKey]);

  const handleAddBlock = useCallback((blockTemplate: Partial<PageBlock>) => {
    flushHistoryDebounce();
    const newBlock = createPageBlockFromTemplate(blockTemplate);
    const withRootMeta: PageBlock = {
      ...newBlock,
      position: {
        x: 0,
        y: blocks.length * 200,
        width: 1200,
        height: 200,
      },
      order: blocks.length,
    };

    const newBlocks = [...blocks, withRootMeta];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(withRootMeta.id);
  }, [blocks, flushHistoryDebounce]);

  const handleUpdateBlock = useCallback(
    (blockId: string, updates: Partial<PageBlock>) => {
      setBlocks((prevBlocks) => {
        const current = findBlockById(prevBlocks, blockId);
        if (!current) return prevBlocks;
        const merged = mergePartialPageBlock(current, updates);
        const newBlocks = updateBlockInTree(prevBlocks, blockId, merged);
        scheduleHistorySave(newBlocks);
        return newBlocks;
      });
    },
    [scheduleHistorySave]
  );

  const handleSettingsPanelUpdate = useCallback(
    (updates: Partial<PageBlock>) => {
      if (!selectedBlockId) return;
      handleUpdateBlock(selectedBlockId, updates);
    },
    [selectedBlockId, handleUpdateBlock]
  );

  const handleDeleteBlock = useCallback((blockId: string) => {
    flushHistoryDebounce();
    const newBlocks = deleteBlockFromTree(blocks, blockId);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [blocks, selectedBlockId, flushHistoryDebounce]);

  const handleReorderBlocks = useCallback((blockIds: string[]) => {
    flushHistoryDebounce();
    const blockMap = new Map(blocks.map(b => [b.id, b]));
    const newBlocks = blockIds.map((id, index) => ({
      ...blockMap.get(id)!,
      order: index,
    }));
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  }, [blocks, flushHistoryDebounce]);

  const handleAddBlockToSection = useCallback((sectionId: string, columnId: string, blockTemplate: Partial<PageBlock>) => {
    flushHistoryDebounce();
    const newBlock = createPageBlockFromTemplate(blockTemplate);
    const newBlocks = addBlockToSectionInTree(blocks, sectionId, columnId, newBlock);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  }, [blocks, flushHistoryDebounce]);

  const handleUndo = useCallback(() => {
    flushHistoryDebounce();
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    }
  }, [flushHistoryDebounce]);

  const handleRedo = useCallback(() => {
    flushHistoryDebounce();
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    }
  }, [flushHistoryDebounce]);

  useEffect(() => {
    return () => {
      if (historyDebounceTimerRef.current) {
        clearTimeout(historyDebounceTimerRef.current);
        historyDebounceTimerRef.current = null;
      }
      if (pendingHistoryBlocksRef.current) {
        saveToHistory(pendingHistoryBlocksRef.current);
        pendingHistoryBlocksRef.current = null;
      }
    };
  }, []);

  const handleSave = useCallback(() => {
    flushHistoryDebounce();
    if (onSave) {
      onSave({
        title: initialPage?.title || 'Новая страница',
        slug: initialPage?.slug || `page-${Date.now()}`,
        blocks,
        settings: initialPage?.settings || {},
        theme: initialPage?.theme || {},
      });
    }
  }, [blocks, deviceType, onSave, initialPage, flushHistoryDebounce]);

  const handlePublish = useCallback(() => {
    flushHistoryDebounce();
    onPublish?.({
      title: initialPage?.title || 'Новая страница',
      slug: initialPage?.slug || `page-${Date.now()}`,
      blocks,
      settings: initialPage?.settings || {},
      theme: initialPage?.theme || {},
    });
  }, [blocks, onPublish, initialPage, flushHistoryDebounce]);

  return (
    <Box
      className="um-page-builder-root"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: embedded ? '100%' : '100vh',
        minHeight: embedded ? 480 : undefined,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <Toolbar
        deviceType={deviceType}
        onDeviceChange={setDeviceType}
        isPreview={isPreview}
        onPreviewToggle={() => setIsPreview(!isPreview)}
        onSave={handleSave}
        onPublish={handlePublish}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        pageId={pageId}
        pageSlug={initialPage?.settings?.slug || initialPage?.slug}
      />

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, alignItems: 'stretch' }}>
        {/* Left Panel - Block Library */}
        <Paper
          elevation={2}
          sx={{
            width: 350,
            flexShrink: 0,
            overflow: 'auto',
            borderRight: 1,
            borderColor: 'divider',
            position: 'relative',
            zIndex: 1,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            '--Paper-overlay': 'none',
            '--Paper-overlay-opacity': 0,
            isolation: 'isolate',
            '&::before': { pointerEvents: 'none' },
          }}
        >
          <BlockLibrary
            onAddBlock={handleAddBlock}
            onAddBlockToSection={handleAddBlockToSection}
            activeColumnTarget={activeColumnTarget}
          />
        </Paper>

        {/* Center - Canvas */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <CanvasEditor
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            activeColumnTarget={activeColumnTarget}
            deviceType={deviceType}
            isPreview={isPreview}
            onSelectBlock={setSelectedBlockId}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onReorderBlocks={handleReorderBlocks}
            onAddBlockToSection={handleAddBlockToSection}
            onColumnActivate={(sectionId, columnId) => setActiveColumnTarget({ sectionId, columnId })}
          />
        </Box>

        {/* Right Panel - Settings */}
        {selectedBlock && !isPreview && (
          <Paper
            data-page-builder-settings
            elevation={2}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: 400,
              flexShrink: 0,
              overflow: 'auto',
              borderLeft: 1,
              borderColor: 'divider',
              position: 'relative',
              /* Выше канваса с transform (dnd-kit) и любых оверлеев ниже modal */
              zIndex: (t) => Math.max(t.zIndex.snackbar, t.zIndex.modal + 20),
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              '--Paper-overlay': 'none',
              '--Paper-overlay-opacity': 0,
              isolation: 'isolate',
              pointerEvents: 'auto',
              touchAction: 'auto',
              '&::before': { pointerEvents: 'none' },
            }}
          >
            <SettingsPanel
              block={selectedBlock}
              blocks={blocks}
              deviceType={deviceType}
              onUpdate={handleSettingsPanelUpdate}
              onAddBlockToSection={handleAddBlockToSection}
            />
          </Paper>
        )}
      </Box>

    </Box>
  );
}
