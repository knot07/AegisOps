import type { ReactNode } from 'react';
import './workspace-glyph.css';

// Solid accents carry the silhouette; the strokes keep details legible at 15px.
const art = {
  queue: ['mint', <><rect className="glyph-fill" x="3" y="4" width="18" height="16" rx="4"/><path d="M7 8h10M7 12h4m-4 4h4m3-4 4 2.5-4 2.5Z"/></>],
  schedule: ['violet', <><rect className="glyph-fill" x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3.5v4m8-4v4m-4 5.4v3l2 1.3"/><circle cx="12" cy="15.5" r="3.5"/></>],
  timeline: ['blue', <><rect className="glyph-fill" x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 7v10m0-9h7m-7 4h4m-4 4h7"/><circle className="glyph-dot" cx="8" cy="8" r="1.1"/><circle className="glyph-dot" cx="8" cy="16" r="1.1"/></>],
  agent: ['violet', <><rect className="glyph-fill" x="4" y="7" width="16" height="13" rx="5"/><path d="M12 7V4m-2 11.5q2 1.5 4 0m-4.8-3.1h.1m5.4 0h.1"/><circle className="glyph-dot" cx="12" cy="3.5" r="1.3"/></>],
  primary: ['violet', <><path className="glyph-fill" d="m12 3 8.7 5-8.7 5-8.7-5Z"/><path d="M12 13v4m-6-5v3m12-3v3"/><circle className="glyph-dot" cx="6" cy="18" r="1.5"/><circle className="glyph-dot" cx="12" cy="19.5" r="1.5"/><circle className="glyph-dot" cx="18" cy="18" r="1.5"/></>],
  workers: ['blue', <><rect className="glyph-fill" x="2.5" y="7" width="8" height="10" rx="2.4"/><rect className="glyph-fill" x="13.5" y="7" width="8" height="10" rx="2.4"/><path d="M6.5 7V4m11 3V4m-12 8h2m9 0h2"/></>],
  delegate: ['mint', <><path d="M8 6h8a3 3 0 0 1 3 3v4m-3-2 3 3 3-3M16 18H8a3 3 0 0 1-3-3v-4m-3 2 3-3 3 3"/><circle className="glyph-dot" cx="5" cy="6" r="1.8"/><circle className="glyph-dot" cx="19" cy="18" r="1.8"/></>],
  flow: ['violet', <><path d="M8 7h3a3 3 0 0 1 3 3v4a3 3 0 0 0 3 3h1m-4-5H7"/><rect className="glyph-fill" x="3" y="4" width="6" height="6" rx="1.7"/><rect className="glyph-fill" x="3" y="10" width="5" height="5" rx="1.6"/><rect className="glyph-fill" x="16" y="14" width="5" height="6" rx="1.6"/></>],
  skill: ['blue', <><path className="glyph-fill" d="M12 7c-3-2-6-2.5-9-2v13c4-.5 6.5 0 9 2 2.5-2 5-2.5 9-2V5c-3-.5-6 0-9 2Z"/><path d="M12 7v13M6 9l3 1m6 0 3-1"/></>],
  tools: ['amber', <><rect className="glyph-fill" x="3.5" y="7" width="17" height="13" rx="3"/><path d="M8.5 7V5h7v2m-12 5h17m-10 0v3h3v-3"/></>],
  catalog: ['mint', <><rect className="glyph-fill" x="3" y="3" width="7" height="7" rx="1.8"/><rect className="glyph-fill" x="14" y="3" width="7" height="7" rx="1.8"/><rect className="glyph-fill" x="3" y="14" width="7" height="7" rx="1.8"/><path d="m17.5 13.5 4 4-4 4-4-4Z" className="glyph-fill"/></>],
  chat: ['mint', <><path className="glyph-fill" d="M6 4h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-6l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><path d="M8 10h8m-8 4h5"/></>],
  mcp: ['violet', <><path className="glyph-fill" d="M7 8h10v5a5 5 0 0 1-10 0Z"/><path d="M9 4v4m6-4v4m-3 10v3M5 8h14"/><circle className="glyph-dot" cx="12" cy="12" r="1.4"/></>],
  api: ['blue', <><path d="M6 5v14M6 12h7m0 0 4-5m-4 5 4 5"/><circle className="glyph-fill" cx="6" cy="12" r="2.4"/><circle className="glyph-fill" cx="18" cy="6" r="2.5"/><circle className="glyph-fill" cx="18" cy="18" r="2.5"/></>],
  local: ['amber', <><rect className="glyph-fill" x="3" y="5" width="18" height="14" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/></>],
  folder: ['amber', <><path className="glyph-fill" d="M3 18V7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v2m-17 7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-.7l2.1-6A1 1 0 0 0 20 11H7l-3 7Z"/></>],
  memory: ['violet', <><path className="glyph-fill" d="M6 4h9l3 3v13H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M9 10h5m-5 4h5m3-12v5m-2.5-2.5h5"/></>],
  build: ['amber', <><path className="glyph-fill" d="M4 16.5 12 8l3 3-8 8.5a2 2 0 0 1-3-3Z"/><path className="glyph-fill" d="m8 5 3-2 5 2 4 4-3 4-4-4-2 1-3-3Z"/></>],
  goal: ['mint', <><circle className="glyph-fill" cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 7-7m0 0V3m0 3h3"/></>],
  dataset: ['mint', <><path className="glyph-fill" d="M4.5 7v10c0 2.2 3.4 4 7.5 4s7.5-1.8 7.5-4V7"/><ellipse className="glyph-fill" cx="12" cy="7" rx="7.5" ry="4"/><path d="M4.5 12c0 2.2 3.4 4 7.5 4s7.5-1.8 7.5-4"/></>],
  knowledge: ['mint', <><path className="glyph-fill" d="M4 5h6v14H4Zm6 0h5v14h-5Zm5.1 1 3.5-1 3 12.8-3.4 1Z"/><path d="M6 9h2m4 0h1M6 16h2m4 0h1"/></>],
  refresh: ['blue', <><path d="M19.5 9a8 8 0 0 0-13-3L4 9m0-5v5h5m-4.5 6a8 8 0 0 0 13 3l2.5-3m0 5v-5h-5"/></>],
  folderAdd: ['amber', <><path className="glyph-fill" d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M12 10.8v5.4m-2.7-2.7h5.4"/></>],
  upload: ['mint', <><path className="glyph-fill" d="M4 13h5l1.5 2h3l1.5-2h5v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M12 12V4M8.5 7.5 12 4l3.5 3.5"/></>],
  building: ['blue', <><path className="glyph-fill" d="M4 20V8h5V4h8v5h3v11ZM9 8v12m8-11v11M12 8h2m-2 4h2m-2 4h2"/></>],
  server: ['blue', <><rect className="glyph-fill" x="3" y="4" width="18" height="7" rx="2"/><rect className="glyph-fill" x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.2M7 16.5h.2M11 7.5h6m-6 9h6"/></>],
  device: ['violet', <><path className="glyph-fill" d="m7 13 5 5 5-5 1-4-3-3-4 1Z"/><path d="m12 7 4-4m1 8 4-4M7 13l-3 3 4 4 4-3"/></>],
  models: ['violet', <><rect className="glyph-fill" x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9 3v3m6-3v3m-6 12v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3m-11-4h4v4h-4Z"/></>],
  tokens: ['blue', <><path className="glyph-fill" d="m12 3 8 5v8l-8 5-8-5V8Z"/><path d="m8 10-2 2 2 2m8-4 2 2-2 2m-3-5-2 6"/></>],
  coins: ['amber', <><ellipse className="glyph-fill" cx="11" cy="7" rx="7" ry="3.5"/><path d="M4 7v5c0 2 3 3.5 7 3.5s7-1.5 7-3.5V7m-14 5v5c0 2 3 3.5 7 3.5s7-1.5 7-3.5v-5"/></>],
  radio: ['blue', <><circle className="glyph-dot" cx="12" cy="10" r="2.3"/><path d="M12 12v8M8 20h8M7.5 6a6 6 0 0 0 0 8m9-8a6 6 0 0 1 0 8M4.5 3a10 10 0 0 0 0 14m15-14a10 10 0 0 1 0 14"/></>],
  enabled: ['mint', <><rect className="glyph-fill" x="2.5" y="6.5" width="19" height="11" rx="5.5"/><circle className="glyph-dot" cx="16" cy="12" r="2.7"/></>],
  signal: ['mint', <><rect className="glyph-fill" x="4" y="13" width="3" height="6" rx="1"/><rect className="glyph-fill" x="10.5" y="9" width="3" height="10" rx="1"/><rect className="glyph-fill" x="17" y="5" width="3" height="14" rx="1"/></>],
  save: ['mint', <><path className="glyph-fill" d="M5 4h11l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></>],
  reset: ['violet', <><path d="M5 10a7.5 7.5 0 1 1 .7 6.8M5 5v5h5"/><path d="M12 8v4l2 1.2"/></>],
  search: ['blue', <><circle className="glyph-fill" cx="10.5" cy="10.5" r="5.7"/><path d="m15 15 4.5 4.5"/></>],
  people: ['violet', <><circle className="glyph-fill" cx="9" cy="8" r="3"/><path className="glyph-fill" d="M3 19v-2a6 6 0 0 1 12 0v2Z"/><path d="M15 5a3 3 0 0 1 0 6m2 2a5 5 0 0 1 4 5v1"/></>],
  personAdd: ['mint', <><circle className="glyph-fill" cx="9" cy="7.5" r="3"/><path className="glyph-fill" d="M3 19v-2a6 6 0 0 1 12 0v2Z"/><path d="M18 7v6m-3-3h6"/></>],
  download: ['blue', <><path className="glyph-fill" d="M4 14h4l2 2h4l2-2h4v5H4Z"/><path d="M12 4v9m-3-3 3 3 3-3"/></>],
  permission: ['violet', <><path className="glyph-fill" d="m12 3 8 3v5c0 4.7-3 8.1-8 10-5-1.9-8-5.3-8-10V6Z"/><path d="m8.8 12 2.2 2.3 4.2-4.6"/></>],
  key: ['amber', <><path className="glyph-fill" d="M20 8a5 5 0 0 1-6 4.9l-6 6H4v-4l6-6a5 5 0 1 1 10-1Z"/><circle className="glyph-dot" cx="15.8" cy="7.6" r="1.3"/></>],
  check: ['mint', <><rect className="glyph-fill" x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="m7.8 12 2.8 2.8 5.6-5.6"/></>],
  fail: ['rose', <><path className="glyph-fill" d="M8 4h8l4 4v8l-4 4H8l-4-4V8Z"/><path d="M12 7.8v5.2"/><circle className="glyph-dot" cx="12" cy="16.1" r="1"/></>],
  paused: ['amber', <><rect className="glyph-fill" x="4" y="4" width="16" height="16" rx="5"/><path d="M9.5 8.5v7m5-7v7"/></>],
  duration: ['blue', <><circle className="glyph-fill" cx="12" cy="13" r="7.5"/><path d="M9.5 3h5m-2.5 2v-2m5.5 4.5 2-2M12 9v4l3 1.2"/></>],
  running: ['blue', <><path className="glyph-fill" d="M7 5.5h8l5 6.5-5 6.5H7l5-6.5Z"/><path d="M4 9h3m-4 3h5m-4 3h3"/></>],
  layers: ['blue', <><path className="glyph-fill" d="m12 4 8 4.5-8 4.5-8-4.5Z"/><path d="m4 12 8 4.5 8-4.5m-16 4 8 4.5 8-4.5"/></>],
  custom: ['violet', <><rect className="glyph-fill" x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 16 7.5-7.5m-1.8 1.8 1.7 1.7M8 7v4m-2-2h4m6 4v4m-2-2h4"/></>],
  folderMove: ['blue', <><path className="glyph-fill" d="M3.5 7a2 2 0 0 1 2-2H10l2 2h6.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><path d="M7 13h9m-3-3 3 3-3 3"/></>],
  edit: ['blue', <><path className="glyph-fill" d="m6 14 9.7-9.7a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L10 18l-5 1Z"/><path d="m13.5 6.5 4 4M13 20h7"/></>],
  delete: ['rose', <><path className="glyph-fill" d="M6 7h12l-1 12H7Z"/><path d="M4 7h16m-11 0V4h6v3m-5 3v6m4-6v6"/></>],
  list: ['violet', <><rect className="glyph-fill" x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M10 8h7m-7 4h7m-7 4h7"/><path d="M7 8h.1m-.1 4h.1m-.1 4h.1" strokeWidth="2.4"/></>],
  tune: ['violet', <><path d="M4 6h16M4 12h16M4 18h16"/><circle className="glyph-fill" cx="9" cy="6" r="2.2"/><circle className="glyph-fill" cx="15" cy="12" r="2.2"/><circle className="glyph-fill" cx="9" cy="18" r="2.2"/></>],
  filter: ['blue', <path className="glyph-fill" d="M4 5h16l-6 7v5l-4 2v-7Z"/>],
  close: ['rose', <><rect className="glyph-fill" x="4" y="4" width="16" height="16" rx="5"/><path d="m9 9 6 6m0-6-6 6"/></>],
  copy: ['blue', <><path d="M8 16H6c-1 0-2-1-2-2V6c0-1 1-2 2-2h8c1 0 2 1 2 2v2"/><rect className="glyph-fill" x="8" y="8" width="12" height="12" rx="3"/></>],
  send: ['mint', <><path className="glyph-fill" d="m4 4 16 8-16 8 3-8Z"/><path d="M7 12h6"/></>],
  file: ['blue', <><path className="glyph-fill" d="M6 3.5h8l4 4V20H6Z"/><path d="M14 3.5V8h4m-9 4h6m-6 4h6"/></>],
  attach: ['violet', <path d="m9.5 14 6-6a2 2 0 0 1 3 3l-7 7a4 4 0 0 1-6-6l7-7"/>],
  add: ['mint', <><rect className="glyph-fill" x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8m-4-4h8"/></>],
} satisfies Record<string, [string, ReactNode]>;

export type WorkspaceGlyphKind = keyof typeof art;

export default function WorkspaceGlyph({ kind, size = 'sm', className = '' }: { kind: WorkspaceGlyphKind; size?: 'micro' | 'xs' | 'sm' | 'lg' | 'empty'; className?: string }) {
  const [tone, drawing] = art[kind];
  return <span aria-hidden="true" className={`workspace-glyph workspace-glyph--${size} ${className}`} data-workspace-glyph={kind} data-tone={tone}>
    <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="var(--glyph-ink)" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{drawing}</svg>
  </span>;
}
