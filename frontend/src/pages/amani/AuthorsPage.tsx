import { useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardMedia, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

// Временные данные (заменить на реальные из API)
const authors = [
  {
    id: 1,
    name: 'LOREM INSPUT',
    image: 'http://localhost:3845/assets/author1.png',
    worksCount: 12,
    description: 'Описание автора',
  },
  // ... добавить больше авторов
];

export function AuthorsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['Все', 'Фото', 'Постеры', 'Аксессуары'];

  return (
    <>
      <SeoMetaTags
        title="Авторы - AMANI"
        description="Познакомьтесь с нашими талантливыми авторами"
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
        <Box sx={{ mb: { xs: '24px', md: '48px' }, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '32px', md: '64px' },
              fontWeight: 400,
              color: '#000000',
              mb: '16px',
            }}
          >
            Авторы
          </Typography>
        </Box>

        {/* Фильтры по категориям */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            mb: { xs: '32px', md: '64px' },
            flexWrap: 'wrap',
          }}
        >
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category === 'Все' ? null : category)}
              sx={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: selectedCategory === category || (category === 'Все' && selectedCategory === null) ? '#000000' : '#787878',
                textTransform: 'none',
                borderBottom: selectedCategory === category || (category === 'Все' && selectedCategory === null) ? '1px solid #000000' : 'none',
                borderRadius: 0,
                px: '8px',
                minWidth: 'auto',
              }}
            >
              {category}
            </Button>
          ))}
        </Box>

        {/* Список авторов */}
        <Grid container spacing={{ xs: 2, md: 4 }}>
          {authors.map((author) => (
            <Grid item xs={12} sm={6} md={4} key={author.id}>
              <Card
                component={Link}
                to={`/authors/${author.id}`}
                sx={{
                  textDecoration: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={author.image}
                  alt={author.name}
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
                    {author.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#787878',
                    }}
                  >
                    {author.worksCount} работ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}
