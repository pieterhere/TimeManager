// Returns { total, runElapsed }: total is accumulated-so-far + current run
// (for display/rollups), runElapsed is seconds elapsed in *this* run only
// (for the countdown ring and auto-complete, so a repeat run isn't judged
// against time built up by earlier runs).
export function liveSeconds(row) {
  const base = Number(row.accumulated_seconds);
  if (!row.started_at) return { total: base, runElapsed: 0 };
  const rawElapsed = (Date.now() - new Date(row.started_at).getTime()) / 1000;
  const runElapsed = row.mode === 'countdown' && row.preset_seconds != null
    ? Math.min(rawElapsed, row.preset_seconds)
    : rawElapsed;
  return { total: base + runElapsed, runElapsed };
}

export function withLive(row) {
  const { total, runElapsed } = liveSeconds(row);
  return { ...row, live_seconds: total, run_elapsed_seconds: runElapsed };
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Global work-per-day log, independent of any single project. `dateStr`
// should be the caller's own local "today" (YYYY-MM-DD) — the browser's
// calendar day, not the server's — so entries land on the day the user
// actually worked, falling back to server-UTC date if the caller can't
// supply one. Accepts negative deltas too (manual time corrections),
// floored so a bucket never goes below zero.
export async function applyActivityDelta(client, deltaSeconds, dateStr) {
  const rounded = Math.round(deltaSeconds);
  if (rounded === 0) return;
  const date = dateStr || todayUTC();
  await client.query(
    `INSERT INTO daily_activity (date, seconds) VALUES ($1::date, GREATEST($2, 0))
     ON CONFLICT (date) DO UPDATE SET seconds = GREATEST(daily_activity.seconds + $2, 0)`,
    [date, rounded]
  );
}

// Stops any project/task whose timer is currently running, folding elapsed
// time into accumulated_seconds. Enforces "one timer running at a time".
export async function stopAllRunning(client, dateStr) {
  const now = new Date();

  const runningProjects = await client.query(
    `SELECT id, started_at, accumulated_seconds, mode, preset_seconds FROM projects WHERE started_at IS NOT NULL`
  );
  for (const row of runningProjects.rows) {
    const elapsed = (now.getTime() - new Date(row.started_at).getTime()) / 1000;
    const capped = row.mode === 'countdown' && row.preset_seconds != null
      ? Math.min(elapsed, row.preset_seconds)
      : elapsed;
    await client.query(
      `UPDATE projects SET accumulated_seconds = accumulated_seconds + $1, started_at = NULL, mode = NULL, preset_seconds = NULL WHERE id = $2`,
      [Math.round(capped), row.id]
    );
    await applyActivityDelta(client, capped, dateStr);
  }

  const runningTasks = await client.query(
    `SELECT id, started_at, accumulated_seconds, mode, preset_seconds FROM tasks WHERE started_at IS NOT NULL`
  );
  for (const row of runningTasks.rows) {
    const elapsed = (now.getTime() - new Date(row.started_at).getTime()) / 1000;
    const capped = row.mode === 'countdown' && row.preset_seconds != null
      ? Math.min(elapsed, row.preset_seconds)
      : elapsed;
    await client.query(
      `UPDATE tasks SET accumulated_seconds = accumulated_seconds + $1, started_at = NULL, mode = NULL, preset_seconds = NULL WHERE id = $2`,
      [Math.round(capped), row.id]
    );
    await applyActivityDelta(client, capped, dateStr);
  }
}
