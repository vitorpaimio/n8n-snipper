"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  Position,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useState } from "react";

import type { WorkflowCanvasEdge } from "../types";

// ─── Edge routing constants (mirroring n8n's getEdgeRenderData) ─────────────
const EDGE_PADDING_BOTTOM = 130;
const EDGE_PADDING_X = 40;
const EDGE_BORDER_RADIUS = 16;
const HANDLE_SIZE = 20;

function getEdgeRenderData(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  kind: string,
): { paths: string[]; labelX: number; labelY: number } {
  const isBackward = sourceX - HANDLE_SIZE > targetX;

  // Forward connections or AI sub-edges → simple bezier
  if (!isBackward || kind === "ai") {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    return { paths: [path], labelX, labelY };
  }

  // Backward connections → two smooth-step segments that route below the nodes
  const midX = (sourceX + targetX) / 2;
  const midY = sourceY + EDGE_PADDING_BOTTOM;

  const [path1] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: midX,
    targetY: midY,
    targetPosition: Position.Right,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PADDING_X,
  });

  const [path2] = getSmoothStepPath({
    sourceX: midX,
    sourceY: midY,
    sourcePosition: Position.Left,
    targetX,
    targetY,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PADDING_X,
  });

  return { paths: [path1, path2], labelX: midX, labelY: midY };
}

// ─── Component ──────────────────────────────────────────────────────────────

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

  const { paths, labelX, labelY } = getEdgeRenderData(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data?.kind ?? "main",
  );

  return (
    <>
      {/* Render each path segment */}
      {paths.map((p, i) => (
        <BaseEdge
          key={i}
          id={i === 0 ? id : `${id}-seg-${i}`}
          path={p}
          style={style}
          markerEnd={i === paths.length - 1 ? markerEnd : undefined}
          interactionWidth={20}
        />
      ))}

      {/* Invisible wider hit area for hover detection */}
      {paths.map((p, i) => (
        <path
          key={`hit-${i}`}
          d={p}
          fill="none"
          stroke="transparent"
          strokeWidth={30}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
      ))}

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
