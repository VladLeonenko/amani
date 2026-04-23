import pool from '../db.js';

// Товары из Figma макета (node-id=1:2086)
const productsFromFigma = [
  {
    imageUrl: 'http://localhost:3845/assets/ca3249d0e3e8a8e7d803897d7c29b1a50c58461d.png',
    price: 120000,
    title: 'Африканская маска "Дух предков"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/969a31cf9ca27aee69cc90832b5510851998102f.png',
    price: 260000,
    title: 'Картина "Саванна на закате"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/6ccd499f0272c80761cbee573c46d17423acf853.png',
    price: 90000,
    title: 'Скульптура "Воин масаи"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/ffaee171fb126371f00b4c942bf978d1f7899f5d.png',
    price: 90000,
    title: 'Постер "Африканские ритмы"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/97f4bb2d6a5d9511c48c0ce35399fc867a5efd9c.png',
    price: 120000,
    title: 'Фотография "Жирафы в саванне"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/3868fa2baa8539c4fd25029c4fdba685bd858881.png',
    price: 120000,
    title: 'Картина "Африканская деревня"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/aa63583361ddf490e2702dc294f11190aca96dc3.png',
    price: 90000,
    title: 'Скульптура "Мать и дитя"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/73a1958ddc50a10b9485096dda636d27d088d54b.png',
    price: 260000,
    title: 'Картина "Золотой закат"',
  },
  {
    imageUrl: 'http://localhost:3845/assets/4406d24fde7a22a4f5bd138663ebc151c05e3f5d.png',
    price: 260000,
    title: 'Фотография "Слоны в национальном парке"',
  },
];

// Рандомные характеристики
const techniques = [
  'Масляная живопись',
  'Акрил',
  'Акварель',
  'Графика',
  'Фотография',
  'Скульптура',
  'Резьба по дереву',
  'Батик',
  'Керамика',
  'Смешанная техника',
];

const themes = [
  'Африканская природа',
  'Портрет',
  'Животные',
  'Пейзаж',
  'Абстракция',
  'Традиционная культура',
  'Современное искусство',
  'Ритуальные маски',
  'Племенные мотивы',
  'Саванна',
];

const dimensions = [
  '30x40 см',
  '40x50 см',
  '50x70 см',
  '60x80 см',
  '70x100 см',
  '80x120 см',
  '100x150 см',
  'Высота 25 см',
  'Высота 35 см',
  'Высота 45 см',
];

