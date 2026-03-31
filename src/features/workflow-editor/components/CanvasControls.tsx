"use client";

import { useReactFlow } from "@xyflow/react";

import * as N8N from "@/workflow-kit/n8n-tokens";

type CanvasControlsProps = {
  onClearAll: () => void;
};

export function CanvasControls({ onClearAll }: CanvasControlsProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <div className="canvas-controls">
      <button
        className="canvas-controls-btn"
        type="button"
        title="Fit view"
        onClick={() =>
          fitView({
            padding: N8N.N8N_FIT_VIEW_PADDING,
            maxZoom: N8N.N8N_FIT_VIEW_MAX_ZOOM,
          })
        }
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
      <button className="canvas-controls-btn" type="button" title="Zoom in" onClick={() => zoomIn()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <button className="canvas-controls-btn" type="button" title="Zoom out" onClick={() => zoomOut()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <button className="canvas-controls-btn" type="button" title="Undo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
      <button
        className="canvas-controls-btn"
        type="button"
        title="Tidy up"
        onClick={() =>
          fitView({
            padding: N8N.N8N_FIT_VIEW_PADDING_LOOSE,
            maxZoom: N8N.N8N_FIT_VIEW_MAX_ZOOM,
          })
        }
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
      </button>
      <button
        className="canvas-controls-btn canvas-controls-btn--clear"
        type="button"
        title="Limpar workflow (remover todos os nós)"
        onClick={onClearAll}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="18" y1="4" x2="10.5" y2="16.5" />
          <path d="M4 21h12l2.5-5H6.5L4 21z" />
        </svg>
      </button>
    </div>
  );
}
