import pool from '../db.js';

// Страницы AMANI из структуры сайта
const amaniPages = [
  {
    slug: '/',
    title: 'Главная страница',
    seo_title: 'AMANI - Интернет-магазин предметов искусства',
    seo_description: 'Уникальные предметы искусства из Африки. Авторские работы, картины, фотографии и аксессуары.',
    is_published: true,
  },
  {
    slug: '/catalog',
    title: 'Каталог товаров',
    seo_title: 'Каталог товаров - AMANI',
    seo_description: 'Каталог уникальных предметов искусства из Африки. Картины, фотографии, постеры, скульптуры и аксессуары.',
    is_published: true,
  },
  {
    slug: '/authors',
    title: 'Авторы',
    seo_title: 'Авторы - AMANI',
    seo_description: 'Знакомство с талантливыми авторами и художниками, чьи работы представлены в нашем магазине.',
    is_published: true,
  },
  {
    slug: '/collaboration',
    title: 'Коллаборация',
    seo_title: 'Коллаборация - AMANI',
    seo_description: 'Сотрудничество с художниками и мастерами африканского искусства.',
    is_published: true,
  },
  {
    slug: '/login',
    title: 'Вход в личный кабинет',
    seo_title: 'Вход - AMANI',
    seo_description: 'Войдите в личный кабинет для управления заказами и избранными товарами.',
    is_published: true,
  },
  {
    slug: '/register',
    title: 'Регистрация',
    seo_title: 'Регистрация - AMANI',
    seo_description: 'Создайте аккаунт для удобных покупок и управления заказами.',
    is_published: true,
  },
  {
    slug: '/account',
    title: 'Личный кабинет',
    seo_title: 'Личный кабинет - AMANI',
    seo_description: 'Управление заказами, избранными товарами и персональными данными.',
    is_published: true,
  },
  {
    slug: '/search',
    title: 'Поиск',
    seo_title: 'Поиск - AMANI',
    seo_description: 'Поиск товаров в каталоге AMANI.',
    is_published: true,
  },
  {
    slug: '/privacy-policy',
    title: 'Политика конфиденциальности',
    seo_title: 'Политика конфиденциальности - AMANI',
    seo_description: 'Политика конфиденциальности и обработки персональных данных.',
    is_published: true,
  },
  {
    slug: '/delivery-payment',
    title: 'Доставка и оплата',
    seo_title: 'Доставка и оплата - AMANI',
    seo_description: 'Информация о способах доставки и оплаты заказов.',
    is_published: true,
  },
  {
    slug: '/checkout',
    title: 'Оформление заказа',
    seo_title: 'Оформление заказа - AMANI',
    seo_description: 'Оформление заказа в интернет-магазине AMANI.',
    is_published: true,
  },
];

async function createAmaniPages() {
  try {
    console.log('📄 Создание страниц AMANI...\n');
    
    for (const page of amaniPages) {
      // Проверяем, существует ли страница
      const existing = await pool.query(
        'SELECT id, slug, title FROM pages WHERE slug = $1',
        [page.slug]
      );
      
      if (existing.rows.length > 0) {
        // Обновляем существующую страницу
        await pool.query(
          `UPDATE pages 
           SET title = $1, seo_title = $2, seo_description = $3, is_published = $4, updated_at = NOW()
           WHERE slug = $5`,
          [page.title, page.seo_title, page.seo_description, page.is_published, page.slug]
        );
        console.log(`  ✅ Обновлена: ${page.title} (${page.slug})`);
      } else {
        // Создаем новую страницу
        await pool.query(
          `INSERT INTO pages (slug, title, seo_title, seo_description, is_published, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [page.slug, page.title, page.seo_title, page.seo_description, page.is_published]
        );
        console.log(`  ✅ Создана: ${page.title} (${page.slug})`);
      }
    }
    
    console.log(`\n✅ Успешно обработано ${amaniPages.length} страниц!\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при создании страниц:', error);
    process.exit(1);
  }
}

createAmaniPages();
