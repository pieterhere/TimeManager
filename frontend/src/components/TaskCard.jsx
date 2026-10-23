import React, { useState } from 'react';
import TimerControls from './TimerControls.jsx';
import { formatSeconds } from '../api.js';
import { EditIcon, DeleteIcon, RestoreIcon } from '../Icons.jsx';

export default function TaskCard({ task, onStart, onStop, onEditTime, onRename, onToggleActive }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);

  const isRunning = !!task.started_at;
  const inactive = !task.active;

  function submitRename(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== task.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className={`task-card${inactive ? ' inactive' : ''}`}>
      <div className="task-name">
        {editing ? (
          <form onSubmit={submitRename}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitRename}
            />
          </form>
        ) : (
          <span onDoubleClick={() => setEditing(true)}>{task.name}</span>
        )}
      </div>
      <TimerControls
        entity={task}
        liveSeconds={formatSeconds(task.live_seconds)}
        isRunning={isRunning}
        disabled={inactive}
        onStart={(mode, preset) => onStart(mode, preset)}
        onStop={onStop}
        onEditTime={onEditTime}
      />
      <button className="icon-btn" onClick={() => setEditing(true)} title="Rename">
        <EditIcon className="btn-icon" />
      </button>
      {inactive ? (
        <button className="icon-btn" onClick={() => onToggleActive(true)} title="Reactivate">
          <RestoreIcon className="btn-icon" />
        </button>
      ) : (
        <button className="icon-btn danger" onClick={() => onToggleActive(false)} title="Mark finished">
          <DeleteIcon className="btn-icon" />
        </button>
      )}
    </div>
  );
}
