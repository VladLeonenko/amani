import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка для загрузки изображений товаров
const uploadsDir = path.join(__dirname, '../uploads/products');
// Папка с исходными изображениями
const sourceDir = path.join(__dirname, '../../frontend/public/products');

// Создаем папку для загрузок если её нет
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Функция для обработки и сохранения изображения
async function processImage(inputPath, productSlug, isGallery = false) {
  try {
    if (!fs.existsSync(inputPath)) {
      return null;
    }
    
    // Генерируем уникальное имя файла
    const ext = path.extname(inputPath).toLowerCase();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const prefix = isGallery ? `${productSlug}-gallery` : productSlug;
    const filename = `${prefix}-${timestamp}-${randomStr}${ext}`;
    const outputPath = path.join(uploadsDir, filename);
    
    // Оптимизируем изображение с помощью sharp
    // Сохраняем в том же формате, но оптимизируем
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Ресайз если изображение слишком большое
    let pipeline = image;
    if (metadata.width > 1200 || metadata.height > 1200) {
      pipeline = pipeline.resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Сохраняем в зависимости от формата
    if (ext === '.png') {
      await pipeline.png({ quality: 90, compressionLevel: 9 }).toFile(outputPath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: 85 }).toFile(outputPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 85 }).toFile(outputPath);
    } else {
      // Для других форматов просто копируем
      await pipeline.toFile(outputPath);
    }
    
    // Возвращаем относительный путь для БД
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error(`  ❌ Ошибка при обработке изображения:`, error.message);
    return null;
  }
}

async function processProductImages() {
  try {
    console.log('🖼️  Обработка изображений товаров из папки...\n');
    
    // Проверяем наличие папки с исходными изображениями
    if (!fs.existsSync(sourceDir)) {
      console.log(`❌ Папка с изображениями не найдена: ${sourceDir}`);
      console.log(`\n📝 Инструкция:`);
      console.log(`1. Создайте папку: ${sourceDir}`);
      console.log(`2. Поместите туда изображения товаров`);
      console.log(`3. Назовите файлы по slug товара:`);
      console.log(`   - африканская-маска-дух-предков.jpg`);
      console.log(`   - картина-саванна-на-закате.jpg`);
      console.log(`   - скульптура-воин-масаи.jpg`);
      console.log(`   - постер-африканские-ритмы.jpg`);
      console.log(`   - фотография-жирафы-в-саванне.jpg`);
      console.log(`   - картина-африканская-деревня.jpg`);
      console.log(`   - скульптура-мать-и-дитя.jpg`);
      console.log(`   - картина-золотой-закат.jpg`);
      console.log(`   - фотография-слоны-в-национальном-парке.jpg`);
      console.log(`\n4. Запустите скрипт снова\n`);
      process.exit(1);
    }
    
    // Получаем все товары
    const products = await pool.query(`
      SELECT id, slug, title, image_url, gallery
      FROM products
      WHERE image_url LIKE 'http://localhost:3845%'
         OR (gallery::text LIKE '%localhost:3845%')
      ORDER BY id
    `);
    
    console.log(`📦 Найдено товаров с изображениями localhost: ${products.rows.length}\n`);
    
    if (products.rows.length === 0) {
      console.log('✅ Нет товаров для обработки\n');
      process.exit(0);
    }
    
    // Получаем список файлов в папке
    const files = fs.readdirSync(sourceDir);
    console.log(`📁 Найдено файлов в папке: ${files.length}\n`);
    
    for (const product of products.rows) {
      console.log(`\n📦 Обрабатываем: ${product.title} (${product.slug})`);
      
      let newImageUrl = product.image_url;
      let newGallery = Array.isArray(product.gallery) ? [...product.gallery] : [];
      
      // Ищем изображение для этого товара
      const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      let foundImage = null;
      
      for (const ext of possibleExtensions) {
        const filename = `${product.slug}${ext}`;
        const imagePath = path.join(sourceDir, filename);
        if (fs.existsSync(imagePath)) {
          foundImage = imagePath;
          break;
        }
      }
      
      // Также проверяем варианты с дефисами и подчеркиваниями
      if (!foundImage) {
        const variants = [
          product.slug.replace(/-/g, '_'),
          product.slug.replace(/_/g, '-'),
          product.title.toLowerCase().replace(/[^a-z0-9а-яё]/g, '-'),
        ];
        
        for (const variant of variants) {
          for (const ext of possibleExtensions) {
            const filename = `${variant}${ext}`;
            const imagePath = path.join(sourceDir, filename);
            if (fs.existsSync(imagePath)) {
              foundImage = imagePath;
              break;
            }
          }
          if (foundImage) break;
        }
      }
      
      if (foundImage) {
        console.log(`  📥 Найдено изображение: ${path.basename(foundImage)}`);
        const processedUrl = await processImage(foundImage, product.slug);
        if (processedUrl) {
          newImageUrl = processedUrl;
          console.log(`  ✅ Изображение обработано: ${newImageUrl}`);
          
          // Обновляем галерею, если там был localhost URL
          if (Array.isArray(newGallery) && newGallery.length > 0) {
            const updatedGallery = newGallery.map(url => {
              if (url && url.startsWith('http://localhost:3845')) {
                return processedUrl; // Используем то же изображение для галереи
              }
              return url;
            });
            newGallery = updatedGallery;
          } else {
            // Если галереи нет, создаем её с основным изображением
            newGallery = [processedUrl];
          }
        }
      } else {
        console.log(`  ⚠️  Изображение не найдено для: ${product.slug}`);
        console.log(`     Ожидаемые имена файлов:`);
        for (const ext of possibleExtensions) {
          console.log(`     - ${product.slug}${ext}`);
        }
      }
      
      // Обновляем товар в БД только если изображение изменилось
      if (newImageUrl !== product.image_url && !newImageUrl.startsWith('http://localhost:3845')) {
        await pool.query(
          `UPDATE products 
           SET image_url = $1, gallery = $2::text[], updated_at = NOW()
           WHERE id = $3`,
          [newImageUrl, newGallery, product.id]
        );
        console.log(`  ✅ Товар обновлен в БД`);
      } else if (newImageUrl.startsWith('http://localhost:3845')) {
        console.log(`  ⚠️  Изображение все еще ссылается на localhost:3845`);
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
