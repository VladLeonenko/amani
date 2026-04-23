import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartItem, removeFromCart, clearCart } from '@/services/ecommerceApi';
import { CartItem } from '@/types/cms';
import { Box, Typography, Button, TextField, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import { resolveImageUrl, fallbackImageUrl } from '@/utils/resolveImageUrl';
import { useToast } from '@/components/common/ToastProvider';
import { AmaniHeader } from '@/components/amani/AmaniHeader';
import { AmaniFooter } from '@/components/amani/AmaniFooter';
import { SyntheticEvent } from 'react';

export function AmaniCartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const items = data?.items || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => updateCartItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Количество обновлено', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeFromCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Товар удален из корзины', 'success');
    },
    onError: () => {
      showToast('Ошибка при удалении товара', 'error');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Корзина очищена', 'success');
    },
    onError: () => {
      showToast('Ошибка при очистке корзины', 'error');
    },
  });

  const total = items.reduce((sum, item) => {
    return sum + (item.product?.priceCents || 0) * item.quantity;
  }, 0);

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity >= 1) {
      updateMutation.mutate({ id: item.id, quantity: newQuantity });
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('Корзина пуста', 'error');
      return;
    }
    navigate('/checkout');
  };

  return (
    <>
      <SeoMetaTags
        title="Корзина - AMANI"
        description="Ваша корзина покупок"
      />
      <AmaniHeader />
      <Box
        className="amani-page"
        sx={{
          bgcolor: '#FFFFFF',
          color: '#000000',
          minHeight: '100vh',
          pt: { xs: '40px', md: '80px' },
          pb: { xs: '60px', md: '120px' },
          px: { xs: '20px', md: '135px' },
        }}
      >
        <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
          <Typography
            sx={{
              fontFamily: "'Poiret One', sans-serif",
              fontSize: { xs: '40px', md: '60px' },
              fontWeight: 400,
              lineHeight: 1,
              color: '#000',
              mb: { xs: '30px', md: '50px' },
            }}
          >
            Корзина
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography
                sx={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '20px',
                  color: '#000',
                  mb: 3,
                }}
              >
                Ваша корзина пуста
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/catalog')}
                sx={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  bgcolor: '#000000',
                  color: '#FFFFFF',
                  py: '16px',
                  px: '32px',
                  '&:hover': {
                    bgcolor: '#111111',
                  },
                }}
              >
                Перейти в каталог
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              {/* Список товаров */}
              <Box sx={{ flex: 1 }}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      gap: 3,
                      mb: 4,
                      pb: 4,
                      borderBottom: '1px solid #e9e9e9',
                    }}
                  >
                    <Box
                      component="img"
                      src={resolveImageUrl(item.product?.imageUrl)}
                      alt={item.product?.title || 'Товар'}
                      onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = fallbackImageUrl();
                      }}
                      sx={{
                        width: { xs: '100px', md: '150px' },
                        height: { xs: '100px', md: '150px' },
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/products/${item.productSlug}`)}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: "'Raleway', sans-serif",
                          fontSize: '20px',
                          fontWeight: 600,
                          color: '#000',
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.7 },
                        }}
                        onClick={() => navigate(`/products/${item.productSlug}`)}
                      >
                        {item.product?.title || 'Товар'}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Raleway', sans-serif",
                          fontSize: '20px',
                          fontWeight: 600,
                          color: '#000',
                          mb: 2,
                        }}
                      >
                        {item.product?.priceCents
                          ? `${((item.product.priceCents * item.quantity) / 100).toLocaleString('ru-RU')} руб.`
                          : 'Цена по запросу'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #000', px: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={item.quantity <= 1}
                            sx={{ color: '#000' }}
                          >
                            <Typography sx={{ fontSize: '20px' }}>-</Typography>
                          </IconButton>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              if (qty >= 1) {
                                updateMutation.mutate({ id: item.id, quantity: qty });
                              }
                            }}
                            size="small"
                            sx={{
                              width: 60,
                              '& .MuiOutlinedInput-root': {
                                border: 'none',
                                '& fieldset': { border: 'none' },
                              },
                              '& input': {
                                textAlign: 'center',
                                fontFamily: "'Raleway', sans-serif",
                                fontSize: '16px',
                                color: '#000',
                              },
                            }}
                            inputProps={{ min: 1 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item, 1)}
                            sx={{ color: '#000' }}
                          >
                            <Typography sx={{ fontSize: '20px' }}>+</Typography>
                          </IconButton>
                        </Box>
                        <IconButton
                          onClick={() => removeMutation.mutate(item.id)}
                          sx={{
                            color: '#000',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Итого */}
              <Box
                sx={{
                  width: { xs: '100%', md: '400px' },
                  p: 3,
                  border: '1px solid #e9e9e9',
                  height: 'fit-content',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Poiret One', sans-serif",
                    fontSize: '32px',
                    fontWeight: 400,
                    color: '#000',
                    mb: 3,
                  }}
                >
                  Итого
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: '16px',
                      color: '#000',
                    }}
                  >
                    Товаров: {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#000',
                    }}
                  >
                    {(total / 100).toLocaleString('ru-RU')} руб.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCheckout}
                  sx={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    bgcolor: '#000000',
                    color: '#FFFFFF',
                    py: '16px',
                    mt: 3,
                    '&:hover': {
                      bgcolor: '#111111',
                    },
                  }}
                >
                  Оформить заказ
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => clearMutation.mutate()}
                  sx={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    borderColor: '#000000',
                    color: '#000000',
                    py: '16px',
                    mt: 2,
                    '&:hover': {
                      borderColor: '#000000',
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  Очистить корзину
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <AmaniFooter />
    </>
  );
}
