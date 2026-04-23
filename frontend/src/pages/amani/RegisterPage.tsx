import { useState } from 'react';
import { Box, Typography, TextField, Button, Link as MuiLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { SeoMetaTags } from '@/components/common/SeoMetaTags';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/common/ToastProvider';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showToast('Пароли не совпадают', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Пароль должен быть не менее 6 символов', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const result = await register(email, password, name, undefined, true, true);
      if (result.requiresVerification) {
        showToast('Регистрация успешна! Проверьте email для подтверждения.', 'success');
        navigate('/login');
      } else {
        showToast('Регистрация успешна!', 'success');
        navigate('/account');
      }
    } catch (error: any) {
      showToast(error?.message || 'Ошибка регистрации', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoMetaTags
        title="Регистрация - AMANI"
        description="Создайте аккаунт"
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
            Регистрация
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <TextField
              fullWidth
              label="Подтвердите пароль"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <MuiLink
                component={Link}
                to="/login"
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
                Уже есть аккаунт? Войти
              </MuiLink>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
