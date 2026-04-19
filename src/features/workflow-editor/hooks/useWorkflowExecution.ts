import { useCallback, useRef, useState } from "react";
import { collectAgentToolChainNodeIds, expandOrderedToolsFromAgent } from "../agent-tool-subgraph";
import { IF_FALSE_HANDLE_ID, IF_TRUE_HANDLE_ID } from "../if-node";
import { LOOP_DONE_HANDLE_ID, LOOP_LOOP_HANDLE_ID } from "../loop-node";
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

/** Nós do corpo do loop (alcançáveis via loop-loop) — excluídos do grafo principal de execução. */
function collectLoopBodyNodeIds(
  edges: WorkflowCanvasEdge[],
  nodes: WorkflowCanvasNode[],
): Set<string> {
  const loopBodyIds = new Set<string>();
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Find direct loop-loop targets for each splitInBatches
  const loopStarts = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.data?.kind === "ai") continue;
    const src = nodeById.get(edge.source);
    if (
      src?.data.templateId === "splitInBatches" &&
      edge.sourceHandle === LOOP_LOOP_HANDLE_ID
    ) {
      if (!loopStarts.has(edge.source)) loopStarts.set(edge.source, []);
      loopStarts.get(edge.source)!.push(edge.target);
    }
  }

  // Build simple main-edge adjacency for forward tracing
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.data?.kind === "ai") continue;
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  }

  // BFS from each loop-loop target, stop at the splitInBatches (don't re-add it)
  for (const [loopId, targets] of loopStarts) {
    const visited = new Set<string>();
    const queue = [...targets];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === loopId || visited.has(current)) continue;
      visited.add(current);
      loopBodyIds.add(current);
      for (const next of adj.get(current) ?? []) {
        if (!visited.has(next)) queue.push(next);
      }
    }
  }

  return loopBodyIds;
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
    if (src?.data.templateId === "splitInBatches") {
      // Only follow the "done" output; skip the back-loop edge to avoid cycles
      const h = edge.sourceHandle ?? LOOP_DONE_HANDLE_ID;
      if (h !== LOOP_DONE_HANDLE_ID) continue;
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
  const loopBodyIds = collectLoopBodyNodeIds(edges, nodes);
  const mainNodes = nodes.filter(
    (n) =>
      !n.data.disabled &&
      !AI_SUB_KINDS.has(n.data.kind) &&
      !aiTargets.has(n.id) &&
      !toolChainMembers.has(n.id) &&
      !loopBodyIds.has(n.id),
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
    // Collect roots (in-degree 0), prioritizing triggers first
    const roots: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) roots.push(id);
    }
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    roots.sort((a, b) => {
      const aIsTrigger = nodeById.get(a)?.data.kind === "trigger" ? 0 : 1;
      const bIsTrigger = nodeById.get(b)?.data.kind === "trigger" ? 0 : 1;
      return aIsTrigger - bIsTrigger;
    });
    queue.push(...roots);
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

