import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Braces,
  Briefcase,
  CalendarClock,
  CircleCheck,
  Clock,
  Filter,
  GitFork,
  ListChecks,
  Loader2,
  MessageCircle,
  MousePointerClick,
  PauseCircle,
  PencilLine,
  Radio,
  RefreshCw,
  ShieldCheck,
  SplitSquareVertical,
  Table2,
  Upload,
  Waypoints,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

import type { WorkflowNode } from "./graph-model";
import {
  IconWebhook,
  IconForm,
  IconCode,
  IconGmail,
  IconGoogleCalendar,
  IconGoogleSheets,
  IconWhatsApp,
  IconNocoDB,
  IconOpenAI,
  IconHttpRequest,
  IconMerge,
  IconFigma,
  IconSlack,
  IconTelegram,
  IconDiscord,
  IconTeams,
  IconTwilio,
  IconPostgres,
  IconMongoDB,
  IconMySQL,
  IconSupabase,
  IconAirtable,
  IconRedis,
  IconNotion,
  IconJira,
  IconGitHub,
  IconGitLab,
  IconTrello,
  IconAsana,
  IconLinear,
  IconTodoist,
  IconClickUp,
  IconHubSpot,
  IconSalesforce,
  IconMailchimp,
  IconPipedrive,
  IconStripe,
  IconShopify,
  IconWooCommerce,
  IconAnthropic,
  IconGemini,
  IconOllama,
  IconMCP,
  IconMistralAI,
  IconLimit,
  IconRemoveDuplicates,
  IconSplitOut,
  IconAggregate,
  IconSummarize,
  IconCompareDatasets,
  IconN8n,
  IconAiTransform,
  IconActionNetwork,
  IconFlowCategory,
  IconDeepSeek,
  IconGroq,
  IconGoogleVertex,
  IconCohere,
  IconLemonade,
  IconOpenRouter,
  IconXata,
} from "./node-icons";

function withSpin(
  Icon: ComponentType<{ className?: string }>,
): ComponentType<{ className?: string }> {
  return function SpinIcon(props: { className?: string }) {
    return <Icon {...props} className={cn("animate-spin", props.className)} />;
  };
}

const IconRunning = withSpin(Loader2);

type TemplateId =
  | "webhook"
  | "formTrigger"
  | "scheduleTrigger"
  | "chatTrigger"
  | "manualTrigger"
  | "appEventTrigger"
  | "aiAgent"
  | "llm"
  | "llmChain"
  | "anthropic"
  | "gemini"
  | "ollama"
  | "mcp"
  | "mistralAi"
  | "switchNode"
  | "ifNode"
  | "whatsapp"
  | "gmail"
  | "gmailMany"
  | "slack"
  | "telegram"
  | "discord"
  | "teams"
  | "twilio"
  | "googleSheets"
  | "nocodb"
  | "googleCalendar"
  | "postgres"
  | "mongodb"
  | "mysql"
  | "supabase"
  | "airtable"
  | "redis"
  | "notion"
  | "jira"
  | "github"
  | "gitlab"
  | "trello"
  | "asana"
  | "linear"
  | "todoist"
  | "clickup"
  | "hubspot"
  | "salesforce"
  | "mailchimp"
  | "pipedrive"
  | "stripe"
  | "shopify"
  | "woocommerce"
  | "httpRequest"
  | "codeNode"
  | "setVariable"
  | "merge"
  | "figma"
  | "animRunning"
  | "animSuccess"
  | "dateTime"
  | "filterNode"
  | "limit"
  | "removeDuplicates"
  | "splitOut"
  | "aggregate"
  | "summarize"
  | "dataTable"
  | "executeSubWorkflow"
  | "executionData"
  | "ftpNode"
  | "n8nNode"
  | "n8nForm"
  | "noOp"
  | "compareDatasets"
  | "stopAndError"
  | "wait"
  | "splitInBatches"
  | "humanReview"
  // Chat Models (language models)
  | "chatModelOpenAI"
  | "chatModelAnthropic"
  | "chatModelAzureOpenAI"
  | "chatModelAwsBedrock"
  | "chatModelCohere"
  | "chatModelDeepSeek"
  | "chatModelGemini"
  | "chatModelGoogleVertex"
  | "chatModelGroq"
  | "chatModelMistral"
  | "chatModelLemonade"
  | "chatModelOllama"
  | "chatModelOpenRouter"
  // Memory
  | "memoryPostgres"
  | "memoryMongoDB"
  | "memoryRedis"
  | "memoryXata"
  // Tools
  | "toolAiAgent"
  | "toolN8nWorkflow"
  | "toolCode"
  | "toolHttpRequest"
  | "toolMcp";

