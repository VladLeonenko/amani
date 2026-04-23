import { Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

const logoImage = "http://localhost:3845/assets/56ff73181e2bda0836aeecf7c80780f1dfe945e9.png";
const polygonImage = "http://localhost:3845/assets/fcf3eb6bab91e45e42c9b6596e6bf4d34435c20b.png";
const telegramIcon = "http://localhost:3845/assets/ba53bbd1529e25e57c89abbc72578797b7636ed0.png";
const whatsappIcon = "http://localhost:3845/assets/821ef8d80b0d7f3d90ec982fd5eac99e931a5bdd.png";
const mailIcon = "http://localhost:3845/assets/707fa9c7a8a7f958bcce824b47ea5a7fa8b126de.png";

export function AmaniFooter() {
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '1060px',
        mt: '64px',
      }}
    >
      {/* Декоративный элемент сверху */}
      <Box
        sx={{
          width: '100%',
          height: '289px',
          position: 'relative',
          transform: 'rotate(180deg)',
          mb: '-289px',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '6.7%',
            right: '6.7%',
            bottom: '25%',
          }}
        >
          <img
            src={polygonImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      </Box>

      {/* Основной контент футера */}
      <Box
        sx={{
          maxWidth: '1920px',
          margin: '0 auto',
          padding: '91px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '64px',
          alignItems: 'center',
        }}
      >
        {/* Колонки с ссылками */}
        <Box
          sx={{
            display: 'flex',
            gap: '100px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '1410px',
            width: '100%',
            padding: { xs: '0 20px', md: '0' },
          }}
        >
          {/* Колонка 1 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '34px',
            }}
          >
            <FooterLink to="/">Главная</FooterLink>
            <FooterLink to="/catalog">Каталог</FooterLink>
            <FooterLink to="/authors">Авторы</FooterLink>
            <FooterLink to="/collaborations">Коллаборации</FooterLink>
            <FooterLink to="/info">Полезная информация</FooterLink>
          </Box>

          {/* Колонка 2 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '34px',
            }}
          >
            <FooterLink to="/catalog?category=expert-selection">Подборка от экспертов</FooterLink>
            <FooterLink to="/catalog?category=paintings">Картины</FooterLink>
            <FooterLink to="/catalog?category=gifts">Подарки</FooterLink>
            <FooterLink to="/catalog?category=painting">Живопись</FooterLink>
            <FooterLink to="/catalog?category=interior">Предметы интерьера</FooterLink>
          </Box>

          {/* Колонка 3 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '33px',
            }}
          >
            <FooterLink to="/delivery">Доставка</FooterLink>
            <FooterLink to="/about">О нас</FooterLink>
            <FooterLink to="/contacts">Контакты</FooterLink>
          </Box>

          {/* Социальные сети */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '37px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '37px' }}>
              <Box sx={{ display: 'flex', gap: '45.66px', alignItems: 'center' }}>
                <img
                  src={telegramIcon}
                  alt="Telegram"
                  style={{ width: '27.445px', height: '27.445px' }}
                />
                <Typography
                  sx={{
                    fontFamily: "'Poiret One', sans-serif",
                    fontSize: '20px',
                    lineHeight: 1.3,
                    color: '#000',
                  }}
                >
                  AMANI_TG
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: '45.66px', alignItems: 'center' }}>
                <img
                  src={whatsappIcon}
                  alt="WhatsApp"
                  style={{ width: '27.445px', height: '27.445px' }}
                />
                <Typography
                  sx={{
                    fontFamily: "'Poiret One', sans-serif",
                    fontSize: '20px',
                    lineHeight: 1.3,
                    color: '#000',
                  }}
                >
                  +7 999 99 99 99
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: '45.66px', alignItems: 'center' }}>
                <img
                  src={mailIcon}
                  alt="Email"
                  style={{ width: '27.445px', height: '27.445px' }}
                />
                <Typography
                  sx={{
                    fontFamily: "'Poiret One', sans-serif",
                    fontSize: '20px',
                    lineHeight: 1.3,
                    color: '#000',
                  }}
                >
                  info@amani.ru
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Логотип внизу */}
        <Box
          sx={{
            height: '248.444px',
            width: '828.148px',
            maxWidth: '100%',
            padding: { xs: '0 20px', md: '0' },
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
      </Box>
    </Box>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        fontFamily: "'Poiret One', sans-serif",
        fontSize: '20px',
        lineHeight: 1.3,
        color: '#000',
        textDecoration: 'none',
        '&:hover': {
          opacity: 0.7,
        },
      }}
    >
      {children}
    </Box>
  );
}
