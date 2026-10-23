CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'future', 'maybe', 'finished')),
  position INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ,
  accumulated_seconds BIGINT NOT NULL DEFAULT 0,
  mode TEXT CHECK (mode IN ('stopwatch', 'countdown')),
  preset_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ,
  accumulated_seconds BIGINT NOT NULL DEFAULT 0,
  mode TEXT CHECK (mode IN ('stopwatch', 'countdown')),
  preset_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Global work-per-day log, independent of any single project. Filled in
-- whenever a running timer stops (see timerUtil.recordActivity).
CREATE TABLE IF NOT EXISTS daily_activity (
  date DATE PRIMARY KEY,
  seconds BIGINT NOT NULL DEFAULT 0
);
