import { Box, Typography, Button, Grid, Card, CardMedia, CardContent } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

// Временные данные (заменить на реальные из API)
const user = {
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  orders: [
    {
      id: 1,
      image: 'http://localhost:3845/assets/order1.png',
      title: 'LOREM INSPUT',
      price: 120000,
      date: '2024-01-15',
      status: 'Доставлен',
    },
    // ... добавить больше заказов
  ],
  favorites: [
    {
      id: 1,
      image: 'http://localhost:3845/assets/favorite1.png',
      title: 'LOREM INSPUT',
      price: 120000,
    },
    // ... добавить больше избранного
  ],
};

export function AccountPage() {
  return (
    <>
      <SeoMetaTags
        title="Личный кабинет - AMANI"
        description="Управление вашим аккаунтом"
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
        <Box sx={{ mb: { xs: '32px', md: '48px' } }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '32px', md: '48px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
            }}
          >
            Личный кабинет
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#787878',
            }}
          >
            {user.name} ({user.email})
          </Typography>
        </Box>

        {/* Заказы */}
        <Box sx={{ mb: { xs: '48px', md: '64px' } }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '36px' },
              fontWeight: 400,
              color: '#000000',
              mb: { xs: '24px', md: '32px' },
            }}
          >
            Мои заказы
          </Typography>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            {user.orders.map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Card
                  sx={{
                    boxShadow: 'none',
                    border: '1px solid #e9e9e9',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={order.image}
                    alt={order.title}
                    sx={{
                      width: '100%',
                      height: { xs: '200px', md: '300px' },
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#000000',
                        mb: '8px',
                      }}
                    >
                      {order.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#787878',
                        mb: '8px',
                      }}
                    >
                      {order.price.toLocaleString('ru-RU')} ₽
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#787878',
                      }}
                    >
                      {order.date} • {order.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Избранное */}
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '24px', md: '36px' },
              fontWeight: 400,
              color: '#000000',
              mb: { xs: '24px', md: '32px' },
            }}
          >
            Избранное
          </Typography>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            {user.favorites.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    boxShadow: 'none',
                    border: '1px solid #e9e9e9',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={item.image}
                    alt={item.title}
                    sx={{
                      width: '100%',
                      height: { xs: '200px', md: '300px' },
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#000000',
                        mb: '8px',
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#000000',
                      }}
                    >
                      {item.price.toLocaleString('ru-RU')} ₽
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
