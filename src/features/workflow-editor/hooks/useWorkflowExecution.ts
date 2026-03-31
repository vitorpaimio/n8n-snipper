import { useCallback, useRef, useState } from "react";
import { collectAgentToolChainNodeIds, expandOrderedToolsFromAgent } from "../agent-tool-subgraph";
import { IF_FALSE_HANDLE_ID, IF_TRUE_HANDLE_ID } from "../if-node";
import { switchHandleId } from "../switch-node";
import type { WorkflowCanvasEdge, WorkflowCanvasNode, NodeVisualState } from "../types";

type SetNodes = React.Dispatch<React.SetStateAction<WorkflowCanvasNode[]>>;
type SetEdges = React.Dispatch<React.SetStateAction<WorkflowCanvasEdge[]>>;

type UseWorkflowExecutionOptions = {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  setNodes: SetNodes;
  setEdges: SetEdges;
};

type AiAgentSubNodes = {
  chatModel: string | null;
  memory: string | null;
  tools: string[];
};

const HANDLE_TO_ROLE: Record<string, keyof AiAgentSubNodes> = {
  "agent-chatModel": "chatModel",
  "agent-memory": "memory",
  "agent-tool": "tools",
};

const AI_SUB_KINDS = new Set(["chatModel", "memory", "tool"]);

/** Destinos de arestas ai (sub-nós do agente); inclui apps na porta Tool com kind ex.: communication. */
function targetsOfAiEdges(edges: WorkflowCanvasEdge[]): Set<string> {
  const s = new Set<string>();
  for (const e of edges) {
    if (e.data?.kind === "ai") s.add(e.target);
  }
  return s;
}

function getAiSubNodes(
  agentId: string,
  edges: WorkflowCanvasEdge[],
  nodes: WorkflowCanvasNode[],
): AiAgentSubNodes {
  const result: AiAgentSubNodes = { chatModel: null, memory: null, tools: [] };
  for (const edge of edges) {
    if (edge.source !== agentId || edge.data?.kind !== "ai") continue;
    const role = edge.sourceHandle ? HANDLE_TO_ROLE[edge.sourceHandle] : undefined;
    if (!role) continue;
    if (role === "tools") continue;
    result[role] = edge.target;
  }
  result.tools = expandOrderedToolsFromAgent(agentId, edges, nodes);
  return result;
}

/** Grafo principal respeitando só o ramo IF escolhido em `ifBranchOutcome`. */
function buildFilteredMainAdjacency(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
  mainNodeIds: Set<string>,
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const id of mainNodeIds) adjacency.set(id, []);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    if (edge.data?.kind === "ai") continue;
    if (!mainNodeIds.has(edge.source) || !mainNodeIds.has(edge.target)) continue;
    const src = nodeById.get(edge.source);
    if (src?.data.templateId === "ifNode") {
      const branch = src.data.ifBranchOutcome === "false" ? "false" : "true";
      const wantHandle = branch === "true" ? IF_TRUE_HANDLE_ID : IF_FALSE_HANDLE_ID;
      const h = edge.sourceHandle ?? IF_TRUE_HANDLE_ID;
      if (h !== wantHandle) continue;
    }
    if (src?.data.templateId === "switchNode") {
      const activeIdx = src.data.switchActiveOutput ?? 0;
      const wantHandle = switchHandleId(activeIdx);
      if ((edge.sourceHandle ?? "") !== wantHandle) continue;
    }
    adjacency.get(edge.source)!.push(edge.target);
  }
  return adjacency;
}

