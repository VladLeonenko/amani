import pool from '../db.js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка для временного хранения скачанных изображений
const tempDir = path.join(__dirname, '../temp-images');
const uploadsDir = path.join(__dirname, '../uploads/products');

// Создаем папки если их нет
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Функция для скачивания изображения
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const filename = path.basename(url.split('?')[0]);
    const filepath = path.join(tempDir, filename);
    
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Функция для оптимизации и сохранения изображения
async function optimizeAndSaveImage(inputPath, productSlug) {
  try {
    // Генерируем уникальное имя файла
    const ext = path.extname(inputPath);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${productSlug}-${timestamp}-${randomStr}${ext}`;
    const outputPath = path.join(uploadsDir, filename);
    
    // Оптимизируем изображение с помощью sharp
    await sharp(inputPath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    // Возвращаем относительный путь для БД
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

async function processProductImages() {
  try {
    console.log('🖼️  Начинаем обработку изображений товаров...\n');
    
    // Получаем все товары с изображениями из localhost:3845
    const products = await pool.query(`
      SELECT id, slug, title, image_url, gallery
      FROM products
      WHERE image_url LIKE 'http://localhost:3845%'
         OR gallery::text LIKE '%localhost:3845%'
      ORDER BY id
    `);
    
    console.log(`📦 Найдено товаров с изображениями localhost: ${products.rows.length}\n`);
    
    if (products.rows.length === 0) {
      console.log('✅ Нет товаров для обработки\n');
      process.exit(0);
    }
    
    for (const product of products.rows) {
      console.log(`\n📦 Обрабатываем: ${product.title} (${product.slug})`);
      
      let newImageUrl = product.image_url;
      let newGallery = product.gallery || [];
      
      // Обрабатываем основное изображение
      if (product.image_url && product.image_url.startsWith('http://localhost:3845')) {
        try {
          console.log(`  📥 Скачиваем: ${product.image_url}`);
          const downloadedPath = await downloadImage(product.image_url);
          
          console.log(`  🔧 Оптимизируем и сохраняем...`);
          newImageUrl = await optimizeAndSaveImage(downloadedPath, product.slug);
          
          // Удаляем временный файл
          fs.unlinkSync(downloadedPath);
          
          console.log(`  ✅ Основное изображение сохранено: ${newImageUrl}`);
        } catch (error) {
          console.error(`  ❌ Ошибка при обработке основного изображения:`, error.message);
        }
      }
      
      // Обрабатываем галерею
      if (Array.isArray(product.gallery) && product.gallery.length > 0) {
        const updatedGallery = [];
        
        for (const galleryUrl of product.gallery) {
          if (galleryUrl && galleryUrl.startsWith('http://localhost:3845')) {
            try {
              console.log(`  📥 Скачиваем из галереи: ${galleryUrl}`);
              const downloadedPath = await downloadImage(galleryUrl);
              
              console.log(`  🔧 Оптимизируем и сохраняем...`);
              const newUrl = await optimizeAndSaveImage(downloadedPath, `${product.slug}-gallery`);
              
              // Удаляем временный файл
              fs.unlinkSync(downloadedPath);
              
              updatedGallery.push(newUrl);
              console.log(`  ✅ Изображение галереи сохранено: ${newUrl}`);
            } catch (error) {
              console.error(`  ❌ Ошибка при обработке изображения галереи:`, error.message);
              // Оставляем старый URL если не удалось обработать
              updatedGallery.push(galleryUrl);
            }
          } else {
            // Оставляем URL как есть, если он не из localhost:3845
            updatedGallery.push(galleryUrl);
          }
        }
        
        newGallery = updatedGallery;
      }
      
      // Обновляем товар в БД
      // Для PostgreSQL массивы нужно передавать как массив, а не JSON строку
      await pool.query(
        `UPDATE products 
         SET image_url = $1, gallery = $2::text[], updated_at = NOW()
         WHERE id = $3`,
        [newImageUrl, newGallery, product.id]
      );
      
      console.log(`  ✅ Товар обновлен в БД`);
    }
    
    // Очищаем временную папку
    console.log(`\n🧹 Очищаем временные файлы...`);
    const tempFiles = fs.readdirSync(tempDir);
    for (const file of tempFiles) {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (error) {
        console.warn(`  ⚠️  Не удалось удалить ${file}:`, error.message);
      }
    }
    
    console.log(`\n✅ Обработка завершена!`);
    console.log(`📁 Изображения сохранены в: ${uploadsDir}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обработке изображений:', error);
    process.exit(1);
  }
}

processProductImages();