type NodeTemplate = Omit<WorkflowNode, "id" | "position"> & { id: TemplateId };

export type NodeTemplateId = TemplateId;

const nodeTemplatesInternal: NodeTemplate[] = [
  { id: "webhook", type: "trigger", title: "Webhook", description: "Inicia quando um webhook é chamado", icon: IconWebhook, color: "emerald" },
  { id: "formTrigger", type: "trigger", title: "Form Trigger", description: "Gatilho de formulário", icon: IconForm, color: "teal" },
  { id: "scheduleTrigger", type: "trigger", title: "Schedule Trigger", description: "Agendar execução", icon: CalendarClock, color: "amber" },
  { id: "chatTrigger", type: "trigger", title: "Chat Trigger", description: "Iniciar a partir de chat", icon: MessageCircle, color: "sky" },
  { id: "manualTrigger", type: "trigger", title: "Manual Trigger", description: "Runs the flow on clicking a button. Good for getting started quickly", icon: MousePointerClick, color: "slate" },
  { id: "appEventTrigger", type: "trigger", title: "On App Event", description: "Runs the flow when something happens in an app like Telegram, Notion or Airtable", icon: Radio, color: "violet" },

  { id: "aiAgent", type: "ai", title: "AI Agent", description: "Agentes autônomos e automação", icon: Bot, color: "violet" },
  { id: "llm", type: "ai", title: "OpenAI Chat Model", description: "Modelo de chat OpenAI", icon: IconOpenAI, color: "fuchsia" },
  { id: "llmChain", type: "ai", title: "LLM Chain", description: "Corrente de modelo (Model*)", icon: IconOpenAI, color: "fuchsia" },
  { id: "anthropic", type: "ai", title: "Anthropic", description: "Claude", icon: IconAnthropic, color: "stone" },
  { id: "gemini", type: "ai", title: "Google Gemini", description: "Gemini", icon: IconGemini, color: "blue" },
  { id: "ollama", type: "ai", title: "Ollama", description: "LLM local", icon: IconOllama, color: "zinc" },
  { id: "mcp", type: "ai", title: "MCP", description: "Model Context Protocol", icon: IconMCP, color: "slate" },
  { id: "mistralAi", type: "ai", title: "Mistral AI", description: "Mistral", icon: IconMistralAI, color: "orange" },

  { id: "switchNode", type: "condition", title: "Switch", description: "mode: Rules", icon: SplitSquareVertical, color: "rose" },
  { id: "ifNode", type: "condition", title: "IF", description: "Encaminhar itens em ramos verdadeiro/falso", icon: GitFork, color: "amber" },

  { id: "whatsapp", type: "communication", title: "WhatsApp", description: "message: send", icon: IconWhatsApp, color: "green" },
  { id: "gmail", type: "communication", title: "Gmail", description: "send: message", icon: IconGmail, color: "red" },
  { id: "gmailMany", type: "communication", title: "Get many messages", description: "getAll: message", icon: IconGmail, color: "red" },
  { id: "slack", type: "communication", title: "Slack", description: "message: send", icon: IconSlack, color: "purple" },
  { id: "telegram", type: "communication", title: "Telegram", description: "message: send", icon: IconTelegram, color: "sky" },
  { id: "discord", type: "communication", title: "Discord", description: "message: send", icon: IconDiscord, color: "indigo" },
  { id: "teams", type: "communication", title: "Microsoft Teams", description: "message: send", icon: IconTeams, color: "blue" },
  { id: "twilio", type: "communication", title: "Twilio", description: "SMS: send", icon: IconTwilio, color: "red" },

  { id: "googleSheets", type: "data", title: "Google Sheets", description: "appendOrUpdate: sheet", icon: IconGoogleSheets, color: "sheets" },
  { id: "nocodb", type: "data", title: "NocoDB", description: "get: row", icon: IconNocoDB, color: "indigo" },
  { id: "googleCalendar", type: "data", title: "Google Calendar", description: "create: event", icon: IconGoogleCalendar, color: "blue" },
  { id: "postgres", type: "data", title: "Postgres", description: "execute: query", icon: IconPostgres, color: "blue" },
  { id: "mongodb", type: "data", title: "MongoDB", description: "find: documents", icon: IconMongoDB, color: "green" },
  { id: "mysql", type: "data", title: "MySQL", description: "execute: query", icon: IconMySQL, color: "blue" },
  { id: "supabase", type: "data", title: "Supabase", description: "get: rows", icon: IconSupabase, color: "emerald" },
  { id: "airtable", type: "data", title: "Airtable", description: "get: records", icon: IconAirtable, color: "yellow" },
  { id: "redis", type: "data", title: "Redis", description: "get: value", icon: IconRedis, color: "red" },
  { id: "notion", type: "data", title: "Notion", description: "get: page", icon: IconNotion, color: "stone" },

  { id: "jira", type: "productivity", title: "Jira", description: "create: issue", icon: IconJira, color: "blue" },
  { id: "github", type: "productivity", title: "GitHub", description: "create: issue", icon: IconGitHub, color: "stone" },
  { id: "gitlab", type: "productivity", title: "GitLab", description: "create: issue", icon: IconGitLab, color: "orange" },
  { id: "trello", type: "productivity", title: "Trello", description: "create: card", icon: IconTrello, color: "blue" },
  { id: "asana", type: "productivity", title: "Asana", description: "create: task", icon: IconAsana, color: "rose" },
  { id: "linear", type: "productivity", title: "Linear", description: "create: issue", icon: IconLinear, color: "indigo" },
  { id: "todoist", type: "productivity", title: "Todoist", description: "create: task", icon: IconTodoist, color: "red" },
  { id: "clickup", type: "productivity", title: "ClickUp", description: "create: task", icon: IconClickUp, color: "violet" },

  { id: "hubspot", type: "marketing", title: "HubSpot", description: "create: contact", icon: IconHubSpot, color: "orange" },
  { id: "salesforce", type: "marketing", title: "Salesforce", description: "create: lead", icon: IconSalesforce, color: "blue" },
  { id: "mailchimp", type: "marketing", title: "Mailchimp", description: "add: subscriber", icon: IconMailchimp, color: "yellow" },
  { id: "pipedrive", type: "marketing", title: "Pipedrive", description: "create: deal", icon: IconPipedrive, color: "green" },

  { id: "stripe", type: "ecommerce", title: "Stripe", description: "create: charge", icon: IconStripe, color: "indigo" },
  { id: "shopify", type: "ecommerce", title: "Shopify", description: "get: order", icon: IconShopify, color: "green" },
  { id: "woocommerce", type: "ecommerce", title: "WooCommerce", description: "get: order", icon: IconWooCommerce, color: "violet" },

  { id: "httpRequest", type: "utility", title: "HTTP Request", description: "Fazer uma requisição HTTP e retornar os dados", icon: IconHttpRequest, color: "slate" },
  { id: "codeNode", type: "utility", title: "Code", description: "Executar JavaScript ou Python customizado", icon: IconCode, color: "zinc" },
  { id: "setVariable", type: "utility", title: "Edit Fields (Set)", description: "Modificar, adicionar ou remover campos do item", icon: Braces, color: "cyan" },
  { id: "merge", type: "utility", title: "Merge", description: "Unir fluxos quando ambos tiverem dados", icon: IconMerge, color: "teal" },
  { id: "figma", type: "utility", title: "Figma", description: "get: file", icon: IconFigma, color: "violet" },

  { id: "dateTime", type: "utility", title: "Date & Time", description: "Manipular valores de data e hora", icon: Clock, color: "sky" },
  { id: "filterNode", type: "utility", title: "Filter", description: "Manter apenas itens que correspondem a uma condição", icon: Filter, color: "slate" },
  { id: "limit", type: "utility", title: "Limit", description: "Restringir o número de itens", icon: IconLimit, color: "emerald" },
  { id: "removeDuplicates", type: "utility", title: "Remove Duplicates", description: "Excluir itens com valores de campo duplicados", icon: IconRemoveDuplicates, color: "teal" },
  { id: "splitOut", type: "utility", title: "Split Out", description: "Transformar lista interna em itens separados", icon: IconSplitOut, color: "violet" },
  { id: "aggregate", type: "utility", title: "Aggregate", description: "Combinar um campo de muitos itens em uma lista", icon: IconAggregate, color: "rose" },
  { id: "summarize", type: "utility", title: "Summarize", description: "Somar, contar, máximo etc. entre itens", icon: IconSummarize, color: "orange" },
  { id: "dataTable", type: "utility", title: "Data table", description: "Persistir dados entre execuções em uma tabela", icon: Table2, color: "zinc" },
  { id: "executeSubWorkflow", type: "utility", title: "Execute Sub-workflow", description: "Chamar outros workflows (modular)", icon: Waypoints, color: "stone" },
  { id: "executionData", type: "utility", title: "Execution Data", description: "Adicionar dados de execução para busca", icon: ListChecks, color: "slate" },
  { id: "ftpNode", type: "utility", title: "FTP", description: "Transferir arquivos via FTP ou SFTP", icon: Upload, color: "blue" },
  { id: "n8nNode", type: "utility", title: "n8n", description: "Eventos e ações na instância n8n", icon: IconN8n, color: "pink" },
  { id: "n8nForm", type: "utility", title: "n8n Form", description: "Gerar formulários web e enviar respostas ao fluxo", icon: IconForm, color: "teal" },
  { id: "noOp", type: "utility", title: "No Operation", description: "Nenhuma operação", icon: ArrowRight, color: "zinc" },
  { id: "compareDatasets", type: "utility", title: "Compare Datasets", description: "Comparar duas entradas para mudanças", icon: IconCompareDatasets, color: "green" },
  { id: "stopAndError", type: "utility", title: "Stop and Error", description: "Interromper o workflow com erro", icon: AlertTriangle, color: "red" },
  { id: "wait", type: "utility", title: "Wait", description: "Esperar antes de continuar a execução", icon: PauseCircle, color: "amber" },
  { id: "splitInBatches", type: "utility", title: "Loop Over Items", description: "Dividir dados em lotes e iterar (Split in Batches)", icon: RefreshCw, color: "cyan" },
  { id: "humanReview", type: "utility", title: "Human review", description: "Aprovação humana antes de ações sensíveis", icon: ShieldCheck, color: "violet" },

  // ── Chat Models (Language Models) ──
  { id: "chatModelOpenAI", type: "chatModel", title: "OpenAI Chat Model", description: "Language Model OpenAI", icon: IconOpenAI, color: "stone" },
  { id: "chatModelAnthropic", type: "chatModel", title: "Anthropic Chat Model", description: "Language Model Anthropic", icon: IconAnthropic, color: "stone" },
  { id: "chatModelAzureOpenAI", type: "chatModel", title: "Azure OpenAI Chat Model", description: "For advanced usage with an AI chain", icon: IconOpenAI, color: "blue" },
  { id: "chatModelAwsBedrock", type: "chatModel", title: "AWS Bedrock Chat Model", description: "Language Model AWS Bedrock", icon: IconOpenAI, color: "orange" },
  { id: "chatModelCohere", type: "chatModel", title: "Cohere Chat Model", description: "For advanced usage with an AI chain", icon: IconCohere, color: "purple" },
  { id: "chatModelDeepSeek", type: "chatModel", title: "DeepSeek Chat Model", description: "Language Model DeepSeek", icon: IconDeepSeek, color: "blue" },
  { id: "chatModelGemini", type: "chatModel", title: "Google Gemini Chat Model", description: "Chat Model Google Gemini", icon: IconGemini, color: "blue" },
  { id: "chatModelGoogleVertex", type: "chatModel", title: "Google Vertex Chat Model", description: "Chat Model Google Vertex", icon: IconGoogleVertex, color: "blue" },
  { id: "chatModelGroq", type: "chatModel", title: "Groq Chat Model", description: "Language Model Groq", icon: IconGroq, color: "orange" },
  { id: "chatModelMistral", type: "chatModel", title: "Mistral Cloud Chat Model", description: "For advanced usage with an AI chain", icon: IconMistralAI, color: "orange" },
  { id: "chatModelLemonade", type: "chatModel", title: "Lemonade Chat Model", description: "Language Model Lemonade Chat", icon: IconLemonade, color: "yellow" },
  { id: "chatModelOllama", type: "chatModel", title: "Ollama Chat Model", description: "Language Model Ollama", icon: IconOllama, color: "zinc" },
  { id: "chatModelOpenRouter", type: "chatModel", title: "OpenRouter Chat Model", description: "For advanced usage with an AI chain", icon: IconOpenRouter, color: "purple" },

  // ── Memory ──
  { id: "memoryPostgres", type: "memory", title: "Postgres Chat Memory", description: "Stores the chat history in Postgres table.", icon: IconPostgres, color: "blue" },
  { id: "memoryMongoDB", type: "memory", title: "MongoDB Chat Memory", description: "Stores the chat history in MongoDB collection.", icon: IconMongoDB, color: "green" },
  { id: "memoryRedis", type: "memory", title: "Redis Chat Memory", description: "Stores the chat history in Redis.", icon: IconRedis, color: "red" },
  { id: "memoryXata", type: "memory", title: "Xata", description: "Use Xata Memory", icon: IconXata, color: "purple" },

  // ── Tools (recommended + app-based) ──
  { id: "toolAiAgent", type: "tool", title: "AI Agent Tool", description: "Generates an action plan and executes it. Can use external tools.", icon: Bot, color: "violet" },
  { id: "toolN8nWorkflow", type: "tool", title: "Call n8n Workflow Tool", description: "Uses another n8n workflow as a tool.", icon: Waypoints, color: "pink" },
  { id: "toolCode", type: "tool", title: "Code Tool", description: "Write a tool in JS or Python", icon: IconCode, color: "zinc" },
  { id: "toolHttpRequest", type: "tool", title: "HTTP Request Tool", description: "Makes an HTTP request and returns the response data", icon: IconHttpRequest, color: "slate" },
  { id: "toolMcp", type: "tool", title: "MCP Client Tool", description: "Connect tools from an MCP Server", icon: IconMCP, color: "slate" },

  { id: "animRunning", type: "animation", title: "Executando", description: "", icon: IconRunning, color: "yellow" },
  { id: "animSuccess", type: "animation", title: "Sucesso", description: "", icon: CircleCheck, color: "lime" },
];

