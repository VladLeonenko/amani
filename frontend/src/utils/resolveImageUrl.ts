const DEFAULT_FALLBACK = '/legacy/img/online-shop.png';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getApiBase = () => {
  const explicitBase = (import.meta as any)?.env?.VITE_API_URL;
  if (explicitBase && explicitBase.trim().length > 0) {
    return trimTrailingSlash(explicitBase.trim());
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return '';
};

export const resolveImageUrl = (path?: string | null, fallback: string = DEFAULT_FALLBACK): string => {
  if (!path || typeof path !== 'string' || path.trim().length === 0) {
    // Если fallback тоже пустой, возвращаем дефолтный
    return fallback && fallback.trim().length > 0 ? fallback : DEFAULT_FALLBACK;
  }

  const trimmedPath = path.trim();

  // Если это внешний URL, проверяем доступность
  if (/^https?:\/\//i.test(trimmedPath)) {
    // Если это недоступный localhost:3845, возвращаем fallback
    if (trimmedPath.includes('localhost:3845') || trimmedPath.includes('127.0.0.1:3845')) {
      return fallback && fallback.trim().length > 0 ? fallback : DEFAULT_FALLBACK;
    }
    return trimmedPath;
  }

  const normalisedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;

  // Для путей /uploads/ используем универсальный подход:
  // - В dev: добавляем API base (бэкенд на localhost:3000)
  // - В prod: если задан VITE_API_URL - используем его, иначе window.location.origin
  // Это работает как для моно-домена (frontend + backend), так и для разделенных
  if (normalisedPath.startsWith('/uploads/')) {
    const base = getApiBase();
    // Если base есть, используем его (универсально для dev и prod)
    // Если нет (не должно быть в нормальных условиях), возвращаем относительный путь
    return base ? `${base}${normalisedPath}` : normalisedPath;
  }

  // Для статических файлов в /legacy/ не добавляем API base
  // Они должны быть доступны напрямую через статику
  if (normalisedPath.startsWith('/legacy/')) {
    return normalisedPath;
  }

  // Для остальных путей используем API base только если это не статика
  const base = getApiBase();

  if (!base) {
    return normalisedPath;
  }

  return `${base}${normalisedPath}`;
};

export const fallbackImageUrl = () => DEFAULT_FALLBACK;