const categories = [
  'Подборка от экспертов',
  'Фото и постеры',
  'Аксессуары',
];

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function updateProducts() {
  try {
    console.log('🔄 Начинаем обновление товаров из Figma...\n');

    // 1. Удаляем все существующие товары
    console.log('🗑️  Удаляем все существующие товары...');
    const deleteResult = await pool.query('DELETE FROM products RETURNING slug');
    console.log(`✅ Удалено ${deleteResult.rows.length} товаров\n`);

    // 2. Создаем или получаем категории товаров AMANI
    console.log('📂 Создаем/получаем категории товаров AMANI...');
    
    const amaniCategories = [
      { name: 'Подборка от экспертов', slug: 'podborka-ot-ekspertov' },
      { name: 'Фото и постеры', slug: 'foto-i-postery' },
      { name: 'Аксессуары', slug: 'aksessuary' },
    ];
    
    const dbCategories = [];
    for (const cat of amaniCategories) {
      // Проверяем, существует ли категория
      let result = await pool.query('SELECT id, name, slug FROM product_categories WHERE slug = $1', [cat.slug]);
      
      if (result.rows.length === 0) {
        // Создаем категорию
        result = await pool.query(
          'INSERT INTO product_categories (name, slug, is_active, sort_order) VALUES ($1, $2, $3, $4) RETURNING id, name, slug',
          [cat.name, cat.slug, true, dbCategories.length + 1]
        );
        console.log(`  ✅ Создана категория: ${cat.name}`);
      } else {
        // Обновляем, если нужно
        await pool.query(
          'UPDATE product_categories SET name = $1, is_active = $2 WHERE slug = $3',
          [cat.name, true, cat.slug]
        );
      }
      
      dbCategories.push(result.rows[0]);
    }
    
    console.log(`✅ Найдено/создано ${dbCategories.length} категорий AMANI\n`);

    // 3. Получаем авторов из базы (если таблица существует)
    console.log('👤 Получаем авторов...');
    let dbAuthors = [];
    try {
      const authorsResult = await pool.query('SELECT id, name FROM authors WHERE is_active = TRUE');
      dbAuthors = authorsResult.rows;
      console.log(`✅ Найдено ${dbAuthors.length} авторов\n`);
    } catch (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Таблица authors не найдена, товары будут добавлены без авторов\n');
      } else {
        throw error;
      }
    }

    // 4. Добавляем новые товары
    console.log(`📦 Добавляем ${productsFromFigma.length} новых товаров...\n`);

    for (let i = 0; i < productsFromFigma.length; i++) {
      const product = productsFromFigma[i];
      const slug = createSlug(product.title);
      
      // Рандомные характеристики
      const technique = getRandomItem(techniques);
      const theme = getRandomItem(themes);
      const dimension = getRandomItem(dimensions);
      
      // Рандомная категория (если есть в базе)
      const category = dbCategories.length > 0 
        ? getRandomItem(dbCategories) 
        : null;
      
      // Рандомный автор (если есть в базе)
      const author = dbAuthors.length > 0 
        ? getRandomItem(dbAuthors) 
        : null;

      // Определяем категорию по названию товара
      let categoryName = 'Подборка от экспертов';
      if (product.title.includes('Постер') || product.title.includes('Фотография')) {
        categoryName = 'Фото и постеры';
      } else if (product.title.includes('Скульптура') || product.title.includes('Маска')) {
        categoryName = 'Аксессуары';
      }

      // Находим категорию в базе по названию или slug
      let selectedCategory = dbCategories.find(c => 
        c.name === categoryName || 
        c.slug === categoryName.toLowerCase().replace(/\s+/g, '-') ||
        c.slug === categoryName.toLowerCase().replace(/\s+/g, '_')
      );
      
      // Если не нашли, ищем по частичному совпадению
      if (!selectedCategory) {
        selectedCategory = dbCategories.find(c => 
          c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(c.name.toLowerCase())
        );
      }
      
      // Если все еще не нашли, берем случайную
      if (!selectedCategory && dbCategories.length > 0) {
        selectedCategory = getRandomItem(dbCategories);
      }

      const summary = `Уникальное произведение африканского искусства. ${technique}. ${theme}.`;
      const description = `${product.title} - это уникальное произведение искусства, созданное талантливым мастером. Техника: ${technique}. Тема: ${theme}. Размеры: ${dimension}.`;

      await pool.query(
        `INSERT INTO products(
          slug, title, description_html, summary, full_description_html,
          price_cents, currency, price_period, features, is_active, sort_order,
          content_json, category_id, image_url, gallery, stock_quantity, sku, tags,
          meta_title, meta_description, meta_keywords, case_slugs,
          technique, theme, dimensions, author_id
        ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
        [
          slug,
          product.title,
          `<p>${description}</p>`,
          summary,
          `<div><h2>${product.title}</h2><p>${description}</p></div>`,
          product.price * 100, // цена в копейках
          'RUB',
          'one_time',
          [],
          true,
          i + 1,
          null,
          selectedCategory?.id || null,
          product.imageUrl,
          [product.imageUrl],
          null,
          `AMANI-${String(i + 1).padStart(3, '0')}`,
          [theme, technique],
          product.title,
          description,
          `${product.title}, ${technique}, ${theme}, африканское искусство`,
          [],
          technique,
          theme,
          dimension,
          author?.id || null,
        ]
      );

      console.log(`  ✅ ${i + 1}. ${product.title} - ${product.price.toLocaleString('ru-RU')} руб.`);
      console.log(`     Категория: ${selectedCategory?.name || 'Не назначена'}`);
      console.log(`     Автор: ${author?.name || 'Не назначен'}`);
      console.log(`     Техника: ${technique}, Тема: ${theme}, Размеры: ${dimension}\n`);
    }

    console.log(`\n✅ Успешно добавлено ${productsFromFigma.length} товаров!`);
    console.log('🎉 Обновление товаров завершено!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении товаров:', error);
    process.exit(1);
  }
}

updateProducts();
