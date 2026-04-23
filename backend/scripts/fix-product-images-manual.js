import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка для загрузки изображений товаров
const uploadsDir = path.join(__dirname, '../uploads/products');

// Создаем папку если её нет
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Маппинг товаров и их изображений
// Если у вас есть изображения в папке frontend/public или другом месте,
// укажите путь к ним здесь
const productImageMapping = {
  'африканская-маска-дух-предков': {
    main: null, // Путь к основному изображению
    gallery: [], // Пути к изображениям галереи
  },
  'картина-саванна-на-закате': {
    main: null,
    gallery: [],
  },
  'скульптура-воин-масаи': {
    main: null,
    gallery: [],
  },
  'постер-африканские-ритмы': {
    main: null,
    gallery: [],
  },
  'фотография-жирафы-в-саванне': {
    main: null,
    gallery: [],
  },
  'картина-африканская-деревня': {
    main: null,
    gallery: [],
  },
  'скульптура-мать-и-дитя': {
    main: null,
    gallery: [],
  },
  'картина-золотой-закат': {
    main: null,
    gallery: [],
  },
  'фотография-слоны-в-национальном-парке': {
    main: null,
    gallery: [],
  },
};

// Функция для обработки и сохранения изображения
async function processImage(inputPath, productSlug, isGallery = false) {
  try {
    if (!fs.existsSync(inputPath)) {
      console.warn(`  ⚠️  Файл не найден: ${inputPath}`);
      return null;
    }
    
    // Генерируем уникальное имя файла
    const ext = path.extname(inputPath);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const prefix = isGallery ? `${productSlug}-gallery` : productSlug;
    const filename = `${prefix}-${timestamp}-${randomStr}${ext}`;
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
    console.error(`  ❌ Ошибка при обработке изображения ${inputPath}:`, error.message);
    return null;
  }
}

async function fixProductImages() {
  try {
    console.log('🖼️  Обработка изображений товаров...\n');
    console.log('📝 Инструкция:');
    console.log('1. Поместите изображения товаров в папку: frontend/public/products/');
    console.log('2. Назовите файлы по slug товара, например:');
    console.log('   - африканская-маска-дух-предков.jpg');
    console.log('   - картина-саванна-на-закате.jpg');
    console.log('3. Или укажите пути к изображениям в скрипте\n');
    
    // Получаем все товары
    const products = await pool.query(`
      SELECT id, slug, title, image_url
      FROM products
      ORDER BY id
    `);
    
    console.log(`📦 Найдено товаров: ${products.rows.length}\n`);
    
    // Проверяем папку с изображениями
    const publicProductsDir = path.join(__dirname, '../../frontend/public/products');
    const hasPublicDir = fs.existsSync(publicProductsDir);
    
    if (hasPublicDir) {
      console.log(`✅ Найдена папка: ${publicProductsDir}\n`);
    } else {
      console.log(`⚠️  Папка не найдена: ${publicProductsDir}`);
      console.log(`   Создайте папку и поместите туда изображения товаров\n`);
    }
    
    for (const product of products.rows) {
      console.log(`\n📦 Обрабатываем: ${product.title} (${product.slug})`);
      
      let newImageUrl = product.image_url;
      
      // Пробуем найти изображение в папке public/products
      if (hasPublicDir) {
        const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        let foundImage = null;
        
        for (const ext of possibleExtensions) {
          const imagePath = path.join(publicProductsDir, `${product.slug}${ext}`);
          if (fs.existsSync(imagePath)) {
            foundImage = imagePath;
            break;
          }
        }
        
        if (foundImage) {
          console.log(`  📥 Найдено изображение: ${foundImage}`);
          const processedUrl = await processImage(foundImage, product.slug);
          if (processedUrl) {
            newImageUrl = processedUrl;
            console.log(`  ✅ Изображение обработано: ${newImageUrl}`);
          }
        } else {
          console.log(`  ⚠️  Изображение не найдено для: ${product.slug}`);
        }
      }
      
      // Проверяем маппинг (если указан вручную)
      const mapping = productImageMapping[product.slug];
      if (mapping && mapping.main) {
        const processedUrl = await processImage(mapping.main, product.slug);
        if (processedUrl) {
          newImageUrl = processedUrl;
          console.log(`  ✅ Изображение обработано из маппинга: ${newImageUrl}`);
        }
      }
      
      // Обновляем товар в БД только если изображение изменилось
      if (newImageUrl !== product.image_url && !newImageUrl.startsWith('http://localhost:3845')) {
        await pool.query(
          `UPDATE products 
           SET image_url = $1, updated_at = NOW()
           WHERE id = $2`,
          [newImageUrl, product.id]
        );
        console.log(`  ✅ Товар обновлен в БД`);
      } else if (newImageUrl.startsWith('http://localhost:3845')) {
        console.log(`  ⚠️  Изображение все еще ссылается на localhost:3845`);
        console.log(`     Поместите изображение в ${publicProductsDir}/${product.slug}.jpg`);
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

fixProductImages();
