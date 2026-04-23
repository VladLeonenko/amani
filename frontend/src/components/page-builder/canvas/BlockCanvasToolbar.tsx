import { Box, IconButton, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

export interface BlockCanvasToolbarProps {
  /** Если не переданы — только редактирование и удаление (вложенные блоки в секции). */
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  onEdit: () => void;
  onDelete: () => void;
}

export function BlockCanvasToolbar({ dragAttributes, dragListeners, onEdit, onDelete }: BlockCanvasToolbarProps) {
  const showDrag = Boolean(dragAttributes && dragListeners);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 4,
        right: 4,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        bgcolor: 'rgba(255,255,255,0.95)',
        borderRadius: 1,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="Удалить (можно отменить через «Назад» вверху)">
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Удалить блок"
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Настройки и содержимое">
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Настройки блока"
        >
          <TuneIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {showDrag && (
        <Tooltip title="Перетащить (изменить порядок)">
          <Box
            {...dragAttributes}
            {...dragListeners}
            sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              color: 'primary.main',
              borderLeft: '1px solid',
              borderColor: 'divider',
              '&:active': { cursor: 'grabbing' },
            }}
            aria-label="Перетащить блок"
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
