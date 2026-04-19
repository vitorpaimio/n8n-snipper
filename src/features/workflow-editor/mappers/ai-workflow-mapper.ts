import type { AIWorkflowEdge, AIWorkflowNode } from "@/app/api/generate-workflow/route";
import type { NodeTemplateId } from "@/workflow-kit";
import type { WorkflowCanvasEdge, WorkflowCanvasNode } from "../types";
import { buildAiSubEdge, buildMainEdge, buildNodeFromTemplate } from "./workflow-reactflow-mapper";

const VALID_TEMPLATE_IDS = new Set<string>([
  "webhook", "formTrigger", "scheduleTrigger", "chatTrigger", "manualTrigger", "appEventTrigger",
  "aiAgent", "llm", "llmChain", "anthropic", "gemini", "ollama", "mcp", "mistralAi",
  "switchNode", "ifNode",
  "whatsapp", "gmail", "gmailMany", "slack", "telegram", "discord", "teams", "twilio",
  "googleSheets", "nocodb", "googleCalendar", "postgres", "mongodb", "mysql", "supabase", "airtable", "redis", "notion",
  "jira", "github", "gitlab", "trello", "asana", "linear", "todoist", "clickup",
  "hubspot", "salesforce", "mailchimp", "pipedrive",
  "stripe", "shopify", "woocommerce",
  "httpRequest", "codeNode", "setVariable", "merge", "figma", "dateTime", "filterNode",
  "limit", "removeDuplicates", "splitOut", "aggregate", "summarize", "dataTable",
  "executeSubWorkflow", "executionData", "ftpNode", "n8nNode", "n8nForm", "noOp",
  "compareDatasets", "stopAndError", "wait", "splitInBatches", "humanReview",
  "chatModelOpenAI", "chatModelAnthropic", "chatModelAzureOpenAI", "chatModelAwsBedrock",
  "chatModelCohere", "chatModelDeepSeek", "chatModelGemini", "chatModelGoogleVertex",
  "chatModelGroq", "chatModelMistral", "chatModelLemonade", "chatModelOllama", "chatModelOpenRouter",
  "memoryPostgres", "memoryMongoDB", "memoryRedis", "memoryXata",
  "toolAiAgent", "toolN8nWorkflow", "toolCode", "toolHttpRequest", "toolMcp",
]);

const AI_HANDLES = ["agent-chatModel", "agent-memory", "agent-tool"] as const;

const STEP_X = 220;
const STEP_Y = 140;
const START_X = 80;
const START_Y = 300;

// ─── Position calculator ─────────────────────────────────────────────────────

function calculatePositions(
  aiNodes: AIWorkflowNode[],
  aiEdges: AIWorkflowEdge[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const mainEdges = aiEdges.filter((e) => e.kind === "main");
  const aiSubEdges = aiEdges.filter((e) => e.kind === "ai");
  const aiSubIds = new Set(aiSubEdges.map((e) => e.target));

  // Build adjacency for main-flow BFS (only non-sub nodes)
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const n of aiNodes) {
    if (aiSubIds.has(n.id)) continue;
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  }
  for (const e of mainEdges) {
    if (!adj.has(e.source) || !adj.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }

  // BFS: assign column (depth) to each node
  const col = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [];

  // Enqueue all roots (in-degree 0 among main-flow nodes)
  for (const [id, deg] of inDeg) {
    if (deg === 0) {
      queue.push({ id, depth: 0 });
      col.set(id, 0);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const { id, depth } = queue[head++];
    if (visited.has(id)) continue;
    visited.add(id);
    for (const child of adj.get(id) ?? []) {
      if (!visited.has(child) && !col.has(child)) {
        col.set(child, depth + 1);
        queue.push({ id: child, depth: depth + 1 });
      }
    }
  }

  // Fallback: any unvisited main-flow node gets placed after the deepest existing column
  const maxCol = col.size > 0 ? Math.max(...col.values()) : 0;
  let extraCol = maxCol + 1;
  for (const n of aiNodes) {
    if (aiSubIds.has(n.id) || col.has(n.id)) continue;
    col.set(n.id, extraCol++);
  }

  // Group by column and assign row index
  const byCol = new Map<number, string[]>();
  for (const [id, c] of col) {
    if (!byCol.has(c)) byCol.set(c, []);
    byCol.get(c)!.push(id);
  }

  // Preserve BFS order within each column
  const bfsOrder = queue.map((q) => q.id);
  for (const [c, ids] of byCol) {
    ids.sort((a, b) => {
      const ia = bfsOrder.indexOf(a);
      const ib = bfsOrder.indexOf(b);
      return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
    });
    byCol.set(c, ids);
  }

  // Assign x/y — center the column vertically around START_Y
  for (const [c, ids] of byCol) {
    const totalH = (ids.length - 1) * STEP_Y;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: START_X + c * STEP_X,
        y: START_Y - totalH / 2 + i * STEP_Y,
      });
    });
  }

  // AI sub-nodes: place below their agent parent
  for (const edge of aiSubEdges) {
    const parentPos = positions.get(edge.source) ?? { x: START_X, y: START_Y };
    const handleIndex = AI_HANDLES.indexOf(edge.sourceHandle as (typeof AI_HANDLES)[number]);
    const colIndex = handleIndex >= 0 ? handleIndex : 0;
    positions.set(edge.target, {
      x: parentPos.x + (colIndex - 1) * 180,
      y: parentPos.y + 270,
    });
  }

  return positions;
}

