/**
 * Tokens visuais alinhados ao n8n dark (referência).
 * Use no canvas novo (ex.: fundo da viewport, cores de aresta, texto).
 */

export const N8N_COLORS = {
  canvasBg: "#141414",
  /** Perto do n8n dark: `--canvas--dot--color` → `--color--neutral-700` sobre fundo escuro. */
  canvasDot: "rgba(255, 255, 255, 0.22)",
  surface: "#1f1f1f",
  surfaceAlt: "#272727",
  nodeBg: "#252525",
  borderSubtle: "rgba(255, 255, 255, 0.12)",
  borderStrong: "rgba(255, 255, 255, 0.2)",
  textPrimary: "#ffffff",
  textMuted: "#ababab",
  accentPrimary: "#ff6d5a",
  accentPrimaryHover: "#ff7f6e",
  triggerRing: "#3dd68c",
  minimapMask: "rgba(0, 0, 0, 0.6)",
  surfaceHover: "#383838",
  stateSelected: "rgba(170, 123, 236, 0.38)",
  stateRunning: "rgba(255, 109, 90, 0.62)",
  stateRunningSoft: "rgba(255, 109, 90, 0.14)",
  stateError: "#f85d82",
  handleBg: "#222223",
  handleBorder: "rgba(255, 255, 255, 0.2)",
  handleHover: "rgba(255, 255, 255, 0.46)",
  handleConnecting: "#ff6d5a",
  edgeIdle: "#78787d",
  edgeHover: "#a4a4aa",
  edgeSelected: "#9f84d8",
  edgeRunning: "#ff6d5a",
  edgeError: "#f85d82",
  edgePreview: "#8f8f95",
} as const;

