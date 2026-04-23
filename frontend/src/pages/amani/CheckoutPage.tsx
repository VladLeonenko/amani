import { useState } from 'react';
import { Box, Typography, Button, TextField, Stepper, Step, StepLabel, Grid, Card, CardContent } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart } from '@/services/ecommerceApi';
import { createOrder } from '@/services/ecommerceApi';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/common/ToastProvider';

const steps = ['Корзина', 'Доставка', 'Оплата', 'Подтверждение'];

export function CheckoutPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [deliveryData, setDeliveryData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // Получаем корзину из API
  const { data: cartData, isLoading: cartLoading } = useQuery({ 
    queryKey: ['cart'], 
    queryFn: getCart 
  });
  
  const cartItems = cartData?.items || [];
  
  const orderMutation = useMutation({
    mutationFn: () => createOrder({
      customerName: deliveryData.name,
      customerEmail: deliveryData.email,
      customerPhone: deliveryData.phone,
      shippingAddress: {
        address: deliveryData.address,
        city: deliveryData.city,
        postalCode: deliveryData.postalCode,
      },
      paymentMethod,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Заказ успешно оформлен!', 'success');
      setActiveStep(3);
    },
    onError: (error: any) => {
      showToast(error?.message || 'Ошибка оформления заказа', 'error');
    },
  });

  const handleNext = () => {
    if (activeStep === 2) {
      // Создаем заказ на шаге оплаты
      orderMutation.mutate();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const total = cartItems.reduce((sum, item) => {
    return sum + (item.product?.priceCents || 0) * item.quantity;
  }, 0);
  
  if (cartLoading) {
    return <Typography>Загрузка...</Typography>;
  }
  
  if (cartItems.length === 0 && activeStep === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Корзина пуста</Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')}>
          Перейти в каталог
        </Button>
      </Box>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Poiret One, sans-serif',
                fontSize: { xs: '24px', md: '32px' },
                fontWeight: 400,
                color: '#000000',
                mb: { xs: '24px', md: '32px' },
              }}
            >
              Корзина
            </Typography>
            {cartItems.map((item) => (
              <Card key={item.id} sx={{ mb: '16px', boxShadow: 'none', border: '1px solid #e9e9e9' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <img
                        src={item.product?.imageUrl || ''}
                        alt={item.product?.title || ''}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </Grid>
                    <Grid item xs={8}>
                      <Typography
                        sx={{
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#000000',
                          mb: '8px',
                        }}
                      >
                        {item.product?.title || ''}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: '16px',
                          fontWeight: 400,
                          color: '#000000',
                        }}
                      >
                        {(item.product?.priceCents || 0).toLocaleString('ru-RU')} ₽ × {item.quantity}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Box sx={{ mt: '24px', textAlign: 'right' }}>
              <Typography
                sx={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: 600,
                  color: '#000000',
                }}
              >
                Итого: {total.toLocaleString('ru-RU')} ₽
              </Typography>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Poiret One, sans-serif',
                fontSize: { xs: '24px', md: '32px' },
                fontWeight: 400,
                color: '#000000',
                mb: { xs: '24px', md: '32px' },
              }}
            >
              Данные доставки
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя"
                  value={deliveryData.name}
                  onChange={(e) => setDeliveryData({ ...deliveryData, name: e.target.value })}
                  required
                  sx={{ mb: '16px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={deliveryData.email}
                  onChange={(e) => setDeliveryData({ ...deliveryData, email: e.target.value })}
                  required
                  sx={{ mb: '16px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={deliveryData.phone}
                  onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })}
                  required
                  sx={{ mb: '16px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Город"
                  value={deliveryData.city}
                  onChange={(e) => setDeliveryData({ ...deliveryData, city: e.target.value })}
                  required
                  sx={{ mb: '16px' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Адрес"
                  value={deliveryData.address}
                  onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })}
                  required
                  sx={{ mb: '16px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Почтовый индекс"
                  value={deliveryData.postalCode}
                  onChange={(e) => setDeliveryData({ ...deliveryData, postalCode: e.target.value })}
                  required
                  sx={{ mb: '16px' }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Poiret One, sans-serif',
                fontSize: { xs: '24px', md: '32px' },
                fontWeight: 400,
                color: '#000000',
                mb: { xs: '24px', md: '32px' },
              }}
            >
              Способ оплаты
            </Typography>
            <Button
              fullWidth
              variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('card')}
              sx={{
                mb: '16px',
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                bgcolor: paymentMethod === 'card' ? '#000000' : 'transparent',
                color: paymentMethod === 'card' ? '#FFFFFF' : '#000000',
                borderColor: '#000000',
                '&:hover': {
                  bgcolor: paymentMethod === 'card' ? '#111111' : '#f4f5f5',
                },
              }}
            >
              Банковская карта
            </Button>
            <Button
              fullWidth
              variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('cash')}
              sx={{
                mb: '16px',
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                bgcolor: paymentMethod === 'cash' ? '#000000' : 'transparent',
                color: paymentMethod === 'cash' ? '#FFFFFF' : '#000000',
                borderColor: '#000000',
                '&:hover': {
                  bgcolor: paymentMethod === 'cash' ? '#111111' : '#f4f5f5',
                },
              }}
            >
              Наложенный платеж
            </Button>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Poiret One, sans-serif',
                fontSize: { xs: '24px', md: '32px' },
                fontWeight: 400,
                color: '#000000',
                mb: { xs: '24px', md: '32px' },
              }}
            >
              Заказ оформлен!
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#000000',
                mb: '32px',
              }}
            >
              Спасибо за ваш заказ. Мы свяжемся с вами в ближайшее время.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <SeoMetaTags
        title="Оформление заказа - AMANI"
        description="Оформление заказа"
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
              textAlign: 'center',
            }}
          >
            Оформление заказа
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: { xs: '32px', md: '48px' } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '14px',
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '32px' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                color: '#000000',
              }}
            >
              Назад
            </Button>
            {activeStep < steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  bgcolor: '#000000',
                  color: '#FFFFFF',
                  px: '32px',
                  '&:hover': {
                    bgcolor: '#111111',
                  },
                }}
              >
                Далее
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
