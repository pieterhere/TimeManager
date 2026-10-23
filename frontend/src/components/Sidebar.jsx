import React, { useState } from 'react';
import { formatSeconds } from '../api.js';
import { ProjectIcon, EditIcon, DeleteIcon, ChevronIcon } from '../Icons.jsx';

const GROUPS = [
  { key: 'current', label: 'Current' },
  { key: 'future', label: 'Future' },
  { key: 'maybe', label: 'Maybe' },
  { key: 'finished', label: 'Finished' },
];

const COLLAPSIBLE_KEYS = ['future', 'maybe', 'finished'];
const COLLAPSED_STORAGE_KEY = 'tm_collapsed_groups';

function loadCollapsed() {
  try {
    const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function ProjectRow({ project, selected, onSelect, onUpdate, onDelete, onDragStart, onDragEnd, onDragOverRow, onDropRow, dragOver }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onUpdate({ name: trimmed, status });
    setEditing(false);
  }

  if (editing) {
    return (
      <form className="edit-form" onSubmit={submit}>
        <div className="edit-form-row">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="edit-form-row">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {GROUPS.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
          <button className="btn" type="submit">Save</button>
          <button className="btn secondary" type="button" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`project-row${selected ? ' selected' : ''}${project.status === 'finished' ? ' finished' : ''}${dragOver ? ' drag-over-row' : ''}`}
      onClick={onSelect}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(project.id)); onDragStart(project.id); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOverRow(project.id); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropRow(e, project.status, project.id); }}
    >
      <ProjectIcon id={project.id} className="dither-icon" />
      <div className="project-row-main">
        <span className="project-row-name">{project.name}</span>
        <span className="project-row-time">{formatSeconds(project.live_total_seconds)}</span>
        <div className="project-row-progress-track">
          <div className="project-row-progress-fill" style={{ width: `${project.progress}%` }} />
        </div>
      </div>
      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Edit">
        <EditIcon className="btn-icon" />
      </button>
      <button
        className="icon-btn danger"
        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${project.name}"? This removes all its tasks too.`)) onDelete(); }}
        title="Delete"
      >
        <DeleteIcon className="btn-icon" />
      </button>
    </div>
  );
}

export default function Sidebar({ projects, selectedId, onSelect, onCreate, onUpdate, onDelete, onReorder, onHome }) {
  const [newName, setNewName] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  function toggleGroup(key) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function submitNew(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName('');
  }

  // Drop onto a group's empty space (no specific row target) appends to the end.
  function handleDrop(e, groupKey) {
    e.preventDefault();
    setDragOverGroup(null);
    setDragOverRowId(null);
    dropOnTarget(e, groupKey, null);
  }

  // Drop onto a specific row inserts before it, reordering within (or across) groups.
  function handleDropOnRow(e, groupKey, targetId) {
    setDragOverGroup(null);
    setDragOverRowId(null);
    dropOnTarget(e, groupKey, targetId);
  }

  function dropOnTarget(e, targetStatus, targetId) {
    const draggedId = Number(e.dataTransfer.getData('text/plain'));
    if (!draggedId || draggedId === targetId) return;

    const groupIds = projects
      .filter((p) => p.status === targetStatus && p.id !== draggedId)
      .sort((a, b) => a.position - b.position)
      .map((p) => p.id);

    let insertAt = groupIds.length;
    if (targetId != null) {
      const idx = groupIds.indexOf(targetId);
      if (idx !== -1) insertAt = idx;
    }
    groupIds.splice(insertAt, 0, draggedId);

    onReorder(targetStatus, draggedId, groupIds);
  }

  return (
    <div className="sidebar">
      <h1 className="logo-home" onClick={onHome} title="Overview"><span className="logo-dither">Time Manager</span></h1>
      <form className="add-project-form" onSubmit={submitNew}>
        <input
          placeholder="New project"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn" type="submit">Add</button>
      </form>

      {GROUPS.map((g) => {
        const groupProjects = projects.filter((p) => p.status === g.key);
        const collapsible = COLLAPSIBLE_KEYS.includes(g.key);
        const isCollapsed = collapsible && collapsed.has(g.key);
        return (
          <div
            className={`sidebar-group${dragOverGroup === g.key ? ' drag-over' : ''}`}
            key={g.key}
            onDragOver={(e) => { e.preventDefault(); setDragOverGroup(g.key); }}
            onDragLeave={() => setDragOverGroup((cur) => (cur === g.key ? null : cur))}
            onDrop={(e) => handleDrop(e, g.key)}
          >
            <h2
              className={collapsible ? 'collapsible' : ''}
              onClick={collapsible ? () => toggleGroup(g.key) : undefined}
            >
              <span>{g.label}</span>
              <span className="sidebar-group-count">{groupProjects.length}</span>
              {collapsible && <ChevronIcon className={`chevron-icon${isCollapsed ? '' : ' expanded'}`} />}
            </h2>
            {!isCollapsed && (
              <>
                {groupProjects.length === 0 && draggingId != null && (
                  <div className="sidebar-drop-hint">drop here</div>
                )}
                {groupProjects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    selected={p.id === selectedId}
                    onSelect={() => onSelect(p.id)}
                    onUpdate={(patch) => onUpdate(p.id, patch)}
                    onDelete={() => onDelete(p.id)}
                    onDragStart={setDraggingId}
                    onDragEnd={() => { setDraggingId(null); setDragOverGroup(null); setDragOverRowId(null); }}
                    onDragOverRow={setDragOverRowId}
                    onDropRow={handleDropOnRow}
                    dragOver={dragOverRowId === p.id && draggingId !== p.id}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
