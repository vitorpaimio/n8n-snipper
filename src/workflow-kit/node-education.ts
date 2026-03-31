import type { WorkflowNode } from "./graph-model";

export interface WorkflowNodeEducation {
  title: string;
  summary: string;
  possibilities: string[];
}

function keyFromNode(node: WorkflowNode): string {
  return node.title.trim().toLowerCase();
}

const EDUCATION_BY_TITLE: Record<string, WorkflowNodeEducation> = {
  "form trigger": {
    title: "Form Trigger",
    summary:
      "Inicia o workflow quando um formulário recebe uma submissão e transforma o evento em dados de entrada.",
    possibilities: [
      "Capturar leads, solicitações e tickets automaticamente",
      "Validar e enriquecer dados antes de enviar para CRM",
      "Disparar fluxos condicionais por tipo de resposta",
    ],
  },
  webhook: {
    title: "Webhook",
    summary:
      "Abre um endpoint HTTP para receber eventos externos em tempo real e iniciar o fluxo.",
    possibilities: [
      "Integrações com sistemas legados e plataformas SaaS",
      "Receber callbacks de pagamento, logística e autenticação",
      "Criar APIs internas orientadas a eventos",
    ],
  },
  "schedule trigger": {
    title: "Schedule Trigger",
    summary:
      "Executa o workflow por agendamento para rotinas recorrentes e automações batch.",
    possibilities: [
      "Sincronização noturna de dados",
      "Envio de relatórios periódicos",
      "Rotinas de limpeza e consistência de base",
    ],
  },
  "chat trigger": {
    title: "Chat Trigger",
    summary:
      "Recebe mensagens de chat como entrada para orquestração com IA e automações conversacionais.",
    possibilities: [
      "Atendimento automático com contexto",
      "Triagem de solicitações por intenção",
      "Escalonamento para humano com histórico consolidado",
    ],
  },
  set: {
    title: "Set",
    summary:
      "Define, transforma e normaliza campos para padronizar a estrutura de dados entre os nós.",
    possibilities: [
      "Mapear payloads heterogêneos para um schema único",
      "Criar campos calculados e aliases",
      "Remover campos sensíveis antes de persistência",
    ],
  },
  "ai agent": {
    title: "AI Agent",
    summary:
      "Coordena decisão e execução com base no contexto, usando modelo, memória e ferramentas.",
    possibilities: [
      "Escolher ações dinamicamente por objetivo do usuário",
      "Usar tools para buscar dados externos",
      "Encadear raciocínio com memória de sessão",
    ],
  },
  switch: {
    title: "Switch",
    summary:
      "Ramifica o fluxo por regras condicionais e roteia a execução para saídas específicas.",
    possibilities: [
      "Separar processamento por prioridade ou categoria",
      "Criar fallback e tratamento de exceção",
      "Controlar rotas de sucesso/erro de forma explícita",
    ],
  },
  "openai chat model": {
    title: "OpenAI Chat Model",
    summary:
      "Nó de modelo de linguagem para geração, classificação e análise textual orientada por prompts.",
    possibilities: [
      "Resumir e reescrever conteúdo",
      "Classificar intenção e sentimento",
      "Extrair entidades e estrutura de documentos",
    ],
  },
  "llm chain": {
    title: "LLM Chain",
    summary:
      "Encapsula uma cadeia de prompts/etapas para obter respostas previsíveis com contexto estruturado.",
    possibilities: [
      "Pipeline de prompt com validação intermediária",
      "Geração de respostas com formato controlado",
      "Composição com memória e ferramentas externas",
    ],
  },
};

export function getWorkflowNodeEducation(
  node: WorkflowNode,
): WorkflowNodeEducation {
  const match = EDUCATION_BY_TITLE[keyFromNode(node)];
  if (match) return match;

  return {
    title: node.title,
    summary:
      "Este nó executa uma etapa específica do workflow e troca dados com os próximos nós conectados.",
    possibilities: [
      "Automatizar uma tarefa repetitiva",
      "Compor fluxo com validações e condições",
      "Integrar APIs e serviços de terceiros",
    ],
  };
}
