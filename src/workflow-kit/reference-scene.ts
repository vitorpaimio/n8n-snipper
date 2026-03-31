import type { WorkflowConnection, WorkflowNode } from "./graph-model";
import { allNodeTemplates, type NodeTemplateId } from "./node-templates";

/**
 * Cena de referência (posições + arestas) para popular o canvas no projeto novo.
 */

/**
 * Layout columns (left→right): Triggers | Set | AI Agent | Switch | Outputs col1 | Outputs col2
 * Rows: ~180px vertical spacing between nodes to accommodate the label below the card.
 */
const COL_TRIGGER = 0;
const COL_SET = 200;
const COL_AI = 380;
const COL_SWITCH = 560;
const COL_OUT_1 = 740;
const COL_OUT_2 = 920;

const ROW_0 = 0;
const ROW_1 = 180;
const ROW_2 = 360;
const ROW_3 = 540;

type Spec = {
  id: string;
  templateId: NodeTemplateId;
  x: number;
  y: number;
  title?: string;
  description?: string;
};

const SPECS: Spec[] = [
  // Triggers (column 0)
  { id: "ref-form", templateId: "formTrigger", x: COL_TRIGGER, y: ROW_0, title: "Form Trigger" },
  { id: "ref-webhook", templateId: "webhook", x: COL_TRIGGER, y: ROW_1, title: "Webhook" },
  { id: "ref-schedule", templateId: "scheduleTrigger", x: COL_TRIGGER, y: ROW_2, title: "Schedule Trigger" },
  { id: "ref-chat", templateId: "chatTrigger", x: COL_TRIGGER, y: ROW_3, title: "Chat Trigger" },

  // Set (column 1)
  { id: "ref-set", templateId: "setVariable", x: COL_SET, y: ROW_0, title: "Set" },

  // AI Agent (column 2)
  { id: "ref-ai", templateId: "aiAgent", x: COL_AI, y: ROW_0, title: "AI Agent" },

  // LLM Chain (column 2-3 area, row 2)
  { id: "ref-llm-chain", templateId: "llmChain", x: COL_SWITCH, y: ROW_2, title: "LLM Chain" },

  // OpenAI Chat Model (column 2 area, row 3)
  { id: "ref-openai", templateId: "llm", x: COL_AI, y: ROW_3, title: "OpenAI Chat Model" },

  // Switch (column 3)
  { id: "ref-switch", templateId: "switchNode", x: COL_SWITCH, y: ROW_0, title: "Switch" },

  // Output nodes col 1
  { id: "ref-gmail-many", templateId: "gmailMany", x: COL_OUT_1, y: ROW_0, title: "Get many messages" },
  { id: "ref-wa", templateId: "whatsapp", x: COL_OUT_1, y: ROW_1, title: "WhatsApp" },
  { id: "ref-gmail-send", templateId: "gmail", x: COL_OUT_1, y: ROW_2, title: "Gmail" },
  { id: "ref-cal", templateId: "googleCalendar", x: COL_OUT_1, y: ROW_3, title: "Google Calendar" },

  // Output nodes col 2
  { id: "ref-sheets", templateId: "googleSheets", x: COL_OUT_2, y: ROW_0, title: "Google Sheets" },
  { id: "ref-slack", templateId: "slack", x: COL_OUT_2, y: ROW_1, title: "Slack" },
  { id: "ref-code", templateId: "codeNode", x: COL_OUT_2, y: ROW_2, title: "Code" },
  { id: "ref-noco", templateId: "nocodb", x: COL_OUT_2, y: ROW_3, title: "Get a row" },
];

function fromSpec(spec: Spec): WorkflowNode {
  const tmpl = allNodeTemplates.find((t) => t.id === spec.templateId)!;
  return {
    id: spec.id,
    type: tmpl.type,
    title: spec.title ?? tmpl.title,
    description: spec.description ?? tmpl.description,
    icon: tmpl.icon,
    color: tmpl.color,
    position: { x: spec.x, y: spec.y },
  };
}

const REF_CONNECTIONS: WorkflowConnection[] = [
  { from: "ref-form", to: "ref-set" },
  { from: "ref-set", to: "ref-ai" },
  { from: "ref-ai", to: "ref-switch" },
  { from: "ref-openai", to: "ref-ai", kind: "ai" },
  { from: "ref-openai", to: "ref-llm-chain", kind: "ai" },
];

export function buildReferenceN8nScene(): {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
} {
  return {
    nodes: SPECS.map(fromSpec),
    connections: REF_CONNECTIONS,
  };
}
