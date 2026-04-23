import { Box, Typography } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

export function DeliveryPaymentPage() {
  return (
    <>
      <SeoMetaTags
        title="Доставка и оплата - AMANI"
        description="Условия доставки и оплаты"
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
            Доставка и оплата
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
            Доставка
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
            Мы осуществляем доставку по всей России. Сроки доставки зависят от выбранного способа и региона. Обычно доставка занимает от 3 до 14 рабочих дней.
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#000000',
              mb: '12px',
              mt: '24px',
            }}
          >
            Способы доставки:
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '16px',
            }}
          >
            • Курьерская доставка по Москве и Санкт-Петербургу
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '16px',
            }}
          >
            • Доставка почтой России
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
            • Доставка транспортными компаниями (СДЭК, Boxberry и др.)
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
            Оплата
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
            Мы принимаем различные способы оплаты для вашего удобства.
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#000000',
              mb: '12px',
              mt: '24px',
            }}
          >
            Способы оплаты:
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '16px',
            }}
          >
            • Банковские карты (Visa, MasterCard, МИР)
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
              mb: '16px',
            }}
          >
            • Электронные кошельки (ЮMoney, Qiwi)
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
            • Наложенный платеж (при получении)
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
            Возврат
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
            Возврат товара возможен в течение 14 дней с момента получения при условии сохранения товарного вида и упаковки.
          </Typography>
        </Box>
      </Box>
    </>
  );
}
