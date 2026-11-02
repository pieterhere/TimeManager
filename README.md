# Time Manager

Self-hosted project time tracker. Organize projects into status columns, clock time per project or per task, track completion with a progress slider, sketch on a drawing pad, and see a dashboard overview of where your time actually went.

## Features

- **Projects grouped by status**: Current, Future, Maybe, Finished. Drag-and-drop to reorder within a group or move between groups, or change a project's status directly from its own page via the status badge/dropdown (no dragging required).
- **Per-project and per-task timers**: stopwatch or countdown mode, with a quarter-hour bell and a focus check-in after 30 minutes of continuous running. Only one timer can run at a time; the sidebar shows a pulsing dot on whichever project is active.
- **Live ticking display**: the running timer and project Total count up every second on their own, independent of network polling, so nothing needs a manual refresh to keep moving.
- **Editable time**: click any stopped timer, project or task, to manually set its accumulated time (H:MM:SS).
- **Drag-to-reorder tasks**: move a task's position within its project the same way projects are reordered in the sidebar.
- **Progress slider**: set roughly how done a project is; shown as a thin bar in the sidebar listing too.
- **Notes and post composer**: a free-text notes box, plus a separate Title/Text/Hashtags composer with a one-click Copy button that formats them as "Title Text #hashtags". Both autosave on blur.
- **Drawing pad**: a 1080x1920 canvas next to Notes, with pen and eraser tools, undo (up to 25 steps) and Clear All. Autosaves as a PNG after every completed stroke.
- **Dashboard (home page)**: total work time, this week/month/year totals, longest-worked project, latest project, a 7-day activity chart, and all active projects ranked by progress. Click the "Time Manager" title anytime to get back to it.
- **Weekly activity chart**: a 7-day bar chart of logged time, independent of any single project. Each day's bar can be scaled against a daily work-time target (set in Settings) instead of the busiest day, so a full bar means you hit your target.
- **Browser notifications**: a chime when a timer finishes, a 30-minute "still focused?" check-in while one runs continuously, and a nudge every 3 hours if nothing is running and the idle stretch keeps going.
- **Settings page**: default hashtags template prefilled on new projects, and a minimum daily work-time target (hours) that drives the week bar's fill level.
- **Consistent time format**: every duration anywhere in the app (projects, tasks, dashboard) is always shown as H:MM:SS.

## Stack

- Frontend: React + Vite, served by nginx (also proxies `/api` to the backend)
- Backend: Node.js + Express
- Database: PostgreSQL

## Setup

```bash
cp .env.example .env
# edit .env: set a real POSTGRES_PASSWORD
docker compose up -d --build
```

Open `http://localhost:8089` (or whatever `PORT` you set).

## Project layout

```
backend/    Express API + Postgres schema (src/schema.sql runs on every startup, idempotent)
frontend/   React app (Vite build, nginx serves the static output + proxies /api)
```

## API overview

- `GET/POST /api/projects`, `PATCH/DELETE /api/projects/:id`, `POST /api/projects/reorder`
- `POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`, `POST /api/tasks/reorder`
- `POST /api/timers/:type/:id/start`, `POST /api/timers/:type/:id/stop`, `GET /api/timers/active`
- `GET /api/stats/week`, `GET /api/stats/summary` (month-to-date and year-to-date totals)
- `GET/PUT /api/settings`

`:type` is either `project` or `task` throughout the timer routes.