export const allNodeTemplates: NodeTemplate[] = nodeTemplatesInternal;

const templateById = new Map(nodeTemplatesInternal.map((t) => [t.id, t]));

/** @deprecated Use o criador em duas etapas (nodeCreatorRootEntries). Mantido para compat. */
export const nodeTemplateSections: { title: string; templates: NodeTemplate[] }[] = [
  { title: "Gatilhos", templates: nodeTemplatesInternal.filter((t) => t.type === "trigger") },
  { title: "IA", templates: nodeTemplatesInternal.filter((t) => ["ai", "condition"].includes(t.type)) },
  { title: "Comunicação", templates: nodeTemplatesInternal.filter((t) => t.type === "communication") },
  { title: "Dados", templates: nodeTemplatesInternal.filter((t) => t.type === "data") },
  { title: "Produtividade", templates: nodeTemplatesInternal.filter((t) => t.type === "productivity") },
  { title: "Marketing / CRM", templates: nodeTemplatesInternal.filter((t) => t.type === "marketing") },
  { title: "E-commerce", templates: nodeTemplatesInternal.filter((t) => t.type === "ecommerce") },
  { title: "Utilitários", templates: nodeTemplatesInternal.filter((t) => t.type === "utility") },
];

export type NodeCreatorCategoryId =
  | "ai"
  | "actionInApp"
  | "dataTransform"
  | "flow"
  | "core"
  | "humanReview"
  | "triggers"
  | "chatModel"
  | "memory"
  | "tool";

