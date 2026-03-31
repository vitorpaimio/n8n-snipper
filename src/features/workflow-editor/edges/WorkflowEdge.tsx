"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useState } from "react";

import type { WorkflowCanvasEdge } from "../types";

export function WorkflowEdge({
  id,
  source,
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<WorkflowCanvasEdge>) {
  const { deleteElements } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        interactionWidth={20}
      />

      {/* Invisible wider hit area for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      <EdgeLabelRenderer>
        <div
          className={`workflow-edge-toolbar${hovered ? " workflow-edge-toolbar--visible" : ""}`}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: hovered ? "all" : "none",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {(() => {
            const SINGLE_HANDLES = new Set(["agent-chatModel", "agent-memory"]);
            const isSingleSubport = sourceHandleId && SINGLE_HANDLES.has(sourceHandleId);
            if (isSingleSubport) return null;

            const HANDLE_TO_CATEGORY: Record<string, string> = {
              "agent-chatModel": "chatModel",
              "agent-memory": "memory",
              "agent-tool": "tool",
            };
            const category = sourceHandleId ? HANDLE_TO_CATEGORY[sourceHandleId] : undefined;
            return (
              <button
                className="workflow-edge-toolbar-btn"
                type="button"
                title="Adicionar nó"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("workflow:edge-plus", {
                      detail: { sourceId: source, category, sourceHandleId: sourceHandleId ?? null },
                    }),
                  );
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            );
          })()}
          <button
            className="workflow-edge-toolbar-btn"
            type="button"
            title="Remover conexão"
            onClick={() => deleteElements({ edges: [{ id }] })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
