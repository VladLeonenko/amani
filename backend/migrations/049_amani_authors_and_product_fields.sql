-- Миграция для авторов AMANI и дополнительных полей товаров

-- Таблица авторов
CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  bio TEXT,
  image_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb, -- { instagram: '...', facebook: '...', etc }
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_active ON authors(is_active);

-- Таблица работ авторов (связь автора с товарами)
CREATE TABLE IF NOT EXISTS author_products (
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  PRIMARY KEY (author_id, product_slug)
);

CREATE INDEX IF NOT EXISTS idx_author_products_author ON author_products(author_id);
CREATE INDEX IF NOT EXISTS idx_author_products_product ON author_products(product_slug);

-- Добавляем дополнительные поля к товарам (техника, тема, размеры)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS technique TEXT, -- Техника исполнения
  ADD COLUMN IF NOT EXISTS theme TEXT, -- Тема произведения
  ADD COLUMN IF NOT EXISTS dimensions TEXT, -- Размеры (например, "50x70 см")
  ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_author ON products(author_id);
CREATE INDEX IF NOT EXISTS idx_products_technique ON products(technique);
CREATE INDEX IF NOT EXISTS idx_products_theme ON products(theme);
