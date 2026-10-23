import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Last 7 days (today inclusive), oldest first, zero-filled for days with
// no recorded activity. `today` should be the caller's own local date
// (YYYY-MM-DD) — falls back to server-UTC if not supplied. Today's value
// is historical only — the frontend adds the live elapsed of whatever
// timer is currently running.
router.get('/week', async (req, res) => {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.today || '') ? req.query.today : todayUTC();

  const { rows } = await pool.query(
    `SELECT to_char(date, 'YYYY-MM-DD') AS date, seconds
     FROM daily_activity
     WHERE date >= $1::date - INTERVAL '6 days' AND date <= $1::date
     ORDER BY date`,
    [today]
  );
  const byDate = new Map(rows.map((r) => [r.date, Number(r.seconds)]));

  const [y, m, d] = today.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(anchor);
    dt.setUTCDate(dt.getUTCDate() - i);
    const key = dt.toISOString().slice(0, 10);
    days.push({ date: key, seconds: byDate.get(key) || 0 });
  }

  res.json(days);
});

export default router;
