import React from 'react';
import { formatSeconds, localDateKey } from '../api.js';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function WeekBar({ days, liveExtraSeconds = 0, dailyTargetSeconds = 0 }) {
  if (!days || days.length === 0) return null;

  const today = localDateKey();
  const adjusted = days.map((d) => ({
    ...d,
    seconds: d.date === today ? d.seconds + liveExtraSeconds : d.seconds,
  }));

  // With a daily target set, each column's height is relative to that
  // target (full bar = target reached) instead of to the tallest day.
  const max = dailyTargetSeconds > 0 ? dailyTargetSeconds : Math.max(...adjusted.map((d) => d.seconds), 1);
  const weekTotal = adjusted.reduce((sum, d) => sum + d.seconds, 0);

  return (
    <div className="week-bar">
      <div className="week-bar-days">
        {adjusted.map((d) => {
          const [y, m, day] = d.date.split('-').map(Number);
          const weekday = DAY_LABELS[new Date(y, m - 1, day).getDay()];
          const isToday = d.date === today;
          const heightPct = Math.min(100, Math.max(6, Math.round((d.seconds / max) * 100)));
          return (
            <div
              key={d.date}
              className={`week-bar-col${isToday ? ' today' : ''}`}
              title={`${weekday}: ${formatSeconds(d.seconds)}`}
            >
              <div className="week-bar-track">
                <div className="week-bar-fill" style={{ height: `${heightPct}%` }} />
              </div>
              <span className="week-bar-label">{weekday}</span>
            </div>
          );
        })}
      </div>
      <div className="week-bar-total">
        <span className="week-bar-total-label">This week</span>
        <span className="week-bar-total-value">{formatSeconds(weekTotal)}</span>
      </div>
    </div>
  );
}
