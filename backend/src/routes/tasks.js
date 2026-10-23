import { Router } from 'express';
import { pool } from '../db.js';
import { withLive, applyActivityDelta } from '../timerUtil.js';

const router = Router();

router.post('/', async (req, res) => {
  const { project_id, name } = req.body;
  if (!project_id || !name || !name.trim()) {
    return res.status(400).json({ error: 'project_id and name required' });
  }
  const { rows } = await pool.query(
    'INSERT INTO tasks (project_id, name) VALUES ($1, $2) RETURNING *',
    [project_id, name.trim()]
  );
  res.status(201).json(withLive(rows[0]));
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, accumulated_seconds, active, client_date } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existingRows } = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [id]);
    if (existingRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not found' });
    }
    const existing = existingRows[0];

    if (accumulated_seconds != null && existing.started_at) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'stop the timer before editing its time' });
    }

    // Archiving a running task folds its elapsed time in and stops it —
    // a finished task shouldn't keep silently racking up time.
    let finalAccumulated = Number(existing.accumulated_seconds);
    let clearRun = false;
    let activityDelta = 0;
    if (active === false && existing.started_at) {
      const elapsed = (Date.now() - new Date(existing.started_at).getTime()) / 1000;
      const capped = existing.mode === 'countdown' && existing.preset_seconds != null
        ? Math.min(elapsed, existing.preset_seconds)
        : elapsed;
      finalAccumulated += Math.round(capped);
      activityDelta += capped;
      clearRun = true;
    }
    if (accumulated_seconds != null) {
      const target = Math.max(0, Math.round(accumulated_seconds));
      activityDelta += target - finalAccumulated;
      finalAccumulated = target;
    }

    const { rows: updated } = await client.query(
      `UPDATE tasks SET
         name = COALESCE($1, name),
         accumulated_seconds = $2,
         active = COALESCE($3, active),
         started_at = CASE WHEN $4 THEN NULL ELSE started_at END,
         mode = CASE WHEN $4 THEN NULL ELSE mode END,
         preset_seconds = CASE WHEN $4 THEN NULL ELSE preset_seconds END
       WHERE id = $5
       RETURNING *`,
      [name?.trim() || null, finalAccumulated, active != null ? active : null, clearRun, id]
    );
    if (activityDelta !== 0) await applyActivityDelta(client, activityDelta, client_date);
    await client.query('COMMIT');
    res.json(withLive(updated[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
