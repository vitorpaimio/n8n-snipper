import type React from "react";

export type WorkflowNodeKind =
  | "trigger"
  | "ai"
  | "chatModel"
  | "memory"
  | "tool"
  | "condition"
  | "communication"
  | "data"
  | "utility"
  | "productivity"
  | "marketing"
  | "ecommerce"
  | "animation";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeKind;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  position: { x: number; y: number };
}

export type WorkflowConnectionKind = "main" | "ai";

export interface WorkflowConnection {
  from: string;
  to: string;
  kind?: WorkflowConnectionKind;
}

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 100;
