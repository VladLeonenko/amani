import { Box, Button, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ComputerIcon from '@mui/icons-material/Computer';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIcon from '@mui/icons-material/Phone';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DeviceType } from '@/types/pageBuilder';

interface ToolbarProps {
  deviceType: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  isPreview: boolean;
  onPreviewToggle: () => void;
  onSave: () => void;
  onPublish: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pageId?: string;
  pageSlug?: string;
}

export function Toolbar({
  deviceType,
  onDeviceChange,
  isPreview,
  onPreviewToggle,
  onSave,
  onPublish,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  pageId,
  pageSlug,
}: ToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderBottom: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}
    >
      {/* Preview & Publish */}
      <Tooltip title="Предпросмотр">
        <IconButton 
          size="small" 
          onClick={onPreviewToggle}
          sx={{ 
            color: isPreview ? '#90caf9' : '#fff',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>

      <Button
        variant="contained"
        size="small"
        startIcon={<PublishIcon />}
        onClick={onPublish}
        sx={{ ml: 1 }}
      >
        Опубликовать
      </Button>

      {pageId && (
        <Tooltip title="Предпросмотр">
          <IconButton
            size="small"
            onClick={() => {
              if (pageSlug) {
                window.open(`/page/${pageSlug}`, '_blank');
              } else {
                window.open(`/admin/page-builder/${pageId}/preview`, '_blank');
              }
            }}
            sx={{ 
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Undo/Redo */}
      <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
        <Tooltip title="Отменить">
          <IconButton 
            size="small" 
            onClick={onUndo} 
            disabled={!canUndo}
            sx={{ 
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <UndoIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Повторить">
          <IconButton 
            size="small" 
            onClick={onRedo} 
            disabled={!canRedo}
            sx={{ 
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <RedoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Save */}
      <Tooltip title="Сохранить">
        <IconButton size="small" onClick={onSave}>
          <SaveIcon />
        </IconButton>
      </Tooltip>

      {/* Device Selector */}
      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
        <ToggleButtonGroup
          value={deviceType}
          exclusive
          onChange={(_, value) => value && onDeviceChange(value)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
          }}
        >
          <ToggleButton value="desktop">
            <Tooltip title="Desktop (1920px)">
              <ComputerIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="tablet">
            <Tooltip title="Tablet (768px)">
              <TabletIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="mobile">
            <Tooltip title="Mobile (375px)">
              <PhoneIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

    </Box>
  );
}
