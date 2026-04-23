import { useState } from 'react';
import { Box, Tabs, Tab, TextField, Typography, Slider, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Button, IconButton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { uploadImage } from '@/services/cmsApi';
import { useToast } from '@/components/common/ToastProvider';
import { normalizeBackgroundImageCss, resolveBackgroundImageCssForDisplay } from '@/utils/backgroundImageCss';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { PageBlock, DeviceType, SectionLayout } from '@/types/pageBuilder';
import { inferContentVariant, shouldHideGenericForContentVariant } from '@/utils/pageBuilderContentVariant';

interface SettingsPanelProps {
  block: PageBlock;
  blocks?: PageBlock[];
  deviceType: DeviceType;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onAddBlockToSection?: (sectionId: string, columnId: string, block: Partial<PageBlock>) => void;
}

/** Выше любого вложенного Modal/оверлея Page Builder (modal ≈ 1300) */
const SELECT_MENU_PROPS = {
  disablePortal: true,
  disableScrollLock: true,
  MenuListProps: {
    disablePadding: false,
  },
  PaperProps: {
    sx: {
      zIndex: (theme: { zIndex: { tooltip: number } }) => theme.zIndex.tooltip + 50,
      pointerEvents: 'auto',
    },
  },
} as const;

function normalizeSectionLayout(raw: unknown): SectionLayout {
  if (typeof raw === 'string' && raw in LAYOUT_LABELS) return raw as SectionLayout;
  return 'full-width';
}

const LAYOUT_LABELS: Record<SectionLayout, string> = {
  'full-width': '1 колонка (100%)',
  'two-50-50': '2 колонки (50/50)',
  'two-33-67': '2 колонки (33/67)',
  'two-67-33': '2 колонки (67/33)',
  'two-25-75': '2 колонки (25/75)',
  'two-75-25': '2 колонки (75/25)',
  'three-equal': '3 колонки (равные)',
  'four-equal': '4 колонки (равные)',
  'custom': 'Своя (число колонок и доли %)',
};

const DEFAULT_WIDTHS: Record<SectionLayout, number[]> = {
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

function equalPercentWidths(n: number): number[] {
  if (n <= 0) return [100];
  return Array.from({ length: n }, () => 100 / n);
}

function normalizePercentWidths(widths: number[]): number[] {
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum <= 0) return equalPercentWidths(widths.length);
  return widths.map((x) => (x / sum) * 100);
}

export function SettingsPanel({ block, blocks, deviceType, onUpdate, onAddBlockToSection }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const updateStyles = (styleUpdates: Partial<typeof block.styles>) => {
    onUpdate({
      styles: {
        ...(block.styles || {}),
        ...styleUpdates,
      },
    });
  };

  const updateContent = (contentUpdates: Partial<typeof block.content>) => {
    onUpdate({
      content: {
        ...(block.content || {}),
        ...contentUpdates,
      },
    });
  };

  return (
    <Box
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
        pointerEvents: 'auto',
        touchAction: 'auto',
      }}
    >
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
        <Tab label="Контент" />
        <Tab label="Стиль" />
        <Tab label="Текст" />
        <Tab label="Spacing" />
        <Tab label="Анимация" />
        <Tab label="Видимость" />
        <Tab label="Дополнительно" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
        {activeTab === 0 && block.type === 'section' && (
          <SectionTab key={block.id} block={block} onUpdate={updateContent} />
        )}
        {activeTab === 0 && block.type !== 'section' && (
          <ContentTab block={block} onUpdate={updateContent} />
        )}
        {activeTab === 1 && (
          <StyleTab block={block} onUpdate={updateStyles} />
        )}
        {activeTab === 2 && (
          <TypoTab block={block} onUpdate={updateStyles} />
        )}
        {activeTab === 3 && (
          <SpacingTab block={block} deviceType={deviceType} onUpdate={updateStyles} />
        )}
        {activeTab === 4 && (
          <AnimationTab block={block} onUpdate={updateStyles} />
        )}
        {activeTab === 5 && (
          <VisibilityTab block={block} deviceType={deviceType} onUpdate={updateStyles} />
        )}
        {activeTab === 6 && (
          <AdvancedTab block={block} onUpdate={onUpdate} />
        )}
      </Box>
    </Box>
  );
}

