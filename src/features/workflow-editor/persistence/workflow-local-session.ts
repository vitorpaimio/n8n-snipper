import { allNodeTemplates, type WorkflowConnectionKind } from "@/workflow-kit";

import { AI_SUB_TOP_TARGET_HANDLE } from "../agent-tool-subgraph";
import {
  edgeFromSnapshot,
  type EdgeSnapshot,
} from "../mappers/workflow-reactflow-mapper";
import type { WorkflowCanvasEdge, WorkflowCanvasNode } from "../types";

const STORAGE_KEY = "n8n-snipper.workflow.session.v1";

const knownTemplateIds = new Set<string>(allNodeTemplates.map((t) => t.id));

type NodeSnapshot = {
  id: string;
  position: { x: number; y: number };
  templateId: string;
  title: string;
  description: string;
  kind: string;
  appEventIntegrationId?: string;
  disabled?: boolean;
  simulateError?: boolean;
  outputLabel?: string;
  ifBranchOutcome?: "true" | "false";
  switchOutputCount?: number;
  switchOutputLabels?: string[];
  switchActiveOutput?: number;
  actionKey?: string;
  actionValue?: string;
};

type StoredEdge = Omit<EdgeSnapshot, "kind"> & { kind: string };

type SessionPayload = {
  version: 1;
  savedAt: string;
  nodes: NodeSnapshot[];
  edges: StoredEdge[];
};

function nodeToSnapshot(n: WorkflowCanvasNode): NodeSnapshot {
  return {
    id: n.id,
    position: n.position,
    templateId: n.data.templateId,
    title: n.data.title,
    description: n.data.description,
    kind: n.data.kind,
    ...(n.data.appEventIntegrationId ? { appEventIntegrationId: n.data.appEventIntegrationId } : {}),
    ...(n.data.disabled ? { disabled: true } : {}),
    ...(n.data.simulateError ? { simulateError: true } : {}),
    ...(n.data.outputLabel ? { outputLabel: n.data.outputLabel } : {}),
    ...(n.data.templateId === "ifNode"
      ? { ifBranchOutcome: n.data.ifBranchOutcome === "false" ? "false" : "true" }
      : {}),
    ...(n.data.templateId === "switchNode"
      ? {
          switchOutputCount: n.data.switchOutputCount ?? 2,
          switchOutputLabels: n.data.switchOutputLabels ?? ["0", "1"],
          switchActiveOutput: n.data.switchActiveOutput ?? 0,
        }
      : {}),
    ...(n.data.actionKey ? { actionKey: n.data.actionKey } : {}),
    ...(n.data.actionValue ? { actionValue: n.data.actionValue } : {}),
  };
}

function edgeToSnapshot(e: WorkflowCanvasEdge): StoredEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
    ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
    kind: e.data?.kind ?? "main",
  };
}

export function saveSession(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): void {
  const payload: SessionPayload = {
    version: 1,
    savedAt: new Date().toISOString(),
    nodes: nodes.map(nodeToSnapshot),
    edges: edges.map(edgeToSnapshot),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function isValidKind(k: unknown): k is WorkflowConnectionKind {
  return k === "main" || k === "ai";
}

export function loadSession(): {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
} | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }

  const payload = parsed as SessionPayload;
  if (
    !payload ||
    payload.version !== 1 ||
    !Array.isArray(payload.nodes) ||
    !Array.isArray(payload.edges)
  ) {
    clearSession();
    return null;
  }

  const nodes: WorkflowCanvasNode[] = [];
  for (const snap of payload.nodes) {
    if (
      typeof snap.id !== "string" ||
      typeof snap.position?.x !== "number" ||
      typeof snap.position?.y !== "number" ||
      !knownTemplateIds.has(snap.templateId)
    ) {
      continue;
    }

    const appEventIntegrationId =
      typeof snap.appEventIntegrationId === "string" && knownTemplateIds.has(snap.appEventIntegrationId)
        ? snap.appEventIntegrationId
        : undefined;

    nodes.push({
      id: snap.id,
      type: "workflowNode",
      position: { x: snap.position.x, y: snap.position.y },
      data: {
        templateId: snap.templateId as WorkflowCanvasNode["data"]["templateId"],
        title: snap.title ?? "",
        description: snap.description ?? "",
        kind: snap.kind as WorkflowCanvasNode["data"]["kind"],
        ...(appEventIntegrationId
          ? { appEventIntegrationId: appEventIntegrationId as WorkflowCanvasNode["data"]["templateId"] }
          : {}),
        ...(snap.disabled ? { disabled: true } : {}),
        ...(snap.simulateError ? { simulateError: true } : {}),
        ...(snap.outputLabel ? { outputLabel: snap.outputLabel } : {}),
        ...(snap.templateId === "ifNode"
          ? { ifBranchOutcome: snap.ifBranchOutcome === "false" ? "false" : "true" }
          : {}),
        ...(snap.templateId === "switchNode"
          ? {
              switchOutputCount: snap.switchOutputCount ?? 2,
              switchOutputLabels: snap.switchOutputLabels ?? ["0", "1"],
              switchActiveOutput: snap.switchActiveOutput ?? 0,
            }
          : {}),
        ...(snap.actionKey ? { actionKey: snap.actionKey } : {}),
        ...(snap.actionValue ? { actionValue: snap.actionValue } : {}),
      },
    });
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: WorkflowCanvasEdge[] = [];
  for (const snap of payload.edges) {
    if (
      typeof snap.id !== "string" ||
      typeof snap.source !== "string" ||
      typeof snap.target !== "string" ||
      !nodeIds.has(snap.source) ||
      !nodeIds.has(snap.target) ||
      !isValidKind(snap.kind)
    ) {
      continue;
    }

    const rawTh = snap.targetHandle ?? null;
    const targetHandle =
      rawTh === "main-sub-left" ? AI_SUB_TOP_TARGET_HANDLE : rawTh;

    edges.push(
      edgeFromSnapshot({
        id: snap.id,
        source: snap.source,
        target: snap.target,
        sourceHandle: snap.sourceHandle ?? null,
        targetHandle,
        kind: snap.kind,
      }),
    );
  }

  if (nodes.length === 0 && edges.length === 0) return null;

  return { nodes, edges };
}