export type NodeCreatorRootRow =
  | {
      kind: "category";
      id: NodeCreatorCategoryId;
      title: string;
      description: string;
      icon: ComponentType<{ className?: string }>;
    }
  | {
      kind: "divider";
    }
  | {
      kind: "triggers";
      id: "triggers";
      title: string;
      description: string;
      icon: ComponentType<{ className?: string }>;
    };

export const nodeCreatorRootRows: NodeCreatorRootRow[] = [
  {
    kind: "category",
    id: "ai",
    title: "IA",
    description: "Agentes autônomos, resumos ou busca em documentos",
    icon: IconAiTransform,
  },
  {
    kind: "category",
    id: "actionInApp",
    title: "Ação em um app",
    description: "Integrações como Google Sheets, Telegram ou Notion",
    icon: IconActionNetwork,
  },
  {
    kind: "category",
    id: "dataTransform",
    title: "Transformação de dados",
    description: "Manipular, filtrar ou converter dados",
    icon: PencilLine,
  },
  {
    kind: "category",
    id: "flow",
    title: "Fluxo",
    description: "Ramificar, unir ou iterar o fluxo",
    icon: IconFlowCategory,
  },
  {
    kind: "category",
    id: "core",
    title: "Core",
    description: "Código, HTTP, webhooks e utilitários centrais",
    icon: Briefcase,
  },
  {
    kind: "category",
    id: "humanReview",
    title: "Revisão humana",
    description: "Aprovação antes de ações críticas",
    icon: ShieldCheck,
  },
  { kind: "divider" },
  {
    kind: "triggers",
    id: "triggers",
    title: "Adicionar outro gatilho",
    description: "Gatilhos iniciam o workflow; pode haver vários",
    icon: Zap,
  },
];

