import { useState, useMemo } from 'react';
import { Box, Typography, TextField, Button, Checkbox, FormControlLabel, Slider, Pagination } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProducts } from '@/services/cmsApi';
import { getPublicProductCategories, getPublicAuthors } from '@/services/cmsApi';
import { addToCart, addToWishlist } from '@/services/ecommerceApi';
import { useToast } from '@/components/common/ToastProvider';
import { resolveImageUrl, fallbackImageUrl } from '@/utils/resolveImageUrl';

const buyIcon = "http://localhost:3845/assets/efbfc20c7efc3dbe4c0ac2496d05393c47071e63.png";
const heartIcon = "http://localhost:3845/assets/51a0414de540fde6f3a12ebecb0c2aea84fd65a0.png";

function ProductCard({ product, authorName }: { product: any; authorName?: string }) {
  const buyIcon = "http://localhost:3845/assets/efbfc20c7efc3dbe4c0ac2496d05393c47071e63.png";
  const heartIcon = "http://localhost:3845/assets/51a0414de540fde6f3a12ebecb0c2aea84fd65a0.png";
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(product.slug, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Товар добавлен в корзину', 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Ошибка при добавлении в корзину', 'error');
    },
  });
  
  const addToWishlistMutation = useMutation({
    mutationFn: () => addToWishlist(product.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      showToast('Товар добавлен в избранное', 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Ошибка при добавлении в избранное', 'error');
    },
  });
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };
  
  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlistMutation.mutate();
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Box
        component={Link}
        to={`/products/${product.slug}`}
        sx={{
          width: '100%',
          height: '350px',
          overflow: 'hidden',
          textDecoration: 'none',
        }}
      >
        <img
          src={resolveImageUrl(product.imageUrl)}
          alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = fallbackImageUrl();
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography
          sx={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: 1.5,
            color: '#000',
          }}
        >
          {(product.priceCents || 0).toLocaleString('ru-RU')} руб.
        </Typography>
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <img 
            src={buyIcon} 
            alt="Купить" 
            onClick={handleAddToCart}
            style={{ width: '26px', height: '26px', cursor: 'pointer' }} 
          />
          <img 
            src={heartIcon} 
            alt="В избранное" 
            onClick={handleAddToWishlist}
            style={{ width: '21px', height: '21px', cursor: 'pointer' }} 
          />
        </Box>
      </Box>
      {authorName && (
        <Typography
          sx={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: 1.5,
            color: '#000',
          }}
        >
          Автор: {authorName}
        </Typography>
      )}
      <Typography
        sx={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 600,
          fontSize: '20px',
          lineHeight: 1.5,
          color: '#000',
        }}
      >
        {[product.technique, product.theme, product.dimensions].filter(Boolean).join(', ') || 'Категория'}
      </Typography>
    </Box>
  );
}

