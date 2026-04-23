import pool from '../db.js';

async function checkProducts() {
  try {
    console.log('🔍 Проверка товаров и категорий...\n');
    
    // Проверяем товары
    const productsResult = await pool.query(`
      SELECT id, slug, title, category_id, technique, theme, dimensions 
      FROM products 
      ORDER BY id
    `);
    
    console.log(`📦 Найдено товаров: ${productsResult.rows.length}\n`);
    
    productsResult.rows.forEach(p => {
      console.log(`  ${p.title}`);
      console.log(`    ID: ${p.id}, Slug: ${p.slug}`);
      console.log(`    category_id: ${p.category_id} (тип: ${typeof p.category_id})`);
      console.log(`    Техника: ${p.technique || 'не указана'}`);
      console.log(`    Тема: ${p.theme || 'не указана'}`);
      console.log(`    Размеры: ${p.dimensions || 'не указаны'}`);
      console.log('');
    });
    
    // Проверяем категории
    const categoriesResult = await pool.query(`
      SELECT id, name, slug 
      FROM product_categories 
      WHERE is_active = TRUE
      ORDER BY id
    `);
    
    console.log(`📂 Найдено категорий: ${categoriesResult.rows.length}\n`);
    
    categoriesResult.rows.forEach(c => {
      console.log(`  ${c.name} (ID: ${c.id}, Slug: ${c.slug})`);
    });
    
    // Проверяем соответствие
    console.log('\n🔗 Соответствие товаров и категорий:\n');
    const matched = productsResult.rows.filter(p => p.category_id);
    const unmatched = productsResult.rows.filter(p => !p.category_id);
    
    console.log(`✅ Товаров с категорией: ${matched.length}`);
    console.log(`❌ Товаров без категории: ${unmatched.length}\n`);
    
    if (unmatched.length > 0) {
      console.log('Товары без категории:');
      unmatched.forEach(p => {
        console.log(`  - ${p.title} (ID: ${p.id})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkProducts();