const TRIGGER_IDS: NodeTemplateId[] = ["manualTrigger", "webhook", "formTrigger", "scheduleTrigger", "chatTrigger", "appEventTrigger"];

const APP_INTEGRATION_IDS: NodeTemplateId[] = [
  "whatsapp",
  "gmail",
  "gmailMany",
  "slack",
  "telegram",
  "discord",
  "teams",
  "twilio",
  "googleSheets",
  "nocodb",
  "googleCalendar",
  "postgres",
  "mongodb",
  "mysql",
  "supabase",
  "airtable",
  "redis",
  "notion",
  "jira",
  "github",
  "gitlab",
  "trello",
  "asana",
  "linear",
  "todoist",
  "clickup",
  "hubspot",
  "salesforce",
  "mailchimp",
  "pipedrive",
  "stripe",
  "shopify",
  "woocommerce",
  "figma",
];

const APP_POPULAR_IDS: NodeTemplateId[] = [
  "slack",
  "gmail",
  "googleSheets",
  "notion",
  "whatsapp",
  "postgres",
  "telegram",
  "hubspot",
];

export type NodeCreatorSubsection = { sectionTitle: string; templateIds: NodeTemplateId[] };

export function getNodeCreatorSubsections(categoryId: NodeCreatorCategoryId): NodeCreatorSubsection[] {
  switch (categoryId) {
    case "ai":
      return [
        {
          sectionTitle: "Popular",
          templateIds: ["aiAgent", "llm", "llmChain", "anthropic", "gemini"],
        },
        {
          sectionTitle: "Outros",
          templateIds: ["ollama", "mcp", "mistralAi"],
        },
      ];
    case "actionInApp": {
      const rest = APP_INTEGRATION_IDS.filter((id) => !APP_POPULAR_IDS.includes(id));
      return [
        { sectionTitle: "Popular", templateIds: [...APP_POPULAR_IDS] },
        { sectionTitle: "Outras integrações", templateIds: rest },
      ];
    }
    case "dataTransform":
      return [
        {
          sectionTitle: "Popular",
          templateIds: ["codeNode", "dateTime", "setVariable"],
        },
        {
          sectionTitle: "Adicionar ou remover itens",
          templateIds: ["filterNode", "limit", "removeDuplicates", "splitOut"],
        },
        {
          sectionTitle: "Combinar itens",
          templateIds: ["aggregate", "merge", "summarize"],
        },
      ];
    case "flow":
      return [
        {
          sectionTitle: "Popular",
          templateIds: ["filterNode", "ifNode", "splitInBatches", "merge"],
        },
        {
          sectionTitle: "Outros",
          templateIds: [
            "compareDatasets",
            "executeSubWorkflow",
            "stopAndError",
            "switchNode",
            "wait",
          ],
        },
      ];
    case "core":
      return [
        {
          sectionTitle: "Popular",
          templateIds: ["codeNode", "dataTable", "httpRequest", "webhook"],
        },
        {
          sectionTitle: "Outros",
          templateIds: [
            "executeSubWorkflow",
            "executionData",
            "ftpNode",
            "n8nNode",
            "n8nForm",
            "noOp",
          ],
        },
      ];
    case "humanReview":
      return [{ sectionTitle: "Popular", templateIds: ["humanReview", "slack"] }];
    case "triggers":
      return [
        { sectionTitle: "Gatilhos", templateIds: [...TRIGGER_IDS] },
      ];
    case "chatModel":
      return [
        {
          sectionTitle: "Language Models",
          templateIds: [
            "chatModelOpenAI", "chatModelAnthropic", "chatModelAzureOpenAI", "chatModelAwsBedrock",
            "chatModelCohere", "chatModelDeepSeek", "chatModelGemini", "chatModelGoogleVertex",
            "chatModelGroq", "chatModelMistral", "chatModelLemonade", "chatModelOllama", "chatModelOpenRouter",
          ],
        },
      ];
    case "memory":
      return [
        {
          sectionTitle: "Memory",
          templateIds: ["memoryPostgres", "memoryMongoDB", "memoryRedis", "memoryXata"],
        },
      ];
    case "tool":
      return [
        {
          sectionTitle: "Recommended Tools",
          templateIds: ["toolAiAgent", "toolN8nWorkflow", "toolCode", "toolHttpRequest", "toolMcp"],
        },
        {
          sectionTitle: "Action in an app",
          templateIds: [...APP_INTEGRATION_IDS],
        },
      ];
    default:
      return [];
  }
}

export function subsectionToTemplates(sub: NodeCreatorSubsection): { sectionTitle: string; templates: NodeTemplate[] } {
  const templates = sub.templateIds.map((id) => templateById.get(id)).filter((t): t is NodeTemplate => Boolean(t));
  return { sectionTitle: sub.sectionTitle, templates };
}

const SUBPORT_CATEGORY_LABELS: Partial<Record<NodeCreatorCategoryId, string>> = {
  chatModel: "Language Models",
  memory: "Memory",
  tool: "Tools",
};

export function getNodeCreatorCategoryLabel(id: NodeCreatorCategoryId): string {
  if (id in SUBPORT_CATEGORY_LABELS) return SUBPORT_CATEGORY_LABELS[id]!;
  const row = nodeCreatorRootRows.find((r) => r.kind === "category" && r.id === id);
  return row && row.kind === "category" ? row.title : id;
}
