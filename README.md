# Time Manager

Self-hosted project time tracker. Organize projects into status columns, clock time per project or per task, track completion with a progress slider, and see a dashboard overview of where your time actually went.

## Features

- **Projects grouped by status** — Current, Future, Maybe, Finished — with drag-and-drop to reorder within a group or move between groups.
- **Per-project and per-task timers** — stopwatch or countdown mode, with a quarter-hour bell and a focus check-in after an hour of continuous running.
- **Progress slider** — set roughly how done a project is; shown as a thin bar in the sidebar listing too.
- **Notes** — a free-text box on each project page for anything worth remembering.
- **Dashboard (home page)** — total work time, longest-worked project, latest project, this week's activity chart, and all active projects ranked by progress. Click the "Time Manager" title anytime to get back to it.
- **Weekly activity chart** — a 7-day bar chart of logged time, independent of any single project.

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
