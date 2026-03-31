import { useCallback, useRef, useState } from "react";
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

function getAiSubNodes(agentId: string, edges: WorkflowCanvasEdge[]): AiAgentSubNodes {
  const result: AiAgentSubNodes = { chatModel: null, memory: null, tools: [] };
  for (const edge of edges) {
    if (edge.source !== agentId || edge.data?.kind !== "ai") continue;
    const role = edge.sourceHandle ? HANDLE_TO_ROLE[edge.sourceHandle] : undefined;
    if (!role) continue;
    if (role === "tools") result.tools.push(edge.target);
    else result[role] = edge.target;
  }
  return result;
}

function mainTopologicalSort(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
  startNodeId?: string,
): string[] {
  const mainNodes = nodes.filter((n) => !n.data.disabled && !AI_SUB_KINDS.has(n.data.kind));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodeIds = new Set(mainNodes.map((n) => n.id));

  for (const id of nodeIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of edges) {
    if (edge.data?.kind === "ai") continue;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  if (startNodeId && nodeIds.has(startNodeId)) {
    queue.push(startNodeId);
  } else {
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }
  }

  const result: string[] = [];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    result.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
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

  const updateEdgesForNode = useCallback(
    (nodeId: string, state: NodeVisualState) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.target === nodeId || e.source === nodeId) {
            const base = (e.className ?? "").replace(/workflow-edge--(running|success|error)/g, "").trim();
            return { ...e, data: { kind: e.data!.kind, visualState: state }, className: `${base} workflow-edge--${state}` } as WorkflowCanvasEdge;
          }
          return e;
        }),
      );
    },
    [setEdges],
  );

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const shouldError = useCallback((nodeId: string): boolean => {
    const node = nodesRef.current.find((n) => n.id === nodeId);
    return node?.data.simulateError === true;
  }, []);

  const runNode = useCallback(
    async (nodeId: string, delayMs = NODE_DELAY_MS): Promise<boolean> => {
      if (cancelRef.current) return false;
      updateNodeState(nodeId, "running");
      updateEdgesForNode(nodeId, "running");
      await delay(delayMs);
      if (cancelRef.current) return false;

      const hasError = shouldError(nodeId);
      const finalState: NodeVisualState = hasError ? "error" : "success";
      updateNodeState(nodeId, finalState);
      updateEdgesForNode(nodeId, finalState);
      return !hasError;
    },
    [updateNodeState, updateEdgesForNode, shouldError],
  );

  const runAiAgentSubRoutine = useCallback(
    async (agentId: string): Promise<boolean> => {
      const sub = getAiSubNodes(agentId, edgesRef.current);

      updateNodeState(agentId, "running");
      updateEdgesForNode(agentId, "running");
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
      updateEdgesForNode(agentId, finalState);
      return !hasError;
    },
    [updateNodeState, updateEdgesForNode, runNode, shouldError],
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
