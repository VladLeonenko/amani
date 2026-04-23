import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function rowToAuthor(r) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    bio: r.bio,
    imageUrl: r.image_url,
    socialLinks: r.social_links || {},
    isActive: r.is_active,
    sortOrder: r.sort_order || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// GET /api/authors - List all authors (public endpoint)
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true' || req.originalUrl.includes('/api/public');
    let query = 'SELECT * FROM authors';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY sort_order ASC, created_at DESC';
    
    const r = await pool.query(query);
    res.json(r.rows.map(rowToAuthor));
  } catch (err) {
    console.error('Error fetching authors:', err);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

// GET /api/authors/:slug - Get author by slug (public endpoint)
router.get('/:slug', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM authors WHERE slug=$1', [req.params.slug]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Author not found' });
    res.json(rowToAuthor(r.rows[0]));
  } catch (err) {
    console.error('Error fetching author:', err);
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

// GET /api/authors/:id/products - Get author's products (public endpoint)
router.get('/:id/products', async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    const r = await pool.query(
      `SELECT p.* FROM products p
       INNER JOIN author_products ap ON p.slug = ap.product_slug
       WHERE ap.author_id = $1 AND p.is_active = TRUE
       ORDER BY p.sort_order ASC, p.created_at DESC`,
      [authorId]
    );
    res.json(r.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      imageUrl: row.image_url,
      priceCents: row.price_cents,
      currency: row.currency,
      technique: row.technique,
      theme: row.theme,
      dimensions: row.dimensions,
    })));
  } catch (err) {
    console.error('Error fetching author products:', err);
    res.status(500).json({ error: 'Failed to fetch author products' });
  }
});

// POST /api/authors - Create author (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { slug, name, description, bio, imageUrl, socialLinks, isActive, sortOrder } = req.body;
    
    const r = await pool.query(
      `INSERT INTO authors (slug, name, description, bio, image_url, social_links, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        slug,
        name,
        description || null,
        bio || null,
        imageUrl || null,
        JSON.stringify(socialLinks || {}),
        isActive !== false,
        sortOrder || 0,
      ]
    );
    res.status(201).json({ created: rowToAuthor(r.rows[0]) });
  } catch (err) {
    console.error('Error creating author:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Author with this slug already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create author' });
    }
  }
});

// PUT /api/authors/:slug - Update author (admin only)
router.put('/:slug', requireAuth, async (req, res) => {
  try {
    const { name, description, bio, imageUrl, socialLinks, isActive, sortOrder } = req.body;
    
    const r = await pool.query(
      `UPDATE authors 
       SET name = $1, description = $2, bio = $3, image_url = $4, 
           social_links = $5, is_active = $6, sort_order = $7, updated_at = NOW()
       WHERE slug = $8
       RETURNING *`,
      [
        name,
        description || null,
        bio || null,
        imageUrl || null,
        JSON.stringify(socialLinks || {}),
        isActive !== false,
        sortOrder || 0,
        req.params.slug,
      ]
    );
    
    if (!r.rows[0]) return res.status(404).json({ error: 'Author not found' });
    res.json({ updated: rowToAuthor(r.rows[0]) });
  } catch (err) {
    console.error('Error updating author:', err);
    res.status(500).json({ error: 'Failed to update author' });
  }
});

// DELETE /api/authors/:slug - Delete author (admin only)
router.delete('/:slug', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM authors WHERE slug = $1 RETURNING *', [req.params.slug]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Author not found' });
    res.json({ deleted: rowToAuthor(r.rows[0]) });
  } catch (err) {
    console.error('Error deleting author:', err);
    res.status(500).json({ error: 'Failed to delete author' });
  }
});

// POST /api/authors/:id/products - Link product to author (admin only)
router.post('/:id/products', requireAuth, async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    const { productSlug } = req.body;
    
    await pool.query(
      'INSERT INTO author_products (author_id, product_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [authorId, productSlug]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error linking product to author:', err);
    res.status(500).json({ error: 'Failed to link product to author' });
  }
});

// DELETE /api/authors/:id/products/:productSlug - Unlink product from author (admin only)
router.delete('/:id/products/:productSlug', requireAuth, async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    const { productSlug } = req.params;
    
    await pool.query(
      'DELETE FROM author_products WHERE author_id = $1 AND product_slug = $2',
      [authorId, productSlug]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error unlinking product from author:', err);
    res.status(500).json({ error: 'Failed to unlink product from author' });
  }
});

export default router;