function mainTopologicalSort(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
  startNodeId?: string,
): string[] {
  const aiTargets = targetsOfAiEdges(edges);
  const toolChainMembers = collectAgentToolChainNodeIds(edges, nodes);
  const mainNodes = nodes.filter(
    (n) =>
      !n.data.disabled &&
      !AI_SUB_KINDS.has(n.data.kind) &&
      !aiTargets.has(n.id) &&
      !toolChainMembers.has(n.id),
  );
  const nodeIds = new Set(mainNodes.map((n) => n.id));
  const adjacency = buildFilteredMainAdjacency(nodes, edges, nodeIds);
  const inDegree = new Map<string, number>();
  for (const id of nodeIds) inDegree.set(id, 0);
  for (const [, targets] of adjacency) {
    for (const t of targets) {
      inDegree.set(t, (inDegree.get(t) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  if (startNodeId && nodeIds.has(startNodeId)) {
    queue.push(startNodeId);
  } else {
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }
    queue.sort();
  }

  const result: string[] = [];
  while (queue.length > 0) {
    queue.sort();
    const current = queue.shift()!;
    result.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }
  return result;
}

const NODE_DELAY_MS = 800;
const SUB_NODE_DELAY_MS = 600;

export function useWorkflowExecution({
  nodes,
  edges,
  setNodes,
  setEdges,
}: UseWorkflowExecutionOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const resetStates = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, visualState: undefined } })),
    );
    setEdges((eds) =>
      eds.map((e) => {
        const base = (e.className ?? "").replace(/workflow-edge--(running|success|error)/g, "").trim();
        return { ...e, data: { kind: e.data!.kind, visualState: undefined }, className: base } as WorkflowCanvasEdge;
      }),
    );
  }, [setNodes, setEdges]);

  const updateNodeState = useCallback(
    (nodeId: string, state: NodeVisualState | undefined) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, visualState: state } } : n)),
      );
    },
    [setNodes],
  );

  const setEdgeState = useCallback(
    (filter: (e: WorkflowCanvasEdge) => boolean, state: NodeVisualState) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (filter(e)) {
            const base = (e.className ?? "").replace(/workflow-edge--(running|success|error)/g, "").trim();
            return { ...e, data: { kind: e.data!.kind, visualState: state }, className: `${base} workflow-edge--${state}` } as WorkflowCanvasEdge;
          }
          return e;
        }),
      );
    },
    [setEdges],
  );

  const markIncomingEdges = useCallback(
    (nodeId: string, state: NodeVisualState) =>
      setEdgeState((e) => e.target === nodeId, state),
    [setEdgeState],
  );

  const markOutgoingEdges = useCallback(
    (nodeId: string, state: NodeVisualState) =>
      setEdgeState((e) => e.source === nodeId, state),
    [setEdgeState],
  );

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const shouldError = useCallback((nodeId: string): boolean => {
    const node = nodesRef.current.find((n) => n.id === nodeId);
    return node?.data.simulateError === true;
  }, []);

  const EDGE_TRAVEL_MS = 350;

  const runNode = useCallback(
    async (nodeId: string, delayMs = NODE_DELAY_MS): Promise<boolean> => {
      if (cancelRef.current) return false;

      markIncomingEdges(nodeId, "running");
      await delay(EDGE_TRAVEL_MS);
      if (cancelRef.current) return false;

      updateNodeState(nodeId, "running");
      await delay(delayMs);
      if (cancelRef.current) return false;

      const hasError = shouldError(nodeId);
      const finalState: NodeVisualState = hasError ? "error" : "success";
      updateNodeState(nodeId, finalState);
      markIncomingEdges(nodeId, finalState);

      if (!hasError) {
        await delay(200);
        if (cancelRef.current) return false;
        markOutgoingEdges(nodeId, "running");
        await delay(EDGE_TRAVEL_MS);
        if (cancelRef.current) return false;
      }

      return !hasError;
    },
    [updateNodeState, markIncomingEdges, markOutgoingEdges, shouldError],
  );

  const runAiAgentSubRoutine = useCallback(
    async (agentId: string): Promise<boolean> => {
      const sub = getAiSubNodes(agentId, edgesRef.current, nodesRef.current);

      markIncomingEdges(agentId, "running");
      await delay(EDGE_TRAVEL_MS);
      if (cancelRef.current) return false;

      updateNodeState(agentId, "running");
      await delay(300);

      if (sub.chatModel) {
        if (!(await runNode(sub.chatModel, SUB_NODE_DELAY_MS))) return false;
      }
      if (sub.memory) {
        if (!(await runNode(sub.memory, SUB_NODE_DELAY_MS))) return false;
      }
      if (sub.chatModel) {
        if (!(await runNode(sub.chatModel, SUB_NODE_DELAY_MS))) return false;
      }
      for (const toolId of sub.tools) {
        if (cancelRef.current) return false;
        if (!(await runNode(toolId, SUB_NODE_DELAY_MS))) return false;
        if (sub.chatModel) {
          if (!(await runNode(sub.chatModel, SUB_NODE_DELAY_MS))) return false;
        }
      }

      if (cancelRef.current) return false;
      const hasError = shouldError(agentId);
      const finalState: NodeVisualState = hasError ? "error" : "success";
      updateNodeState(agentId, finalState);
      markIncomingEdges(agentId, finalState);

      if (!hasError) {
        await delay(200);
        if (cancelRef.current) return false;
        markOutgoingEdges(agentId, "running");
        await delay(EDGE_TRAVEL_MS);
      }

      return !hasError;
    },
    [updateNodeState, markIncomingEdges, markOutgoingEdges, runNode, shouldError],
  );

  const startExecution = useCallback(
    async (singleNodeId?: string) => {
      if (isRunning) return;
      cancelRef.current = false;
      setIsRunning(true);
      resetStates();
      await delay(100);

      const order = mainTopologicalSort(nodesRef.current, edgesRef.current, singleNodeId);
      const executionOrder = order;

      for (const nodeId of executionOrder) {
        if (cancelRef.current) break;
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node) continue;

        const isAgent = node.data.templateId === "aiAgent";
        const ok = isAgent ? await runAiAgentSubRoutine(nodeId) : await runNode(nodeId);
        if (!ok) break;
      }

      setIsRunning(false);
    },
    [isRunning, resetStates, runNode, runAiAgentSubRoutine],
  );

  const stopExecution = useCallback(() => {
    cancelRef.current = true;
    setIsRunning(false);
    resetStates();
  }, [resetStates]);

  return { isRunning, startExecution, stopExecution };
}
