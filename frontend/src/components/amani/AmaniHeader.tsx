import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, IconButton, Drawer, List, ListItem, ListItemText, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { getCart } from '@/services/ecommerceApi';

const logoImage = "http://localhost:3845/assets/56ff73181e2bda0836aeecf7c80780f1dfe945e9.png";

export function AmaniHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Получаем корзину для отображения количества товаров
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    refetchInterval: 30000,
  });
  
  const cartCount = cartData?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  const menuItems = [
    { label: 'Аксессуары', path: '/catalog?category=accessories' },
    { label: 'Фото', path: '/catalog?category=photo' },
    { label: 'Постеры', path: '/catalog?category=posters' },
    { label: 'Индивидуальный заказ', path: '/custom-order' },
    { label: 'Контакты', path: '/contacts' },
    { label: 'О нас', path: '/about' },
  ];

  return (
    <Box
      component="header"
      sx={{
        height: '77px',
        width: '100%',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: { xs: '0 16px', md: '0 21px' },
          position: 'relative',
        }}
      >
        {/* Логотип */}
        <Box
          component={Link}
          to="/"
          sx={{
            height: '57.507px',
            width: '191.692px',
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          <img
            src={logoImage}
            alt="AMANI"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* Меню - только для desktop */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: '20px',
            alignItems: 'center',
            fontFamily: "'Poiret One', sans-serif",
            fontSize: '24px',
            fontWeight: 400,
            letterSpacing: '0.24px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {menuItems.map((item) => (
            <Box
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                color: '#000',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.7,
                },
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>

        {/* Иконки справа */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '19.169px',
          }}
        >
          <IconButton
            onClick={() => navigate('/search')}
            sx={{
              width: '19.169px',
              height: '19.169px',
              padding: 0,
            }}
          >
            <SearchIcon sx={{ fontSize: '19.169px', color: '#000' }} />
          </IconButton>
          <IconButton
            onClick={() => navigate('/cart')}
            sx={{
              width: '19.169px',
              height: '19.169px',
              padding: 0,
            }}
          >
            <Badge badgeContent={cartCount} color="error" max={99}>
              <ShoppingCartIcon sx={{ fontSize: '19.169px', color: '#000' }} />
            </Badge>
          </IconButton>
          <IconButton
            onClick={() => navigate('/wishlist')}
            sx={{
              width: '19.169px',
              height: '19.169px',
              padding: 0,
            }}
          >
            <FavoriteBorderIcon sx={{ fontSize: '19.169px', color: '#000' }} />
          </IconButton>
          <IconButton
            onClick={() => navigate('/account')}
            sx={{
              width: '19.169px',
              height: '19.169px',
              padding: 0,
            }}
          >
            <PersonOutlineIcon sx={{ fontSize: '19.169px', color: '#000' }} />
          </IconButton>
          <IconButton
            onClick={() => setIsMenuOpen(true)}
            sx={{
              width: '19.169px',
              height: '19.169px',
              padding: 0,
              display: { xs: 'block', md: 'none' },
            }}
          >
            <MenuIcon sx={{ fontSize: '19.169px', color: '#000' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Мобильное меню */}
      <Drawer
        anchor="right"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '80%', sm: '400px' },
            padding: '20px',
            backgroundColor: '#FFFFFF !important',
            color: '#000000 !important',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box
            component={Link}
            to="/"
            onClick={() => setIsMenuOpen(false)}
            sx={{
              height: '57.507px',
              width: '191.692px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img
              src={logoImage}
              alt="AMANI"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
          <IconButton 
            onClick={() => setIsMenuOpen(false)}
            sx={{
              color: '#000000 !important',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon sx={{ color: '#000000 !important' }} />
          </IconButton>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              sx={{
                textDecoration: 'none',
                color: '#000',
                fontFamily: "'Poiret One', sans-serif",
                fontSize: '24px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
