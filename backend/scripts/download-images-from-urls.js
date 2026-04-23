import pool from '../db.js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Функция для скачивания изображения по URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    // Пробуем разные варианты URL
    const urls = [
      url,
      url.replace('localhost:3845', '127.0.0.1:3845'),
      url.replace('http://', 'https://'),
    ];
    
    let lastError = null;
    
    const tryDownload = (urlToTry) => {
      const protocol = urlToTry.startsWith('https') ? https : http;
      const filename = path.basename(urlToTry.split('?')[0]);
      const filepath = path.join(uploadsDir, `temp-${filename}`);
      
      const file = fs.createWriteStream(filepath);
      
      protocol.get(urlToTry, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filepath);
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Редирект
          file.close();
          fs.unlink(filepath, () => {});
          tryDownload(response.headers.location);
        } else {
          file.close();
          fs.unlink(filepath, () => {});
          lastError = new Error(`HTTP ${response.statusCode}`);
          if (urls.length > 0) {
            tryDownload(urls.shift());
          } else {
            reject(lastError);
          }
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(filepath, () => {});
        lastError = err;
        if (urls.length > 0) {
          tryDownload(urls.shift());
        } else {
          reject(lastError);
        }
      });
    };
    
    tryDownload(urls.shift());
  });
}

// Функция для обработки и сохранения изображения
async function processImage(inputPath, productSlug, isGallery = false) {
  try {
    const ext = path.extname(inputPath).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const prefix = isGallery ? `${productSlug}-gallery` : productSlug;
    const filename = `${prefix}-${timestamp}-${randomStr}${ext}`;
    const outputPath = path.join(uploadsDir, filename);
    
    // Оптимизируем изображение
    await sharp(inputPath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    // Удаляем временный файл
    fs.unlinkSync(inputPath);
    
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error(`  ❌ Ошибка при обработке:`, error.message);
    // Удаляем временный файл даже при ошибке
    try {
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch {}
    return null;
  }
}

async function downloadAndUpdateImages() {
  try {
    console.log('🖼️  Попытка скачать изображения...\n');
    console.log('⚠️  Если localhost:3845 недоступен, изображения не будут скачаны.');
    console.log('   В этом случае поместите изображения в frontend/public/products/ и запустите process-product-images-from-folder.js\n');
    
    const products = await pool.query(`
      SELECT id, slug, title, image_url, gallery
      FROM products
      WHERE image_url LIKE 'http://localhost:3845%'
         OR (gallery::text LIKE '%localhost:3845%')
      ORDER BY id
    `);
    
    console.log(`📦 Найдено товаров: ${products.rows.length}\n`);
    
    if (products.rows.length === 0) {
      console.log('✅ Нет товаров для обработки\n');
      process.exit(0);
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of products.rows) {
      console.log(`\n📦 ${product.title} (${product.slug})`);
      
      let newImageUrl = product.image_url;
      let newGallery = Array.isArray(product.gallery) ? [...product.gallery] : [];
      
      // Пробуем скачать основное изображение
      if (product.image_url && product.image_url.startsWith('http://localhost:3845')) {
        try {
          console.log(`  📥 Пытаемся скачать: ${product.image_url}`);
          const downloadedPath = await downloadImage(product.image_url);
          console.log(`  ✅ Скачано: ${path.basename(downloadedPath)}`);
          
          const processedUrl = await processImage(downloadedPath, product.slug);
          if (processedUrl) {
            newImageUrl = processedUrl;
            console.log(`  ✅ Обработано: ${processedUrl}`);
            successCount++;
          }
        } catch (error) {
          console.log(`  ❌ Не удалось скачать: ${error.message}`);
          failCount++;
        }
      }
      
      // Обновляем галерею
      if (Array.isArray(newGallery) && newGallery.length > 0) {
        const updatedGallery = [];
        for (const galleryUrl of newGallery) {
          if (galleryUrl && galleryUrl.startsWith('http://localhost:3845')) {
            if (newImageUrl && !newImageUrl.startsWith('http://localhost:3845')) {
              // Используем обработанное основное изображение
              updatedGallery.push(newImageUrl);
            } else {
              // Пробуем скачать
              try {
                const downloadedPath = await downloadImage(galleryUrl);
                const processedUrl = await processImage(downloadedPath, product.slug, true);
                if (processedUrl) {
                  updatedGallery.push(processedUrl);
                } else {
                  updatedGallery.push(galleryUrl); // Оставляем старый URL
                }
              } catch (error) {
                updatedGallery.push(galleryUrl); // Оставляем старый URL
              }
            }
          } else {
            updatedGallery.push(galleryUrl);
          }
        }
        newGallery = updatedGallery;
      } else if (newImageUrl && !newImageUrl.startsWith('http://localhost:3845')) {
        // Создаем галерею из основного изображения
        newGallery = [newImageUrl];
      }
      
      // Обновляем в БД только если изображение изменилось
      if (newImageUrl !== product.image_url || JSON.stringify(newGallery) !== JSON.stringify(product.gallery)) {
        await pool.query(
          `UPDATE products 
           SET image_url = $1, gallery = $2::text[], updated_at = NOW()
           WHERE id = $3`,
          [newImageUrl, newGallery, product.id]
        );
        console.log(`  ✅ Обновлено в БД`);
      }
    }
    
    console.log(`\n📊 Результаты:`);
    console.log(`  ✅ Успешно: ${successCount}`);
    console.log(`  ❌ Не удалось: ${failCount}`);
    
    if (failCount > 0) {
      console.log(`\n💡 Решение:`);
      console.log(`   Поместите изображения в frontend/public/products/`);
      console.log(`   Назовите файлы по slug товаров (например: африканская-маска-дух-предков.jpg)`);
      console.log(`   Запустите: node scripts/process-product-images-from-folder.js\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

downloadAndUpdateImages();
