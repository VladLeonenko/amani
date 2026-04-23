import { useState } from 'react';
import { Box, Typography, TextField, Button, Link as MuiLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/common/ToastProvider';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Вход выполнен успешно', 'success');
      navigate('/account');
    } catch (error: any) {
      showToast(error?.message || 'Ошибка входа', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoMetaTags
        title="Вход - AMANI"
        description="Войдите в личный кабинет"
      />

      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          bgcolor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: { xs: '40px', md: '80px' },
          pb: { xs: '40px', md: '80px' },
          px: { xs: '16px', md: '40px' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Poiret One, sans-serif',
              fontSize: { xs: '32px', md: '48px' },
              fontWeight: 400,
              color: '#000000',
              mb: '32px',
              textAlign: 'center',
            }}
          >
            Вход
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{
                mb: '24px',
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Raleway, sans-serif',
                },
              }}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{
                mb: '24px',
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Raleway, sans-serif',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                bgcolor: '#000000',
                color: '#FFFFFF',
                py: '16px',
                mb: '24px',
                '&:hover': {
                  bgcolor: '#111111',
                },
              }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <MuiLink
                component={Link}
                to="/register"
                sx={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#787878',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Нет аккаунта? Зарегистрироваться
              </MuiLink>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
