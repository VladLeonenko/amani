import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardMedia, CardContent, Button } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

// Временные данные (заменить на реальные из API)
const author = {
  id: 1,
  name: 'LOREM INSPUT',
  image: 'http://localhost:3845/assets/author1.png',
  description: 'Подробное описание автора и его творчества',
  works: [
    {
      id: 1,
      image: 'http://localhost:3845/assets/work1.png',
      title: 'Название работы',
      price: 120000,
    },
    // ... добавить больше работ
  ],
};

export function AuthorPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <SeoMetaTags
        title={`${author.name} - AMANI`}
        description={author.description}
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
        {/* Информация об авторе */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: '24px', md: '48px' },
            mb: { xs: '32px', md: '64px' },
          }}
        >
          <Box
            sx={{
              width: { xs: '100%', md: '400px' },
              height: { xs: '300px', md: '500px' },
            }}
          >
            <img
              src={author.image}
              alt={author.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'Poiret One, sans-serif',
                fontSize: { xs: '32px', md: '48px' },
                fontWeight: 400,
                color: '#000000',
                mb: '24px',
              }}
            >
              {author.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#000000',
                lineHeight: 1.6,
              }}
            >
              {author.description}
            </Typography>
          </Box>
        </Box>

        {/* Работы автора */}
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
            Работы автора
          </Typography>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            {author.works.map((work) => (
              <Grid item xs={12} sm={6} md={4} key={work.id}>
                <Card
                  sx={{
                    boxShadow: 'none',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={work.image}
                    alt={work.title}
                    sx={{
                      width: '100%',
                      height: { xs: '200px', md: '300px' },
                      objectFit: 'cover',
                      mb: '16px',
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#000000',
                        mb: '8px',
                      }}
                    >
                      {work.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#000000',
                      }}
                    >
                      {work.price.toLocaleString('ru-RU')} ₽
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
