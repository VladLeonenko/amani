import { useParams } from 'react-router-dom';
import { useState, SyntheticEvent } from 'react';
import { Box, Typography, Button, Grid, IconButton } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct } from '@/services/cmsApi';
import { addToCart, addToWishlist, checkInWishlist } from '@/services/ecommerceApi';
import { useToast } from '@/components/common/ToastProvider';
import { resolveImageUrl, fallbackImageUrl } from '@/utils/resolveImageUrl';

// Временные данные (заменить на реальные из API)
const product = {
  id: 1,
  title: 'LOREM INSPUT',
  images: [
    'http://localhost:3845/assets/product1.png',
    'http://localhost:3845/assets/product2.png',
  ],
  price: 120000,
  author: 'LOREM INSPUT',
  category: 'Категория, Техника, Тема, Размеры',
  description: 'Подробное описание товара',
};

const buyIcon = 'http://localhost:3845/assets/efbfc20c7efc3dbe4c0ac2496d05393c47071e63.png';
const heartIcon = 'http://localhost:3845/assets/51a0414de540fde6f3a12ebecb0c2aea84fd65a0.png';

export function AmaniProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // Декодируем slug из URL
  const decodedSlug = slug ? decodeURIComponent(slug) : '';
  
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', decodedSlug],
    queryFn: () => getProduct(decodedSlug),
    enabled: !!decodedSlug,
  });
  
  const { data: wishlistCheck } = useQuery({
    queryKey: ['wishlist-check', decodedSlug],
    queryFn: () => checkInWishlist(decodedSlug),
    enabled: !!decodedSlug,
  });
  
  const [isFavorite, setIsFavorite] = useState(wishlistCheck || false);
  
  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(decodedSlug, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Товар добавлен в корзину', 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Ошибка при добавлении в корзину', 'error');
    },
  });
  
  const addToWishlistMutation = useMutation({
    mutationFn: () => addToWishlist(decodedSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', decodedSlug] });
      setIsFavorite(true);
      showToast('Товар добавлен в избранное', 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Ошибка при добавлении в избранное', 'error');
    },
  });
  
  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };
  
  const handleToggleFavorite = () => {
    if (isFavorite) {
      // TODO: реализовать removeFromWishlist
      setIsFavorite(false);
    } else {
      addToWishlistMutation.mutate();
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }
  
  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Товар не найден</Typography>
      </Box>
    );
  }
  
  const productImages = product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : product.imageUrl 
      ? [product.imageUrl] 
      : [];

  return (
    <>
      <SeoMetaTags
        title={`${product.title} - AMANI`}
        description={product.descriptionHtml?.replace(/<[^>]*>/g, '').substring(0, 160) || ''}
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
        <Grid container spacing={{ xs: 2, md: 4 }}>
          {/* Изображения */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: '100%',
                height: { xs: '300px', md: '600px' },
                mb: '16px',
              }}
            >
              <img
                src={resolveImageUrl(productImages[selectedImage])}
                alt={product.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = fallbackImageUrl();
                }}
              />
            </Box>
            {productImages.length > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                }}
              >
                {productImages.map((image, index) => (
                  <Box
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    sx={{
                      width: '80px',
                      height: '80px',
                      cursor: 'pointer',
                      border: selectedImage === index ? '2px solid #000000' : '1px solid #e9e9e9',
                      opacity: selectedImage === index ? 1 : 0.7,
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                  >
                    <img
                      src={resolveImageUrl(image)}
                      alt={`${product.title} ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = fallbackImageUrl();
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Grid>

          {/* Информация о товаре */}
          <Grid item xs={12} md={6}>
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
              {product.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: '16px',
                fontWeight: 400,
                color: '#787878',
                mb: '24px',
              }}
            >
              {[product.technique, product.theme, product.dimensions].filter(Boolean).join(', ') || 'Категория'}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: { xs: '24px', md: '32px' },
                fontWeight: 600,
                color: '#000000',
                mb: '32px',
              }}
            >
              {(product.priceCents || 0).toLocaleString('ru-RU')} руб.
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: '16px',
                fontWeight: 400,
                color: '#000000',
                lineHeight: 1.6,
                mb: '32px',
              }}
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml || '' }}
            />
            <Box
              sx={{
                display: 'flex',
                gap: '16px',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Button
                variant="contained"
                startIcon={<img src={buyIcon} alt="Купить" style={{ width: '20px', height: '20px' }} />}
                sx={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  bgcolor: '#000000',
                  color: '#FFFFFF',
                  py: '16px',
                  px: '32px',
                  flex: 1,
                  '&:hover': {
                    bgcolor: '#111111',
                  },
                }}
              >
                В корзину
              </Button>
              <IconButton
                onClick={() => setIsFavorite(!isFavorite)}
                sx={{
                  border: '1px solid #000000',
                  borderRadius: 0,
                  width: '56px',
                  height: '56px',
                }}
              >
                {isFavorite ? (
                  <FavoriteIcon sx={{ color: '#000000' }} />
                ) : (
                  <FavoriteBorderIcon sx={{ color: '#000000' }} />
                )}
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
