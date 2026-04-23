import { AppLayout } from '@/components/layout/AppLayout';
import { AppRoutes } from '@/routes/AppRoutes';
import { ToastProvider } from '@/components/common/ToastProvider';
import { ThemeModeProvider } from '@/theme/ThemeModeProvider';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { AIChatWidget } from '@/components/ai/AIChatWidget';
import { CookieConsentProvider } from '@/components/privacy/CookieConsentProvider';
import { HeaderFooterInjector } from '@/components/public/HeaderFooterInjector';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { AmaniHeader } from '@/components/amani/AmaniHeader';
import { AmaniFooter } from '@/components/amani/AmaniFooter';
import { HiddenPromoCodeInjector } from '@/components/public/HiddenPromoCodeInjector';
import { GlobalFormValidator } from '@/components/common/GlobalFormValidator';
import { FaviconNotificationTracker } from '@/components/common/FaviconNotificationTracker';
// import { GlobalPreloader } from '@/components/common/GlobalPreloader'; // Закомментировано - preloader не работает
import { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useCacheVersionWatcher } from '@/hooks/useCacheVersionWatcher';
import { useCursor } from '@/hooks/useCursor';

export default function App() {
  const location = useLocation();
  const { token, user } = useAuth();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isAdminRoute = normalizedPath.startsWith('/admin');
  const isLoginPage = /^\/admin\/login$/i.test(normalizedPath);
  const shouldUseAdminLayout = isAdminRoute && !isLoginPage && !!token && user?.role === 'admin';
  useCacheVersionWatcher();
  
  // Добавляем класс для различения админских и публичных страниц
  useEffect(() => {
    if (shouldUseAdminLayout) {
      document.body.classList.add('admin-page');
      document.body.classList.remove('public-page');
    } else {
      document.body.classList.add('public-page');
      document.body.classList.remove('admin-page');
    }
  }, [shouldUseAdminLayout]);
  // Кастомный курсор отключен для AMANI - используем стандартный курсор браузера
  // useCursor(normalizedPath);
  
  // If user tries to access admin routes without auth, redirect to login
  // Except for the login page itself
  // ВАЖНО: Проверяем только admin роуты, публичные доступны всем
  if (isAdminRoute && !isLoginPage && !token) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Если пользователь авторизован и заходит на корень, редиректим в админку
  if (location.pathname === '/' && token && !isAdminRoute) {
    // НЕ редиректим - пусть публичная страница доступна
    // return <Navigate to="/admin" replace />;
  }
  
  return (
    <ThemeModeProvider>
      <ToastProvider>
        {/* Глобальное отслеживание уведомлений и обновление фавиконки */}
        <FaviconNotificationTracker />
        {/* Глобальная валидация форм с toast-уведомлениями для всех страниц */}
        <GlobalFormValidator />
        {/* <GlobalPreloader /> */} {/* Закомментировано - preloader не работает */}
        {shouldUseAdminLayout ? (
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        ) : isAdminRoute ? (
          <AppRoutes />
        ) : (
          <>
            <style>{`
              /* Убираем padding для MUI контейнеров на странице портфолио */
              .css-1qqvtnl {
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }
              
              .css-1gwheji {
                padding-top: 0 !important;
              }
              
              /* Устанавливаем белый фон для всего продакшена AMANI */
              body {
                background-color: #fff !important;
              }
              
              #root {
                background-color: #fff !important;
              }
              
              /* Переопределяем темную тему для страниц AMANI - все должно быть черным на белом */
              .dark-theme .MuiTypography-root,
              .dark-theme .MuiFormControlLabel-label,
              .dark-theme .MuiFormControlLabel-root {
                color: #000000 !important;
              }
              
              .dark-theme .MuiTextField-root .MuiOutlinedInput-root,
              .dark-theme .MuiTextField-root .MuiOutlinedInput-input {
                color: #000000 !important;
                background-color: #FFFFFF !important;
              }
              
              .dark-theme .MuiTextField-root .MuiOutlinedInput-root fieldset {
                border-color: #000000 !important;
              }
              
              .dark-theme .MuiTextField-root .MuiOutlinedInput-root:hover fieldset {
                border-color: #000000 !important;
              }
              
              .dark-theme .MuiTextField-root .MuiOutlinedInput-root.Mui-focused fieldset {
                border-color: #000000 !important;
              }
              
              .dark-theme .MuiTextField-root .MuiOutlinedInput-input::placeholder {
                color: #787878 !important;
                opacity: 1 !important;
              }
              
              .dark-theme .MuiCheckbox-root {
                color: #000000 !important;
              }
              
              .dark-theme .MuiCheckbox-root.Mui-checked {
                color: #000000 !important;
              }
              
              .dark-theme .MuiBox-root {
                color: #000000 !important;
              }
              
              /* Специфичные стили для страниц AMANI */
              .amani-page,
              .amani-page *,
              .amani-page .MuiTypography-root,
              .amani-page .MuiFormControlLabel-label,
              .amani-page .MuiFormControlLabel-root,
              .amani-page .MuiTextField-root .MuiOutlinedInput-root,
              .amani-page .MuiTextField-root .MuiOutlinedInput-input {
                color: #000000 !important;
              }
              
              .amani-page .MuiTextField-root .MuiOutlinedInput-root {
                background-color: #FFFFFF !important;
              }
              
              .amani-page .MuiTextField-root .MuiOutlinedInput-input::placeholder {
                color: #787878 !important;
                opacity: 1 !important;
              }
              
              .amani-page .MuiCheckbox-root {
                color: #000000 !important;
              }
              
              .amani-page .MuiCheckbox-root.Mui-checked {
                color: #000000 !important;
              }
              
              /* Глобальные стили для всех публичных страниц AMANI - переопределяем темную тему */
              body:not(.admin-page) .MuiTypography-root,
              body:not(.admin-page) .MuiFormControlLabel-label,
              body:not(.admin-page) .MuiFormControlLabel-root {
                color: #000000 !important;
              }
              
              body:not(.admin-page) .MuiTextField-root .MuiOutlinedInput-root,
              body:not(.admin-page) .MuiTextField-root .MuiOutlinedInput-input {
                color: #000000 !important;
                background-color: #FFFFFF !important;
              }
              
              body:not(.admin-page) .MuiTextField-root .MuiOutlinedInput-root fieldset {
                border-color: #000000 !important;
              }
              
              body:not(.admin-page) .MuiTextField-root .MuiOutlinedInput-root:hover fieldset {
                border-color: #000000 !important;
              }
              
              body:not(.admin-page) .MuiTextField-root .MuiOutlinedInput-root.Mui-focused fieldset {
                border-color: #000000 !important;
              }
              
              body:not(.admin-page) .MuiTextField-root .MuiOutlinedInput-input::placeholder {
                color: #787878 !important;
                opacity: 1 !important;
              }
              
              body:not(.admin-page) .MuiCheckbox-root {
                color: #000000 !important;
              }
              
              body:not(.admin-page) .MuiCheckbox-root.Mui-checked {
                color: #000000 !important;
              }
              
              body:not(.admin-page) .MuiBox-root {
                color: #000000 !important;
              }
              
              /* Глобальные шрифты для AMANI - упрощенная версия */
              /* Только h1 и h2 используют Poiret One */
              body:not(.admin-page) h1,
              body:not(.admin-page) h2,
              body:not(.admin-page) .MuiTypography-h1,
              body:not(.admin-page) .MuiTypography-h2 {
                font-family: "'Poiret One', cursive, Raleway, sans-serif !important;
              }
              
              /* Все остальное использует Raleway */
              body:not(.admin-page) {
                font-family: 'Raleway, sans-serif !important;
              }
              
              /* Переопределяем для Typography, чтобы не конфликтовало */
              body:not(.admin-page) .MuiTypography-root {
                font-family: 'Raleway, sans-serif !important;
              }
              
              /* Но h1 и h2 должны быть Poiret One (более высокий приоритет) */
              body:not(.admin-page) .MuiTypography-h1,
              body:not(.admin-page) .MuiTypography-h2 {
                font-family: "'Poiret One', cursive, Raleway, sans-serif !important;
              }
              
              /* Блок обратного звонка - белый текст, темные инпуты */
              body:not(.admin-page) .amani-page [style*="rgba(25, 23, 24"] .MuiTypography-root,
              body:not(.admin-page) .amani-page [style*="rgba(25, 23, 24"] p,
              body:not(.admin-page) .amani-page [style*="rgba(25, 23, 24"] span {
                color: #FFFFFF !important;
              }
            `}</style>
            {/* React Header компонент для всех публичных React страниц */}
            {/* Используем новый дизайн AMANI для всех публичных страниц */}
            <AmaniHeader />
            {/* Скрытые промокоды на сайте */}
            <HiddenPromoCodeInjector />
            {/* Глобальная валидация форм с toast-уведомлениями */}
            <GlobalFormValidator />
            <AppRoutes />
            {/* React Footer компонент для всех публичных React страниц */}
            <AmaniFooter />
            {/* HeaderFooterInjector для legacy HTML страниц (PublicPageView) */}
            <HeaderFooterInjector />
            {/* ChatWidget на всех публичных страницах */}
            <ChatWidget />
            {/* AI Chat Widget на всех публичных страницах */}
            <AIChatWidget />
            {/* Cookie Consent Modal */}
            <CookieConsentProvider />
          </>
        )}
      </ToastProvider>
    </ThemeModeProvider>
  );
}


