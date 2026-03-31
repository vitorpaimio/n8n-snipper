/**
 * Componentes de ícone dos nós usando SVGs oficiais do n8n.
 * SVGs carregados via <img> para evitar conflitos de IDs globais.
 */

import type { ComponentType } from "react";

type IconProps = { className?: string };

function svgIcon(src: string, alt: string): ComponentType<IconProps> {
  return function SvgIcon({ className }: IconProps) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} draggable={false} />
    );
  };
}

const BASE = "/node-icons";

export const IconWebhook = svgIcon(`${BASE}/webhook.svg`, "Webhook");
export const IconForm = svgIcon(`${BASE}/form.svg`, "Form Trigger");
export const IconCode = svgIcon(`${BASE}/code.svg`, "Code");
export const IconGmail = svgIcon(`${BASE}/gmail.svg`, "Gmail");
export const IconGoogleCalendar = svgIcon(`${BASE}/googleCalendar.svg`, "Google Calendar");
export const IconGoogleSheets = svgIcon(`${BASE}/googleSheets.svg`, "Google Sheets");
export const IconWhatsApp = svgIcon(`${BASE}/whatsapp.svg`, "WhatsApp");
export const IconNocoDB = svgIcon(`${BASE}/nocodb.svg`, "NocoDB");
export const IconOpenAI = svgIcon(`${BASE}/openAi.svg`, "OpenAI");
export const IconHttpRequest = svgIcon(`${BASE}/httprequest.svg`, "HTTP Request");
export const IconMerge = svgIcon(`${BASE}/merge.svg`, "Merge");
export const IconFigma = svgIcon(`${BASE}/figma.svg`, "Figma");

export const IconSlack = svgIcon(`${BASE}/slack.svg`, "Slack");
export const IconTelegram = svgIcon(`${BASE}/telegram.svg`, "Telegram");
export const IconDiscord = svgIcon(`${BASE}/discord.svg`, "Discord");
export const IconTeams = svgIcon(`${BASE}/teams.svg`, "Microsoft Teams");
export const IconTwilio = svgIcon(`${BASE}/twilio.svg`, "Twilio");

export const IconPostgres = svgIcon(`${BASE}/postgres.svg`, "Postgres");
export const IconMongoDB = svgIcon(`${BASE}/mongodb.svg`, "MongoDB");
export const IconMySQL = svgIcon(`${BASE}/mysql.svg`, "MySQL");
export const IconSupabase = svgIcon(`${BASE}/supabase.svg`, "Supabase");
export const IconAirtable = svgIcon(`${BASE}/airtable.svg`, "Airtable");
export const IconRedis = svgIcon(`${BASE}/redis.svg`, "Redis");
export const IconNotion = svgIcon(`${BASE}/notion.svg`, "Notion");

export const IconJira = svgIcon(`${BASE}/jira.svg`, "Jira");
export const IconGitHub = svgIcon(`${BASE}/github.svg`, "GitHub");
export const IconGitLab = svgIcon(`${BASE}/gitlab.svg`, "GitLab");
export const IconTrello = svgIcon(`${BASE}/trello.svg`, "Trello");
export const IconAsana = svgIcon(`${BASE}/asana.svg`, "Asana");
export const IconLinear = svgIcon(`${BASE}/linear.svg`, "Linear");
export const IconTodoist = svgIcon(`${BASE}/todoist.svg`, "Todoist");
export const IconClickUp = svgIcon(`${BASE}/clickup.svg`, "ClickUp");

export const IconHubSpot = svgIcon(`${BASE}/hubspot.svg`, "HubSpot");
export const IconSalesforce = svgIcon(`${BASE}/salesforce.svg`, "Salesforce");
export const IconMailchimp = svgIcon(`${BASE}/mailchimp.svg`, "Mailchimp");
export const IconPipedrive = svgIcon(`${BASE}/pipedrive.svg`, "Pipedrive");

export const IconStripe = svgIcon(`${BASE}/stripe.svg`, "Stripe");
export const IconShopify = svgIcon(`${BASE}/shopify.svg`, "Shopify");
export const IconWooCommerce = svgIcon(`${BASE}/wooCommerce.svg`, "WooCommerce");

export const IconAnthropic = svgIcon(`${BASE}/anthropic.svg`, "Anthropic");
export const IconGemini = svgIcon(`${BASE}/gemini.svg`, "Google Gemini");
export const IconOllama = svgIcon(`${BASE}/ollama.svg`, "Ollama");
export const IconMCP = svgIcon(`${BASE}/mcp.svg`, "MCP");
export const IconMistralAI = svgIcon(`${BASE}/mistralAi.svg`, "Mistral AI");

export const IconLimit = svgIcon(`${BASE}/limit.svg`, "Limit");
export const IconRemoveDuplicates = svgIcon(`${BASE}/removeDuplicates.svg`, "Remove Duplicates");
export const IconSplitOut = svgIcon(`${BASE}/splitOut.svg`, "Split Out");
export const IconAggregate = svgIcon(`${BASE}/aggregate.svg`, "Aggregate");
export const IconSummarize = svgIcon(`${BASE}/summarize.svg`, "Summarize");
export const IconCompareDatasets = svgIcon(`${BASE}/compareDatasets.svg`, "Compare Datasets");
export const IconN8n = svgIcon(`${BASE}/n8n.svg`, "n8n");
export const IconFlowCategory = svgIcon(`${BASE}/flowCategory.svg`, "Flow");
export const IconAiTransform = svgIcon(`${BASE}/aiTransform.svg`, "AI Transform");
export const IconActionNetwork = svgIcon(`${BASE}/actionNetwork.svg`, "Apps");

export const IconDeepSeek = svgIcon(`${BASE}/openAi.svg`, "DeepSeek");
export const IconGroq = svgIcon(`${BASE}/openAi.svg`, "Groq");
export const IconGoogleVertex = svgIcon(`${BASE}/gemini.svg`, "Google Vertex");
export const IconCohere = svgIcon(`${BASE}/openAi.svg`, "Cohere");
export const IconLemonade = svgIcon(`${BASE}/openAi.svg`, "Lemonade Chat");
export const IconOpenRouter = svgIcon(`${BASE}/openAi.svg`, "OpenRouter");
export const IconXata = svgIcon(`${BASE}/supabase.svg`, "Xata");
