import React, { useState } from 'react';
import { PlayIcon, PauseIcon } from '../Icons.jsx';
import { parseHMS } from '../api.js';
import { playStartSound, playStopSound } from '../chime.js';

const PRESETS = [
  { label: '15', seconds: 15 * 60 },
  { label: '30', seconds: 30 * 60 },
  { label: '1h', seconds: 60 * 60 },
];

export default function TimerControls({ entity, liveSeconds, isRunning, onStart, onStop, onEditTime, disabled }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(liveSeconds);
  const activePreset = isRunning && entity.mode === 'countdown' ? entity.preset_seconds : null;

  function openEdit() {
    if (isRunning || !onEditTime) return;
    setDraft(liveSeconds);
    setEditing(true);
  }

  function submitEdit(e) {
    e.preventDefault();
    const seconds = parseHMS(draft);
    if (seconds != null) onEditTime(seconds);
    setEditing(false);
  }

  return (
    <div className="timer-row">
      <button
        className={`play-btn${isRunning ? ' running' : ''}`}
        disabled={disabled}
        onClick={() => {
          if (isRunning) {
            playStopSound();
            onStop();
          } else {
            playStartSound();
            onStart('stopwatch');
          }
        }}
        title={disabled ? 'Reactivate to track time' : isRunning ? 'Pause' : 'Play'}
      >
        {isRunning ? <PauseIcon className="btn-icon" /> : <PlayIcon className="btn-icon" />}
      </button>
      {PRESETS.map((p) => {
        const active = activePreset === p.seconds;
        const remainingFraction = active
          ? Math.max(0, Math.min(1, 1 - entity.run_elapsed_seconds / p.seconds))
          : 1;
        return (
          <button
            key={p.label}
            className={`circle-timer-btn${active ? ' active' : ''}`}
            style={{ '--progress': remainingFraction }}
            disabled={disabled}
            onClick={() => { playStartSound(); onStart('countdown', p.seconds); }}
            title={disabled ? 'Reactivate to track time' : `${p.label} min countdown`}
          >
            <span className="circle-timer-btn-inner">{p.label}</span>
          </button>
        );
      })}
      {editing ? (
        <form className="time-edit-form" onSubmit={submitEdit}>
          <input
            autoFocus
            className="time-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitEdit}
            placeholder="H:MM:SS"
          />
        </form>
      ) : (
        <span
          className={`timer-display${!isRunning && onEditTime ? ' editable' : ''}`}
          onClick={openEdit}
          title={!isRunning && onEditTime ? 'Click to edit' : undefined}
        >
          {liveSeconds}
        </span>
      )}
    </div>
  );
}
