import React, { useEffect, useRef, useState } from 'react';
import TimerControls from './TimerControls.jsx';
import TaskCard from './TaskCard.jsx';
import WeekBar from './WeekBar.jsx';
import DrawingPad from './DrawingPad.jsx';
import NotesView from './NotesView.jsx';
import { formatSeconds, liveSecondsNow } from '../api.js';
import { ProjectIcon } from '../Icons.jsx';

const STATUS_GROUPS = [
  { key: 'current', label: 'Current' },
  { key: 'future', label: 'Future' },
  { key: 'maybe', label: 'Maybe' },
  { key: 'finished', label: 'Finished' },
];

export default function ProjectBoard({
  project,
  onUpdateProject,
  onStartTimer,
  onStopTimer,
  onEditTaskTime,
  onAddTask,
  onRenameTask,
  onToggleTaskActive,
  onReorderTasks,
  weekStats,
  liveExtraSeconds,
  dailyTargetSeconds,
  defaultHashtags,
}) {
  const [taskName, setTaskName] = useState('');
  const [liveProgress, setLiveProgress] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [postHashtags, setPostHashtags] = useState('');
  const [copied, setCopied] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const [notesEditing, setNotesEditing] = useState(false);
  const [, setTick] = useState(0);
  const notesTextareaRef = useRef(null);

  useEffect(() => {
    if (notesEditing) notesTextareaRef.current?.focus();
  }, [notesEditing]);

  useEffect(() => {
    setLiveProgress(null);
    setNotesDraft(project?.notes || '');
    setNotesEditing(false);
    setPostTitle(project?.post_title || '');
    setPostText(project?.post_text || '');
    setPostHashtags(project?.post_hashtags || defaultHashtags || '');
    setCopied(false);
  }, [project?.id]);

  const runningTask = project?.tasks.find((t) => !!t.started_at);
  // Whichever timer is actually running under this project — the main
  // play button and the header glow both track this, not just the
  // project's own (separate) stopwatch.
  const runningEntity = project?.started_at
    ? { type: 'project', id: project.id }
    : runningTask
      ? { type: 'task', id: runningTask.id }
      : null;
  const anyRunning = !!runningEntity;

  // Ticks every second whenever something's running, so the Total figure
  // keeps counting on its own instead of waiting for the next poll. Must
  // stay above the `if (!project)` early return below — hooks can't be
  // conditional, or React throws error #310 as soon as project is null.
  useEffect(() => {
    if (!anyRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [anyRunning, project?.id]);

  if (!project) {
    return <div className="board"><div className="board-empty">Pick a project from the sidebar, or add a new one.</div></div>;
  }

  const displayProgress = liveProgress != null ? liveProgress : project.progress;
  const tasksTotal = project.tasks.reduce((sum, t) => sum + liveSecondsNow(t), 0);
  const total = liveSecondsNow(project) + tasksTotal;

  function handleTaskDragStart(id) {
    setDraggingTaskId(id);
  }
  function handleTaskDragEnd() {
    setDraggingTaskId(null);
    setDragOverTaskId(null);
  }
  function handleTaskDrop(e, targetId) {
    e.preventDefault();
    const draggedId = Number(e.dataTransfer.getData('text/plain'));
    setDragOverTaskId(null);
    setDraggingTaskId(null);
    if (!draggedId || draggedId === targetId || !onReorderTasks) return;

    const ids = project.tasks.map((t) => t.id).filter((id) => id !== draggedId);
    let insertAt = ids.length;
    if (targetId != null) {
      const idx = ids.indexOf(targetId);
      if (idx !== -1) insertAt = idx;
    }
    ids.splice(insertAt, 0, draggedId);
    onReorderTasks(ids);
  }

  async function copyFormattedPost() {
    const formatted = `${postTitle} ${postText} ${postHashtags}`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable/denied — nothing more we can do silently
    }
  }

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
          <span className="progress-edit-label">Status</span>
          <span className={`status-badge status-${project.status}`}>
            {STATUS_GROUPS.find((g) => g.key === project.status)?.label || project.status}
          </span>
          <select
            className="status-select"
            value={project.status}
            onChange={(e) => onUpdateProject({ status: e.target.value })}
          >
            {STATUS_GROUPS.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
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
        <WeekBar days={weekStats} liveExtraSeconds={liveExtraSeconds} dailyTargetSeconds={dailyTargetSeconds} />
        <TimerControls
          entity={project}
          liveSeconds={formatSeconds(project.live_seconds)}
          isRunning={anyRunning}
          onStart={(mode, preset) => onStartTimer('project', project.id, mode, preset)}
          onStop={() => runningEntity && onStopTimer(runningEntity.type, runningEntity.id)}
          onEditTime={(seconds) => onUpdateProject({ accumulated_seconds: seconds })}
        />
      </div>

      <div className="board-row">
        <div className="project-card drawing-card">
          <span className="progress-edit-label">Drawing</span>
          <DrawingPad
            key={project.id}
            value={project.drawing_data}
            onSave={(drawing_data) => onUpdateProject({ drawing_data })}
          />
        </div>

        <div className="project-card notes-tasks-card">
          <div className="notes-card">
            <div className="notes-col">
              <span className="progress-edit-label">Notes</span>
              {notesEditing ? (
                <textarea
                  ref={notesTextareaRef}
                  className="notes-textarea notes-textarea-main"
                  placeholder="Add notes for this project... (* item for a bullet list, indent with 2 spaces for sub-items)"
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => {
                    if (notesDraft !== (project.notes || '')) onUpdateProject({ notes: notesDraft });
                    setNotesEditing(false);
                  }}
                />
              ) : (
                <NotesView
                  text={notesDraft}
                  placeholder="Add notes for this project... (* item for a bullet list)"
                  onClick={() => setNotesEditing(true)}
                />
              )}
            </div>
            <div className="notes-col">
              <span className="progress-edit-label">Post composer</span>
              <input
                className="post-field"
                placeholder="Title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                onBlur={() => { if (postTitle !== (project.post_title || '')) onUpdateProject({ post_title: postTitle }); }}
              />
              <textarea
                className="notes-textarea post-field"
                placeholder="Text"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onBlur={() => { if (postText !== (project.post_text || '')) onUpdateProject({ post_text: postText }); }}
              />
              <input
                className="post-field"
                placeholder="#hashtags"
                value={postHashtags}
                onChange={(e) => setPostHashtags(e.target.value)}
                onBlur={() => { if (postHashtags !== (project.post_hashtags || '')) onUpdateProject({ post_hashtags: postHashtags }); }}
              />
              <button className="btn secondary" type="button" onClick={copyFormattedPost}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="tasks-section">
            <span className="progress-edit-label">Tasks</span>
            <div className="task-list">
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-drag-wrap${dragOverTaskId === task.id && draggingTaskId !== task.id ? ' drag-over-row' : ''}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(task.id)); handleTaskDragStart(task.id); }}
                  onDragEnd={handleTaskDragEnd}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTaskId(task.id); }}
                  onDrop={(e) => handleTaskDrop(e, task.id)}
                >
                  <TaskCard
                    task={task}
                    onStart={(mode, preset) => onStartTimer('task', task.id, mode, preset)}
                    onStop={() => onStopTimer('task', task.id)}
                    onEditTime={(seconds) => onEditTaskTime(task.id, seconds)}
                    onRename={(name) => onRenameTask(task.id, name)}
                    onToggleActive={(active) => onToggleTaskActive(task.id, active)}
                  />
                </div>
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
        </div>
      </div>
    </div>
  );
}
