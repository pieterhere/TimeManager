import React from 'react';
import WeekBar from './WeekBar.jsx';
import { formatSeconds } from '../api.js';
import { ProjectIcon } from '../Icons.jsx';

export default function Dashboard({ projects, weekStats, liveExtraSeconds, onSelect }) {
  const active = projects.filter((p) => p.status !== 'finished');

  const latest = [...projects].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0];

  const longest = [...projects].sort(
    (a, b) => b.live_total_seconds - a.live_total_seconds
  )[0];

  const totalSeconds = projects.reduce((sum, p) => sum + p.live_total_seconds, 0);

  const byProgress = [...active].sort((a, b) => b.progress - a.progress);

  return (
    <div className="board">
      <h2 className="dashboard-title">Overview</h2>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-card-label">Total work time</span>
          <span className="stat-card-value">{formatSeconds(totalSeconds)}</span>
        </div>
        <div className="stat-card clickable" onClick={() => longest && onSelect(longest.id)}>
          <span className="stat-card-label">Longest worked on</span>
          <span className="stat-card-value stat-card-value-sm">{longest ? longest.name : '—'}</span>
          {longest && <span className="stat-card-sub">{formatSeconds(longest.live_total_seconds)}</span>}
        </div>
        <div className="stat-card clickable" onClick={() => latest && onSelect(latest.id)}>
          <span className="stat-card-label">Latest project</span>
          <span className="stat-card-value stat-card-value-sm">{latest ? latest.name : '—'}</span>
        </div>
      </div>

      <div className="project-card">
        <WeekBar days={weekStats} liveExtraSeconds={liveExtraSeconds} />
      </div>

      <div className="project-card">
        <h3 className="dashboard-section-title">Projects by progress</h3>
        <div className="progress-list">
          {byProgress.length === 0 && <div className="board-empty" style={{ margin: 0 }}>No active projects yet.</div>}
          {byProgress.map((p) => (
            <div className="progress-list-row" key={p.id} onClick={() => onSelect(p.id)}>
              <ProjectIcon id={p.id} className="dither-icon" />
              <span className="progress-list-name">{p.name}</span>
              <div className="progress-list-track">
                <div className="progress-list-fill" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="progress-list-value">{p.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
