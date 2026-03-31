import type { WorkflowNodeData } from "../types";

export const SUGGESTED_ACTION_KEYS = [
  "message",
  "mode",
  "send",
  "create",
  "operation",
  "resource",
  "action",
  "channel",
  "method",
  "event",
] as const;

export function parseDescriptionToAction(description: string): { actionKey: string; actionValue: string } | null {
  const m = description.trim().match(/^([^:\n]+):\s*(.+)$/);
  if (!m) return null;
  const actionKey = m[1].trim();
  const actionValue = m[2].trim();
  if (!actionKey || !actionValue) return null;
  return { actionKey, actionValue };
}

export function buildActionDescription(actionKey: string, actionValue: string): string {
  const k = actionKey.trim();
  const v = actionValue.trim();
  if (k && v) return `${k}: ${v}`;
  if (k) return k;
  if (v) return v;
  return "";
}

export function getWorkflowNodeSubtitle(data: Pick<WorkflowNodeData, "description" | "actionKey" | "actionValue">): string {
  const k = data.actionKey?.trim() ?? "";
  const v = data.actionValue?.trim() ?? "";
  const built = buildActionDescription(k, v);
  if (built) return built;
  return (data.description ?? "").trim();
}
