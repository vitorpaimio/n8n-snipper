"use client";

type RightToolbarProps = {
  onOpenCreator: () => void;
  onOpenAIGenerator: () => void;
  aiPanelOpen: boolean;
};

export function RightToolbar({ onOpenCreator, onOpenAIGenerator, aiPanelOpen }: RightToolbarProps) {
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
      <button
        className={`wf-right-toolbar-btn${aiPanelOpen ? " wf-right-toolbar-btn--active" : ""}`}
        type="button"
        title="Gerar com IA"
        onClick={onOpenAIGenerator}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
      </button>
    </div>
  );
}
