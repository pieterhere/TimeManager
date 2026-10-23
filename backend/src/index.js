import express from 'express';
import cors from 'cors';
import { initSchema, waitForDb } from './db.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import timersRouter from './routes/timers.js';
import statsRouter from './routes/stats.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/timers', timersRouter);
app.use('/api/stats', statsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const port = process.env.PORT || 4000;

async function main() {
  await waitForDb();
  await initSchema();
  app.listen(port, () => console.log(`backend listening on ${port}`));
}

main().catch((err) => {
  console.error('failed to start', err);
  process.exit(1);
});