function SectionTab({ block, onUpdate }: { block: PageBlock; onUpdate: (updates: any) => void }) {
  const layout = normalizeSectionLayout(block.content?.layout);
  const columns = block.content?.columns || [];
  const presetDefault = DEFAULT_WIDTHS[layout];
  const columnWidths =
    columns.length === 0
      ? [100]
      : block.content?.columnWidths?.length === columns.length
        ? block.content.columnWidths!
        : presetDefault?.length === columns.length
          ? presetDefault
          : normalizePercentWidths(equalPercentWidths(columns.length));

  const handleLayoutChange = (newLayout: SectionLayout) => {
    const widths = DEFAULT_WIDTHS[newLayout];
    const newColumnCount = widths.length;
    const currentColumns = [...(block.content?.columns || [])];

    let newColumns = [...currentColumns];
    if (newColumnCount > currentColumns.length) {
      for (let i = currentColumns.length; i < newColumnCount; i++) {
        newColumns.push({ id: `col-${Date.now()}-${i}`, blocks: [] });
      }
    } else if (newColumnCount < currentColumns.length) {
      const dropped = newColumns.slice(newColumnCount);
      const merged = dropped.flatMap((c) => c.blocks || []);
      newColumns = newColumns.slice(0, newColumnCount);
      if (merged.length && newColumns.length) {
        const last = newColumns[newColumns.length - 1];
        newColumns[newColumns.length - 1] = { ...last, blocks: [...(last.blocks || []), ...merged] };
      }
    }
    onUpdate({ layout: newLayout, columnWidths: widths, columns: newColumns });
  };

  const handleColumnCountChange = (n: number) => {
    const currentColumns = [...(block.content?.columns || [])];
    const allBlocks = currentColumns.flatMap((c) => c.blocks || []);

    if (currentColumns.length === 0 && n > 0) {
      onUpdate({
        layout: n === 1 ? 'full-width' : 'custom',
        columns:
          n === 1
            ? [{ id: `col-${Date.now()}`, blocks: [] }]
            : Array.from({ length: n }, (_, i) => ({ id: `col-${Date.now()}-${i}`, blocks: [] })),
        columnWidths: n === 1 ? [100] : normalizePercentWidths(equalPercentWidths(n)),
      });
      return;
    }

    if (n === 1) {
      onUpdate({
        layout: 'full-width',
        columns: [{ id: currentColumns[0]?.id || `col-${Date.now()}-0`, blocks: allBlocks }],
        columnWidths: [100],
      });
      return;
    }

    let newColumns = [...currentColumns];
    if (n > newColumns.length) {
      for (let i = newColumns.length; i < n; i++) {
        newColumns.push({ id: `col-${Date.now()}-${i}`, blocks: [] });
      }
    } else if (n < newColumns.length) {
      const dropped = newColumns.slice(n);
      const merged = dropped.flatMap((c) => c.blocks || []);
      newColumns = newColumns.slice(0, n);
      if (merged.length && newColumns.length) {
        const last = newColumns[n - 1];
        newColumns[n - 1] = { ...last, blocks: [...(last.blocks || []), ...merged] };
      }
    }
    onUpdate({
      layout: 'custom',
      columns: newColumns,
      columnWidths: normalizePercentWidths(equalPercentWidths(n)),
    });
  };

  const handleWidthChange = (index: number, value: number) => {
    const n = columnWidths.length;
    if (n === 1) {
      onUpdate({ columnWidths: [100] });
      return;
    }
    if (n === 2) {
      const v = Math.min(95, Math.max(5, value));
      const other = 100 - v;
      onUpdate({
        columnWidths: index === 0 ? [v, other] : [other, v],
      });
      return;
    }
    const next = [...columnWidths];
    next[index] = Math.min(95, Math.max(5, value));
    onUpdate({ columnWidths: normalizePercentWidths(next) });
  };

  const applyEqualWidths = () => {
    onUpdate({ columnWidths: normalizePercentWidths(equalPercentWidths(columnWidths.length)) });
  };

  if (columns.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2">Раскладка секции</Typography>
        <Typography variant="body2" color="text.secondary">
          Колонок нет. Выберите число колонок ниже — секция заполнится.
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Количество колонок</InputLabel>
          <Select
            value={1}
            label="Количество колонок"
            onChange={(e) => handleColumnCountChange(Number(e.target.value))}
            MenuProps={SELECT_MENU_PROPS}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Раскладка секции</Typography>
      <FormControl fullWidth>
        <InputLabel>Тип секции</InputLabel>
        <Select
          value={layout}
          label="Тип секции"
          onChange={(e) => handleLayoutChange(e.target.value as SectionLayout)}
          MenuProps={SELECT_MENU_PROPS}
        >
          {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Количество колонок</InputLabel>
        <Select
          value={Math.min(6, Math.max(1, columns.length))}
          label="Количество колонок"
          onChange={(e) => handleColumnCountChange(Number(e.target.value))}
          MenuProps={SELECT_MENU_PROPS}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Ширина колонок (%)</Typography>
      <Typography variant="caption" color="text.secondary">
        Сумма долей: {columnWidths.reduce((a, b) => a + b, 0).toFixed(1)}% (после правок нормализуется к 100%)
      </Typography>
      {columnWidths.length > 2 && (
        <Button size="small" variant="outlined" onClick={applyEqualWidths}>
          Равные доли
        </Button>
      )}
      {columnWidths.length === 1 ? (
        <Typography variant="caption" color="text.secondary">
          Одна колонка на всю ширину (100%).
        </Typography>
      ) : (
        columnWidths.map((w, idx) => (
          <Box key={idx}>
            <Typography variant="caption">Колонка {idx + 1}: {w.toFixed(1)}%</Typography>
            <Slider
              value={w}
              onChange={(_, v) => handleWidthChange(idx, v as number)}
              min={5}
              max={95}
              valueLabelDisplay="auto"
            />
          </Box>
        ))
      )}
    </Box>
  );
}

function ContentTab({ block, onUpdate }: { block: PageBlock; onUpdate: (updates: any) => void }) {
  const { showToast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const cv = inferContentVariant(block);
  const hideStructuredGeneric = block.type === 'content' && shouldHideGenericForContentVariant(cv);

  const showPrimaryTextHtml =
    block.type === 'text' ||
    block.type === 'cover' ||
    block.type === 'cta' ||
    (block.type === 'content' && !hideStructuredGeneric);

  const showContentAuxImage =
    block.type === 'image' ||
    block.type === 'gallery' ||
    block.type === 'cover' ||
    (block.type === 'content' && (!cv || cv === 'text' || cv === 'image-text'));

  const showContentVideoRow =
    block.type === 'cover' ||
    !!block.content?.videoUrl ||
    (block.type === 'content' && (!cv || cv === 'text' || cv === 'image-text' || cv === 'video'));

  const showContentLinkRow =
    block.type === 'cta' ||
    !!block.content?.linkUrl ||
    (block.type === 'content' && (!cv || cv === 'text' || cv === 'image-text'));

  const showUniversalHtmlFooter = block.type !== 'content' || !shouldHideGenericForContentVariant(cv);

  const contentFeaturesPatch = block.type === 'content' && cv === 'features' ? { type: 'features' as const } : {};
  const showQuickEditor = block.type === 'content' || block.type === 'cover';

  const handleImageUpload = async (field: 'imageUrl' | 'videoUrl' | 'items' | 'images', index?: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      try {
        setUploadingImage(true);
        const response = await uploadImage(file);
        const imageUrl = response.url;
        
        if (field === 'items' && index !== undefined) {
          const newItems = [...(block.content.items || [])];
          const v = inferContentVariant(block);
          newItems[index] =
            v === 'team'
              ? { ...newItems[index], photo: imageUrl, imageUrl: imageUrl }
              : { ...newItems[index], imageUrl };
          onUpdate({ items: newItems, ...(v === 'team' ? { type: 'team' } : {}) });
        } else if (field === 'images' && index !== undefined) {
          const newImages = [...(block.content.images || [])];
          newImages[index] = imageUrl;
          onUpdate({ images: newImages });
        } else if (field === 'images') {
          onUpdate({ images: [...(block.content.images || []), imageUrl] });
        } else {
          onUpdate({ [field]: imageUrl });
        }
        showToast('Изображение загружено', 'success');
      } catch (error: any) {
        showToast(error?.message || 'Ошибка загрузки', 'error');
      } finally {
        setUploadingImage(false);
        target.value = '';
      }
    };
    input.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Содержимое блока</Typography>

      {showQuickEditor && (
        <>
          <Typography variant="caption" color="text.secondary">
            Быстрое редактирование
          </Typography>
          <TextField
            label="Заголовок"
            fullWidth
            value={block.content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
          <TextField
            label="Подзаголовок"
            fullWidth
            value={block.content.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
          />
          <TextField
            label="Текст"
            multiline
            rows={5}
            fullWidth
            value={block.content?.text ?? ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
          />
          {showContentAuxImage && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Изображение (URL)"
                fullWidth
                value={block.content.imageUrl || ''}
                onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              />
              <Button
                variant="outlined"
                onClick={() => handleImageUpload('imageUrl')}
                disabled={uploadingImage}
                sx={{ minWidth: 120 }}
              >
                {uploadingImage ? 'Загрузка...' : 'Загрузить'}
              </Button>
            </Box>
          )}
          {showContentVideoRow && (
            <TextField
              label="Видео (URL)"
              fullWidth
              value={block.content.videoUrl || ''}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
            />
          )}
          <Divider />
        </>
      )}

      {/* FAQ */}
      {block.type === 'content' && cv === 'faq' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Вопросы и ответы</Typography>
          {(block.content.items || []).map((item: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Вопрос {index + 1}</Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const newItems = (block.content.items || []).filter((_: any, i: number) => i !== index);
                    onUpdate({ items: newItems, type: 'faq' });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Вопрос"
                fullWidth
                size="small"
                value={item.question || ''}
                onChange={(e) => {
                  const newItems = [...(block.content.items || [])];
                  newItems[index] = { ...newItems[index], question: e.target.value };
                  onUpdate({ items: newItems, type: 'faq' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Ответ"
                multiline
                rows={3}
                fullWidth
                size="small"
                value={item.answer || ''}
                onChange={(e) => {
                  const newItems = [...(block.content.items || [])];
                  newItems[index] = { ...newItems[index], answer: e.target.value };
                  onUpdate({ items: newItems, type: 'faq' });
                }}
              />
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const newItems = [...(block.content.items || []), { question: '', answer: '' }];
              onUpdate({ items: newItems, type: 'faq' });
            }}
          >
            Добавить вопрос
          </Button>
        </>
      )}

      {/* Pricing */}
      {block.type === 'content' && cv === 'pricing' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Тарифные планы</Typography>
          {(block.content.plans || []).map((plan: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>План {index + 1}</Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const newPlans = (block.content.plans || []).filter((_: any, i: number) => i !== index);
                    onUpdate({ plans: newPlans, type: 'pricing' });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Название"
                fullWidth
                size="small"
                value={plan.name || ''}
                onChange={(e) => {
                  const newPlans = [...(block.content.plans || [])];
                  newPlans[index] = { ...newPlans[index], name: e.target.value };
                  onUpdate({ plans: newPlans, type: 'pricing' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Цена"
                fullWidth
                size="small"
                value={plan.price || ''}
                onChange={(e) => {
                  const newPlans = [...(block.content.plans || [])];
                  newPlans[index] = { ...newPlans[index], price: e.target.value };
                  onUpdate({ plans: newPlans, type: 'pricing' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Период"
                fullWidth
                size="small"
                value={plan.period || ''}
                onChange={(e) => {
                  const newPlans = [...(block.content.plans || [])];
                  newPlans[index] = { ...newPlans[index], period: e.target.value };
                  onUpdate({ plans: newPlans, type: 'pricing' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Описание"
                multiline
                rows={2}
                fullWidth
                size="small"
                value={plan.description || ''}
                onChange={(e) => {
                  const newPlans = [...(block.content.plans || [])];
                  newPlans[index] = { ...newPlans[index], description: e.target.value };
                  onUpdate({ plans: newPlans, type: 'pricing' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Текст кнопки"
                fullWidth
                size="small"
                value={plan.buttonText || 'Выбрать'}
                onChange={(e) => {
                  const newPlans = [...(block.content.plans || [])];
                  newPlans[index] = { ...newPlans[index], buttonText: e.target.value };
                  onUpdate({ plans: newPlans, type: 'pricing' });
                }}
              />
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const newPlans = [...(block.content.plans || []), { name: '', price: '', period: '', description: '', buttonText: 'Выбрать' }];
              onUpdate({ plans: newPlans, type: 'pricing' });
            }}
          >
            Добавить план
          </Button>
        </>
      )}

      {/* Team */}
      {block.type === 'content' && cv === 'team' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Участники команды</Typography>
          {(block.content.items || []).map((member: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Участник {index + 1}</Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const newItems = (block.content.items || []).filter((_: any, i: number) => i !== index);
                    onUpdate({ items: newItems, type: 'team' });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Имя"
                  fullWidth
                  size="small"
                  value={member.name || ''}
                  onChange={(e) => {
                    const newItems = [...(block.content.items || [])];
                    newItems[index] = { ...newItems[index], name: e.target.value };
                    onUpdate({ items: newItems, type: 'team' });
                  }}
                />
                <TextField
                  label="Должность"
                  fullWidth
                  size="small"
                  value={member.role || ''}
                  onChange={(e) => {
                    const newItems = [...(block.content.items || [])];
                    newItems[index] = { ...newItems[index], role: e.target.value };
                    onUpdate({ items: newItems, type: 'team' });
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Фото (URL)"
                  fullWidth
                  size="small"
                  value={member.photo || member.imageUrl || ''}
                  onChange={(e) => {
                    const newItems = [...(block.content.items || [])];
                    newItems[index] = { ...newItems[index], photo: e.target.value };
                    onUpdate({ items: newItems, type: 'team' });
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleImageUpload('items', index)}
                  disabled={uploadingImage}
                >
                  Загрузить
                </Button>
              </Box>
              <TextField
                label="Описание"
                multiline
                rows={2}
                fullWidth
                size="small"
                value={member.description || ''}
                onChange={(e) => {
                  const newItems = [...(block.content.items || [])];
                  newItems[index] = { ...newItems[index], description: e.target.value };
                  onUpdate({ items: newItems, type: 'team' });
                }}
              />
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const newItems = [...(block.content.items || []), { name: '', role: '', photo: '', description: '' }];
              onUpdate({ items: newItems, type: 'team' });
            }}
          >
            Добавить участника
          </Button>
        </>
      )}

      {/* Steps */}
      {block.type === 'content' && cv === 'steps' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Шаги</Typography>
          {(block.content.steps || []).map((step: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Шаг {index + 1}</Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const newSteps = (block.content.steps || []).filter((_: any, i: number) => i !== index);
                    onUpdate({ steps: newSteps, type: 'steps' });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Номер шага"
                type="number"
                fullWidth
                size="small"
                value={step.number || index + 1}
                onChange={(e) => {
                  const newSteps = [...(block.content.steps || [])];
                  newSteps[index] = { ...newSteps[index], number: parseInt(e.target.value) || index + 1 };
                  onUpdate({ steps: newSteps, type: 'steps' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Заголовок"
                fullWidth
                size="small"
                value={step.title || ''}
                onChange={(e) => {
                  const newSteps = [...(block.content.steps || [])];
                  newSteps[index] = { ...newSteps[index], title: e.target.value };
                  onUpdate({ steps: newSteps, type: 'steps' });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Описание"
                multiline
                rows={2}
                fullWidth
                size="small"
                value={step.description || ''}
                onChange={(e) => {
                  const newSteps = [...(block.content.steps || [])];
                  newSteps[index] = { ...newSteps[index], description: e.target.value };
                  onUpdate({ steps: newSteps, type: 'steps' });
                }}
              />
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const newSteps = [...(block.content.steps || []), { number: (block.content.steps || []).length + 1, title: '', description: '' }];
              onUpdate({ steps: newSteps, type: 'steps' });
            }}
          >
            Добавить шаг
          </Button>
        </>
      )}

      {/* Таблица */}
      {block.type === 'content' && cv === 'table' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Таблица</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Заголовки
          </Typography>
          {(block.content.tableHeaders || []).map((header: string, hi: number) => (
            <Box key={hi} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                label={`Колонка ${hi + 1}`}
                fullWidth
                size="small"
                value={header}
                onChange={(e) => {
                  const headers = [...(block.content.tableHeaders || [])];
                  headers[hi] = e.target.value;
                  onUpdate({ tableHeaders: headers, type: 'table' });
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const headers = (block.content.tableHeaders || []).filter((_: string, i: number) => i !== hi);
                  const rows = (block.content.tableRows || []).map((r: string[]) => r.filter((_: string, i: number) => i !== hi));
                  onUpdate({ tableHeaders: headers, tableRows: rows, type: 'table' });
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            sx={{ mb: 2 }}
            startIcon={<AddIcon />}
            onClick={() => {
              const headers = [...(block.content.tableHeaders || []), `Кол ${(block.content.tableHeaders || []).length + 1}`];
              const rows = (block.content.tableRows || []).map((r: string[]) => [...r, '']);
              onUpdate({ tableHeaders: headers, tableRows: rows.length ? rows : [Array(headers.length).fill('')], type: 'table' });
            }}
          >
            Добавить колонку
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Строки
          </Typography>
          {(block.content.tableRows || []).map((row: string[], ri: number) => (
            <Box key={ri} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Строка {ri + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const next = (block.content.tableRows || []).filter((_: string[], i: number) => i !== ri);
                    onUpdate({ tableRows: next, type: 'table' });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              {(row || []).map((cell: string, ci: number) => (
                <TextField
                  key={ci}
                  label={`Ячейка ${ci + 1}`}
                  fullWidth
                  size="small"
                  value={cell}
                  sx={{ mb: 1 }}
                  onChange={(e) => {
                    const rows = [...(block.content.tableRows || [])].map((r: string[]) => [...r]);
                    rows[ri] = [...rows[ri]];
                    rows[ri][ci] = e.target.value;
                    onUpdate({ tableRows: rows, type: 'table' });
                  }}
                />
              ))}
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const n = Math.max((block.content.tableHeaders || []).length, 1);
              const rows = [...(block.content.tableRows || []), Array(n).fill('')];
              onUpdate({ tableRows: rows, type: 'table' });
            }}
          >
            Добавить строку
          </Button>
        </>
      )}

      {/* Маркированный список */}
      {block.type === 'content' && cv === 'list' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Пункты списка</Typography>
          {(block.content.listItems || []).map((line: string, li: number) => (
            <Box key={li} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                size="small"
                label={`Пункт ${li + 1}`}
                value={line}
                onChange={(e) => {
                  const listItems = [...(block.content.listItems || [])];
                  listItems[li] = e.target.value;
                  onUpdate({ listItems, type: 'list' });
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const listItems = (block.content.listItems || []).filter((_: string, i: number) => i !== li);
                  onUpdate({ listItems, type: 'list' });
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => onUpdate({ listItems: [...(block.content.listItems || []), ''], type: 'list' })}
          >
            Добавить пункт
          </Button>
        </>
      )}

      {/* Аккордеон */}
      {block.type === 'content' && cv === 'accordion' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Секции аккордеона</Typography>
          {(block.content.accordionItems || []).map((sec: { title?: string; body?: string }, ai: number) => (
            <Box key={ai} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Секция {ai + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const accordionItems = (block.content.accordionItems || []).filter((_: unknown, i: number) => i !== ai);
                    onUpdate({ accordionItems, type: 'accordion' });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Заголовок"
                fullWidth
                size="small"
                value={sec.title || ''}
                sx={{ mb: 1 }}
                onChange={(e) => {
                  const accordionItems = [...(block.content.accordionItems || [])];
                  accordionItems[ai] = { ...accordionItems[ai], title: e.target.value };
                  onUpdate({ accordionItems, type: 'accordion' });
                }}
              />
              <TextField
                label="Текст"
                fullWidth
                size="small"
                multiline
                rows={3}
                value={sec.body || ''}
                onChange={(e) => {
                  const accordionItems = [...(block.content.accordionItems || [])];
                  accordionItems[ai] = { ...accordionItems[ai], body: e.target.value };
                  onUpdate({ accordionItems, type: 'accordion' });
                }}
              />
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() =>
              onUpdate({
                accordionItems: [...(block.content.accordionItems || []), { title: '', body: '' }],
                type: 'accordion',
              })
            }
          >
            Добавить секцию
          </Button>
        </>
      )}

      {/* Цитата */}
      {block.type === 'content' && cv === 'quote' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Цитата</Typography>
          <TextField
            label="Текст цитаты"
            fullWidth
            multiline
            rows={4}
            value={(block.content as { quoteText?: string }).quoteText || ''}
            onChange={(e) => onUpdate({ quoteText: e.target.value, type: 'quote' })}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Автор / подпись"
            fullWidth
            value={(block.content as { quoteAuthor?: string }).quoteAuthor || ''}
            onChange={(e) => onUpdate({ quoteAuthor: e.target.value, type: 'quote' })}
          />
        </>
      )}

      {/* Элементы для features, menu и других списковых блоков */}
      {(block.type === 'features' ||
        block.type === 'social' ||
        (block.type === 'content' && cv === 'features')) && (
        <Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Элементы</Typography>
          {(block.content.items || []).map((item: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Элемент {index + 1}</Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    const newItems = (block.content.items || []).filter((_: any, i: number) => i !== index);
                    onUpdate({ items: newItems, ...contentFeaturesPatch });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label={block.type === 'features' || (block.type === 'content' && cv === 'features') ? 'Заголовок' : 'Текст'}
                fullWidth
                size="small"
                value={
                  block.type === 'features' || (block.type === 'content' && cv === 'features')
                    ? item.title || item.text || item.label || ''
                    : item.text || item.label || ''
                }
                onChange={(e) => {
                  const newItems = [...(block.content.items || [])];
                  if (block.type === 'features' || (block.type === 'content' && cv === 'features')) {
                    newItems[index] = { ...newItems[index], title: e.target.value, text: e.target.value };
                  } else {
                    newItems[index] = { ...newItems[index], text: e.target.value, label: e.target.value };
                  }
                  onUpdate({ items: newItems, ...contentFeaturesPatch });
                }}
                sx={{ mb: 1 }}
              />
              {block.type === 'social' && (
                <TextField
                  label="Ссылка"
                  fullWidth
                  size="small"
                  value={item.link || item.url || item.linkUrl || ''}
                  onChange={(e) => {
                    const newItems = [...(block.content.items || [])];
                    newItems[index] = { ...newItems[index], link: e.target.value, url: e.target.value, linkUrl: e.target.value };
                    onUpdate({ items: newItems });
                  }}
                />
              )}
              {(block.type === 'features' || (block.type === 'content' && cv === 'features')) && (
                <>
                  <TextField
                    label="Иконка (emoji или URL)"
                    fullWidth
                    size="small"
                    value={item.icon || ''}
                    onChange={(e) => {
                      const newItems = [...(block.content.items || [])];
                      newItems[index] = { ...newItems[index], icon: e.target.value };
                      onUpdate({ items: newItems, ...contentFeaturesPatch });
                    }}
                    sx={{ mt: 1 }}
                  />
                  <TextField
                    label="Описание"
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={item.description || ''}
                    onChange={(e) => {
                      const newItems = [...(block.content.items || [])];
                      newItems[index] = { ...newItems[index], description: e.target.value };
                      onUpdate({ items: newItems, ...contentFeaturesPatch });
                    }}
                    sx={{ mt: 1 }}
                  />
                </>
              )}
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const defaultItem =
                block.type === 'features' || (block.type === 'content' && cv === 'features')
                  ? { icon: '✨', title: '', description: '' }
                  : { text: '', link: '' };
              const newItems = [...(block.content.items || []), defaultItem];
              onUpdate({ items: newItems, ...contentFeaturesPatch });
            }}
          >
            Добавить элемент
          </Button>
        </Box>
      )}
      {/* Текст+HTML для типов, где нет быстрого редактора */}
      {showPrimaryTextHtml && !showQuickEditor && (
        <>
          <TextField
            label="Текст"
            multiline
            rows={4}
            fullWidth
            value={block.content?.text ?? ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
          />
          <TextField
            label="HTML"
            multiline
            rows={6}
            fullWidth
            value={block.content?.html ?? ''}
            onChange={(e) => onUpdate({ html: e.target.value })}
          />
        </>
      )}

      {/* Заголовок для cover блоков */}
      {block.type === 'cover' && !showQuickEditor && (
        <>
          <TextField
            label="Заголовок"
            fullWidth
            value={block.content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
          <TextField
            label="Подзаголовок"
            fullWidth
            value={block.content.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
          />
          <TextField
            label="Текст кнопки"
            fullWidth
            value={block.content.buttonText || ''}
            onChange={(e) => onUpdate({ buttonText: e.target.value })}
          />
        </>
      )}

      {/* GIF из изображений */}
      {block.type === 'image-gif' && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Кадры GIF</Typography>
          {(block.content.images || []).map((url: string, index: number) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label={`Кадр ${index + 1}`}
                fullWidth
                size="small"
                value={url}
                onChange={(e) => {
                  const imgs = [...(block.content.images || [])];
                  imgs[index] = e.target.value;
                  onUpdate({ images: imgs });
                }}
              />
              <Button size="small" variant="outlined" onClick={() => handleImageUpload('images' as any, index)} disabled={uploadingImage}>
                Загрузить
              </Button>
              <IconButton size="small" onClick={() => onUpdate({ images: (block.content.images || []).filter((_: string, i: number) => i !== index) })}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => onUpdate({ images: [...(block.content.images || []), ''] })}>
            Добавить кадр
          </Button>
          <TextField label="FPS" type="number" size="small" fullWidth value={block.content.gifFps || 5} onChange={(e) => onUpdate({ gifFps: parseInt(e.target.value) || 5 })} />
          <FormControlLabel control={<Switch checked={block.content.gifLoop !== false} onChange={(e) => onUpdate({ gifLoop: e.target.checked })} />} label="Зациклить" />
        </>
      )}

      {/* Сравнение изображений */}
      {block.type === 'image-compare' && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>До / После</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField label="Изображение 1 (До)" fullWidth size="small" value={(block.content.images || [''])[0] || ''} onChange={(e) => onUpdate({ images: [e.target.value, (block.content.images || ['', ''])[1] || ''] })} />
            <Button size="small" variant="outlined" onClick={() => {
              const imgs = block.content.images || ['', ''];
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async (ev: Event) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (!file) return;
                try {
                  setUploadingImage(true);
                  const res = await uploadImage(file);
                  onUpdate({ images: [res.url, imgs[1] || ''] });
                  showToast('Изображение загружено', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Ошибка', 'error');
                } finally {
                  setUploadingImage(false);
                }
              };
              input.click();
            }} disabled={uploadingImage}>Загрузить</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label="Изображение 2 (После)" fullWidth size="small" value={(block.content.images || ['', ''])[1] || ''} onChange={(e) => onUpdate({ images: [(block.content.images || ['', ''])[0] || '', e.target.value] })} />
            <Button size="small" variant="outlined" onClick={() => {
              const imgs = block.content.images || ['', ''];
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async (ev: Event) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (!file) return;
                try {
                  setUploadingImage(true);
                  const res = await uploadImage(file);
                  onUpdate({ images: [imgs[0] || '', res.url] });
                  showToast('Изображение загружено', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Ошибка', 'error');
                } finally {
                  setUploadingImage(false);
                }
              };
              input.click();
            }} disabled={uploadingImage}>Загрузить</Button>
          </Box>
        </>
      )}

      {/* Волна на фото */}
      {block.type === 'image-wave' && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField label="URL изображения" fullWidth value={block.content.imageUrl || ''} onChange={(e) => onUpdate({ imageUrl: e.target.value })} />
          <Button variant="outlined" onClick={() => handleImageUpload('imageUrl')} disabled={uploadingImage}>Загрузить</Button>
        </Box>
      )}

      {/* Изображение */}
      {showContentAuxImage && (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="URL изображения"
              fullWidth
              value={block.content.imageUrl || ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            />
            <Button
              variant="outlined"
              onClick={() => handleImageUpload('imageUrl')}
              disabled={uploadingImage}
              sx={{ minWidth: 120 }}
            >
              {uploadingImage ? 'Загрузка...' : 'Загрузить'}
            </Button>
          </Box>
          {block.type === 'gallery' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Элементы галереи</Typography>
              {(block.content.items || []).map((item: any, index: number) => (
                <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      label={`Изображение ${index + 1}`}
                      fullWidth
                      size="small"
                      value={item.imageUrl || ''}
                      onChange={(e) => {
                        const newItems = [...(block.content.items || [])];
                        newItems[index] = { ...newItems[index], imageUrl: e.target.value };
                        onUpdate({ items: newItems });
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleImageUpload('items', index)}
                      disabled={uploadingImage}
                    >
                      Загрузить
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newItems = (block.content.items || []).filter((_: any, i: number) => i !== index);
                        onUpdate({ items: newItems });
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    label="Alt текст"
                    fullWidth
                    size="small"
                    value={item.alt || ''}
                    onChange={(e) => {
                      const newItems = [...(block.content.items || [])];
                      newItems[index] = { ...newItems[index], alt: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                  />
                </Box>
              ))}
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newItems = [...(block.content.items || []), { imageUrl: '', alt: '' }];
                  onUpdate({ items: newItems });
                }}
              >
                Добавить изображение
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Видео */}
      {showContentVideoRow && (
        <TextField
          label="URL видео"
          fullWidth
          value={block.content.videoUrl || ''}
          onChange={(e) => onUpdate({ videoUrl: e.target.value })}
        />
      )}

      {/* Ссылка */}
      {showContentLinkRow && (
        <TextField
          label="Ссылка"
          fullWidth
          value={block.content.linkUrl || ''}
          onChange={(e) => onUpdate({ linkUrl: e.target.value })}
        />
      )}

      {/* Слайдер */}
      {(block.type === 'gallery' && ['slider', 'carousel'].includes(String(block.content.layout ?? ''))) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Настройки слайдера</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={block.content.autoplay || false}
                onChange={(e) => onUpdate({ autoplay: e.target.checked })}
              />
            }
            label="Автоплей"
          />
          <TextField
            label="Скорость (мс)"
            type="number"
            fullWidth
            value={block.content.speed || 3000}
            onChange={(e) => onUpdate({ speed: parseInt(e.target.value) || 3000 })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={block.content.pauseOnHover || false}
                onChange={(e) => onUpdate({ pauseOnHover: e.target.checked })}
              />
            }
            label="Пауза при наведении"
          />
          <FormControlLabel
            control={
              <Switch
                checked={block.content.showArrows !== false}
                onChange={(e) => onUpdate({ showArrows: e.target.checked })}
              />
            }
            label="Стрелки"
          />
          <FormControlLabel
            control={
              <Switch
                checked={block.content.showDots !== false}
                onChange={(e) => onUpdate({ showDots: e.target.checked })}
              />
            }
            label="Точки"
          />
        </>
      )}

      {/* Формы */}
      {block.type === 'forms' && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Поля формы</Typography>
          {(block.content.fields || []).map((field: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Название поля"
                  size="small"
                  fullWidth
                  value={field.name || ''}
                  onChange={(e) => {
                    const newFields = [...(block.content.fields || [])];
                    newFields[index] = { ...newFields[index], name: e.target.value };
                    onUpdate({ fields: newFields });
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Тип</InputLabel>
                  <Select
                    value={field.type || 'text'}
                    MenuProps={SELECT_MENU_PROPS}
                    onChange={(e) => {
                      const newFields = [...(block.content.fields || [])];
                      newFields[index] = { ...newFields[index], type: e.target.value };
                      onUpdate({ fields: newFields });
                    }}
                  >
                    <MenuItem value="text">Текст</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="tel">Телефон</MenuItem>
                    <MenuItem value="textarea">Текстовая область</MenuItem>
                    <MenuItem value="select">Выбор</MenuItem>
                    <MenuItem value="checkbox">Чекбокс</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  size="small"
                  onClick={() => {
                    const newFields = (block.content.fields || []).filter((_: any, i: number) => i !== index);
                    onUpdate({ fields: newFields });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Плейсхолдер"
                size="small"
                fullWidth
                value={field.placeholder || ''}
                onChange={(e) => {
                  const newFields = [...(block.content.fields || [])];
                  newFields[index] = { ...newFields[index], placeholder: e.target.value };
                  onUpdate({ fields: newFields });
                }}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={field.required || false}
                    onChange={(e) => {
                      const newFields = [...(block.content.fields || [])];
                      newFields[index] = { ...newFields[index], required: e.target.checked };
                      onUpdate({ fields: newFields });
                    }}
                  />
                }
                label="Обязательное"
              />
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const newFields = [...(block.content.fields || []), { name: '', type: 'text', placeholder: '', required: false }];
              onUpdate({ fields: newFields });
            }}
          >
            Добавить поле
          </Button>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="Текст кнопки отправки"
            fullWidth
            value={block.content.submitButtonText || 'Отправить'}
            onChange={(e) => onUpdate({ submitButtonText: e.target.value })}
          />
          <TextField
            label="Email для уведомлений"
            fullWidth
            value={block.content.notificationEmail || ''}
            onChange={(e) => onUpdate({ notificationEmail: e.target.value })}
          />
        </>
      )}



      {/* Универсальные поля для всех блоков */}
      {showUniversalHtmlFooter && (
        <>
          <Divider sx={{ my: 2 }} />
          <TextField
            label="HTML контент (для всех типов)"
            multiline
            rows={6}
            fullWidth
            value={block.content.html || ''}
            onChange={(e) => onUpdate({ html: e.target.value })}
            helperText="Можно использовать HTML для любого блока"
          />
        </>
      )}
    </Box>
  );
}

function StyleTab({ block, onUpdate }: { block: PageBlock; onUpdate: (updates: any) => void }) {
  const { showToast } = useToast();
  const [bgUploading, setBgUploading] = useState(false);
  const bgRaw = block.styles?.backgroundImage || '';
  const bgPreview =
    bgRaw.trim() &&
    resolveBackgroundImageCssForDisplay(bgRaw, (u) => resolveImageUrl(u, ''));

  const handleBackgroundUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      try {
        setBgUploading(true);
        const { url } = await uploadImage(file);
        onUpdate({ backgroundImage: normalizeBackgroundImageCss(url) });
        showToast('Фон загружен на сайт', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Ошибка загрузки фона', 'error');
      } finally {
        setBgUploading(false);
        target.value = '';
      }
    };
    input.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Стили</Typography>
      
      <TextField
        label="Фоновый цвет"
        type="color"
        fullWidth
        value={block.styles?.backgroundColor || '#ffffff'}
        onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
      />

      <TextField
        label="Цвет текста"
        type="color"
        fullWidth
        value={block.styles?.color || '#000000'}
        onChange={(e) => onUpdate({ color: e.target.value })}
      />

      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          Фоновое изображение
        </Typography>
        {bgPreview && (
          <Box
            sx={{
              mb: 1,
              height: 80,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              backgroundImage: bgPreview,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'grey.100',
            }}
          />
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            label="URL, градиент или CSS"
            fullWidth
            multiline
            minRows={2}
            value={bgRaw}
            onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (!v) return;
              const n = normalizeBackgroundImageCss(v);
              if (n && n !== v) onUpdate({ backgroundImage: n });
            }}
            placeholder="https://… или linear-gradient(…)"
            helperText="Загрузка с компьютера кладёт файл на сервер. С облака вставьте прямую ссылку на картинку (не страницу просмотра — у Яндекс.Диска нужна «прямая» ссылка или сначала загрузите файл сюда)."
          />
          <Button
            variant="outlined"
            disabled={bgUploading}
            onClick={handleBackgroundUpload}
            sx={{ flexShrink: 0, mt: 0.5 }}
          >
            {bgUploading ? 'Загрузка…' : 'Загрузить файл'}
          </Button>
          {bgRaw ? (
            <Button size="small" color="inherit" onClick={() => onUpdate({ backgroundImage: '' })} sx={{ mt: 0.5 }}>
              Сбросить фон
            </Button>
          ) : null}
        </Box>
      </Box>

      <FormControl fullWidth>
        <InputLabel>Размер фона</InputLabel>
        <Select
          value={block.styles?.backgroundSize || 'cover'}
          MenuProps={SELECT_MENU_PROPS}
          onChange={(e) => onUpdate({ backgroundSize: e.target.value })}
        >
          <MenuItem value="cover">На весь блок (Cover)</MenuItem>
          <MenuItem value="contain">Вместить (Contain)</MenuItem>
          <MenuItem value="auto">Авто</MenuItem>
        </Select>
      </FormControl>

      <Box>
        <Typography gutterBottom>Радиус границы</Typography>
        <Slider
          value={block.styles?.borderRadius || 0}
          onChange={(_, value) => onUpdate({ borderRadius: value as number })}
          min={0}
          max={50}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Тень</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="0 2px 4px rgba(0,0,0,0.1)"
          value={block.styles?.boxShadow || ''}
          onChange={(e) => onUpdate({ boxShadow: e.target.value })}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Прозрачность</Typography>
        <Slider
          value={(block.styles?.opacity ?? 1) * 100}
          onChange={(_, value) => onUpdate({ opacity: (value as number) / 100 })}
          min={0}
          max={100}
        />
      </Box>
    </Box>
  );
}

function TypoTab({ block, onUpdate }: { block: PageBlock; onUpdate: (updates: any) => void }) {
  const fonts = [
    'Geologica',
    'Helvetica',
    'Arial',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Playfair Display',
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Типографика</Typography>
      
      <FormControl fullWidth>
        <InputLabel>Шрифт</InputLabel>
        <Select
          value={block.styles?.fontFamily || 'Geologica'}
          MenuProps={SELECT_MENU_PROPS}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
        >
          {fonts.map((font) => (
            <MenuItem key={font} value={font}>
              {font}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <Typography gutterBottom>Размер шрифта: {block.styles?.fontSize || 16}px</Typography>
        <Slider
          value={block.styles?.fontSize || 16}
          onChange={(_, value) => onUpdate({ fontSize: value as number })}
          min={8}
          max={72}
        />
      </Box>

      <FormControl fullWidth>
        <InputLabel>Насыщенность</InputLabel>
        <Select
          value={block.styles?.fontWeight || 'normal'}
          MenuProps={SELECT_MENU_PROPS}
          onChange={(e) => onUpdate({ fontWeight: e.target.value })}
        >
          <MenuItem value="100">Thin (100)</MenuItem>
          <MenuItem value="300">Light (300)</MenuItem>
          <MenuItem value="400">Normal (400)</MenuItem>
          <MenuItem value="500">Medium (500)</MenuItem>
          <MenuItem value="700">Bold (700)</MenuItem>
          <MenuItem value="900">Black (900)</MenuItem>
        </Select>
      </FormControl>

      <Box>
        <Typography gutterBottom>Межстрочный интервал: {block.styles?.lineHeight || 1.5}</Typography>
        <Slider
          value={(block.styles?.lineHeight || 1.5) * 100}
          onChange={(_, value) => onUpdate({ lineHeight: (value as number) / 100 })}
          min={100}
          max={300}
          step={10}
        />
      </Box>

      <FormControl fullWidth>
        <InputLabel>Выравнивание</InputLabel>
        <Select
          value={block.styles?.textAlign || 'left'}
          MenuProps={SELECT_MENU_PROPS}
          onChange={(e) => onUpdate({ textAlign: e.target.value })}
        >
          <MenuItem value="left">Слева</MenuItem>
          <MenuItem value="center">По центру</MenuItem>
          <MenuItem value="right">Справа</MenuItem>
          <MenuItem value="justify">По ширине</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

function SpacingTab({ block, deviceType, onUpdate }: { block: PageBlock; deviceType: DeviceType; onUpdate: (updates: any) => void }) {
  const padding = block.styles?.padding || {};
  const margin = block.styles?.margin || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Отступы (Padding)</Typography>
      
      <Box>
        <Typography gutterBottom>Верх: {padding.top || 0}px</Typography>
        <Slider
          value={padding.top || 0}
          onChange={(_, value) => onUpdate({
            padding: { ...padding, top: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Право: {padding.right || 0}px</Typography>
        <Slider
          value={padding.right || 0}
          onChange={(_, value) => onUpdate({
            padding: { ...padding, right: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Низ: {padding.bottom || 0}px</Typography>
        <Slider
          value={padding.bottom || 0}
          onChange={(_, value) => onUpdate({
            padding: { ...padding, bottom: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Лево: {padding.left || 0}px</Typography>
        <Slider
          value={padding.left || 0}
          onChange={(_, value) => onUpdate({
            padding: { ...padding, left: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Typography variant="subtitle2" sx={{ mt: 2 }}>Внешние отступы (Margin)</Typography>
      
      <Box>
        <Typography gutterBottom>Верх: {margin.top || 0}px</Typography>
        <Slider
          value={margin.top || 0}
          onChange={(_, value) => onUpdate({
            margin: { ...margin, top: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Право: {margin.right || 0}px</Typography>
        <Slider
          value={margin.right || 0}
          onChange={(_, value) => onUpdate({
            margin: { ...margin, right: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Низ: {margin.bottom || 0}px</Typography>
        <Slider
          value={margin.bottom || 0}
          onChange={(_, value) => onUpdate({
            margin: { ...margin, bottom: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Лево: {margin.left || 0}px</Typography>
        <Slider
          value={margin.left || 0}
          onChange={(_, value) => onUpdate({
            margin: { ...margin, left: value as number },
          })}
          min={0}
          max={200}
        />
      </Box>

      <Box>
        <Typography gutterBottom>Ширина</Typography>
        <TextField
          fullWidth
          size="small"
          value={block.styles?.width || '100%'}
          onChange={(e) => onUpdate({ width: e.target.value })}
          placeholder="100% или 1200px"
        />
      </Box>

      <Box>
        <Typography gutterBottom>Высота</Typography>
        <TextField
          fullWidth
          size="small"
          value={block.styles?.height || 'auto'}
          onChange={(e) => onUpdate({ height: e.target.value })}
          placeholder="auto или 400px"
        />
      </Box>
    </Box>
  );
}

function AnimationTab({ block, onUpdate }: { block: PageBlock; onUpdate: (updates: any) => void }) {
  const animation = block.styles?.animation || {};
  const enabled = animation.enabled === true;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Анимация</Typography>

      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => {
              if (e.target.checked) {
                onUpdate({
                  animation: {
                    enabled: true,
                    trigger: 'inview',
                    effect: 'fade',
                    delay: 0,
                    duration: 0.6,
                  },
                });
              } else {
                onUpdate({ animation: undefined });
              }
            }}
          />
        }
        label="Включить анимацию появления"
      />
      {!enabled && (
        <Typography variant="caption" color="text.secondary">
          Пока выключено — на блок не записываются настройки анимации.
        </Typography>
      )}
      
      <FormControl fullWidth disabled={!enabled}>
        <InputLabel>Триггер</InputLabel>
        <Select
          value={animation.trigger || 'inview'}
          MenuProps={SELECT_MENU_PROPS}
          onChange={(e) => onUpdate({
            animation: { ...animation, enabled: true, trigger: e.target.value },
          })}
        >
          <MenuItem value="scroll">При скролле</MenuItem>
          <MenuItem value="inview">При появлении</MenuItem>
          <MenuItem value="hover">При наведении</MenuItem>
          <MenuItem value="click">При клике</MenuItem>
          <MenuItem value="loop">Цикл</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!enabled}>
        <InputLabel>Эффект</InputLabel>
        <Select
          value={animation.effect || 'fade'}
          MenuProps={SELECT_MENU_PROPS}
          onChange={(e) => onUpdate({
            animation: { ...animation, enabled: true, effect: e.target.value },
          })}
        >
          <MenuItem value="fade">Fade</MenuItem>
          <MenuItem value="slide">Slide</MenuItem>
          <MenuItem value="zoom">Zoom</MenuItem>
          <MenuItem value="rotate">Rotate</MenuItem>
          <MenuItem value="scale">Scale</MenuItem>
          <MenuItem value="morph">Morph</MenuItem>
          <MenuItem value="clay-morph">Morphing Clay</MenuItem>
          <MenuItem value="liquid-glass">Liquid Glass</MenuItem>
          <MenuItem value="particles-network">Particles Network</MenuItem>
          <MenuItem value="spiral-reveal">Spiral Reveal</MenuItem>
          <MenuItem value="gradient-warp">Gradient Warp</MenuItem>
          <MenuItem value="ice-shard">Ice Shard</MenuItem>
          <MenuItem value="cosmic-orbit">Cosmic Orbit</MenuItem>
          <MenuItem value="firefly-pulse">Firefly Pulse</MenuItem>
          <MenuItem value="holographic-flip">Holographic Flip</MenuItem>
          <MenuItem value="wind-swept">Wind Swept</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
        <Typography gutterBottom>Задержка: {animation.delay || 0}s</Typography>
        <Slider
          value={(animation.delay || 0) * 10}
          onChange={(_, value) => onUpdate({
            animation: { ...animation, enabled: true, delay: (value as number) / 10 },
          })}
          min={0}
          max={20}
        />
      </Box>

      <Box sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
        <Typography gutterBottom>Длительность: {animation.duration || 0.5}s</Typography>
        <Slider
          value={(animation.duration || 0.5) * 10}
          onChange={(_, value) => onUpdate({
            animation: { ...animation, enabled: true, duration: (value as number) / 10 },
          })}
          min={3}
          max={30}
        />
      </Box>
    </Box>
  );
}

function VisibilityTab({ block, deviceType, onUpdate }: { block: PageBlock; deviceType: DeviceType; onUpdate: (updates: any) => void }) {
  const display = block.styles?.display || {
    desktop: 'block',
    tablet: 'block',
    mobile: 'block',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Видимость</Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={display.desktop !== 'none'}
            onChange={(e) => onUpdate({
              display: {
                ...display,
                desktop: e.target.checked ? 'block' : 'none',
              },
            })}
          />
        }
        label="Desktop"
      />

      <FormControlLabel
        control={
          <Switch
            checked={display.tablet !== 'none'}
            onChange={(e) => onUpdate({
              display: {
                ...display,
                tablet: e.target.checked ? 'block' : 'none',
              },
            })}
          />
        }
        label="Tablet"
      />

      <FormControlLabel
        control={
          <Switch
            checked={display.mobile !== 'none'}
            onChange={(e) => onUpdate({
              display: {
                ...display,
                mobile: e.target.checked ? 'block' : 'none',
              },
            })}
          />
        }
        label="Mobile"
      />
    </Box>
  );
}

function AdvancedTab({ block, onUpdate }: { block: PageBlock; onUpdate: (updates: Partial<PageBlock>) => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2">Дополнительно</Typography>
      
      <TextField
        label="Custom CSS"
        multiline
        rows={6}
        fullWidth
        value={block.customCss || ''}
        onChange={(e) => onUpdate({ customCss: e.target.value })}
        placeholder=".my-class { color: red; }"
      />

      <TextField
        label="Custom JS"
        multiline
        rows={6}
        fullWidth
        value={block.customJs || ''}
        onChange={(e) => onUpdate({ customJs: e.target.value })}
        placeholder="console.log('Hello');"
      />

      <TextField
        label="Z-index"
        type="number"
        fullWidth
        value={block.styles?.zIndex || 0}
        onChange={(e) => onUpdate({
          styles: {
            ...block.styles,
            zIndex: parseInt(e.target.value) || 0,
          },
        })}
      />
    </Box>
  );
}
