import pool from '../db.js';

// Список старых страниц primecoder для удаления
// Оставляем только страницы AMANI
const amaniPageSlugs = [
  '/',
  '/catalog',
  '/authors',
  '/collaboration',
  '/login',
  '/register',
  '/account',
  '/search',
  '/privacy-policy',
  '/delivery-payment',
  '/checkout',
];

async function removeOldPages() {
  try {
    console.log('🗑️  Удаление старых страниц primecoder...\n');
    
    // Получаем все страницы
    const allPages = await pool.query('SELECT id, slug, title FROM pages');
    console.log(`📄 Найдено страниц: ${allPages.rows.length}\n`);
    
    // Удаляем страницы, которых нет в списке AMANI
    let deletedCount = 0;
    for (const page of allPages.rows) {
      if (!amaniPageSlugs.includes(page.slug)) {
        await pool.query('DELETE FROM pages WHERE id = $1', [page.id]);
        console.log(`  ✅ Удалена: ${page.title} (${page.slug})`);
        deletedCount++;
      } else {
        console.log(`  ⏭️  Оставлена: ${page.title} (${page.slug})`);
      }
    }
    
    console.log(`\n✅ Удалено ${deletedCount} старых страниц!`);
    console.log(`📄 Осталось ${allPages.rows.length - deletedCount} страниц AMANI\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при удалении страниц:', error);
    process.exit(1);
  }
}

removeOldPages();
