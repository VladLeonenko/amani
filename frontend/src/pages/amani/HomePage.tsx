import { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import { submitForm } from '@/services/cmsApi';
import { useToast } from '@/components/common/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProducts } from '@/services/cmsApi';
import { getPublicProductCategories } from '@/services/cmsApi';
import { addToCart, addToWishlist } from '@/services/ecommerceApi';
import { resolveImageUrl, fallbackImageUrl } from '@/utils/resolveImageUrl';

// Временные изображения (заменить на реальные из API)
const mainBlockImages = [
  "http://localhost:3845/assets/4ba83da5bb798324807f73ef18baddaf80164d80.png",
  "http://localhost:3845/assets/2a633e79e4ea8fa2ba7ec757d63b9768b5e77744.png",
  "http://localhost:3845/assets/12dd6a8aeb4ac955aad7ea3f7d520891e236a03f.png",
];

const buyIcon = "http://localhost:3845/assets/efbfc20c7efc3dbe4c0ac2496d05393c47071e63.png";
const heartIcon = "http://localhost:3845/assets/51a0414de540fde6f3a12ebecb0c2aea84fd65a0.png";
const arrowIcon = "http://localhost:3845/assets/8fbec667364ed4a700068033521feb466feb2459.svg";
const rectangle3 = "http://localhost:3845/assets/b5e49880b1b1282f6dc16ec39469c075226c8af1.png";
const telegramIcon = "http://localhost:3845/assets/82bd892f67eaf91b55a8c149afc962e80e327e0c.png";
const whatsappIcon = "http://localhost:3845/assets/71cf0b8be90664dad46aa8160b9a13609c050183.png";
const mailIcon = "http://localhost:3845/assets/4db9e827187c9a7a15af85fa6461acacb64cb8e5.png";
const line6 = "http://localhost:3845/assets/26165b6351ed7e055e0cae5770357592859ccab9.svg";
const line7 = "http://localhost:3845/assets/f6119a714ee99faaa5b8ea2a6c8a706b68bc0bdf.svg";
const line8 = "http://localhost:3845/assets/264d8fff23871b1877602efbbed70f6b2ccbbe1c.svg";

// Временные данные товаров (заменить на реальные из API)
const expertProducts = [
  {
    id: 1,
    image: "http://localhost:3845/assets/835ddd0651137bdd6c1c1fb955910c946b2d24f7.png",
    price: 120000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
  {
    id: 2,
    image: "http://localhost:3845/assets/3ed004357188ae82c0c54a0f2cff1021f217b244.png",
    price: 260000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
  {
    id: 3,
    image: "http://localhost:3845/assets/a89610b2b8efc1d2e95ae40dd576f241f7d1e23a.png",
    price: 90000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
];

const photoPostersProducts = [
  {
    id: 4,
    image: "http://localhost:3845/assets/835ddd0651137bdd6c1c1fb955910c946b2d24f7.png",
    price: 120000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
  {
    id: 5,
    image: "http://localhost:3845/assets/3ed004357188ae82c0c54a0f2cff1021f217b244.png",
    price: 260000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
  {
    id: 6,
    image: "http://localhost:3845/assets/a89610b2b8efc1d2e95ae40dd576f241f7d1e23a.png",
    price: 90000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
];

const accessoriesProducts = [
  {
    id: 7,
    image: "http://localhost:3845/assets/835ddd0651137bdd6c1c1fb955910c946b2d24f7.png",
    price: 120000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
  {
    id: 8,
    image: "http://localhost:3845/assets/3ed004357188ae82c0c54a0f2cff1021f217b244.png",
    price: 260000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
  {
    id: 9,
    image: "http://localhost:3845/assets/a89610b2b8efc1d2e95ae40dd576f241f7d1e23a.png",
    price: 90000,
    author: "LOREM INSPUT",
    category: "Категория, Техника, Тема, Размеры",
  },
];

function ProductCard({ product }: { product: { id: string; image: string; price: number; author: string; category: string } }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(product.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Товар добавлен в корзину', 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Ошибка при добавлении в корзину', 'error');
    },
  });
  
  const addToWishlistMutation = useMutation({
    mutationFn: () => addToWishlist(product.id),
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <Box
        component={Link}
        to={`/products/${product.id}`}
        sx={{
          position: 'relative',
          width: '383px',
          height: { xs: '300px', md: '500px' },
          overflow: 'hidden',
          textDecoration: 'none',
          '&:hover': {
            opacity: 0.9,
          },
        }}
      >
        <img
          src={resolveImageUrl(product.image)}
          alt={product.category}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = fallbackImageUrl();
          }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography
            sx={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: 1.5,
              color: '#000',
              letterSpacing: '-0.4px',
            }}
          >
            {product.price.toLocaleString('ru-RU')} руб.
          </Typography>
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <Box
              component="img"
              src={buyIcon}
              alt="Купить"
              onClick={handleAddToCart}
              sx={{
                width: '25px',
                height: '25px',
                cursor: 'pointer',
                '&:hover': { opacity: 0.7 },
              }}
            />
            <Box
              component="img"
              src={heartIcon}
              alt="В избранное"
              onClick={handleAddToWishlist}
              sx={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                '&:hover': { opacity: 0.7 },
              }}
            />
          </Box>
        </Box>
        <Typography
          sx={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: 1.5,
            color: '#000',
            letterSpacing: '-0.4px',
          }}
        >
          Автор: {product.author}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: 1.5,
            color: '#000',
            letterSpacing: '-0.4px',
          }}
        >
          {product.category}
        </Typography>
      </Box>
    </Box>
  );
}

function CategorySection({
  title,
  products,
  seeAllLink,
}: {
  title: string;
  products: Array<{ id: string; image: string; price: number; author: string; category: string }>;
  seeAllLink: string;
}) {
  return (
    <Box
      sx={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: { xs: '0 20px', md: '0 135px' },
        mt: { xs: '50px', md: '100px' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '50px' }}>
        <Typography
          sx={{
            fontFamily: "'Poiret One', sans-serif",
            fontSize: { xs: '40px', md: '60px' },
            fontWeight: 400,
            lineHeight: 1,
            color: '#000',
          }}
        >
          {title}
        </Typography>
        <Box
          component={Link}
          to={seeAllLink}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            textDecoration: 'none',
            color: '#000',
            '&:hover': { opacity: 0.7 },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Poiret One', sans-serif",
              fontSize: '24px',
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: '0.24px',
            }}
          >
            Смотреть все
          </Typography>
          <Box sx={{ width: '150px', height: '3.68px' }}>
            <img src={arrowIcon} alt="" style={{ width: '100%', height: '100%' }} />
          </Box>
        </Box>
      </Box>
      {products.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: '30px',
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Box>
      ) : (
        <Typography
          sx={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: '16px',
            color: '#000',
            textAlign: 'center',
            py: 4,
          }}
        >
          Товары в этой категории пока отсутствуют
        </Typography>
      )}
    </Box>
  );
}

