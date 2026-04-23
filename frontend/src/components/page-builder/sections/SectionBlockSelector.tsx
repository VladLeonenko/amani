import { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BlockType } from '@/types/pageBuilder';

interface SectionBlockSelectorProps {
  onSelect?: (type: BlockType) => void;
  /** Предпочтительно: шаблон блока (как из библиотеки) */
  onSelectBlock?: (block: Partial<import('@/types/pageBuilder').PageBlock>) => void;
  label?: string;
}

const blockTypeLabels: Partial<Record<BlockType, string>> = {
  cover: 'Hero',
  text: 'Текст',
  content: 'Контент',
  features: 'Преимущества',
  gallery: 'Галерея',
  forms: 'Форма',
  social: 'Социальные сети',
  cta: 'CTA',
  shop: 'Магазин',
  image: 'Изображение',
  'image-gif': 'GIF из изображений',
  'image-compare': 'Сравнение изображений',
  'image-wave': 'Волна на фото',
  video: 'Видео',
  spacer: 'Отступ',
};

export function SectionBlockSelector({ onSelect, onSelectBlock, label = 'Добавить блок' }: SectionBlockSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (type: BlockType) => {
    if (onSelectBlock) {
      onSelectBlock({
        type,
        name: blockTypeLabels[type] || type,
        category: 'content',
        content: type === 'text' ? { text: 'Введите текст...' } : type === 'content' ? { text: 'Контент...' } : {},
        styles: {},
        position: { x: 0, y: 0, width: 400, height: 100 },
        order: 0,
      });
    } else if (onSelect) {
      onSelect(type);
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleClick}
        size="small"
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 200, maxHeight: 400 },
        }}
      >
        {Object.entries(blockTypeLabels).map(([value, label]) => (
          <MenuItem key={value} onClick={() => handleSelect(value as BlockType)}>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