/** Ordem topológica dos nós do corpo do loop (excluindo sub-nós AI). */
function getLoopBodyExecutionOrder(
  loopNodeId: string,
  edges: WorkflowCanvasEdge[],
  nodes: WorkflowCanvasNode[],
): string[] {
  // Find loop-loop targets
  const starts: string[] = [];
  for (const edge of edges) {
    if (
      edge.source === loopNodeId &&
      edge.sourceHandle === LOOP_LOOP_HANDLE_ID &&
      edge.data?.kind !== "ai"
    ) {
      starts.push(edge.target);
    }
  }
  if (starts.length === 0) return [];

  // Build adjacency for tracing (main edges only)
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.data?.kind === "ai") continue;
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  }

  // BFS to collect all body nodes
  const bodyIds = new Set<string>();
  const queue = [...starts];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === loopNodeId || bodyIds.has(current)) continue;
    bodyIds.add(current);
    for (const next of adj.get(current) ?? []) {
      if (!bodyIds.has(next) && next !== loopNodeId) queue.push(next);
    }
  }

  // Filter out AI sub-nodes and tool chain members (handled by runAiAgentSubRoutine)
  const aiTargets = targetsOfAiEdges(edges);
  const toolChainMembers = collectAgentToolChainNodeIds(edges, nodes);
  const executableBody = new Set<string>();
  for (const id of bodyIds) {
    const node = nodes.find((n) => n.id === id);
    if (!node) continue;
    if (AI_SUB_KINDS.has(node.data.kind)) continue;
    if (aiTargets.has(id)) continue;
    if (toolChainMembers.has(id)) continue;
    executableBody.add(id);
  }

  // Topological sort within executable body
  const bodyAdj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const id of executableBody) {
    bodyAdj.set(id, []);
    inDegree.set(id, 0);
  }
  for (const edge of edges) {
    if (edge.data?.kind === "ai") continue;
    if (!executableBody.has(edge.source) || !executableBody.has(edge.target)) continue;
    bodyAdj.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const sorted: string[] = [];
  const sortQueue = [...executableBody].filter((id) => (inDegree.get(id) ?? 0) === 0);
  while (sortQueue.length > 0) {
    sortQueue.sort();
    const current = sortQueue.shift()!;
    sorted.push(current);
    for (const next of bodyAdj.get(current) ?? []) {
      inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
      if (inDegree.get(next) === 0) sortQueue.push(next);
    }
  }

  return sorted;
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
        // Only mark main outgoing edges — AI sub-edges stay as "success" from sub-routine
        setEdgeState((e) => e.source === agentId && e.data?.kind !== "ai", "running");
        await delay(EDGE_TRAVEL_MS);
      }

      return !hasError;
    },
    [updateNodeState, markIncomingEdges, setEdgeState, runNode, shouldError],
  );

  const runLoopNode = useCallback(
    async (loopNodeId: string): Promise<boolean> => {
      const node = nodesRef.current.find((n) => n.id === loopNodeId);
      if (!node) return false;
      const loopCount = node.data.loopCount ?? 3;

      // Pre-compute body set so we can distinguish main-incoming vs back-edges
      const bodyOrder = getLoopBodyExecutionOrder(loopNodeId, edgesRef.current, nodesRef.current);
      const bodyIdSet = new Set(bodyOrder);

      // Mark only the main incoming edges (not the back-edge from the loop body)
      const markMainIncoming = (state: NodeVisualState) =>
        setEdgeState((e) => e.target === loopNodeId && !bodyIdSet.has(e.source), state);

      markMainIncoming("running");
      await delay(EDGE_TRAVEL_MS);
      if (cancelRef.current) return false;

      updateNodeState(loopNodeId, "running");
      markMainIncoming("success");
      await delay(400);
      if (cancelRef.current) return false;

      if (bodyOrder.length === 0) {
        const hasError = shouldError(loopNodeId);
        const st: NodeVisualState = hasError ? "error" : "success";
        updateNodeState(loopNodeId, st);
        markIncomingEdges(loopNodeId, st);
        if (!hasError) {
          await delay(200);
          if (cancelRef.current) return false;
          setEdgeState((e) => e.source === loopNodeId && e.sourceHandle === LOOP_DONE_HANDLE_ID, "running");
          await delay(EDGE_TRAVEL_MS);
        }
        return !hasError;
      }

      for (let iter = 0; iter < loopCount; iter++) {
        if (cancelRef.current) return false;

        // Animate loop-loop edge
        setEdgeState(
          (e) => e.source === loopNodeId && e.sourceHandle === LOOP_LOOP_HANDLE_ID,
          "running",
        );
        await delay(EDGE_TRAVEL_MS);
        if (cancelRef.current) return false;

        // Execute each body node
        for (const bodyNodeId of bodyOrder) {
          if (cancelRef.current) return false;
          const bodyNode = nodesRef.current.find((n) => n.id === bodyNodeId);
          if (!bodyNode) continue;

          const isAgent = bodyNode.data.templateId === "aiAgent";
          const ok = isAgent
            ? await runAiAgentSubRoutine(bodyNodeId)
            : await runNode(bodyNodeId);
          if (!ok) return false;
        }

        // Between iterations: reset body states for next pass
        if (iter < loopCount - 1) {
          await delay(300);
          setNodes((nds) =>
            nds.map((n) =>
              bodyIdSet.has(n.id) ? { ...n, data: { ...n.data, visualState: undefined } } : n,
            ),
          );
          setEdges((eds) =>
            eds.map((e) => {
              const isBodyEdge =
                bodyIdSet.has(e.source) ||
                bodyIdSet.has(e.target) ||
                (e.source === loopNodeId && e.sourceHandle === LOOP_LOOP_HANDLE_ID);
              if (isBodyEdge) {
                const base = (e.className ?? "").replace(/workflow-edge--(running|success|error)/g, "").trim();
                return { ...e, data: { kind: e.data!.kind, visualState: undefined }, className: base } as WorkflowCanvasEdge;
              }
              return e;
            }),
          );
          await delay(200);
        }
      }

      // All iterations complete — mark back-edge as success
      if (cancelRef.current) return false;
      setEdgeState(
        (e) => e.target === loopNodeId && bodyIdSet.has(e.source),
        "success",
      );

      const hasError = shouldError(loopNodeId);
      const finalState: NodeVisualState = hasError ? "error" : "success";
      updateNodeState(loopNodeId, finalState);
      markMainIncoming(finalState);

      if (!hasError) {
        await delay(200);
        if (cancelRef.current) return false;
        setEdgeState(
          (e) => e.source === loopNodeId && e.sourceHandle === LOOP_DONE_HANDLE_ID,
          "running",
        );
        await delay(EDGE_TRAVEL_MS);
        if (cancelRef.current) return false;
      }

      return !hasError;
    },
    [updateNodeState, setEdgeState, runNode, runAiAgentSubRoutine, shouldError, setNodes, setEdges],
  );

  const startExecution = useCallback(
    async (singleNodeId?: string) => {
      if (isRunning) return;
      cancelRef.current = false;
      setIsRunning(true);
      resetStates();
      await delay(100);

      const order = mainTopologicalSort(nodesRef.current, edgesRef.current, singleNodeId);

      for (const nodeId of order) {
        if (cancelRef.current) break;
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node) continue;

        let ok: boolean;
        if (node.data.templateId === "splitInBatches") {
          ok = await runLoopNode(nodeId);
        } else if (node.data.templateId === "aiAgent") {
          ok = await runAiAgentSubRoutine(nodeId);
        } else {
          ok = await runNode(nodeId);
        }
        if (!ok) break;
      }

      setIsRunning(false);
    },
    [isRunning, resetStates, runNode, runAiAgentSubRoutine, runLoopNode],
  );

  const stopExecution = useCallback(() => {
    cancelRef.current = true;
    setIsRunning(false);
    resetStates();
  }, [resetStates]);

  return { isRunning, startExecution, stopExecution };
}
