import React, { useEffect, useRef, useState } from 'react';
import { PenIcon, EraserIcon, UndoIcon, ClearAllIcon } from '../Icons.jsx';

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const MAX_HISTORY = 25;
const PEN_COLOR = '#d6f2df';

// A freehand drawing pad, fixed at a 1080x1920 (portrait) canvas internally
// regardless of its displayed size, so strokes stay crisp at any zoom.
// Autosaves as a PNG data URL on every completed stroke/clear/undo.
export default function DrawingPad({ value, onSave }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const historyRef = useRef([]);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      img.src = value;
    }
    // Loads once on mount only — the parent remounts this component (via
    // `key={project.id}`) whenever the selected project changes, so there's
    // no need to react to `value` changing afterwards (that'd just be our
    // own save round-tripping back through the next poll).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function pushHistory() {
    historyRef.current.push(canvasRef.current.toDataURL('image/png'));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    setCanUndo(true);
  }

  function save() {
    onSave(canvasRef.current.toDataURL('image/png'));
  }

  function handlePointerDown(e) {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    pushHistory();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    const point = getPoint(e);
    const last = lastPointRef.current;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = PEN_COLOR;
    ctx.lineWidth = tool === 'eraser' ? 50 : 6;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    save();
  }

  function handleUndo() {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    setCanUndo(historyRef.current.length > 0);
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      save();
    };
    img.src = prev;
  }

  function handleClear() {
    pushHistory();
    ctxRef.current.clearRect(0, 0, CANVAS_W, CANVAS_H);
    save();
  }

  return (
    <div className="drawing-pad">
      <div className="drawing-toolbar">
        <button type="button" className={`icon-btn${tool === 'pen' ? ' active' : ''}`} onClick={() => setTool('pen')} title="Pen">
          <PenIcon className="btn-icon" />
        </button>
        <button type="button" className={`icon-btn${tool === 'eraser' ? ' active' : ''}`} onClick={() => setTool('eraser')} title="Eraser">
          <EraserIcon className="btn-icon" />
        </button>
        <button type="button" className="icon-btn" onClick={handleUndo} disabled={!canUndo} title="Undo">
          <UndoIcon className="btn-icon" />
        </button>
        <button type="button" className="icon-btn danger" onClick={handleClear} title="Clear all">
          <ClearAllIcon className="btn-icon" />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="drawing-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
