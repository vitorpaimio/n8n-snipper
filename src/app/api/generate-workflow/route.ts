import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// ─── Template catalog (plain data — no React components) ───────────────────

const TEMPLATE_CATALOG = [
  // Triggers
  { id: "webhook", type: "trigger", title: "Webhook", description: "Inicia quando um webhook é chamado" },
  { id: "formTrigger", type: "trigger", title: "Form Trigger", description: "Gatilho de formulário" },
  { id: "scheduleTrigger", type: "trigger", title: "Schedule Trigger", description: "Agendar execução periódica" },
  { id: "chatTrigger", type: "trigger", title: "Chat Trigger", description: "Iniciar a partir de chat" },
  { id: "manualTrigger", type: "trigger", title: "Manual Trigger", description: "Executa o fluxo ao clicar num botão" },
  { id: "appEventTrigger", type: "trigger", title: "On App Event", description: "Executa quando algo acontece em um app (Telegram, Notion, Airtable, etc.)" },
  // AI
  { id: "aiAgent", type: "ai", title: "AI Agent", description: "Agente autônomo que executa tarefas com ferramentas externas" },
  { id: "llmChain", type: "ai", title: "LLM Chain", description: "Cadeia de modelo de linguagem" },
  // Conditions
  { id: "ifNode", type: "condition", title: "IF", description: "Encaminha itens em ramos verdadeiro/falso" },
  { id: "switchNode", type: "condition", title: "Switch", description: "Encaminha itens por múltiplos ramos com regras" },
  // Communication
  { id: "whatsapp", type: "communication", title: "WhatsApp", description: "Enviar mensagem via WhatsApp" },
  { id: "gmail", type: "communication", title: "Gmail", description: "Enviar e-mail via Gmail" },
  { id: "gmailMany", type: "communication", title: "Gmail — Get Many", description: "Buscar múltiplas mensagens do Gmail" },
  { id: "slack", type: "communication", title: "Slack", description: "Enviar mensagem no Slack" },
  { id: "telegram", type: "communication", title: "Telegram", description: "Enviar mensagem no Telegram" },
  { id: "discord", type: "communication", title: "Discord", description: "Enviar mensagem no Discord" },
  { id: "teams", type: "communication", title: "Microsoft Teams", description: "Enviar mensagem no Teams" },
  { id: "twilio", type: "communication", title: "Twilio", description: "Enviar SMS ou iniciar chamada telefônica" },
  // Data
  { id: "googleSheets", type: "data", title: "Google Sheets", description: "Ler ou escrever em planilhas do Google" },
  { id: "nocodb", type: "data", title: "NocoDB", description: "Banco de dados NocoDB" },
  { id: "googleCalendar", type: "data", title: "Google Calendar", description: "Criar ou buscar eventos no calendário" },
  { id: "postgres", type: "data", title: "Postgres", description: "Executar queries SQL no Postgres" },
  { id: "mongodb", type: "data", title: "MongoDB", description: "Operações no MongoDB" },
  { id: "mysql", type: "data", title: "MySQL", description: "Executar queries SQL no MySQL" },
  { id: "supabase", type: "data", title: "Supabase", description: "Operações no Supabase" },
  { id: "airtable", type: "data", title: "Airtable", description: "Ler ou escrever registros no Airtable" },
  { id: "redis", type: "data", title: "Redis", description: "Get/Set de valores no Redis" },
  { id: "notion", type: "data", title: "Notion", description: "Criar ou buscar páginas no Notion" },
  // Productivity
  { id: "jira", type: "productivity", title: "Jira", description: "Criar ou atualizar issues no Jira" },
  { id: "github", type: "productivity", title: "GitHub", description: "Criar issues ou PRs no GitHub" },
  { id: "trello", type: "productivity", title: "Trello", description: "Criar ou mover cartões no Trello" },
  { id: "asana", type: "productivity", title: "Asana", description: "Criar tarefas no Asana" },
  { id: "linear", type: "productivity", title: "Linear", description: "Criar issues no Linear" },
  { id: "todoist", type: "productivity", title: "Todoist", description: "Criar tarefas no Todoist" },
  { id: "clickup", type: "productivity", title: "ClickUp", description: "Criar tarefas no ClickUp" },
  // Marketing / CRM
  { id: "hubspot", type: "marketing", title: "HubSpot", description: "Criar contatos ou negócios no HubSpot" },
  { id: "salesforce", type: "marketing", title: "Salesforce", description: "Criar leads no Salesforce" },
  { id: "mailchimp", type: "marketing", title: "Mailchimp", description: "Adicionar assinantes no Mailchimp" },
  { id: "pipedrive", type: "marketing", title: "Pipedrive", description: "Criar negócios no Pipedrive" },
  // E-commerce
  { id: "stripe", type: "ecommerce", title: "Stripe", description: "Criar cobranças no Stripe" },
  { id: "shopify", type: "ecommerce", title: "Shopify", description: "Buscar pedidos no Shopify" },
  { id: "woocommerce", type: "ecommerce", title: "WooCommerce", description: "Buscar pedidos no WooCommerce" },
  // Utility
  { id: "httpRequest", type: "utility", title: "HTTP Request", description: "Fazer uma requisição HTTP para qualquer API" },
  { id: "codeNode", type: "utility", title: "Code", description: "Executar JavaScript ou Python customizado" },
  { id: "setVariable", type: "utility", title: "Edit Fields (Set)", description: "Modificar, adicionar ou remover campos do item" },
  { id: "merge", type: "utility", title: "Merge", description: "Unir dois fluxos paralelos" },
  { id: "dateTime", type: "utility", title: "Date & Time", description: "Manipular valores de data e hora" },
  { id: "filterNode", type: "utility", title: "Filter", description: "Manter apenas itens que correspondem a uma condição" },
  { id: "wait", type: "utility", title: "Wait", description: "Esperar um tempo antes de continuar" },
  { id: "splitInBatches", type: "utility", title: "Loop Over Items", description: "Iterar sobre itens em lotes" },
  { id: "humanReview", type: "utility", title: "Human Review", description: "Aprovação humana antes de continuar" },
  { id: "executeSubWorkflow", type: "utility", title: "Execute Sub-workflow", description: "Chamar outro workflow" },
  { id: "noOp", type: "utility", title: "No Operation", description: "Nenhuma operação — apenas passa os dados adiante" },
  // Chat Models (conectados a aiAgent via edge "ai")
  { id: "chatModelOpenAI", type: "chatModel", title: "OpenAI Chat Model", description: "Modelo GPT da OpenAI (para usar com AI Agent)" },
  { id: "chatModelAnthropic", type: "chatModel", title: "Anthropic Chat Model", description: "Modelo Claude da Anthropic (para usar com AI Agent)" },
  { id: "chatModelGemini", type: "chatModel", title: "Google Gemini Chat Model", description: "Modelo Gemini do Google (para usar com AI Agent)" },
  { id: "chatModelGroq", type: "chatModel", title: "Groq Chat Model", description: "Modelo via Groq (para usar com AI Agent)" },
  { id: "chatModelDeepSeek", type: "chatModel", title: "DeepSeek Chat Model", description: "Modelo DeepSeek (para usar com AI Agent)" },
  { id: "chatModelOllama", type: "chatModel", title: "Ollama Chat Model", description: "Modelo local via Ollama (para usar com AI Agent)" },
  // Memory (conectados a aiAgent via edge "ai")
  { id: "memoryPostgres", type: "memory", title: "Postgres Chat Memory", description: "Histórico de chat salvo no Postgres (para usar com AI Agent)" },
  { id: "memoryRedis", type: "memory", title: "Redis Chat Memory", description: "Histórico de chat salvo no Redis (para usar com AI Agent)" },
  // Tools (conectados a aiAgent via edge "ai")
  { id: "toolHttpRequest", type: "tool", title: "HTTP Request Tool", description: "Ferramenta para fazer requisições HTTP dentro de um agente" },
  { id: "toolCode", type: "tool", title: "Code Tool", description: "Ferramenta para executar código dentro de um agente" },
  { id: "toolN8nWorkflow", type: "tool", title: "Call n8n Workflow Tool", description: "Ferramenta para chamar outro workflow dentro de um agente" },
  { id: "toolMcp", type: "tool", title: "MCP Client Tool", description: "Conectar ferramentas de um servidor MCP ao agente" },
] as const;

