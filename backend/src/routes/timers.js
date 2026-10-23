import { Router } from 'express';
import { pool } from '../db.js';
import { withLive, stopAllRunning, applyActivityDelta } from '../timerUtil.js';

const router = Router();
const TABLES = { project: 'projects', task: 'tasks' };

function assertType(type, res) {
  if (!TABLES[type]) {
    res.status(400).json({ error: 'type must be project or task' });
    return false;
  }
  return true;
}

// Only one timer runs at a time (enforced by stopAllRunning), so this is
// how the frontend watches for countdown completion without needing a
// project selected — fixes countdowns that never got acknowledged as done
// because nobody was viewing that project when the preset ran out.
router.get('/active', async (req, res) => {
  const { rows: projectRows } = await pool.query(
    `SELECT id, name, started_at, accumulated_seconds, mode, preset_seconds, id AS project_id
     FROM projects WHERE started_at IS NOT NULL LIMIT 1`
  );
  if (projectRows.length > 0) {
    return res.json({ type: 'project', project_id: projectRows[0].id, ...withLive(projectRows[0]) });
  }

  const { rows: taskRows } = await pool.query(
    `SELECT id, name, started_at, accumulated_seconds, mode, preset_seconds, project_id
     FROM tasks WHERE started_at IS NOT NULL LIMIT 1`
  );
  if (taskRows.length > 0) {
    return res.json({ type: 'task', ...withLive(taskRows[0]) });
  }

  res.json(null);
});

// mode: 'stopwatch' | 'countdown'. preset_seconds required for countdown.
router.post('/:type/:id/start', async (req, res) => {
  const { type, id } = req.params;
  if (!assertType(type, res)) return;
  const { mode = 'stopwatch', preset_seconds, client_date } = req.body;
  if (mode === 'countdown' && !preset_seconds) {
    return res.status(400).json({ error: 'preset_seconds required for countdown' });
  }

  const table = TABLES[type];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await stopAllRunning(client, client_date);
    const { rows } = await client.query(
      `UPDATE ${table} SET started_at = now(), mode = $1, preset_seconds = $2 WHERE id = $3 RETURNING *`,
      [mode, mode === 'countdown' ? preset_seconds : null, id]
    );
    await client.query('COMMIT');
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(withLive(rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/:type/:id/stop', async (req, res) => {
  const { type, id } = req.params;
  if (!assertType(type, res)) return;
  const { client_date } = req.body;
  const table = TABLES[type];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: current } = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [id]);
    if (current.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not found' });
    }
    const row = current[0];
    if (!row.started_at) {
      await client.query('COMMIT');
      return res.json(withLive(row));
    }
    const elapsed = (Date.now() - new Date(row.started_at).getTime()) / 1000;
    const capped = row.mode === 'countdown' && row.preset_seconds != null
      ? Math.min(elapsed, row.preset_seconds)
      : elapsed;
    const { rows: updated } = await client.query(
      `UPDATE ${table} SET accumulated_seconds = accumulated_seconds + $1, started_at = NULL, mode = NULL, preset_seconds = NULL WHERE id = $2 RETURNING *`,
      [Math.round(capped), id]
    );
    await applyActivityDelta(client, capped, client_date);
    await client.query('COMMIT');
    res.json(withLive(updated[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