// ─── Template kind helpers ───────────────────────────────────────────────────

function getSubKind(templateId: string): "chatModel" | "memory" | "tool" | null {
  if (templateId.startsWith("chatModel")) return "chatModel";
  if (templateId.startsWith("memory")) return "memory";
  if (templateId.startsWith("tool")) return "tool";
  return null;
}

const SUB_KIND_TO_HANDLE: Record<string, string> = {
  chatModel: "agent-chatModel",
  memory: "agent-memory",
  tool: "agent-tool",
};

/** Fix ai edges that the LLM generated backwards (sub-node → aiAgent instead of aiAgent → sub-node). */
function normalizeAiEdges(
  edges: AIWorkflowEdge[],
  templateById: Map<string, string>,
): AIWorkflowEdge[] {
  return edges.map((e) => {
    if (e.kind !== "ai") return e;

    const sourceTemplate = templateById.get(e.source) ?? "";
    const targetTemplate = templateById.get(e.target) ?? "";
    const sourceSubKind = getSubKind(sourceTemplate);
    const targetIsAgent = targetTemplate === "aiAgent";

    // Edge is backwards: sub-node → aiAgent → fix to aiAgent → sub-node
    if (sourceSubKind && targetIsAgent) {
      return {
        source: e.target,
        target: e.source,
        kind: "ai",
        sourceHandle: SUB_KIND_TO_HANDLE[sourceSubKind],
      };
    }

    // Edge has no sourceHandle: infer it from the target's template kind
    if (!e.sourceHandle) {
      const targetSubKind = getSubKind(targetTemplate);
      if (targetSubKind) {
        return { ...e, sourceHandle: SUB_KIND_TO_HANDLE[targetSubKind] };
      }
    }

    return e;
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function buildWorkflowFromAIResponse(
  aiNodes: AIWorkflowNode[],
  aiEdges: AIWorkflowEdge[],
): { nodes: WorkflowCanvasNode[]; edges: WorkflowCanvasEdge[] } {
  const validNodes = aiNodes.filter((n) => VALID_TEMPLATE_IDS.has(n.templateId));
  const validNodeIds = new Set(validNodes.map((n) => n.id));

  // Build templateId lookup before normalizing edges
  const templateById = new Map(validNodes.map((n) => [n.id, n.templateId]));

  const rawValidEdges = aiEdges.filter(
    (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target),
  );
  const validEdges = normalizeAiEdges(rawValidEdges, templateById);

  const positions = calculatePositions(validNodes, validEdges);

  const nodes: WorkflowCanvasNode[] = validNodes.map((aiNode) => {
    const pos = positions.get(aiNode.id) ?? { x: START_X, y: START_Y };
    const uniqueId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ai-${Date.now()}-${aiNode.id}`;

    const node = buildNodeFromTemplate(aiNode.templateId as NodeTemplateId, pos, uniqueId);

    const overrides: Partial<WorkflowCanvasNode["data"]> = {};
    if (aiNode.title) overrides.title = aiNode.title;
    if (aiNode.actionKey !== undefined) overrides.actionKey = aiNode.actionKey;
    if (aiNode.actionValue !== undefined) overrides.actionValue = aiNode.actionValue;
    if (aiNode.ifBranchOutcome) overrides.ifBranchOutcome = aiNode.ifBranchOutcome;
    if (aiNode.switchOutputCount !== undefined) {
      overrides.switchOutputCount = aiNode.switchOutputCount;
      overrides.switchOutputLabels = Array.from({ length: aiNode.switchOutputCount }, (_, i) =>
        String(i),
      );
      overrides.switchActiveOutput = aiNode.switchActiveOutput ?? 0;
    }

    return { ...node, data: { ...node.data, ...overrides } };
  });

  const idMap = new Map<string, string>();
  validNodes.forEach((aiNode, i) => idMap.set(aiNode.id, nodes[i].id));

  const VALID_MAIN_HANDLES = new Set(["loop-loop", "loop-done", "if-true", "if-false"]);

  const edges: WorkflowCanvasEdge[] = validEdges.map((aiEdge) => {
    const source = idMap.get(aiEdge.source) ?? aiEdge.source;
    const target = idMap.get(aiEdge.target) ?? aiEdge.target;
    if (aiEdge.kind === "ai" && aiEdge.sourceHandle) {
      return buildAiSubEdge({ source, target, sourceHandle: aiEdge.sourceHandle });
    }
    // Only pass sourceHandle if it's a valid handle for the source node type
    const sourceTemplate = templateById.get(aiEdge.source);
    const isLoopNode = sourceTemplate === "splitInBatches";
    const isIfNode = sourceTemplate === "ifNode";
    const isSwitchNode = sourceTemplate === "switchNode";
    let sourceHandle: string | null = aiEdge.sourceHandle ?? null;
    if (sourceHandle) {
      if (sourceHandle.startsWith("loop-") && !isLoopNode) sourceHandle = null;
      else if (sourceHandle.startsWith("if-") && !isIfNode) sourceHandle = null;
      else if (sourceHandle.startsWith("switch-") && !isSwitchNode) sourceHandle = null;
    }
    return buildMainEdge({ source, target, sourceHandle });
  });

  return { nodes, edges };
}
