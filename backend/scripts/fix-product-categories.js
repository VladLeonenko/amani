import pool from '../db.js';

async function fixProductCategories() {
  try {
    console.log('🔧 Исправление привязки товаров к категориям...\n');

    // Получаем категории
    const categoriesResult = await pool.query('SELECT id, name, slug FROM product_categories WHERE is_active = TRUE');
    const categories = categoriesResult.rows;
    console.log('📂 Найдено категорий:', categories.length);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (id: ${cat.id}, slug: ${cat.slug})`);
    });

    // Получаем товары
    const productsResult = await pool.query('SELECT slug, title, category_id FROM products WHERE is_active = TRUE');
    const products = productsResult.rows;
    console.log(`\n📦 Найдено товаров: ${products.length}\n`);

    // Создаем маппинг категорий
    const categoryMap = {
      'podborka-ot-ekspertov': categories.find(c => c.slug === 'podborka-ot-ekspertov'),
      'foto-i-postery': categories.find(c => c.slug === 'foto-i-postery'),
      'aksessuary': categories.find(c => c.slug === 'aksessuary'),
    };

    let updated = 0;
    for (const product of products) {
      let categoryId = null;
      
      // Определяем категорию по названию товара
      if (product.title.includes('Постер') || product.title.includes('Фотография')) {
        categoryId = categoryMap['foto-i-postery']?.id || null;
      } else if (product.title.includes('Скульптура') || product.title.includes('Маска')) {
        categoryId = categoryMap['aksessuary']?.id || null;
      } else {
        categoryId = categoryMap['podborka-ot-ekspertov']?.id || null;
      }

      // Обновляем категорию, даже если она уже установлена (для гарантии)
      if (categoryId) {
        await pool.query('UPDATE products SET category_id = $1 WHERE slug = $2', [categoryId, product.slug]);
        const categoryName = categories.find(c => c.id === categoryId)?.name || 'Неизвестно';
        if (product.category_id !== categoryId) {
          console.log(`  ✅ ${product.title} → ${categoryName} (было: ${product.category_id || 'нет'})`);
          updated++;
        } else {
          console.log(`  ✓ ${product.title} → ${categoryName} (уже привязан)`);
        }
      } else {
        console.log(`  ⚠️  ${product.title} → категория не найдена`);
      }
    }

    console.log(`\n✅ Обновлено ${updated} товаров\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

fixProductCategories();
