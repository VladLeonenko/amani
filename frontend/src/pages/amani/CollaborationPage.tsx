import { Box, Typography, Button, TextField } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

export function CollaborationPage() {
  return (
    <>
      <SeoMetaTags
        title="Коллаборации - AMANI"
        description="Сотрудничайте с нами для создания уникальных проектов"
      />

      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          bgcolor: '#FFFFFF',
          pt: { xs: '20px', md: '40px' },
          pb: { xs: '40px', md: '80px' },
          px: { xs: '16px', md: '40px' },
        }}
      >
        {/* Заголовок */}
        <Box sx={{ mb: { xs: '32px', md: '64px' }, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '32px', md: '64px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
            }}
          >
            Коллаборации
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#787878',
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Мы открыты для сотрудничества с брендами, дизайнерами и творческими людьми
          </Typography>
        </Box>

        {/* Форма обратной связи */}
        <Box
          sx={{
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          <TextField
            fullWidth
            label="Ваше имя"
            sx={{
              mb: '24px',
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            sx={{
              mb: '24px',
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          />
          <TextField
            fullWidth
            label="Телефон"
            sx={{
              mb: '24px',
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          />
          <TextField
            fullWidth
            label="Сообщение"
            multiline
            rows={6}
            sx={{
              mb: '32px',
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              bgcolor: '#000000',
              color: '#FFFFFF',
              py: '16px',
              '&:hover': {
                bgcolor: '#111111',
              },
            }}
          >
            Отправить заявку
          </Button>
        </Box>
      </Box>
    </>
  );
}