const CATALOG_TEXT = TEMPLATE_CATALOG.map(
  (t) => `- ${t.id} [${t.type}] "${t.title}": ${t.description}`
).join("\n");

const SYSTEM_PROMPT = `Você é um especialista em design de workflows n8n para criadores de conteúdo. Sua tarefa é criar um workflow visual que represente o que está sendo descrito.

## Templates disponíveis (use SOMENTE estes IDs exatos):

${CATALOG_TEXT}

## Regras obrigatórias

1. O workflow DEVE começar com um nó trigger (type: "trigger")
2. Use IDs simples e sequenciais: "n1", "n2", "n3"...
3. Edges entre nós do fluxo principal: kind "main"
4. O nó aiAgent DEVE estar no fluxo principal conectado por edges "main" (trigger → ... → aiAgent → ...)
5. chatModel, memory e tool são SUB-NÓS do aiAgent — conecte-os com kind "ai" e sourceHandle:
   - chatModel → sourceHandle: "agent-chatModel"
   - memory    → sourceHandle: "agent-memory"
   - tool      → sourceHandle: "agent-tool"
6. NUNCA use kind "ai" para conectar o aiAgent a outros nós do fluxo principal — isso é sempre "main"
7. O nó splitInBatches (Loop Over Items) tem DUAS saídas com sourceHandle obrigatório:
   - "loop-loop": conecta ao nó que será processado em cada iteração (o corpo do loop)
   - "loop-done": conecta ao nó seguinte APÓS todas as iterações terminarem
   Exemplo: splitInBatches → (loop-loop) → nó de processamento, splitInBatches → (loop-done) → nó final
8. Dê títulos ESPECÍFICOS ao contexto (ex: "Cobrar via WhatsApp", não apenas "WhatsApp")
9. Mantenha o workflow focado — máximo 10 nós no fluxo principal

## Exemplo correto de workflow com AI Agent

Descrição: "Agente que responde perguntas de clientes usando GPT e ferramentas HTTP"

\`\`\`json
{
  "nodes": [
    { "id": "n1", "templateId": "chatTrigger",      "title": "Pergunta do Cliente" },
    { "id": "n2", "templateId": "aiAgent",           "title": "Agente de Suporte" },
    { "id": "n3", "templateId": "chatModelOpenAI",   "title": "GPT-4o" },
    { "id": "n4", "templateId": "toolHttpRequest",   "title": "Buscar Base de Conhecimento" },
    { "id": "n5", "templateId": "whatsapp",          "title": "Enviar Resposta ao Cliente", "actionKey": "message", "actionValue": "send" }
  ],
  "edges": [
    { "source": "n1", "target": "n2", "kind": "main" },
    { "source": "n2", "target": "n3", "kind": "ai",   "sourceHandle": "agent-chatModel" },
    { "source": "n2", "target": "n4", "kind": "ai",   "sourceHandle": "agent-tool" },
    { "source": "n2", "target": "n5", "kind": "main" }
  ]
}
\`\`\`

Observe: n2 (aiAgent) está no fluxo principal (n1→n2→n5 via "main"). Os sub-nós n3 e n4 são conectados via "ai".

## Formato de resposta

Retorne SOMENTE um JSON válido, sem texto extra, sem markdown, sem explicações:

{
  "nodes": [
    {
      "id": "n1",
      "templateId": "<id do template>",
      "title": "<título específico>",
      "actionKey": "<chave opcional>",
      "actionValue": "<valor opcional>"
    }
  ],
  "edges": [
    {
      "source": "n1",
      "target": "n2",
      "kind": "main"
    }
  ]
}`;

