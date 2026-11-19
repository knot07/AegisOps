import './chat-step-icon.css';

type StepKind = 'thinking' | 'pending' | 'running' | 'completed' | 'error' | 'plan';
/** Small process marks, using the workbench olive palette without enclosing tiles. */
export default function ChatStepIcon({ kind, active = false }: { kind: StepKind; active?: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"
      className={`chat-step-icon${active ? ' chat-step-icon--active' : ''}`} data-step-icon={kind}>
      {kind === 'thinking' ? <>
        <path d="M5.3 13.6C3.2 10.5 4.3 6.5 7.7 5c3.3-1.5 6.9-.2 8 2.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18.7 10.4c2.1 3.1 1 7.1-2.4 8.6-3.3 1.5-6.9.2-8-2.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".78" />
        <path d="m12 7.6 1.3 3.1 3.1 1.3-3.1 1.3-1.3 3.1-1.3-3.1L7.6 12l3.1-1.3Z" fill="currentColor" />
      </> : <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'completed' && <><path d="M19.2 11.4a7.3 7.3 0 1 1-5.6-6.5" opacity=".6" /><path d="m7.9 11.7 3.2 3.2 8.2-8.2" strokeWidth="2.2" /></>}
        {kind === 'error' && <><circle cx="12" cy="12" r="7.5" opacity=".56" /><path d="m9.3 9.3 5.4 5.4m0-5.4-5.4 5.4" strokeWidth="2" /></>}
        {kind === 'pending' && <><circle cx="12" cy="12" r="7.4" opacity=".45" /><path d="M12 7.8v4.4l2.9 1.8" /></>}
        {kind === 'running' && <g className="chat-step-icon__orbit"><circle cx="12" cy="12" r="7.2" opacity=".18" /><path d="M12 4.8a7.2 7.2 0 0 1 7.2 7.2" strokeWidth="2.2" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></g>}
        {kind === 'plan' && <><path d="M10 6h9M10 12h9M10 18h9" /><path d="m4 5.7 1.2 1.2 2.2-2.2M4 12h2M4 18h2" opacity=".65" /></>}
      </g>}
    </svg>
  );
}
