import { MarkerType, type Edge, type Node } from "@xyflow/react";

import * as N8N from "@/workflow-kit/n8n-tokens";
import {
  allNodeTemplates,
  buildReferenceN8nScene,
  type NodeTemplateId,
  type WorkflowConnection,
  type WorkflowConnectionKind,
  type WorkflowNode,
} from "@/workflow-kit";

import type { WorkflowCanvasEdge, WorkflowCanvasNode } from "../types";
import { parseDescriptionToAction } from "../utils/node-subtitle";

const templateById = new Map(allNodeTemplates.map((template) => [template.id, template]));

function resolveTemplateId(node: WorkflowNode): NodeTemplateId {
  const exact = allNodeTemplates.find(
    (template) => template.type === node.type && template.title === node.title,
  );
  if (exact) return exact.id;

  const descMatch = allNodeTemplates.find(
    (template) =>
      template.type === node.type &&
      template.description.length > 0 &&
      template.description === node.description,
  );
  if (descMatch) return descMatch.id;

  const byType = allNodeTemplates.find((template) => template.type === node.type);
  return byType?.id ?? allNodeTemplates[0].id;
}

export type BuildNodeFromTemplateOptions = {
  appEventIntegrationId?: NodeTemplateId;
};

export function buildNodeFromTemplate(
  templateId: NodeTemplateId,
  position: { x: number; y: number },
  id: string,
  options?: BuildNodeFromTemplateOptions,
): WorkflowCanvasNode {
  const template = templateById.get(templateId);
  if (!template) {
    throw new Error(`Template de node não encontrado: ${templateId}`);
  }

  if (templateId === "appEventTrigger" && options?.appEventIntegrationId) {
    const appT = templateById.get(options.appEventIntegrationId);
    if (!appT) {
      throw new Error(`Integração não encontrada: ${options.appEventIntegrationId}`);
    }
    return {
      id,
      type: "workflowNode",
      position,
      data: {
        templateId,
        appEventIntegrationId: options.appEventIntegrationId,
        title: appT.title,
        description: `Gatilho quando ocorre um evento em ${appT.title}`,
        kind: template.type,
      },
    };
  }

  const parsed = parseDescriptionToAction(template.description);

  return {
    id,
    type: "workflowNode",
    position,
    data: {
      templateId,
      title: template.title,
      description: template.description,
      kind: template.type,
      ...(parsed ? { actionKey: parsed.actionKey, actionValue: parsed.actionValue } : {}),
    },
  };
}

function toReactFlowNode(node: WorkflowNode): WorkflowCanvasNode {
  const templateId = resolveTemplateId(node);
  const parsed = parseDescriptionToAction(node.description);

  return {
    id: node.id,
    type: "workflowNode",
    position: node.position,
    data: {
      templateId,
      title: node.title,
      description: node.description,
      kind: node.type,
      ...(parsed ? { actionKey: parsed.actionKey, actionValue: parsed.actionValue } : {}),
    },
  };
}

function edgeKindToStyle(kind: WorkflowConnectionKind): Edge["style"] {
  if (kind === "ai") {
    return {
      strokeOpacity: N8N.N8N_EDGE_AI_OPACITY,
      strokeDasharray: N8N.N8N_EDGE_AI_DASH,
    };
  }

  return {
    strokeOpacity: N8N.N8N_EDGE_STROKE_OPACITY,
  };
}

const MAIN_MARKER_END = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: N8N.N8N_COLORS.edgeIdle,
} as const;

function toReactFlowEdge(connection: WorkflowConnection, index: number): WorkflowCanvasEdge {
  const kind = connection.kind ?? "main";
  const className = [
    "workflow-edge",
    `workflow-edge--${kind}`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: `edge-${connection.from}-${connection.to}-${kind}-${index}`,
    type: "workflowEdge",
    source: connection.from,
    target: connection.to,
    animated: false,
    className,
    style: edgeKindToStyle(kind),
    markerEnd: kind === "main" ? MAIN_MARKER_END : undefined,
    data: { kind },
  };
}

export function buildReferenceGraph(): {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
} {
  const { nodes, connections } = buildReferenceN8nScene();

  return {
    nodes: nodes.map(toReactFlowNode),
    edges: connections.map(toReactFlowEdge),
  };
}

export function buildMainEdge({
  source,
  target,
}: {
  source: string;
  target: string;
}): WorkflowCanvasEdge {
  return edgeFromSnapshot({
    id: `edge-${source}-${target}-${Date.now()}`,
    source,
    target,
    kind: "main",
  });
}

export function buildAiSubEdge({
  source,
  target,
  sourceHandle,
}: {
  source: string;
  target: string;
  sourceHandle: string;
}): WorkflowCanvasEdge {
  return edgeFromSnapshot({
    id: `edge-${source}-${target}-ai-${Date.now()}`,
    source,
    target,
    sourceHandle,
    kind: "ai",
  });
}

export type EdgeSnapshot = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  kind: WorkflowConnectionKind;
};

export function edgeFromSnapshot(snap: EdgeSnapshot): WorkflowCanvasEdge {
  return {
    id: snap.id,
    type: "workflowEdge",
    source: snap.source,
    target: snap.target,
    ...(snap.sourceHandle ? { sourceHandle: snap.sourceHandle } : {}),
    ...(snap.targetHandle ? { targetHandle: snap.targetHandle } : {}),
    className: `workflow-edge workflow-edge--${snap.kind}`,
    style: edgeKindToStyle(snap.kind),
    markerEnd: snap.kind === "main" ? MAIN_MARKER_END : undefined,
    data: { kind: snap.kind },
  };
}

export function resolveTemplate(templateId: NodeTemplateId) {
  return templateById.get(templateId);
}

export { templateById };
