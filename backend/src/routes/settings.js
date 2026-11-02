import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  res.json(out);
});

router.put('/', async (req, res) => {
  const entries = Object.entries(req.body || {});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, String(value ?? '')]
      );
    }
    await client.query('COMMIT');
    const { rows } = await client.query('SELECT key, value FROM settings');
    const out = {};
    for (const row of rows) out[row.key] = row.value;
    res.json(out);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
