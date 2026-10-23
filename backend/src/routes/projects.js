import { Router } from 'express';
import { pool } from '../db.js';
import { withLive, applyActivityDelta } from '../timerUtil.js';

const router = Router();

// List all projects with tasks-total-seconds rolled in, for the sidebar.
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*,
      COALESCE((SELECT SUM(t.accumulated_seconds) FROM tasks t WHERE t.project_id = p.id), 0) AS tasks_accumulated_seconds
    FROM projects p
    ORDER BY p.status, p.position, p.created_at
  `);
  res.json(rows.map((r) => {
    const withTimer = withLive(r);
    return { ...withTimer, live_total_seconds: withTimer.live_seconds + Number(r.tasks_accumulated_seconds) };
  }));
});

// Single project + its tasks, for the main board.
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  if (projectRes.rows.length === 0) return res.status(404).json({ error: 'not found' });
  const tasksRes = await pool.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY active DESC, position, created_at', [id]);
  res.json({
    ...withLive(projectRes.rows[0]),
    tasks: tasksRes.rows.map(withLive),
  });
});

router.post('/', async (req, res) => {
  const { name, status = 'current' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query(
    'INSERT INTO projects (name, status) VALUES ($1, $2) RETURNING *',
    [name.trim(), status]
  );
  res.status(201).json(withLive(rows[0]));
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status, accumulated_seconds, progress, notes, client_date } = req.body;
  const clampedProgress = progress != null ? Math.max(0, Math.min(100, Math.round(progress))) : null;
  const notesValue = notes !== undefined ? notes : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let activityDelta = 0;

    if (accumulated_seconds != null) {
      const { rows: existing } = await client.query('SELECT started_at, accumulated_seconds FROM projects WHERE id = $1 FOR UPDATE', [id]);
      if (existing.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'not found' });
      }
      if (existing[0].started_at) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'stop the timer before editing its time' });
      }
      const target = Math.max(0, Math.round(accumulated_seconds));
      activityDelta = target - Number(existing[0].accumulated_seconds);
    }

    const { rows } = await client.query(
      `UPDATE projects SET name = COALESCE($1, name), status = COALESCE($2, status), accumulated_seconds = COALESCE($3, accumulated_seconds), progress = COALESCE($4, progress), notes = COALESCE($5, notes) WHERE id = $6 RETURNING *`,
      [name?.trim() || null, status || null, accumulated_seconds != null ? Math.max(0, Math.round(accumulated_seconds)) : null, clampedProgress, notesValue, id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not found' });
    }
    if (activityDelta !== 0) await applyActivityDelta(client, activityDelta, client_date);
    await client.query('COMMIT');
    res.json(withLive(rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Bulk-reorder: body is { order: [id, id, ...] } in desired display order.
// Positions are assigned as the array index, scoped loosely since ordering
// only matters within a status group (see the ORDER BY in GET /).
router.post('/reorder', async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ error: 'order must be an array of project ids' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < order.length; i++) {
      await client.query('UPDATE projects SET position = $1 WHERE id = $2', [i, order[i]]);
    }
    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
