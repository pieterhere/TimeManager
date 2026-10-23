let ctx;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function playBlip(fromFreq, toFreq) {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(fromFreq, now);
  osc.frequency.linearRampToValueAtTime(toFreq, now + 0.1);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.13, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

// Soft two-note bell, no audio asset needed.
export function playChime() {
  const c = getCtx();
  const now = c.currentTime;

  [880, 1320].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 1.5);
  });
}

export function playStartSound() {
  playBlip(440, 660);
}

export function playStopSound() {
  playBlip(660, 440);
}

// Single soft strike, marks a 15-minute mile­stone without a run.
export function playQuarterBell() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 1);
}