// ─── Types ──────────────────────────────────────────────────────────────────

export type AIWorkflowNode = {
  id: string;
  templateId: string;
  title: string;
  actionKey?: string;
  actionValue?: string;
  ifBranchOutcome?: "true" | "false";
  switchOutputCount?: number;
  switchActiveOutput?: number;
};

export type AIWorkflowEdge = {
  source: string;
  target: string;
  kind: "main" | "ai";
  sourceHandle?: string;
};

type GenerateWorkflowResponse =
  | { nodes: AIWorkflowNode[]; edges: AIWorkflowEdge[] }
  | { error: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildUserPrompt(description: string, script?: string): string {
  let prompt = `Crie um workflow n8n para: ${description}`;
  if (script?.trim()) {
    prompt += `\n\nContexto adicional (script do vídeo):\n"""\n${script.trim()}\n"""`;
  }
  return prompt;
}

function parseAIResponse(text: string): { nodes: AIWorkflowNode[]; edges: AIWorkflowEdge[] } {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned) as { nodes: AIWorkflowNode[]; edges: AIWorkflowEdge[] };
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("Resposta da IA não contém nodes ou edges");
  }
  return parsed;
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<GenerateWorkflowResponse>> {
  let body: { description?: string; script?: string; provider?: string };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { description, script, provider = "anthropic" } = body;

  if (!description?.trim()) {
    return NextResponse.json({ error: "Descrição do workflow é obrigatória" }, { status: 400 });
  }

  const userPrompt = buildUserPrompt(description, script);

  try {
    let responseText: string;

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
      }
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      });
      responseText = completion.choices[0]?.message?.content ?? "";
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500 });
      }
      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}` }],
        temperature: 0.3,
      });
      const block = message.content[0];
      responseText = block.type === "text" ? block.text : "";
    }

    const result = parseAIResponse(responseText);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: `Falha ao gerar workflow: ${message}` }, { status: 500 });
  }
}
