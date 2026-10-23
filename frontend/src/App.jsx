import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ProjectBoard from './components/ProjectBoard.jsx';
import Dashboard from './components/Dashboard.jsx';
import { api } from './api.js';
import { playChime, playQuarterBell } from './chime.js';
import { requestNotificationPermission, notify } from './notify.js';

const FOCUS_CHECK_INTERVAL_SECONDS = 60 * 60;
const QUARTER_BELL_SECONDS = 15 * 60;

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [focusPrompt, setFocusPrompt] = useState(null);
  const [weekStats, setWeekStats] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const completing = useRef(new Set());
  const runningSecondsAccum = useRef(0);
  const nextFocusThreshold = useRef(FOCUS_CHECK_INTERVAL_SECONDS);
  const quarterBellState = useRef({ key: null, startedAt: null, lastMark: 0 });

  const refreshList = useCallback(async () => {
    try {
      setProjects(await api.listProjects());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshSelected = useCallback(async (id) => {
    if (!id) return;
    try {
      setSelectedProject(await api.getProject(id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshWeekStats = useCallback(async () => {
    try {
      setWeekStats(await api.getWeekStats());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    refreshList();
    const interval = setInterval(refreshList, 5000);
    return () => clearInterval(interval);
  }, [refreshList]);

  useEffect(() => {
    refreshWeekStats();
    const interval = setInterval(refreshWeekStats, 30000);
    return () => clearInterval(interval);
  }, [refreshWeekStats]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedProject(null);
      return;
    }
    refreshSelected(selectedId);
    const interval = setInterval(() => refreshSelected(selectedId), 1000);
    return () => clearInterval(interval);
  }, [selectedId, refreshSelected]);

  // Watches whichever timer is actually running, globally — not just
  // whatever project happens to be selected — so a countdown always gets
  // stopped and announced even if you've navigated away from it.
  useEffect(() => {
    const tick = async () => {
      let active;
      try {
        active = await api.getActiveTimer();
      } catch (err) {
        console.error(err);
        return;
      }

      setActiveTimer(active || null);

      if (active) {
        runningSecondsAccum.current += 1;
        if (runningSecondsAccum.current >= nextFocusThreshold.current) {
          nextFocusThreshold.current += FOCUS_CHECK_INTERVAL_SECONDS;
          setFocusPrompt({ name: active.name });
          notify('Still focused?', `You've been running "${active.name}" for a while — checking in.`);
        }

        const key = `${active.type}-${active.id}`;

        // Ring every 15 min of run time, except the boundary a preset's own
        // completion chime already covers (so a 15-min preset never double
        // rings, and 30/60-min presets don't ring again right at the finish).
        const qb = quarterBellState.current;
        if (qb.key !== key || qb.startedAt !== active.started_at) {
          quarterBellState.current = { key, startedAt: active.started_at, lastMark: 0 };
        }
        const mark = Math.floor(active.run_elapsed_seconds / QUARTER_BELL_SECONDS);
        if (mark > quarterBellState.current.lastMark) {
          quarterBellState.current.lastMark = mark;
          const boundarySeconds = mark * QUARTER_BELL_SECONDS;
          const isCompletionBoundary = active.mode === 'countdown' && active.preset_seconds != null && boundarySeconds >= active.preset_seconds;
          if (!isCompletionBoundary) playQuarterBell();
        }

        if (
          active.mode === 'countdown' &&
          active.preset_seconds &&
          active.run_elapsed_seconds >= active.preset_seconds - 0.5 &&
          !completing.current.has(key)
        ) {
          completing.current.add(key);
          try {
            await api.stopTimer(active.type, active.id);
            playChime();
            notify('Timer finished', `"${active.name}" is done.`);
          } finally {
            completing.current.delete(key);
          }
          refreshList();
          refreshWeekStats();
          if (selectedId) refreshSelected(selectedId);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [selectedId, refreshList, refreshSelected, refreshWeekStats]);

  function handleSelectProject(id) {
    setShowDashboard(false);
    setSelectedId(id);
  }

  async function handleCreateProject(name) {
    const p = await api.createProject(name, 'current');
    await refreshList();
    setShowDashboard(false);
    setSelectedId(p.id);
  }

  async function handleUpdateProject(id, patch) {
    await api.updateProject(id, patch);
    await refreshList();
    if (id === selectedId) refreshSelected(id);
  }

  async function handleReorderProjects(targetStatus, draggedId, orderedIds) {
    const dragged = projects.find((p) => p.id === draggedId);
    if (dragged && dragged.status !== targetStatus) {
      await api.updateProject(draggedId, { status: targetStatus });
    }
    await api.reorderProjects(orderedIds);
    await refreshList();
  }

  async function handleDeleteProject(id) {
    await api.deleteProject(id);
    if (id === selectedId) setSelectedId(null);
    await refreshList();
  }

  async function handleStartTimer(type, id, mode, preset_seconds) {
    await api.startTimer(type, id, mode, preset_seconds);
    await refreshSelected(selectedId);
    await refreshList();
  }

  async function handleStopTimer(type, id) {
    await api.stopTimer(type, id);
    await refreshSelected(selectedId);
    await refreshList();
    await refreshWeekStats();
  }

  async function handleEditTaskTime(id, seconds) {
    await api.updateTask(id, { accumulated_seconds: seconds });
    await refreshSelected(selectedId);
    await refreshList();
  }

  async function handleAddTask(name) {
    await api.createTask(selectedId, name);
    await refreshSelected(selectedId);
    await refreshList();
  }

  async function handleRenameTask(id, name) {
    await api.updateTask(id, { name });
    await refreshSelected(selectedId);
  }

  async function handleToggleTaskActive(id, active) {
    await api.updateTask(id, { active });
    await refreshSelected(selectedId);
    await refreshList();
    await refreshWeekStats();
  }

  return (
    <div className="app">
      <Sidebar
        projects={projects}
        selectedId={showDashboard ? null : selectedId}
        onSelect={handleSelectProject}
        onCreate={handleCreateProject}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
        onReorder={handleReorderProjects}
        onHome={() => setShowDashboard(true)}
      />
      {showDashboard ? (
        <Dashboard
          projects={projects}
          weekStats={weekStats}
          liveExtraSeconds={activeTimer ? activeTimer.run_elapsed_seconds : 0}
          onSelect={handleSelectProject}
        />
      ) : (
        <ProjectBoard
          project={selectedProject}
          onUpdateProject={(patch) => handleUpdateProject(selectedProject.id, patch)}
          onStartTimer={handleStartTimer}
          onStopTimer={handleStopTimer}
          onEditTaskTime={handleEditTaskTime}
          onAddTask={handleAddTask}
          onRenameTask={handleRenameTask}
          onToggleTaskActive={handleToggleTaskActive}
          weekStats={weekStats}
          liveExtraSeconds={activeTimer ? activeTimer.run_elapsed_seconds : 0}
        />
      )}
      {focusPrompt && (
        <div className="focus-modal-backdrop">
          <div className="focus-modal">
            <h3>Still focused?</h3>
            <p>You've been running &ldquo;{focusPrompt.name}&rdquo; for another hour.</p>
            <button className="btn" onClick={() => setFocusPrompt(null)}>Yes, carry on</button>
          </div>
        </div>
      )}
    </div>
  );
}
