import React, { useEffect, useState } from 'react';

export default function Settings({ settings, onSave }) {
  const [defaultHashtags, setDefaultHashtags] = useState(settings.default_hashtags || '');
  const [dailyMinHours, setDailyMinHours] = useState(settings.daily_minimum_hours || '');
  const [saved, setSaved] = useState(false);
  const [savedDaily, setSavedDaily] = useState(false);

  useEffect(() => {
    setDefaultHashtags(settings.default_hashtags || '');
  }, [settings.default_hashtags]);

  useEffect(() => {
    setDailyMinHours(settings.daily_minimum_hours || '');
  }, [settings.daily_minimum_hours]);

  async function handleSave(e) {
    e.preventDefault();
    await onSave({ default_hashtags: defaultHashtags });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleSaveDailyMin(e) {
    e.preventDefault();
    await onSave({ daily_minimum_hours: dailyMinHours });
    setSavedDaily(true);
    setTimeout(() => setSavedDaily(false), 1500);
  }

  return (
    <div className="board">
      <h2 className="dashboard-title">Settings</h2>

      <div className="project-card">
        <h3 className="dashboard-section-title">Default hashtags</h3>
        <p className="settings-help">
          Prefills a new project's post-composer hashtags field. Each project can still
          change or clear it freely — this is just the starting text.
        </p>
        <form onSubmit={handleSave} className="notes-col">
          <input
            className="post-field"
            placeholder="#hashtags"
            value={defaultHashtags}
            onChange={(e) => setDefaultHashtags(e.target.value)}
          />
          <button className="btn" type="submit">{saved ? 'Saved!' : 'Save'}</button>
        </form>
      </div>

      <div className="project-card">
        <h3 className="dashboard-section-title">Minimum daily work time</h3>
        <p className="settings-help">
          Target hours per day. The week bar's daily columns fill up to this — a full
          bar means that day hit the target. Leave blank to go back to scaling against
          the busiest day instead.
        </p>
        <form onSubmit={handleSaveDailyMin} className="notes-col">
          <input
            className="post-field"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 8"
            value={dailyMinHours}
            onChange={(e) => setDailyMinHours(e.target.value)}
          />
          <button className="btn" type="submit">{savedDaily ? 'Saved!' : 'Save'}</button>
        </form>
      </div>
    </div>
  );
}
