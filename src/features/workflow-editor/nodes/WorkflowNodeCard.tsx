"use client";

import {
  Handle,
  Position,
  useEdges,
  useNodeConnections,
  useNodes,
  type NodeProps,
} from "@xyflow/react";
import React, { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";

import * as N8N from "@/workflow-kit/n8n-tokens";

import { AI_SUB_TOP_TARGET_HANDLE, collectAgentToolChainNodeIds } from "../agent-tool-subgraph";
import { IF_FALSE_HANDLE_ID, IF_TRUE_HANDLE_ID } from "../if-node";
import { resolveTemplate } from "../mappers/workflow-reactflow-mapper";
import { SWITCH_DEFAULT_OUTPUT_COUNT, switchHandleId } from "../switch-node";
import type { WorkflowCanvasEdge, WorkflowCanvasNode, WorkflowNodeData } from "../types";
import { getWorkflowNodeSubtitle } from "../utils/node-subtitle";
import type { NodeVisualState } from "../types";

function ExecutionBadge({ state }: { state?: NodeVisualState }) {
  if (state === "success") {
    return (
      <div className="workflow-node-exec-badge workflow-node-exec-badge--success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="workflow-node-exec-badge workflow-node-exec-badge--error">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    );
  }
  return null;
}

/** Layout n8n AI Agent: alinhado a globals.css (--n8n-agent-*) e --canvas-node--height do n8n. */
const AI_AGENT_CARD_PX = N8N.N8N_AI_AGENT_CARD_HEIGHT_PX;
const AI_AGENT_SUBPORTS_GAP_PX = 2;
const AI_AGENT_SUBPORTS_PX = 64;
const AI_AGENT_SHELL_H = AI_AGENT_CARD_PX + AI_AGENT_SUBPORTS_GAP_PX + AI_AGENT_SUBPORTS_PX;
const AI_AGENT_DIAMOND_CENTER_Y = AI_AGENT_CARD_PX + 1;
const AI_AGENT_SUB_HANDLE_BOTTOM = AI_AGENT_SHELL_H - AI_AGENT_DIAMOND_CENTER_Y;

const AI_AGENT_SUBPORTS = [
  { id: "agent-chatModel", label: "Chat Model", required: true, category: "chatModel" as const, multi: false },
  { id: "agent-memory", label: "Memory", required: false, category: "memory" as const, multi: false },
  { id: "agent-tool", label: "Tool", required: false, category: "tool" as const, multi: true },
] as const;

function getBorderRadius(kind: WorkflowNodeData["kind"]) {
  if (kind === "trigger") return N8N.N8N_RADIUS_TRIGGER_ENTRY;
  return `${N8N.N8N_RADIUS_NODE}px`;
}

/** Só interação — toolbar/handles usam hover/selected mesmo após execução (success/error). */
function resolveInteractionState({
  isHovered,
  isSelected,
}: {
  isHovered: boolean;
  isSelected: boolean;
}): N8N.N8NNodeVisualState {
  if (isSelected) return "selected";
  if (isHovered) return "hover";
  return "idle";
}

function TriggerPanel({ onExecute }: { onExecute?: () => void }) {
  return (
    <div className="workflow-trigger-panel" onDoubleClick={(e) => e.stopPropagation()}>
      <div className="workflow-trigger-bolt-idle" aria-hidden>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
          <path
            d="M5.8 0.5L0.5 8H4.5L3.8 13.5L9.5 6H5.5L5.8 0.5Z"
            fill="#ff6d5a"
            stroke="#ff6d5a"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <button className="workflow-trigger-execute" type="button" onClick={onExecute}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="workflow-trigger-execute-bolt">
          <path
            d="M5.8 0.5L0.5 8H4.5L3.8 13.5L9.5 6H5.5L5.8 0.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </svg>
        <span>Execute workflow</span>
      </button>
    </div>
  );
}

function NodeToolbar({
  onRun,
  onDisable,
  onDelete,
  disabled,
  onMouseEnter,
  onMouseLeave,
}: {
  onRun?: () => void;
  onDisable?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      className="workflow-node-toolbar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <button className="workflow-node-toolbar-btn" type="button" title="Executar" onClick={onRun}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
      </button>
      <button
        className={`workflow-node-toolbar-btn${disabled ? " workflow-node-toolbar-btn--active" : ""}`}
        type="button"
        title={disabled ? "Ativar" : "Desativar"}
        onClick={onDisable}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 0 1 20.77 15" /><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
      </button>
      <button className="workflow-node-toolbar-btn" type="button" title="Excluir" onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
      </button>
    </div>
  );
}

function AgentSubPlus({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className="workflow-agent-sub-plus"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      role="button"
      tabIndex={-1}
      title="Adicionar nó conectado"
    >
      <svg width="24" height="70" viewBox="0 0 24 70">
        <line
          x1="12" y1="0" x2="12" y2="47"
          className="workflow-agent-sub-plus-line"
          strokeWidth="2"
        />
        <g transform="translate(0, 46)">
          <rect
            x="2" y="2" width="20" height="20" rx="4"
            className="workflow-agent-sub-plus-rect"
            strokeWidth="2"
          />
          <path
            d="M8 12h8m-4-4v8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

function HandlePlus({ onClick, label, className, style }: { onClick?: () => void; label?: string; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={["workflow-handle-plus", className].filter(Boolean).join(" ")}
      style={style}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onDoubleClick={(e) => e.stopPropagation()}
      role="button"
      tabIndex={-1}
      title="Adicionar nó conectado"
    >
      {label && <span className="workflow-handle-plus-label">{label}</span>}
      <BranchPlusSvg />
    </div>
  );
}

function BranchPlusSvg() {
  return (
    <svg width="62" height="28" viewBox="0 0 62 28">
      <line x1="0" y1="14" x2="36" y2="14" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      <rect x="34" y="2" width="24" height="24" rx="6" fill="var(--n8n-surface-alt)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" className="workflow-branch-plus-rect" />
      <path d="M42 14h8M46 10v8" stroke="var(--n8n-text-muted)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const HOVER_LINGER_MS = 400;

export function WorkflowNodeCard({ data, selected, id }: NodeProps<WorkflowCanvasNode>) {
  const template = resolveTemplate(data.templateId);
  const appEventTemplate =
    data.templateId === "appEventTrigger" && data.appEventIntegrationId
      ? resolveTemplate(data.appEventIntegrationId)
      : undefined;
  const Icon = appEventTemplate?.icon ?? template?.icon;
  const title = data.title || template?.title || "Node";
  const subtitle = getWorkflowNodeSubtitle(data);
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    cancelLeave();
    setIsHovered(true);
  }, [cancelLeave]);

  const handleMouseLeave = useCallback(() => {
    cancelLeave();
    leaveTimer.current = setTimeout(() => setIsHovered(false), HOVER_LINGER_MS);
  }, [cancelLeave]);

  const interactionState = useMemo(
    () =>
      resolveInteractionState({
        isHovered,
        isSelected: Boolean(selected),
      }),
    [isHovered, selected],
  );

  const executionState = data.visualState;

  const isTrigger = data.kind === "trigger";
  const isAiAgent = data.templateId === "aiAgent";
  const isIfNode = data.templateId === "ifNode";
  const isSwitchNode = data.templateId === "switchNode";
  const isMultiOutput = isIfNode || isSwitchNode;
  const isAiSubNode = data.kind === "chatModel" || data.kind === "memory" || data.kind === "tool";

  const switchCount = data.switchOutputCount ?? SWITCH_DEFAULT_OUTPUT_COUNT;
  const switchLabels = data.switchOutputLabels ?? [];
  const switchCardHeight = isSwitchNode && switchCount > 2
    ? Math.round(100 + (switchCount - 2) * 30.6)
    : undefined;

  const ifLabelWidth = isIfNode ? Math.max("false".length * 6.6 + 2, 12) : undefined;

  const switchLabelWidth = useMemo(() => {
    if (!isSwitchNode) return undefined;
    let maxLen = 0;
    for (let i = 0; i < switchCount; i++) {
      const l = switchLabels[i] ?? String(i);
      const truncated = l.length > 9 ? 10 : l.length;
      if (truncated > maxLen) maxLen = truncated;
    }
    return Math.max(maxLen * 6.6 + 2, 12);
  }, [isSwitchNode, switchCount, switchLabels]);
  const edges = useEdges();
  const nodes = useNodes<WorkflowCanvasNode>();
  const hasIncomingAiEdge = useMemo(
    () =>
      edges.some(
        (e) => e.target === id && !!e.data && "kind" in e.data && e.data.kind === "ai",
      ),
    [edges, id],
  );
  const toolSubgraphIds = useMemo(
    () => collectAgentToolChainNodeIds(edges as WorkflowCanvasEdge[], nodes),
    [edges, nodes],
  );
  /** Apps da categoria “tool” (WhatsApp, etc.) usam kind do template (ex.: communication), mas ligam por aresta ai; cadeia tool→tool segue arestas main. */
  const renderAsAiSub = isAiSubNode || hasIncomingAiEdge || toolSubgraphIds.has(id);
  /** Tools sob o agente são folhas: só entrada (topo), sem porta de saída. Chat Model / Memory continuam com saída. */
  const isAgentToolPortLeaf =
    data.kind === "tool" ||
    (toolSubgraphIds.has(id) && data.kind !== "chatModel" && data.kind !== "memory");
  const sourceConnections = useNodeConnections({ handleType: "source" });
  const ifTrueConnections = useNodeConnections({ handleType: "source", handleId: IF_TRUE_HANDLE_ID });
  const ifFalseConnections = useNodeConnections({ handleType: "source", handleId: IF_FALSE_HANDLE_ID });
  const hasOutgoingEdge = sourceConnections.length > 0;

  const connectedSwitchHandles = useMemo(() => {
    const set = new Set<string>();
    for (const conn of sourceConnections) {
      if (conn.sourceHandle?.startsWith("switch-")) set.add(conn.sourceHandle);
    }
    return set;
  }, [sourceConnections]);

  const connectedSubports = useMemo(() => {
    const set = new Set<string>();
    for (const conn of sourceConnections) {
      if (conn.sourceHandle) set.add(conn.sourceHandle);
    }
    return set;
  }, [sourceConnections]);

  const mainHandleTopStyle = isAiAgent ? { top: AI_AGENT_CARD_PX / 2 } : undefined;

  const aiShellStyle = useMemo((): CSSProperties | undefined => {
    if (!isAiAgent) return undefined;
    const w = N8N.n8nAiSubtypeNodeWidthPx(AI_AGENT_SUBPORTS.length);
    return {
      width: w,
      ["--n8n-agent-shell-width" as string]: `${w}px`,
    };
  }, [isAiAgent]);

  if (renderAsAiSub) {
    return (
      <div
        className="workflow-node-shell workflow-node-shell--ai-sub"
        data-node-state={interactionState}
        {...(executionState ? { "data-node-execution": executionState } : {})}
        {...(data.disabled ? { "data-node-disabled": true } : {})}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <NodeToolbar
          onRun={data.onRun}
          onDisable={() => data.onDisable?.(id)}
          onDelete={() => data.onDelete?.(id)}
          disabled={data.disabled}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        <div className="workflow-node-card workflow-node-card--ai-sub">
          <Handle
            className="workflow-handle workflow-handle--target workflow-handle--ai-sub-target"
            type="target"
            position={Position.Top}
            id={AI_SUB_TOP_TARGET_HANDLE}
          />
          <div className="workflow-node-card-icon">
            {Icon ? <Icon className="workflow-node-card-icon-svg" /> : null}
          </div>
          {!isAgentToolPortLeaf ? (
            <>
              <Handle
                className="workflow-handle workflow-handle--source workflow-handle--ai-sub-source"
                type="source"
                position={Position.Right}
              />
              {data.outputLabel && hasOutgoingEdge ? (
                <span className="workflow-handle-output-label">{data.outputLabel}</span>
              ) : null}
              {!hasOutgoingEdge ? (
                <HandlePlus onClick={() => data.onPlusClick?.(id)} label={data.outputLabel} />
              ) : null}
            </>
          ) : null}
          <ExecutionBadge state={executionState} />
        </div>
        <div className="workflow-node-meta">
          <span className="workflow-node-card-title">{title}</span>
          {subtitle ? (
            <span className="workflow-node-card-description">{subtitle}</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`workflow-node-shell${isTrigger ? " workflow-node-shell--trigger" : ""}${isAiAgent ? " workflow-node-shell--ai-agent" : ""}`}
      data-node-state={interactionState}
      {...(executionState ? { "data-node-execution": executionState } : {})}
      {...(data.disabled ? { "data-node-disabled": true } : {})}
      style={aiShellStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`workflow-node-card${isTrigger ? " workflow-node-card--trigger" : ""}${isAiAgent ? " workflow-node-card--ai-agent" : ""}${isIfNode ? " workflow-node-card--if" : ""}${isSwitchNode ? " workflow-node-card--switch" : ""}`}
        style={isAiAgent ? undefined : { borderRadius: getBorderRadius(data.kind), ...(switchCardHeight ? { height: switchCardHeight } : {}) }}
      >
        {isTrigger && <TriggerPanel onExecute={data.onExecuteWorkflow} />}
        <NodeToolbar
          onRun={data.onRun}
          onDisable={() => data.onDisable?.(id)}
          onDelete={() => data.onDelete?.(id)}
          disabled={data.disabled}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        {!isTrigger && (
          <Handle
            className="workflow-handle workflow-handle--target"
            type="target"
            position={Position.Left}
            style={mainHandleTopStyle}
          />
        )}
        {!isMultiOutput && (
          <Handle
            className={`workflow-handle workflow-handle--source${isTrigger ? " workflow-handle--trigger" : ""}`}
            type="source"
            position={Position.Right}
            style={mainHandleTopStyle}
          />
        )}
        {!isMultiOutput && data.outputLabel && hasOutgoingEdge && (
          <span className="workflow-handle-output-label">{data.outputLabel}</span>
        )}
        {!isMultiOutput && !hasOutgoingEdge && (
          <HandlePlus
            onClick={() => data.onPlusClick?.(id)}
            label={data.outputLabel}
            className={isAiAgent ? "workflow-handle-plus--aligned" : undefined}
          />
        )}
        {isAiAgent ? (
          <>
            <div className="workflow-node-card-icon">
              {Icon ? <Icon className="workflow-node-card-icon-svg" /> : null}
            </div>
            <span className="workflow-node-card-title workflow-node-card-title--inline">{title}</span>
            <div className="workflow-agent-diamonds-row">
              {AI_AGENT_SUBPORTS.map((port, index) => (
                <div
                  key={port.id}
                  className="workflow-agent-diamond-wrapper"
                  style={{ left: `${((1 + index * 2) / (AI_AGENT_SUBPORTS.length * 2)) * 100}%` }}
                >
                  <Handle
                    className="workflow-handle workflow-handle--agent-diamond"
                    type="source"
                    position={Position.Bottom}
                    id={port.id}
                  />
                </div>
              ))}
            </div>
          </>
        ) : isIfNode ? (
          <div className="workflow-node-card-icon">
            {Icon ? <Icon className="workflow-node-card-icon-svg" /> : null}
          </div>
        ) : isSwitchNode ? (
          <div className="workflow-node-card-icon">
            {Icon ? <Icon className="workflow-node-card-icon-svg" /> : null}
          </div>
        ) : (
          <div className="workflow-node-card-icon">
            {Icon ? <Icon className="workflow-node-card-icon-svg" /> : null}
          </div>
        )}
        {isIfNode ? (
          <>
            <Handle
              className="workflow-handle workflow-handle--source workflow-handle--if-true"
              type="source"
              position={Position.Right}
              id={IF_TRUE_HANDLE_ID}
            />
            <div className="workflow-switch-output" style={{ top: "25%" }}>
              <span className="workflow-switch-output-label" style={{ width: ifLabelWidth }}>true</span>
              {ifTrueConnections.length === 0 ? (
                <div
                  className="workflow-switch-output-plus"
                  onClick={(e) => { e.stopPropagation(); data.onPlusClick?.(id, undefined, IF_TRUE_HANDLE_ID); }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  role="button"
                  tabIndex={-1}
                  title="Adicionar nó conectado"
                >
                  <BranchPlusSvg />
                </div>
              ) : null}
            </div>
            <Handle
              className="workflow-handle workflow-handle--source workflow-handle--if-false"
              type="source"
              position={Position.Right}
              id={IF_FALSE_HANDLE_ID}
            />
            <div className="workflow-switch-output" style={{ top: "75%" }}>
              <span className="workflow-switch-output-label" style={{ width: ifLabelWidth }}>false</span>
              {ifFalseConnections.length === 0 ? (
                <div
                  className="workflow-switch-output-plus"
                  onClick={(e) => { e.stopPropagation(); data.onPlusClick?.(id, undefined, IF_FALSE_HANDLE_ID); }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  role="button"
                  tabIndex={-1}
                  title="Adicionar nó conectado"
                >
                  <BranchPlusSvg />
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {isSwitchNode ? (
          <>
            {Array.from({ length: switchCount }, (_, i) => {
              const hId = switchHandleId(i);
              const pct = ((i + 1) / (switchCount + 1)) * 100;
              const label = switchLabels[i] ?? String(i);
              const hasConn = connectedSwitchHandles.has(hId);
              return (
                <React.Fragment key={hId}>
                  <Handle
                    className="workflow-handle workflow-handle--source workflow-handle--switch"
                    type="source"
                    position={Position.Right}
                    id={hId}
                    style={{ top: `${pct}%` }}
                  />
                  <div className="workflow-switch-output" style={{ top: `${pct}%` }}>
                    <span className="workflow-switch-output-label" style={{ width: switchLabelWidth }}>
                      {label.length > 9 ? `${label.slice(0, 9)}…` : label}
                    </span>
                    {!hasConn ? (
                      <div
                        className="workflow-switch-output-plus"
                        onClick={(e) => { e.stopPropagation(); data.onPlusClick?.(id, undefined, hId); }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex={-1}
                        title="Adicionar nó conectado"
                      >
                        <BranchPlusSvg />
                      </div>
                    ) : null}
                  </div>
                </React.Fragment>
              );
            })}
          </>
        ) : null}
        <ExecutionBadge state={executionState} />
      </div>

      {isAiAgent ? (
        <div className="workflow-node-agent-subports">
          {AI_AGENT_SUBPORTS.map((port) => {
            const hasConnection = connectedSubports.has(port.id);
            const showPlus = port.multi || !hasConnection;
            return (
              <div key={port.id} className="workflow-agent-port-col">
                <span className="workflow-agent-port-label">
                  {port.label}
                  {port.required ? <span className="workflow-agent-required">*</span> : null}
                </span>
                {showPlus && (
                  <AgentSubPlus onClick={() => data.onPlusClick?.(id, port.category)} />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="workflow-node-meta">
        <span className="workflow-node-card-title">{title}</span>
        {subtitle ? (
          <span className="workflow-node-card-description">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
