import { Box, Typography } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

export function PrivacyPolicyPage() {
  return (
    <>
      <SeoMetaTags
        title="Политика конфиденциальности - AMANI"
        description="Политика конфиденциальности AMANI"
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
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '32px', md: '48px' },
              fontWeight: 400,
              color: '#000000',
              mb: { xs: '24px', md: '32px' },
            }}
          >
            Политика конфиденциальности
          </Typography>

          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '24px',
            }}
          >
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта AMANI.
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
              mt: '32px',
            }}
          >
            1. Общие положения
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '24px',
            }}
          >
            Использование сайта AMANI означает безоговорочное согласие пользователя с настоящей Политикой конфиденциальности и указанными в ней условиями обработки его персональной информации.
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
              mt: '32px',
            }}
          >
            2. Сбор персональных данных
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '24px',
            }}
          >
            Мы собираем следующие персональные данные: имя, email, телефон, адрес доставки. Данные собираются при регистрации, оформлении заказа и заполнении форм обратной связи.
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
              mt: '32px',
            }}
          >
            3. Использование персональных данных
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '24px',
            }}
          >
            Персональные данные используются для обработки заказов, связи с клиентами, отправки уведомлений о статусе заказа, а также для улучшения качества обслуживания.
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
              mt: '32px',
            }}
          >
            4. Защита персональных данных
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '24px',
            }}
          >
            Мы применяем современные методы защиты информации и обеспечиваем безопасность персональных данных пользователей.
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
              mt: '32px',
            }}
          >
            5. Контакты
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '24px',
            }}
          >
            По вопросам, связанным с обработкой персональных данных, вы можете связаться с нами по email: info@amani.com
          </Typography>
        </Box>
      </Box>
    </>
  );
}
