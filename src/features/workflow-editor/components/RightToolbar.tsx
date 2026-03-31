"use client";

type RightToolbarProps = {
  onOpenCreator: () => void;
};

export function RightToolbar({ onOpenCreator }: RightToolbarProps) {
  return (
    <div className="wf-right-toolbar">
      <button className="wf-right-toolbar-btn" type="button" title="Adicionar nó" onClick={onOpenCreator}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button className="wf-right-toolbar-btn" type="button" title="Buscar nós">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <button className="wf-right-toolbar-btn" type="button" title="Sticky note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </button>
      <button className="wf-right-toolbar-btn" type="button" title="Painel lateral">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </button>
    </div>
  );
}
