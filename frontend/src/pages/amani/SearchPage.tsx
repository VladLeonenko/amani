import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, TextField, Grid, Card, CardMedia, CardContent } from '@mui/material';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';

// Временные данные (заменить на реальные из API)
const searchResults = [
  {
    id: 1,
    image: 'http://localhost:3845/assets/result1.png',
    title: 'LOREM INSPUT',
    price: 120000,
    author: 'LOREM INSPUT',
  },
  // ... добавить больше результатов
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <>
      <SeoMetaTags
        title="Поиск - AMANI"
        description="Поиск товаров"
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
        {/* Поисковая строка */}
        <Box sx={{ mb: { xs: '32px', md: '48px' } }}>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder="Поиск..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '16px',
                },
              }}
            />
          </form>
        </Box>

        {/* Результаты поиска */}
        {query && (
          <Box>
            <Typography
              sx={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#787878',
                mb: { xs: '24px', md: '32px' },
              }}
            >
              Найдено результатов: {searchResults.length}
            </Typography>
            <Grid container spacing={{ xs: 2, md: 4 }}>
              {searchResults.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
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
                      image={item.image}
                      alt={item.title}
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
                        {item.title}
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
                        {item.author}
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
        )}
      </Box>
    </>
  );
}
