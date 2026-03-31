import type { Edge, Node } from "@xyflow/react";

import type {
  NodeTemplateId,
  WorkflowConnectionKind,
  WorkflowNodeKind,
} from "@/workflow-kit";

export type NodeVisualState = "running" | "error" | "success";

export type WorkflowNodeData = {
  templateId: NodeTemplateId;
  title: string;
  description: string;
  /** App escolhido ao adicionar o gatilho "On App Event" (id de template de integração). */
  appEventIntegrationId?: NodeTemplateId;
  actionKey?: string;
  actionValue?: string;
  kind: WorkflowNodeKind;
  visualState?: NodeVisualState;
  disabled?: boolean;
  simulateError?: boolean;
  outputLabel?: string;
  onDelete?: (nodeId: string) => void;
  onDisable?: (nodeId: string) => void;
  onRun?: () => void;
  onExecuteWorkflow?: () => void;
  onPlusClick?: (nodeId: string, subportCategory?: string) => void;
};

export type WorkflowEdgeData = {
  kind: WorkflowConnectionKind;
  visualState?: NodeVisualState | undefined;
};

export type WorkflowCanvasNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowCanvasEdge = Edge<WorkflowEdgeData>;
