import React from 'react';

// Parses "* item" / "- item" lines into a nested bullet list, nesting by
// indentation (2 spaces or one tab per level). Non-list lines render as
// plain paragraphs. Intentionally minimal — just enough markdown to make
// lists (and sub-lists) readable, not a full markdown renderer.
function parseNotes(text) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let listStack = null;

  for (const raw of lines) {
    const match = raw.match(/^(\s*)[-*]\s+(.*)$/);
    if (match) {
      const indent = match[1].replace(/\t/g, '  ').length;
      const level = Math.floor(indent / 2);
      const content = match[2];
      if (!listStack) {
        const root = { level: -1, children: [] };
        listStack = [root];
        blocks.push({ type: 'list', root });
      }
      while (listStack.length > 1 && listStack[listStack.length - 1].level >= level) {
        listStack.pop();
      }
      const node = { level, text: content, children: [] };
      listStack[listStack.length - 1].children.push(node);
      listStack.push(node);
    } else {
      listStack = null;
      blocks.push({ type: 'text', value: raw });
    }
  }

  return blocks;
}

function ListNodes({ nodes }) {
  return (
    <ul>
      {nodes.map((n, i) => (
        <li key={i}>
          {n.text}
          {n.children.length > 0 && <ListNodes nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}

export default function NotesView({ text, placeholder, onClick }) {
  const blocks = parseNotes(text);
  const isEmpty = !text || !text.trim();

  return (
    <div className="notes-view" onClick={onClick} title="Click to edit">
      {isEmpty ? (
        <p className="notes-view-placeholder">{placeholder}</p>
      ) : (
        blocks.map((b, i) => (
          b.type === 'list'
            ? <ListNodes key={i} nodes={b.root.children} />
            : <p key={i}>{b.value || ' '}</p>
        ))
      )}
    </div>
  );
}
