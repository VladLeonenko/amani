import { useState } from 'react';
import { Box, Typography, TextField, Tabs, Tab, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { BlockLibraryItem, PageBlock } from '@/types/pageBuilder';
import { BlockCategory } from './BlockCategory';
import { blockTemplates } from './blockTemplates';

interface BlockLibraryProps {
  onAddBlock: (block: Partial<PageBlock>) => void;
  onAddBlockToSection?: (sectionId: string, columnId: string, block: Partial<PageBlock>) => void;
  activeColumnTarget?: { sectionId: string; columnId: string } | null;
}

type LibraryPreset = 'all' | 'article' | 'project';

const presetLabels: Record<LibraryPreset, string> = {
  all: 'Все',
  article: 'Новая статья',
  project: 'Спецпроект/страница',
};

const categoryPriorityByPreset: Record<Exclude<LibraryPreset, 'all'>, string[]> = {
  article: ['text', 'media', 'sections', 'social', 'forms'],
  project: ['sections', 'text', 'media', 'forms', 'social', 'shop'],
};

const editorialTextTemplates: BlockLibraryItem[] = [
  {
    id: 'editorial-h1',
    name: 'Заголовок H1',
    category: 'content',
    icon: 'H1',
    thumbnail: '',
    tags: ['text', 'heading', 'h1', 'title'],
    block: {
      type: 'content',
      name: 'Заголовок H1',
      category: 'content',
      content: { type: 'text', html: '<h1>Заголовок первого уровня</h1>' },
    },
  },
  {
    id: 'editorial-h2',
    name: 'Заголовок H2',
    category: 'content',
    icon: 'H2',
    thumbnail: '',
    tags: ['text', 'heading', 'h2'],
    block: {
      type: 'content',
      name: 'Заголовок H2',
      category: 'content',
      content: { type: 'text', html: '<h2>Заголовок второго уровня</h2>' },
    },
  },
  {
    id: 'editorial-h3',
    name: 'Заголовок H3',
    category: 'content',
    icon: 'H3',
    thumbnail: '',
    tags: ['text', 'heading', 'h3'],
    block: {
      type: 'content',
      name: 'Заголовок H3',
      category: 'content',
      content: { type: 'text', html: '<h3>Заголовок третьего уровня</h3>' },
    },
  },
];

const editorialMediaTemplates: BlockLibraryItem[] = [
  {
    id: 'editorial-image',
    name: 'Изображение',
    category: 'gallery',
    icon: '🖼️',
    thumbnail: '',
    tags: ['image', 'photo', 'media'],
    block: {
      type: 'image',
      name: 'Изображение',
      category: 'gallery',
      content: { imageUrl: '' },
      styles: { padding: { top: 16, bottom: 16 } },
    },
  },
];

type UiCategoryId = 'sections' | 'text' | 'media' | 'forms' | 'social' | 'shop';

const textTypes = new Set(['text', 'faq', 'table', 'list', 'quote', 'steps']);
const mediaTypes = new Set(['image', 'video', 'image-gif', 'image-compare', 'image-wave', 'gallery']);
const allowedMediaLayouts = new Set(['slider', 'carousel']);

function isAllowedMediaTemplate(template: BlockLibraryItem): boolean {
  const blockType = String(template.block?.type || '');
  if (blockType === 'gallery') {
    const layout = String(template.block?.content?.layout || '').toLowerCase();
    return allowedMediaLayouts.has(layout);
  }
  if (template.category === 'gallery') {
    return blockType !== 'gallery' || allowedMediaLayouts.has(String(template.block?.content?.layout || '').toLowerCase());
  }
  if (template.category === 'content') {
    const contentType = String(template.block?.content?.type || '').toLowerCase();
    return contentType === 'image-text' || contentType === 'video' || contentType === 'audio' || contentType === 'map';
  }
  return mediaTypes.has(blockType);
}

function getUiCategory(template: BlockLibraryItem): UiCategoryId | null {
  if (template.category === 'sections') return 'sections';
  if (template.category === 'forms') return 'forms';
  if (template.category === 'social') return 'social';
  if (template.category === 'shop') return 'shop';

  if (template.category === 'gallery') return 'media';
  if (template.category === 'content') {
    const contentType = String(template.block?.content?.type || '').toLowerCase();
    if (textTypes.has(contentType)) return 'text';
    if (mediaTypes.has(contentType)) return 'media';
    return null;
  }

  if (template.block?.type && mediaTypes.has(String(template.block.type))) return 'media';
  return null;
}

function includeByPreset(template: BlockLibraryItem, preset: LibraryPreset): boolean {
  const uiCategory = getUiCategory(template);
  if (!uiCategory) return false;
  if (uiCategory === 'media' && !isAllowedMediaTemplate(template)) return false;
  if (preset === 'all') return true;
  if (preset === 'article') return uiCategory !== 'shop';
  return true;
}

function scoreByPreset(template: BlockLibraryItem, preset: LibraryPreset): number {
  if (preset === 'all') return 0;
  const priorities = categoryPriorityByPreset[preset];
  const uiCategory = getUiCategory(template);
  if (!uiCategory) return priorities.length + 1;
  const index = priorities.indexOf(uiCategory);
  return index === -1 ? priorities.length + 1 : index;
}

function normalizeTemplateName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function BlockLibrary({ onAddBlock, onAddBlockToSection, activeColumnTarget }: BlockLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreset, setActivePreset] = useState<LibraryPreset>('all');
  const [activeCategory, setActiveCategory] = useState<string>('text');

  const allTemplates = [...editorialTextTemplates, ...editorialMediaTemplates, ...blockTemplates];

  const categories: { id: UiCategoryId; name: string; icon: string }[] = [
    { id: 'sections', name: 'Секции', icon: '📐' },
    { id: 'text', name: 'Текст', icon: '✍️' },
    { id: 'media', name: 'Медиа', icon: '🖼️' },
    { id: 'shop', name: 'Магазин', icon: '🛒' },
    { id: 'forms', name: 'Формы', icon: '📝' },
    { id: 'social', name: 'Соцдоказательства', icon: '⭐' },
  ];

  const availableCategories = categories.filter((category) =>
    allTemplates.some((template) => getUiCategory(template) === category.id && includeByPreset(template, activePreset))
  );

  const normalizedSearch = searchQuery.toLowerCase().trim();
  const safeActiveCategory = availableCategories.some((category) => category.id === activeCategory)
    ? activeCategory
    : availableCategories[0]?.id ?? 'sections';

  const filteredTemplates = allTemplates
    .filter((template) => {
      const matchesSearch =
        !normalizedSearch ||
        template.name.toLowerCase().includes(normalizedSearch) ||
        template.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
      const matchesCategory = getUiCategory(template) === safeActiveCategory;
      const matchesPreset = includeByPreset(template, activePreset);
      return matchesSearch && matchesCategory && matchesPreset;
    })
    .sort((a, b) => {
      const scoreDiff = scoreByPreset(a, activePreset) - scoreByPreset(b, activePreset);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name, 'ru');
    })
    .filter((template, index, list) => {
      const key = `${template.category}::${normalizeTemplateName(template.name)}`;
      return list.findIndex((candidate) => `${candidate.category}::${normalizeTemplateName(candidate.name)}` === key) === index;
    });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск блоков..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Quick Presets */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Быстрые пресеты по задаче
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {(Object.keys(presetLabels) as LibraryPreset[]).map((preset) => (
            <Chip
              key={preset}
              size="small"
              label={presetLabels[preset]}
              color={activePreset === preset ? 'primary' : 'default'}
              variant={activePreset === preset ? 'filled' : 'outlined'}
              onClick={() => setActivePreset(preset)}
              sx={{
                fontWeight: 600,
                bgcolor: activePreset === preset ? '#ffbb00 !important' : 'background.paper !important',
                color: activePreset === preset ? '#111111 !important' : 'text.primary !important',
                borderColor: activePreset === preset ? '#ffbb00 !important' : 'divider !important',
                '& .MuiChip-label': { color: 'inherit !important' },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Categories */}
      <Tabs
        value={safeActiveCategory}
        onChange={(_, value) => setActiveCategory(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {availableCategories.map((category) => (
          <Tab
            key={category.id}
            value={category.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{category.icon}</span>
                <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {category.name}
                </Typography>
              </Box>
            }
          />
        ))}
      </Tabs>

      {activeColumnTarget && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'primary.light', color: 'primary.contrastText', fontSize: '0.75rem' }}>
          Блоки добавляются в выбранную колонку. Кликните по другой колонке, чтобы изменить.
        </Box>
      )}
      {/* Blocks Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <BlockCategory
          category={safeActiveCategory}
          templates={filteredTemplates}
          onAddBlock={(block) => {
            if (block.type === 'section') {
              onAddBlock(block);
              return;
            }
            if (activeColumnTarget && onAddBlockToSection) {
              onAddBlockToSection(activeColumnTarget.sectionId, activeColumnTarget.columnId, block);
            } else {
              onAddBlock(block);
            }
          }}
        />
      </Box>
    </Box>
  );
}
