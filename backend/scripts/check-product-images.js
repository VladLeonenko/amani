import pool from '../db.js';

async function checkImages() {
  try {
    const products = await pool.query(`
      SELECT id, slug, title, image_url, gallery
      FROM products
      ORDER BY id
    `);
    
    console.log('📦 Товары и их изображения:\n');
    products.rows.forEach(p => {
      console.log(`${p.title} (${p.slug}):`);
      console.log(`  image_url: ${p.image_url || 'NULL'}`);
      console.log(`  gallery: ${JSON.stringify(p.gallery || [])}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkImages();
