import type { WorkflowNodeKind } from "./graph-model";

const LABELS: Record<WorkflowNodeKind, string> = {
  trigger: "Gatilho",
  ai: "IA",
  chatModel: "Language Model",
  memory: "Memory",
  tool: "Tool",
  condition: "Condição",
  communication: "Comunicação",
  data: "Dados",
  utility: "Utilitário",
  productivity: "Produtividade",
  marketing: "Marketing / CRM",
  ecommerce: "E-commerce",
  animation: "Animação",
};

export function workflowNodeKindLabel(kind: WorkflowNodeKind): string {
  return LABELS[kind];
}