export function AmaniHomePage() {
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '' });
  const { showToast } = useToast();
  
  // Получаем товары из API
  const { data: products = [] } = useQuery({ 
    queryKey: ['products'], 
    queryFn: () => listProducts(true) 
  });
  
  // Получаем категории из API
  const { data: categories = [] } = useQuery({ 
    queryKey: ['product-categories'], 
    queryFn: () => getPublicProductCategories() 
  });
  
  // Фильтруем товары по категориям AMANI
  const expertCategory = categories.find(c => 
    c.slug === 'podborka-ot-ekspertov' || 
    c.name === 'Подборка от экспертов' ||
    c.name.toLowerCase().includes('эксперт') ||
    c.name.toLowerCase().includes('подборка')
  );
  const photoPostersCategory = categories.find(c => 
    c.slug === 'foto-i-postery' || 
    c.name === 'Фото и постеры' ||
    c.name.toLowerCase().includes('фото') || 
    c.name.toLowerCase().includes('постер')
  );
  const accessoriesCategory = categories.find(c => 
    c.slug === 'aksessuary' || 
    c.name === 'Аксессуары' ||
    c.name.toLowerCase().includes('аксессуар')
  );
  
  // Отладочная информация
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔍 Отладка товаров на главной:');
    console.log('Категории:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
    console.log('Expert category:', expertCategory);
    console.log('Photo/Posters category:', photoPostersCategory);
    console.log('Accessories category:', accessoriesCategory);
    console.log('Товары:', products.map(p => ({ 
      slug: p.slug, 
      title: p.title, 
      categoryId: p.categoryId,
      categoryIdType: typeof p.categoryId 
    })));
  }
  
  // Фильтруем товары по категориям
  const expertProducts = products
    .filter(p => {
      if (!expertCategory) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('Expert category not found');
        }
        return false;
      }
      const matches = Number(p.categoryId) === Number(expertCategory.id);
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && matches) {
        console.log(`✅ Товар "${p.title}" попал в экспертную подборку (categoryId: ${p.categoryId}, expertCategory.id: ${expertCategory.id})`);
      }
      return matches;
    })
    .slice(0, 3)
    .map(p => ({
      id: p.slug,
      image: p.imageUrl || '',
      price: p.priceCents || 0,
      author: 'Автор', // TODO: получить из authorId
      category: [p.technique, p.theme, p.dimensions].filter(Boolean).join(', ') || 'Категория',
    }));
  
  const photoPostersProducts = products
    .filter(p => {
      if (!photoPostersCategory) return false;
      const matches = Number(p.categoryId) === Number(photoPostersCategory.id);
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && matches) {
        console.log(`✅ Товар "${p.title}" попал в фото/постеры (categoryId: ${p.categoryId}, photoPostersCategory.id: ${photoPostersCategory.id})`);
      }
      return matches;
    })
    .slice(0, 3)
    .map(p => ({
      id: p.slug,
      image: p.imageUrl || '',
      price: p.priceCents || 0,
      author: 'Автор', // TODO: получить из authorId
      category: [p.technique, p.theme, p.dimensions].filter(Boolean).join(', ') || 'Категория',
    }));
  
  const accessoriesProducts = products
    .filter(p => {
      if (!accessoriesCategory) return false;
      const matches = Number(p.categoryId) === Number(accessoriesCategory.id);
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && matches) {
        console.log(`✅ Товар "${p.title}" попал в аксессуары (categoryId: ${p.categoryId}, accessoriesCategory.id: ${accessoriesCategory.id})`);
      }
      return matches;
    })
    .slice(0, 3)
    .map(p => ({
      id: p.slug,
      image: p.imageUrl || '',
      price: p.priceCents || 0,
      author: 'Автор', // TODO: получить из authorId
      category: [p.technique, p.theme, p.dimensions].filter(Boolean).join(', ') || 'Категория',
    }));
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Результаты фильтрации:');
    console.log('Expert products:', expertProducts.length);
    console.log('Photo/Posters products:', photoPostersProducts.length);
    console.log('Accessories products:', accessoriesProducts.length);
  }

  return (
    <Box className="amani-page" sx={{ bgcolor: '#FFFFFF', color: '#000000', minHeight: '100vh' }}>
      <SeoMetaTags
        title="AMANI - Интернет-магазин предметов искусства"
        description="Уникальные предметы искусства из Африки. Авторские работы, картины, фотографии и аксессуары."
        url={typeof window !== 'undefined' ? window.location.origin + '/' : '/'}
      />
      {/* Главный блок с тремя изображениями */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: { xs: '600px', md: '875px' },
          mt: '25px',
        }}
      >
        {mainBlockImages.map((img, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <img
              src={img}
              alt={`Main block ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Подборка от экспертов */}
      <CategorySection
        title="Подборка от экспертов"
        products={expertProducts}
        seeAllLink="/catalog?category=expert-selection"
      />

      {/* Форма обратного звонка */}
      <Box
        sx={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: { xs: '0 20px', md: '0 135px' },
          mt: { xs: '50px', md: '100px' },
          position: 'relative',
        }}
      >
        <Box
          className="callback-form-section"
          sx={{
            background: 'rgba(25, 23, 24, 0.99) !important',
            borderRadius: '10px',
            padding: { xs: '30px', md: '60px' },
            position: 'relative',
            overflow: 'hidden',
            '& *': {
              color: '#FFFFFF !important',
            },
            '& .MuiTypography-root': {
              color: '#FFFFFF !important',
            },
            '& p': {
              color: '#FFFFFF !important',
            },
            '& span': {
              color: '#FFFFFF !important',
            },
          }}
        >
          {/* Декоративные элементы */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '35px',
              backgroundImage: `url(${rectangle3})`,
              backgroundSize: '300px 450px',
              backgroundPosition: 'top left',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '35px',
              backgroundImage: `url(${rectangle3})`,
              backgroundSize: '546.67px 820px',
              backgroundPosition: 'top left',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
            }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: '30px', md: '167px' },
              alignItems: 'flex-start',
            }}
          >
            {/* Левая часть */}
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "'Poiret One', sans-serif",
                  fontSize: { xs: '28px', md: '35px' },
                  fontWeight: 400,
                  lineHeight: 1,
                  color: '#fff',
                  mb: '20px',
                }}
              >
                Подбор предметов искусства от экспертов AMANI
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 600,
                  fontSize: '20px',
                  lineHeight: 1.5,
                  color: '#fff',
                  letterSpacing: '-0.4px',
                  mb: '50px',
                  maxWidth: '941px',
                }}
              >
                Мы помогаем работам художников найти своих владельцев и верим, что процесс выбора и
                покупки произведений современного искусства может быть простым и удобным.
              </Typography>

              <Box
                component="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await submitForm('callback-form', {
                      name: callbackForm.name,
                      phone: callbackForm.phone,
                    });
                    showToast('Заявка отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                    setCallbackForm({ name: '', phone: '' });
                  } catch (error: any) {
                    showToast(error?.message || 'Ошибка отправки формы', 'error');
                  }
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: '20px' }}>
                  <TextField
                    placeholder="+7 (___) ___-__-__"
                    value={callbackForm.phone}
                    onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                    required
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(25, 23, 24, 0.8) !important',
                        border: 'none !important',
                        borderBottom: '1px solid #fff !important',
                        borderRadius: '0 !important',
                        '& fieldset': { border: 'none !important' },
                        '&:hover fieldset': { border: 'none !important' },
                        '&.Mui-focused fieldset': { border: 'none !important' },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: '#fff !important',
                        fontFamily: "'Poiret One', sans-serif !important",
                        fontSize: '20px !important',
                        '&::placeholder': { 
                          color: '#a1a1a1 !important', 
                          opacity: '1 !important' 
                        },
                      },
                    }}
                  />
                  <TextField
                    placeholder="Ваше имя"
                    value={callbackForm.name}
                    onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                    required
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(25, 23, 24, 0.8) !important',
                        border: 'none !important',
                        borderBottom: '1px solid #fff !important',
                        borderRadius: '0 !important',
                        '& fieldset': { border: 'none !important' },
                        '&:hover fieldset': { border: 'none !important' },
                        '&.Mui-focused fieldset': { border: 'none !important' },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: '#fff !important',
                        fontFamily: "'Poiret One', sans-serif !important",
                        fontSize: '20px !important',
                        '&::placeholder': { 
                          color: '#a1a1a1 !important', 
                          opacity: '1 !important' 
                        },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mt: '10px' }}>
                  <input type="checkbox" id="privacy-consent" required style={{ width: '7px', height: '7px' }} />
                  <Typography
                    component="label"
                    htmlFor="privacy-consent"
                    sx={{
                      fontFamily: "'Raleway', sans-serif",
                      fontWeight: 600,
                      fontSize: '10px',
                      lineHeight: 1.5,
                      color: '#fff',
                      letterSpacing: '-0.2px',
                      cursor: 'pointer',
                    }}
                  >
                    я согласен с{' '}
                    <Box component="span" sx={{ textDecoration: 'underline' }}>
                      политикой обработки персональных данных
                    </Box>{' '}
                    и{' '}
                    <Box component="span" sx={{ textDecoration: 'underline' }}>
                      правилами использования сервиса
                    </Box>
                  </Typography>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    bgcolor: '#000000',
                    color: '#FFFFFF',
                    py: '12px',
                    px: '32px',
                    alignSelf: 'flex-start',
                    mt: '10px',
                    '&:hover': {
                      bgcolor: '#111111',
                    },
                  }}
                >
                  Отправить
                </Button>
              </Box>
            </Box>

            {/* Правая часть - контакты */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '-83.5px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(90deg)',
                  width: '167px',
                  height: '2px',
                  backgroundImage: `url(${line8})`,
                  display: { xs: 'none', md: 'block' },
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Poiret One', sans-serif",
                  fontSize: { xs: '28px', md: '35px' },
                  fontWeight: 400,
                  lineHeight: 1,
                  color: '#fff',
                }}
              >
                Связаться с нами
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '37px' }}>
                <Box sx={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={telegramIcon} alt="Telegram" style={{ width: '25px', height: '25px' }} />
                  <Typography
                    sx={{
                      fontFamily: "'Poiret One', sans-serif",
                      fontSize: '20px',
                      lineHeight: 1.3,
                      color: '#fff',
                    }}
                  >
                    AMANI_TG
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={whatsappIcon} alt="WhatsApp" style={{ width: '25px', height: '25px' }} />
                  <Typography
                    sx={{
                      fontFamily: "'Poiret One', sans-serif",
                      fontSize: '20px',
                      lineHeight: 1.3,
                      color: '#fff',
                    }}
                  >
                    +7 999 99 99 99
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={mailIcon} alt="Email" style={{ width: '25px', height: '25px' }} />
                  <Typography
                    sx={{
                      fontFamily: "'Poiret One', sans-serif",
                      fontSize: '20px',
                      lineHeight: 1.3,
                      color: '#fff',
                    }}
                  >
                    info@amani.ru
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Фото, Постеры */}
      <CategorySection
        title="Фото, Постеры"
        products={photoPostersProducts}
        seeAllLink="/catalog?category=photo-posters"
      />

      {/* Аксессуары */}
      <CategorySection
        title="Аксессуары"
        products={accessoriesProducts}
        seeAllLink="/catalog?category=accessories"
      />

    </Box>
  );
}
