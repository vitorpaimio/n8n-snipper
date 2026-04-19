"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import * as N8N from "@/workflow-kit/n8n-tokens";
import type { NodeTemplateId } from "@/workflow-kit";

import { AIGeneratorPanel } from "./components/AIGeneratorPanel";
import { RightToolbar } from "./components/RightToolbar";
import { CanvasControls } from "./components/CanvasControls";
import { CanvasEmptyState } from "./components/CanvasEmptyState";
import { NodeCreatorPanel } from "./components/NodeCreatorPanel";
import { NodeEditModal } from "./components/NodeEditModal";
import { ExecuteWorkflowBar } from "./components/ExecuteWorkflowBar";
import { WorkflowEdge } from "./edges/WorkflowEdge";
import {
  buildAiSubEdge,
  buildMainEdge,
  buildNodeFromTemplate,
  resolveTemplate,
} from "./mappers/workflow-reactflow-mapper";
import { AI_SUB_TOP_TARGET_HANDLE, collectAgentToolChainNodeIds } from "./agent-tool-subgraph";
import { WorkflowNodeCard } from "./nodes/WorkflowNodeCard";
import type { WorkflowCanvasEdge, WorkflowCanvasNode } from "./types";
import { useWorkflowExecution } from "./hooks/useWorkflowExecution";
import { clearSession, loadSession, saveSession } from "./persistence/workflow-local-session";
import { buildActionDescription, parseDescriptionToAction } from "./utils/node-subtitle";

function getNextNodePosition(nodes: WorkflowCanvasNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 200, y: 200 };
  const maxX = Math.max(...nodes.map((n) => n.position.x));
  const avgY = nodes.reduce((s, n) => s + n.position.y, 0) / nodes.length;
  return { x: maxX + 200, y: avgY };
}

const EMPTY_NODES: WorkflowCanvasNode[] = [];
const EMPTY_EDGES: WorkflowCanvasEdge[] = [];

const SAVE_DEBOUNCE_MS = 400;

function WorkflowEditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowCanvasNode>(EMPTY_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowCanvasEdge>(EMPTY_EDGES);
  const { deleteElements, fitView } = useReactFlow();

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setNodes(saved.nodes);
      setEdges(saved.edges);
    }
    hasRestoredRef.current = true;
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    const timer = setTimeout(() => {
      if (nodes.length === 0 && edges.length === 0) {
        clearSession();
      } else {
        saveSession(nodes, edges);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  const [creatorOpen, setCreatorOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [creatorCategory, setCreatorCategory] = useState<import("@/workflow-kit").NodeCreatorCategoryId | undefined>(undefined);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const [connectFromNodeId, setConnectFromNodeId] = useState<string | null>(null);
  const [connectFromHandleId, setConnectFromHandleId] = useState<string | null>(null);
  const [editModalNodeId, setEditModalNodeId] = useState<string | null>(null);

  const { isRunning, startExecution, stopExecution } = useWorkflowExecution({
    nodes,
    edges,
    setNodes,
    setEdges,
  });

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNodeCard }), []);
  const edgeTypes = useMemo(() => ({ workflowEdge: WorkflowEdge }), []);
  const defaultEdgeOptions = useMemo(
    () => ({
      style: {
        stroke: N8N.N8N_EDGE_STROKE,
        strokeWidth: N8N.N8N_EDGE_STROKE_WIDTH,
        strokeOpacity: N8N.N8N_EDGE_IDLE_OPACITY,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: N8N.N8N_COLORS.edgeIdle,
      },
    }),
    [],
  );
  const connectionLineStyle = useMemo(
    () => ({
      stroke: N8N.N8N_CONNECTION_PREVIEW_STROKE,
      strokeWidth: N8N.N8N_CONNECTION_PREVIEW_WIDTH,
      opacity: N8N.N8N_CONNECTION_PREVIEW_OPACITY,
      strokeDasharray: N8N.N8N_CONNECTION_PREVIEW_DASH,
    }),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const mainEdge = buildMainEdge({
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
      setEdges((currentEdges) => addEdge(mainEdge, currentEdges));
    },
    [setEdges],
  );

  const AI_SUBPORT_CATEGORIES = new Set(["chatModel", "memory", "tool"]);
  const CATEGORY_TO_HANDLE: Record<string, string> = {
    chatModel: "agent-chatModel",
    memory: "agent-memory",
    tool: "agent-tool",
  };

  const AI_SUB_TEMPLATE_TYPES = new Set(["chatModel", "memory", "tool", "communication"]);

  const onAddNode = useCallback(
    (
      templateId: NodeTemplateId,
      options?: { appEventIntegrationId?: NodeTemplateId },
    ) => {
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `node-${Date.now()}`;

      const sourceId = connectFromNodeId;
      const isAiSub = creatorCategory && AI_SUBPORT_CATEGORIES.has(creatorCategory);
      const addedTemplate = resolveTemplate(templateId);
      const sourceInToolChain = sourceId
        ? collectAgentToolChainNodeIds(edges, nodes).has(sourceId)
        : false;
      const mainEdgeTargetHandle =
        sourceInToolChain && addedTemplate && AI_SUB_TEMPLATE_TYPES.has(addedTemplate.type)
          ? AI_SUB_TOP_TARGET_HANDLE
          : undefined;

      setNodes((currentNodes) => {
        let position: { x: number; y: number };
        if (sourceId) {
          const sourceNode = currentNodes.find((n) => n.id === sourceId);
          if (isAiSub && sourceNode) {
            const colIndex = creatorCategory === "chatModel" ? 0 : creatorCategory === "memory" ? 1 : 2;
            position = {
              x: sourceNode.position.x + (colIndex - 1) * 180,
              y: sourceNode.position.y + 260,
            };
          } else {
            position = sourceNode
              ? { x: sourceNode.position.x + 220, y: sourceNode.position.y }
              : getNextNodePosition(currentNodes);
          }
        } else {
          position = getNextNodePosition(currentNodes);
        }
        const nextNode = buildNodeFromTemplate(templateId, position, newId, options);
        return [...currentNodes, nextNode];
      });

      if (sourceId) {
        if (isAiSub && creatorCategory) {
          const sourceHandle = CATEGORY_TO_HANDLE[creatorCategory];
          const edge = buildAiSubEdge({ source: sourceId, target: newId, sourceHandle });
          setEdges((currentEdges) => addEdge(edge, currentEdges));
        } else {
          const edge = buildMainEdge({
            source: sourceId,
            target: newId,
            ...(connectFromHandleId ? { sourceHandle: connectFromHandleId } : {}),
            ...(mainEdgeTargetHandle ? { targetHandle: mainEdgeTargetHandle } : {}),
          });
          setEdges((currentEdges) => addEdge(edge, currentEdges));
        }
      }

      setConnectFromNodeId(null);
      setConnectFromHandleId(null);
      setCreatorCategory(undefined);
    },
    [setNodes, setEdges, connectFromNodeId, connectFromHandleId, creatorCategory, edges, nodes],
  );

  const onPlusClick = useCallback(
    (nodeId: string, subportCategory?: string, sourceHandleId?: string) => {
      setConnectFromNodeId(nodeId);
      setConnectFromHandleId(sourceHandleId ?? null);
      setCreatorCategory(subportCategory as import("@/workflow-kit").NodeCreatorCategoryId | undefined);
      setCreatorOpen(true);
    },
    [],
  );

  useEffect(() => {
    function handleEdgePlus(e: Event) {
      const { sourceId, category, sourceHandleId } = (e as CustomEvent).detail as {
        sourceId?: string | null;
        category?: string;
        sourceHandleId?: string | null;
      };
      setConnectFromNodeId(sourceId ?? null);
      setConnectFromHandleId(sourceHandleId ?? null);
      setCreatorCategory(category as import("@/workflow-kit").NodeCreatorCategoryId | undefined);
      setCreatorOpen(true);
    }
    window.addEventListener("workflow:edge-plus", handleEdgePlus);
    return () => window.removeEventListener("workflow:edge-plus", handleEdgePlus);
  }, []);

  useEffect(() => {
    function handleAIGenerated(e: Event) {
      const { nodes: generatedNodes, edges: generatedEdges } = (e as CustomEvent).detail as {
        nodes: WorkflowCanvasNode[];
        edges: WorkflowCanvasEdge[];
      };
      setNodes(generatedNodes);
      setEdges(generatedEdges);
      setTimeout(() => fitView({ padding: 0.15, maxZoom: 1 }), 80);
    }
    window.addEventListener("workflow:load-ai-generated", handleAIGenerated);
    return () => window.removeEventListener("workflow:load-ai-generated", handleAIGenerated);
  }, [setNodes, setEdges, fitView]);

  const onDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      deleteElements({
        nodes: selectedNodes.map((n) => ({ id: n.id })),
        edges: selectedEdges.map((e) => ({ id: e.id })),
      });
    }
  }, [nodes, edges, deleteElements]);

  const onToggleDisable = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, disabled: !n.data.disabled } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const onUpdateNodeData = useCallback(
    (
      nodeId: string,
      patch: {
        title?: string;
        actionKey?: string;
        actionValue?: string;
        simulateError?: boolean;
        ifBranchOutcome?: "true" | "false";
        switchOutputCount?: number;
        switchOutputLabels?: string[];
        switchActiveOutput?: number;
        loopCount?: number;
      },
    ) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const parsed = parseDescriptionToAction(n.data.description);
          const prevKey = n.data.actionKey ?? parsed?.actionKey ?? "";
          const prevVal = n.data.actionValue ?? parsed?.actionValue ?? "";
          const title = patch.title !== undefined ? patch.title : n.data.title;
          const actionKey = patch.actionKey !== undefined ? patch.actionKey : prevKey;
          const actionValue = patch.actionValue !== undefined ? patch.actionValue : prevVal;
          const built = buildActionDescription(actionKey, actionValue);
          const touchedAction = patch.actionKey !== undefined || patch.actionValue !== undefined;
          const description = built || (!touchedAction ? n.data.description : "");
          return {
            ...n,
            data: {
              ...n.data,
              title,
              actionKey,
              actionValue,
              description,
              ...(patch.simulateError !== undefined ? { simulateError: patch.simulateError } : {}),
              ...(patch.ifBranchOutcome !== undefined ? { ifBranchOutcome: patch.ifBranchOutcome } : {}),
              ...(patch.switchOutputCount !== undefined ? { switchOutputCount: patch.switchOutputCount } : {}),
              ...(patch.switchOutputLabels !== undefined ? { switchOutputLabels: patch.switchOutputLabels } : {}),
              ...(patch.switchActiveOutput !== undefined ? { switchActiveOutput: patch.switchActiveOutput } : {}),
              ...(patch.loopCount !== undefined ? { loopCount: patch.loopCount } : {}),
            },
          };
        }),
      );
    },
    [setNodes],
  );

  const onNodeDoubleClick = useCallback((_e: MouseEvent, node: WorkflowCanvasNode) => {
    if (node.type === "workflowNode") setEditModalNodeId(node.id);
  }, []);

  const onClearCanvas = useCallback(() => {
    if (
      !window.confirm(
        "Remover todos os nós e conexões deste workflow? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }
    stopExecution();
    setNodes([]);
    setEdges([]);
    clearSession();
    setEditModalNodeId(null);
    setConnectFromNodeId(null);
    setConnectFromHandleId(null);
    setSelectedTriggerId(null);
  }, [stopExecution, setNodes, setEdges]);

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      deleteElements({ nodes: [{ id: nodeId }] });
    },
    [deleteElements],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        onDeleteSelected();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        setCreatorOpen(true);
      }
    },
    [onDeleteSelected],
  );

  const editModalNode = useMemo(() => {
    if (!editModalNodeId) return null;
    return nodes.find((n) => n.id === editModalNodeId) ?? null;
  }, [nodes, editModalNodeId]);

  useEffect(() => {
    if (editModalNodeId && !nodes.some((n) => n.id === editModalNodeId)) {
      setEditModalNodeId(null);
    }
  }, [nodes, editModalNodeId]);

  const triggerNodes = useMemo(
    () =>
      nodes
        .filter((n) => n.data.kind === "trigger")
        .map((n) => {
          const template = resolveTemplate(n.data.templateId);
          return {
            id: n.id,
            title: n.data.title,
            templateId: n.data.templateId,
            icon: template?.icon ?? (() => null),
          };
        }),
    [nodes],
  );

  return (
    <div className="wf-app" onKeyDown={onKeyDown} tabIndex={-1}>
      <section className="workflow-editor-canvas">
            <ReactFlow
              className="workflow-reactflow"
              nodes={nodes.map((n) => ({
                ...n,
                data: {
                  ...n.data,
                  onDelete: onDeleteNode,
                  onDisable: onToggleDisable,
                  onRun: () => startExecution(n.id),
                  onExecuteWorkflow: () => startExecution(),
                  onPlusClick,
                  outputLabel:
                    n.data.templateId === "webhook" ? "POST" : undefined,
                },
              }))}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={onNodeDoubleClick}
              zoomOnDoubleClick={false}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionLineStyle={connectionLineStyle}
              fitView
              fitViewOptions={{
                padding: N8N.N8N_FIT_VIEW_PADDING,
                maxZoom: N8N.N8N_FIT_VIEW_MAX_ZOOM,
              }}
              colorMode="dark"
              deleteKeyCode={null}
              proOptions={{ hideAttribution: true }}
            >
              {nodes.length > 0 ? (
                <MiniMap
                  position="bottom-left"
                  pannable
                  maskColor={N8N.N8N_MINIMAP_MASK}
                  nodeColor={N8N.N8N_NODE_BORDER}
                  style={{
                    background: N8N.N8N_TOOLBAR_BG,
                    border: `1px solid ${N8N.N8N_TOOLBAR_BORDER}`,
                  }}
                />
              ) : null}
              <Background
                variant={BackgroundVariant.Dots}
                gap={N8N.N8N_GRID_STEP_PX}
                size={N8N.N8N_GRID_DOT_SIZE}
                color={N8N.N8N_GRID_DOT}
                bgColor={N8N.N8N_CANVAS_BG}
              />
            </ReactFlow>

            {nodes.length === 0 ? (
              <CanvasEmptyState onAddFirst={() => setCreatorOpen(true)} />
            ) : null}

            <CanvasControls onClearAll={onClearCanvas} />

            {nodes.length > 0 ? (
              <ExecuteWorkflowBar
                isRunning={isRunning}
                onExecute={() => startExecution(selectedTriggerId ?? triggerNodes[0]?.id)}
                onStop={stopExecution}
                triggers={triggerNodes}
                selectedTriggerId={selectedTriggerId ?? triggerNodes[0]?.id ?? null}
                onSelectTrigger={setSelectedTriggerId}
              />
            ) : null}

            <RightToolbar
              onOpenCreator={() => setCreatorOpen(true)}
              onOpenAIGenerator={() => setAiPanelOpen((v) => !v)}
              aiPanelOpen={aiPanelOpen}
            />

            {aiPanelOpen ? (
              <AIGeneratorPanel onClose={() => setAiPanelOpen(false)} />
            ) : null}

            <NodeEditModal
              open={editModalNodeId !== null && editModalNode !== null}
              node={editModalNode}
              onClose={() => setEditModalNodeId(null)}
              onUpdate={onUpdateNodeData}
            />

            <NodeCreatorPanel
              open={creatorOpen}
              onClose={() => {
                setCreatorOpen(false);
                setConnectFromNodeId(null);
                setConnectFromHandleId(null);
                setCreatorCategory(undefined);
              }}
              onAddNode={onAddNode}
              initialCategory={creatorCategory}
            />
      </section>
    </div>
  );
}

export function WorkflowEditorClient() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}
