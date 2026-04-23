import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function rowToCategory(r) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    parentId: r.parent_id,
    sortOrder: r.sort_order || 0,
    isActive: r.is_active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// GET /api/product-categories - List all categories (public endpoint)
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true' || req.originalUrl.includes('/api/public');
    let query = 'SELECT * FROM product_categories';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const r = await pool.query(query);
    res.json(r.rows.map(rowToCategory));
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/product-categories/:id - Get category by id (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const r = await pool.query('SELECT * FROM product_categories WHERE id=$1', [id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json(rowToCategory(r.rows[0]));
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/product-categories - Create category (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { slug, name, description, parentId, sortOrder, isActive } = req.body;
    
    if (!slug || !name) {
      return res.status(400).json({ error: 'slug and name are required' });
    }
    
    const r = await pool.query(
      `INSERT INTO product_categories (slug, name, description, parent_id, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        slug,
        name,
        description || null,
        parentId || null,
        sortOrder || 0,
        isActive !== false,
      ]
    );
    res.status(201).json({ created: rowToCategory(r.rows[0]) });
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Category with this slug already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// PUT /api/product-categories/:id - Update category (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { slug, name, description, parentId, sortOrder, isActive } = req.body;
    
    const r = await pool.query(
      `UPDATE product_categories 
       SET slug = COALESCE($2, slug), 
           name = COALESCE($3, name),
           description = $4,
           parent_id = $5,
           sort_order = COALESCE($6, sort_order),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        slug,
        name,
        description !== undefined ? description : null,
        parentId !== undefined ? parentId : null,
        sortOrder,
        isActive,
      ]
    );
    
    if (!r.rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json({ updated: rowToCategory(r.rows[0]) });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/product-categories/:id - Delete category (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    // Проверяем, есть ли товары в этой категории
    const productsCheck = await pool.query('SELECT COUNT(*) as count FROM products WHERE category_id = $1', [id]);
    const productCount = parseInt(productsCheck.rows[0]?.count || '0', 10);
    
    if (productCount > 0) {
      return res.status(400).json({ error: `Невозможно удалить категорию с товарами. Сначала переназначьте ${productCount} товар(ов) в другую категорию.` });
    }
    
    // Проверяем, есть ли дочерние категории
    const childrenCheck = await pool.query('SELECT COUNT(*) as count FROM product_categories WHERE parent_id = $1', [id]);
    const childrenCount = parseInt(childrenCheck.rows[0]?.count || '0', 10);
    
    if (childrenCount > 0) {
      return res.status(400).json({ error: `Невозможно удалить категорию с дочерними категориями. Сначала удалите или переместите ${childrenCount} дочерних категорий.` });
    }
    
    const r = await pool.query('DELETE FROM product_categories WHERE id = $1 RETURNING *', [id]);
    if (!r.rows[0]) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json({ deleted: rowToCategory(r.rows[0]) });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

export default router;
