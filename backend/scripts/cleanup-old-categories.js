import pool from '../db.js';

async function cleanupOldCategories() {
  try {
    console.log('🧹 Очистка старых категорий товаров...\n');

    // Удаляем старые категории, которые не относятся к AMANI
    const oldCategorySlugs = ['branding', 'design', 'consulting', 'marketing', 'other-services'];
    
    console.log('🗑️  Удаляем старые категории...');
    for (const slug of oldCategorySlugs) {
      // Сначала обнуляем category_id у товаров, связанных с этими категориями
      const categoryResult = await pool.query('SELECT id FROM product_categories WHERE slug = $1', [slug]);
      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        await pool.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [categoryId]);
        console.log(`  ✅ Обнулены связи товаров с категорией: ${slug}`);
      }
      
      // Удаляем категорию
      const deleteResult = await pool.query('DELETE FROM product_categories WHERE slug = $1 RETURNING name', [slug]);
      if (deleteResult.rows.length > 0) {
        console.log(`  ✅ Удалена категория: ${deleteResult.rows[0].name}`);
      }
    }

    console.log('\n✅ Очистка завершена!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
    process.exit(1);
  }
}

cleanupOldCategories();
