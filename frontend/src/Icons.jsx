import React from 'react';

// Outline-only icon set (stroke, no fill) so everything reads as one style.
const PROJECT_PATHS = [
  'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z', // folder
  'M12 2c3 3 4 6 4 9 0 3-1.5 5-4 7-2.5-2-4-4-4-7 0-3 1-6 4-9Z M9 14l-2 5 5-2 M15 14l2 5-5-2', // rocket
  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z', // target
  'M14.5 6.5a4 4 0 0 1-5 5L4 17l3 3 5.5-5.5a4 4 0 0 1 5-5l-2.7 2.7-2-2 2.7-2.7Z', // wrench
  'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.8-1.6L13.3 2h-2.6l-.4 2.9a7 7 0 0 0-2.8 1.6l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 3.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.8 1.6l.4 2.9h2.6l.4-2.9a7 7 0 0 0 2.8-1.6l2.3 1 2-3.4-2-1.5c.13-.52.2-1.06.2-1.6Z', // gear
  'M4 20V10 M10 20V4 M16 20v-7 M22 20H2', // bar chart
  'M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4l3-3Z M9 12h6', // puzzle-ish
  'M9 3h6 M10 3v5l-5 8a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-8V3', // flask
  'M4 20l4-1 10-10-3-3L5 16l-1 4Z M13 6l3 3', // pen
  'M15 12l6 6-3 3-6-6 M3 21l6-6 M9 6l3 3-6 6-3-3Z', // hammer-ish
  'M12 21v-9 M12 12C7 12 4 9 4 5c4 0 7 3 7 7Z M12 12c0-4 3-7 7-7 0 4-3 7-7 7Z', // sprout
  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M15 9l-2 6-6 2 2-6 6-2Z', // compass
  'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3 11c.6.5 1 1.3 1 2h4c0-.7.4-1.5 1-2a6 6 0 0 0-3-11Z', // lightbulb
  'M4 4h16v16H4z M4 9h16 M9 9v11', // book
];

function iconIndex(id, len) {
  const hash = (id * 2654435761) >>> 0;
  return hash % len;
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function ProjectIcon({ id, className }) {
  const d = PROJECT_PATHS[iconIndex(id, PROJECT_PATHS.length)];
  return (
    <span className={className}>
      <svg {...svgProps}><path d={d} /></svg>
    </span>
  );
}

export function PlayIcon({ className }) {
  return (
    <svg className={className} {...svgProps}><path d="M7 4.5v15l13-7.5-13-7.5Z" /></svg>
  );
}

export function PauseIcon({ className }) {
  return (
    <svg className={className} {...svgProps}><path d="M8 4.5v15 M16 4.5v15" /></svg>
  );
}

export function EditIcon({ className }) {
  return (
    <svg className={className} {...svgProps}><path d="M4 20l4-1 10-10-3-3L5 16l-1 4Z M13 6l3 3" /></svg>
  );
}

export function DeleteIcon({ className }) {
  return (
    <svg className={className} {...svgProps}><path d="M5 7h14 M9 7V4h6v3 M7 7l1 13h8l1-13 M10 11v6 M14 11v6" /></svg>
  );
}

export function RestoreIcon({ className }) {
  return (
    <svg className={className} {...svgProps}><path d="M3 11a9 9 0 1 1 2.6 6.4 M3 17v-6h6" /></svg>
  );
}

export function ChevronIcon({ className }) {
  return (
    <svg className={className} {...svgProps}><path d="M9 6l6 6-6 6" /></svg>
  );
}