export function AmaniCatalogPage() {
  const [searchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState<number[]>([10000, 6800000]);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Получаем данные из API
  const { data: products = [] } = useQuery({ 
    queryKey: ['products'], 
    queryFn: () => listProducts(true) 
  });
  
  const { data: categories = [] } = useQuery({ 
    queryKey: ['product-categories'], 
    queryFn: () => getPublicProductCategories() 
  });
  
  const { data: authors = [] } = useQuery({ 
    queryKey: ['authors'], 
    queryFn: () => getPublicAuthors() 
  });
  
  // Фильтруем и сортируем товары
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Фильтр по категории из URL
    const categorySlug = searchParams.get('category');
    if (categorySlug) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        filtered = filtered.filter(p => p.categoryId === category.id);
      }
    }
    
    // Фильтр по цене
    filtered = filtered.filter(p => {
      const price = p.priceCents || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Фильтр по тегам
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => 
        p.tags && p.tags.some((tag: string) => selectedTags.includes(tag))
      );
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return (a.priceCents || 0) - (b.priceCents || 0);
      if (sortBy === 'price-desc') return (b.priceCents || 0) - (a.priceCents || 0);
      return (b.sortOrder || 0) - (a.sortOrder || 0);
    });
    
    return filtered;
  }, [products, categories, searchParams, priceRange, selectedTags, sortBy]);
  
  // Получаем имя автора для товара
  const getAuthorName = (product: any) => {
    if (!product.authorId) return undefined;
    const author = authors.find(a => a.id === product.authorId);
    return author?.name;
  };

  return (
    <Box className="amani-page" sx={{ bgcolor: '#FFFFFF', color: '#000000' }}>
      <SeoMetaTags
        title="Каталог - AMANI"
        description="Каталог предметов искусства из Африки"
        url={typeof window !== 'undefined' ? window.location.href : '/catalog'}
      />
      {/* Breadcrumbs */}
      <Box
        sx={{
          maxWidth: '1410px',
          margin: '0 auto',
          padding: { xs: '20px', md: '25px 0' },
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Poiret One', sans-serif",
            fontSize: '20px',
            lineHeight: 1.3,
            color: '#000',
          }}
        >
          Главная → Каталог
        </Typography>
      </Box>

      {/* Галерея изображений */}
      <Box
        sx={{
          display: 'flex',
          overflow: 'hidden',
          height: { xs: '400px', md: '804px' },
          position: 'relative',
        }}
      >
        <Box sx={{ flex: 1, height: '100%' }}>
          <img
            src="http://localhost:3845/assets/616a4f7e5942ad4e72865969beb910d167bbfa70.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '64px',
              left: '105px',
              background: 'linear-gradient(to right, #0085b2 60.912%, rgba(255,255,255,0))',
              height: '64px',
              width: '429px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '35.156px',
                color: '#fff',
                letterSpacing: '1.75px',
              }}
            >
              Постеры
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, height: '100%' }}>
          <img
            src="http://localhost:3845/assets/73a1958ddc50a10b9485096dda636d27d088d54b.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '64px',
              left: '745px',
              background: 'linear-gradient(to right, #6c4838 60.912%, rgba(255,255,255,0))',
              height: '64px',
              width: '429px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '35.156px',
                color: '#fff',
                letterSpacing: '1.75px',
              }}
            >
              Фотографии
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, height: '100%' }}>
          <img
            src="http://localhost:3845/assets/4406d24fde7a22a4f5bd138663ebc151c05e3f5d.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '64px',
              left: '1386px',
              background: 'linear-gradient(to right, #343434 60.912%, rgba(255,255,255,0))',
              height: '64px',
              width: '429px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '35.156px',
                color: '#fff',
                letterSpacing: '1.75px',
              }}
            >
              Аксессуары
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Основной контент */}
      <Box
        sx={{
          maxWidth: '1410px',
          margin: '0 auto',
          padding: { xs: '20px', md: '0 0 50px' },
          display: 'flex',
          gap: '30px',
          mt: '50px',
        }}
      >
        {/* Фильтры */}
        <Box sx={{ width: { xs: '100%', md: '330px' }, flexShrink: 0 }}>
          {/* Сортировка */}
          <Box sx={{ mb: '22.5px', pb: '23.5px', borderBottom: '1px solid #e9e9e9' }}>
            <Typography
              sx={{
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '11.974px',
                mb: '15px',
                color: '#000000',
              }}
            >
              Сортировать
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '7.5px' }}>
              {['По цене (сначала дешевле)', 'По цене (сначала дороже)', 'По цене (цена по запросу)', 'Недавно добавлено', 'По году (сначала новые)', 'По году (сначала старые)'].map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      size="small"
                      sx={{
                        color: '#000000',
                        '&.Mui-checked': {
                          color: '#000000',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontFamily: "'Poiret One', sans-serif",
                        fontSize: '14px',
                        color: '#000000',
                      }}
                    >
                      {option}
                    </Typography>
                  }
                  sx={{
                    color: '#000000',
                    '& .MuiFormControlLabel-label': {
                      color: '#000000',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Цена */}
          <Box sx={{ mb: '22.5px', pb: '16px', borderBottom: '1px solid #e9e9e9' }}>
            <Typography
              sx={{
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '12.179px',
                mb: '15px',
                color: '#000000',
              }}
            >
              Цена
            </Typography>
            <Box sx={{ display: 'flex', gap: '15px', mb: '15px' }}>
              <TextField
                placeholder="От"
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    '& fieldset': {
                      borderColor: '#000000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                    },
                    '& input': {
                      color: '#000000',
                    },
                    '& input::placeholder': {
                      color: '#787878',
                      opacity: 1,
                    },
                  },
                }}
              />
              <TextField
                placeholder="До"
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    '& fieldset': {
                      borderColor: '#000000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                    },
                    '& input': {
                      color: '#000000',
                    },
                    '& input::placeholder': {
                      color: '#787878',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>
            <Slider
              value={priceRange}
              onChange={(_, newValue) => setPriceRange(newValue as number[])}
              min={10000}
              max={6800000}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value.toLocaleString('ru-RU')} ₽`}
            />
          </Box>

          {/* Хэштеги */}
          <Box sx={{ mb: '22.5px', pb: '23.5px', borderBottom: '1px solid #e9e9e9' }}>
            <Typography
              sx={{
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '12.486px',
                mb: '15px',
                color: '#000000',
              }}
            >
              Хэштеги
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '7.5px' }}>
              {['Работа с выставки', 'Вторичный рынок', 'Молодой автор'].map((tag) => (
                <FormControlLabel
                  key={tag}
                  control={
                    <Checkbox
                      size="small"
                      sx={{
                        color: '#000000',
                        '&.Mui-checked': {
                          color: '#000000',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontFamily: "'Poiret One', sans-serif",
                        fontSize: '14px',
                        color: '#000000',
                      }}
                    >
                      {tag}
                    </Typography>
                  }
                  sx={{
                    color: '#000000',
                    '& .MuiFormControlLabel-label': {
                      color: '#000000',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '11.25px', mt: '380px' }}>
            <Button
              variant="outlined"
              sx={{
                height: '52.5px',
                border: '2.813px solid #111',
                borderRadius: '3.75px',
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '13.1px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Применить
            </Button>
            <Button
              variant="outlined"
              sx={{
                height: '52.5px',
                border: '2.813px solid rgba(17,17,17,0.12)',
                borderRadius: '3.75px',
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '13.1px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Сбросить
            </Button>
          </Box>
        </Box>

        {/* Товары */}
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontFamily: "'Poiret One', sans-serif",
              fontSize: { xs: '40px', md: '60px' },
              mb: '50px',
              color: '#000000',
            }}
          >
            Каталог
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: 1.5,
              mb: '45px',
              color: '#000000',
            }}
          >
            Добро пожаловать в наш уникальный каталог африканского искусства...
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: '45px',
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} authorName={getAuthorName(product)} />
            ))}
            {filteredProducts.length === 0 && (
              <Typography sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4, color: '#000000' }}>
                Товары не найдены
              </Typography>
            )}
          </Box>

          {/* Пагинация */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: '61px' }}>
            <Pagination count={33} page={1} color="primary" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
