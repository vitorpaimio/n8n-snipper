"use client";

type CanvasEmptyStateProps = {
  onAddFirst: () => void;
};

export function CanvasEmptyState({ onAddFirst }: CanvasEmptyStateProps) {
  return (
    <div className="wf-canvas-empty">
      <button className="wf-canvas-empty-trigger" type="button" onClick={onAddFirst} aria-label="Adicionar primeiro passo">
        <span className="wf-canvas-empty-box" aria-hidden>
          <span className="wf-canvas-empty-plus">+</span>
        </span>
        <span className="wf-canvas-empty-label">Adicione o primeiro passo…</span>
      </button>
    </div>
  );
}
