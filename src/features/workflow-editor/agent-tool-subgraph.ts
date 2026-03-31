import { allNodeTemplates } from "@/workflow-kit";

import type { WorkflowCanvasEdge, WorkflowCanvasNode } from "./types";

const templateById = new Map(allNodeTemplates.map((t) => [t.id, t] as const));

/** Tipos de template que entram no subgrafo da porta Tool (layout redondo + execução na subrotina). */
const TOOL_CHAIN_TEMPLATE_TYPES = new Set(["chatModel", "memory", "tool", "communication"]);

/** Única entrada do sub-nó tool: aresta `ai` do agente ou `main` tool → tool (mesmo handle). */
export const AI_SUB_TOP_TARGET_HANDLE = "ai-sub-top";

function isToolChainableNode(node: WorkflowCanvasNode): boolean {
  const { kind } = node.data;
  if (kind === "chatModel" || kind === "memory" || kind === "tool") return true;
  const t = templateById.get(node.data.templateId);
  return t ? TOOL_CHAIN_TEMPLATE_TYPES.has(t.type) : false;
}

/**
 * Nós alcançáveis da porta Tool do agente seguindo arestas `main` apenas até outros nós
 * encadeáveis como tool (evita “absorver” nós comuns como Set).
 */
export function collectAgentToolChainNodeIds(
  edges: WorkflowCanvasEdge[],
  nodes: WorkflowCanvasNode[],
): Set<string> {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const chain = new Set<string>();
  for (const e of edges) {
    if (e.data?.kind === "ai" && e.sourceHandle === "agent-tool") {
      chain.add(e.target);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of edges) {
      if (e.data?.kind !== "main" || !chain.has(e.source) || chain.has(e.target)) continue;
      const targetNode = nodeById.get(e.target);
      if (targetNode && isToolChainableNode(targetNode)) {
        chain.add(e.target);
        changed = true;
      }
    }
  }
  return chain;
}

/**
 * Ordem das tools na subrotina: raízes na porta `agent-tool`, depois cadeia `main`
 * entre nós encadeáveis (primeira aresta por nó; desempate por id do alvo).
 */
export function expandOrderedToolsFromAgent(
  agentId: string,
  edges: WorkflowCanvasEdge[],
  nodes: WorkflowCanvasNode[],
): string[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const roots: string[] = [];
  for (const edge of edges) {
    if (
      edge.source !== agentId ||
      edge.data?.kind !== "ai" ||
      edge.sourceHandle !== "agent-tool"
    ) {
      continue;
    }
    roots.push(edge.target);
  }
  if (roots.length === 0) return [];

  const ordered: string[] = [];
  const visited = new Set<string>();

  const walkFrom = (start: string) => {
    let cur: string | null = start;
    while (cur !== null && !visited.has(cur)) {
      visited.add(cur);
      ordered.push(cur);
      const chainOuts = edges.filter((e) => {
        if (e.source !== cur || e.data?.kind !== "main") return false;
        const n = nodeById.get(e.target);
        return Boolean(n && isToolChainableNode(n));
      });
      if (chainOuts.length === 0) {
        cur = null;
      } else {
        chainOuts.sort((a, b) => a.target.localeCompare(b.target));
        const next = chainOuts[0]!.target;
        cur = visited.has(next) ? null : next;
      }
    }
  };

  roots.sort((a, b) => a.localeCompare(b));
  for (const r of roots) {
    if (!visited.has(r)) walkFrom(r);
  }
  return ordered;
}