export const N8N_SPACING = {
  "4xs": 4,
  "3xs": 6,
  "2xs": 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const N8N_RADIUS = {
  "3xs": 4,
  "2xs": 6,
  xs: 8,
  sm: 12,
  full: 9999,
} as const;

export const N8N_TYPOGRAPHY = {
  fontFamily:
    'InterVariable, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  titleSizePx: 13,
  bodySizePx: 12,
  subtitleSizePx: 11,
  lineHeightSm: 1.25,
  lineHeightMd: 1.3,
  weightRegular: 400,
  weightMedium: 500,
  weightBold: 600,
} as const;

export const N8N_SHADOWS = {
  base: "0 2px 4px rgba(0, 0, 0, 0.2), 0 0 6px rgba(0, 0, 0, 0.2)",
  light: "0 2px 12px rgba(0, 0, 0, 0.3)",
  hover: "0 4px 14px rgba(0, 0, 0, 0.28)",
  selected: "0 0 0 2px rgba(170, 123, 236, 0.28), 0 6px 16px rgba(0, 0, 0, 0.34)",
  running: "0 0 0 2px rgba(255, 109, 90, 0.28), 0 6px 16px rgba(0, 0, 0, 0.34)",
  error: "0 0 0 2px rgba(248, 93, 130, 0.32), 0 6px 16px rgba(0, 0, 0, 0.34)",
} as const;

export const N8N_CANVAS_BG = N8N_COLORS.canvasBg;

export const N8N_GRID_DOT = N8N_COLORS.canvasDot;
/** Grade do canvas (dots); alinha com o passo de layout dos nós (16px no n8n). */
export const N8N_GRID_BASE_PX = 16;
export const N8N_GRID_STEP_PX = N8N_GRID_BASE_PX;
/** Raio base do ponto no `<Background variant="Dots" />` (React Flow; escala com o zoom). */
export const N8N_GRID_DOT_SIZE = 1.35;

/**
 * Fit view (React Flow): o default (padding ~0.1) amplia demais quando há poucos nós.
 * Padding maior + teto de zoom aproxima do conforto visual do n8n.
 */
export const N8N_FIT_VIEW_PADDING = 0.28;
export const N8N_FIT_VIEW_MAX_ZOOM = 0.82;
/** Fit com margem extra (ex. reorganizar / “tidy”). */
export const N8N_FIT_VIEW_PADDING_LOOSE = 0.36;

/**
 * Largura em px de nó com portas **não-Main** visíveis (ex.: AI Agent no canvas n8n).
 *
 * Documentação n8n: `floor(80 + 16 × (max(4, portCount) − 1) × 3)` (×1.5 opcional NDV experimental).
 *
 * | Portas não-main (ex.) | max(4, k) | Parcela 16×… | Largura |
 * |------------------------|-----------|----------------|---------|
 * | 3 (Chat + Memory + Tool) | 4 | 16×(4−1)×3 = **16×9** | **80+144 = 224** |
 */
export function n8nAiSubtypeNodeWidthPx(
  nonMainPortCount: number,
  ndvExperimental = false,
): number {
  const m = Math.max(4, nonMainPortCount);
  const inner = 80 + N8N_GRID_BASE_PX * (m - 1) * 3;
  return Math.floor(inner * (ndvExperimental ? 1.5 : 1));
}

/** Largura padrão do AI Agent (3 sub-portas): 224px. */
export const N8N_AI_AGENT_DEFAULT_WIDTH_PX = n8nAiSubtypeNodeWidthPx(3);

export const N8N_NODE_BG = N8N_COLORS.nodeBg;
export const N8N_NODE_BORDER = N8N_COLORS.borderSubtle;
export const N8N_NODE_INSET_HIGHLIGHT = "none";
export const N8N_NODE_BOX_SHADOW = N8N_SHADOWS.base;
export const N8N_NODE_BORDER_HOVER = N8N_COLORS.borderStrong;
export const N8N_NODE_BORDER_SELECTED = N8N_COLORS.stateSelected;
export const N8N_NODE_BORDER_RUNNING = N8N_COLORS.stateRunning;
export const N8N_NODE_BORDER_ERROR = N8N_COLORS.stateError;

export const N8N_RADIUS_NODE = N8N_RADIUS.sm;
export const N8N_RADIUS_TRIGGER_SQUIRCLE = N8N_RADIUS.xs;
export const N8N_RADIUS_TRIGGER_ENTRY = "36px 14px 14px 36px" as const;
export const N8N_NODE_WIDTH = 100;
export const N8N_NODE_MIN_HEIGHT = 100;
export const N8N_NODE_PADDING = 0;
export const N8N_NODE_GAP = 8;
export const N8N_NODE_ICON_SIZE = 40;

/** Altura do card principal do AI Agent, alinhada ao --canvas-node--height do n8n. */
export const N8N_AI_AGENT_CARD_HEIGHT_PX = 96;

/** Ícone do AI Agent segue --node--icon--size do n8n. */
export const N8N_AI_AGENT_ICON_SIZE_PX = N8N_NODE_ICON_SIZE;

export const N8N_TEXT_PRIMARY = N8N_COLORS.textPrimary;
export const N8N_TEXT_MUTED = N8N_COLORS.textMuted;

/** Rótulos / acento dos sub-ports AI no canvas; espelhado em globals.css (`--n8n-ai-subport-*`). */
export const N8N_AI_SUBPORT_ACCENT = "#a5a6ff";
export const N8N_AI_SUBPORT_LABEL = "#8a8a8e";

export const N8N_TRIGGER_ACCENT = N8N_COLORS.accentPrimary;
export const N8N_TRIGGER_ACCENT_HOVER = N8N_COLORS.accentPrimaryHover;
export const N8N_TRIGGER_BOLT = N8N_COLORS.accentPrimary;

export const N8N_TRIGGER_ICON_RING = N8N_COLORS.triggerRing;

export const N8N_TOOLBAR_BG = N8N_COLORS.surfaceAlt;
export const N8N_TOOLBAR_BORDER = N8N_COLORS.borderSubtle;
export const N8N_MINIMAP_MASK = N8N_COLORS.minimapMask;

export const N8N_PORT_RING = N8N_COLORS.borderStrong;
export const N8N_PORT_FILL = N8N_COLORS.nodeBg;
export const N8N_PORT_SIZE = 12;
export const N8N_PORT_FILL_BASE = N8N_COLORS.handleBg;
export const N8N_PORT_BORDER_BASE = N8N_COLORS.handleBorder;
export const N8N_PORT_BORDER_HOVER = N8N_COLORS.handleHover;
export const N8N_PORT_BORDER_CONNECTING = N8N_COLORS.handleConnecting;

export const N8N_PLUS_BG = N8N_COLORS.surfaceAlt;
export const N8N_PLUS_BG_HOVER = "#383838";
export const N8N_PLUS_BORDER = "transparent";

export const N8N_EDGE_STROKE = "#8f8f8f";
export const N8N_EDGE_STROKE_WIDTH = 2;
export const N8N_EDGE_STROKE_OPACITY = 0.78;
export const N8N_EDGE_BEZIER_TENSION = 0.45;

export const N8N_EDGE_AI_DASH = "5 6";
export const N8N_EDGE_AI_OPACITY = 0.72;
export const N8N_EDGE_HOVER_STROKE = N8N_COLORS.edgeHover;
export const N8N_EDGE_SELECTED_STROKE = N8N_COLORS.edgeSelected;
export const N8N_EDGE_RUNNING_STROKE = N8N_COLORS.edgeRunning;
export const N8N_EDGE_ERROR_STROKE = N8N_COLORS.edgeError;
export const N8N_EDGE_SELECTED_WIDTH = 1.8;
export const N8N_EDGE_RUNNING_WIDTH = 2;
export const N8N_EDGE_ERROR_WIDTH = 2;
export const N8N_EDGE_IDLE_OPACITY = 0.78;
export const N8N_EDGE_HOVER_OPACITY = 0.9;
export const N8N_EDGE_SELECTED_OPACITY = 1;
export const N8N_EDGE_RUNNING_OPACITY = 0.98;
export const N8N_EDGE_ERROR_OPACITY = 0.98;
export const N8N_EDGE_GLOW_IDLE = "drop-shadow(0 0 0 rgba(0, 0, 0, 0))";
export const N8N_EDGE_GLOW_SELECTED = "drop-shadow(0 0 2px rgba(170, 123, 236, 0.32))";
export const N8N_EDGE_GLOW_RUNNING = "drop-shadow(0 0 2px rgba(255, 109, 90, 0.34))";
export const N8N_EDGE_GLOW_ERROR = "drop-shadow(0 0 3px rgba(248, 93, 130, 0.45))";
export const N8N_CONNECTION_PREVIEW_STROKE = N8N_COLORS.edgePreview;
export const N8N_CONNECTION_PREVIEW_WIDTH = 1.6;
export const N8N_CONNECTION_PREVIEW_OPACITY = 0.8;
export const N8N_CONNECTION_PREVIEW_DASH = "6 6";
export const N8N_CONNECTION_PREVIEW_VALID_STROKE = "#3dd68c";
export const N8N_CONNECTION_PREVIEW_INVALID_STROKE = "#f85d82";

export const N8N_SHELL_BG = N8N_COLORS.canvasBg;
export const N8N_SHELL_SIDEBAR = N8N_COLORS.surface;
export const N8N_SHELL_HEADER_BORDER = N8N_COLORS.borderSubtle;
export const N8N_SHELL_MUTED_TEXT = N8N_COLORS.textMuted;

export const N8N_FONT_TITLE_PX = 13;
export const N8N_FONT_SUBTITLE_PX = 11;

export const N8N_NODE_STATE_PRIORITY = [
  "error",
  "running",
  "selected",
  "hover",
  "idle",
] as const;

export type N8NNodeVisualState = (typeof N8N_NODE_STATE_PRIORITY)[number];

export const N8N_EDGE_STATE_PRIORITY = [
  "error",
  "running",
  "selected",
  "hover",
  "idle",
] as const;

export type N8NEdgeVisualState = (typeof N8N_EDGE_STATE_PRIORITY)[number];
