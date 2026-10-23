import React, { useEffect, useState } from 'react';
import TimerControls from './TimerControls.jsx';
import TaskCard from './TaskCard.jsx';
import WeekBar from './WeekBar.jsx';
import { formatSeconds } from '../api.js';
import { ProjectIcon } from '../Icons.jsx';

export default function ProjectBoard({
  project,
  onUpdateProject,
  onStartTimer,
  onStopTimer,
  onEditTaskTime,
  onAddTask,
  onRenameTask,
  onToggleTaskActive,
  weekStats,
  liveExtraSeconds,
}) {
  const [taskName, setTaskName] = useState('');
  const [liveProgress, setLiveProgress] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    setLiveProgress(null);
    setNotesDraft(project?.notes || '');
  }, [project?.id]);

  if (!project) {
    return <div className="board"><div className="board-empty">Pick a project from the sidebar, or add a new one.</div></div>;
  }

  const displayProgress = liveProgress != null ? liveProgress : project.progress;

  const runningTask = project.tasks.find((t) => !!t.started_at);
  // Whichever timer is actually running under this project — the main
  // play button and the header glow both track this, not just the
  // project's own (separate) stopwatch.
  const runningEntity = project.started_at
    ? { type: 'project', id: project.id }
    : runningTask
      ? { type: 'task', id: runningTask.id }
      : null;
  const anyRunning = !!runningEntity;
  const tasksTotal = project.tasks.reduce((sum, t) => sum + t.live_seconds, 0);
  const total = project.live_seconds + tasksTotal;

  function submitTask(e) {
    e.preventDefault();
    const trimmed = taskName.trim();
    if (!trimmed) return;
    onAddTask(trimmed);
    setTaskName('');
  }

  return (
    <div className="board">
      <div className="project-card">
        <div className={`board-header${anyRunning ? ' timer-active' : ''}`}>
          <h2><ProjectIcon id={project.id} className="dither-icon board-icon" />{project.name}</h2>
          <div className="total-time-block">
            <span className="total-time-label">Total</span>
            <span className="total-time-value">{formatSeconds(total)}</span>
          </div>
        </div>
        <div className="progress-edit">
          <span className="progress-edit-label">Progress</span>
          <input
            type="range"
            min="0"
            max="100"
            value={displayProgress}
            onChange={(e) => setLiveProgress(Number(e.target.value))}
            onMouseUp={(e) => onUpdateProject({ progress: Number(e.target.value) })}
            onTouchEnd={(e) => onUpdateProject({ progress: Number(e.target.value) })}
          />
          <span className="progress-edit-value">{displayProgress}%</span>
        </div>
        <WeekBar days={weekStats} liveExtraSeconds={liveExtraSeconds} />
        <TimerControls
          entity={project}
          liveSeconds={formatSeconds(project.live_seconds)}
          isRunning={anyRunning}
          onStart={(mode, preset) => onStartTimer('project', project.id, mode, preset)}
          onStop={() => runningEntity && onStopTimer(runningEntity.type, runningEntity.id)}
        />
      </div>

      <div className="project-card notes-card">
        <span className="progress-edit-label">Notes</span>
        <textarea
          className="notes-textarea"
          placeholder="Add notes for this project..."
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => { if (notesDraft !== (project.notes || '')) onUpdateProject({ notes: notesDraft }); }}
        />
      </div>

      <div className="task-list">
        {project.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStart={(mode, preset) => onStartTimer('task', task.id, mode, preset)}
            onStop={() => onStopTimer('task', task.id)}
            onEditTime={(seconds) => onEditTaskTime(task.id, seconds)}
            onRename={(name) => onRenameTask(task.id, name)}
            onToggleActive={(active) => onToggleTaskActive(task.id, active)}
          />
        ))}
      </div>

      <form className="add-task-form" onSubmit={submitTask}>
        <input
          placeholder="New task"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <button className="btn" type="submit">Add task</button>
      </form>
    </div>
  );
}
