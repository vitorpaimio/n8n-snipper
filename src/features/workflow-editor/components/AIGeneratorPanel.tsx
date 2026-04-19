"use client";

import { useState } from "react";
import type { AIWorkflowEdge, AIWorkflowNode } from "@/app/api/generate-workflow/route";
import { buildWorkflowFromAIResponse } from "../mappers/ai-workflow-mapper";

type Provider = "anthropic" | "openai";

type Props = {
  onClose: () => void;
};

export function AIGeneratorPanel({ onClose }: Props) {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, script: script || undefined, provider }),
      });

      const data = (await res.json()) as
        | { nodes: AIWorkflowNode[]; edges: AIWorkflowEdge[] }
        | { error: string };

      if ("error" in data) {
        setError(data.error);
        return;
      }

      const { nodes, edges } = buildWorkflowFromAIResponse(data.nodes, data.edges);
      window.dispatchEvent(
        new CustomEvent("workflow:load-ai-generated", { detail: { nodes, edges } }),
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar com a API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wf-ai-panel" onClick={(e) => e.stopPropagation()}>
      <div className="wf-ai-panel-header">
        <span className="wf-ai-panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--n8n-accent)" }}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          Gerar com IA
        </span>
        <button className="wf-ai-panel-close" type="button" onClick={onClose} title="Fechar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="wf-ai-panel-body">
        {/* Provider toggle */}
        <div className="wf-ai-panel-field">
          <label className="wf-ai-panel-label">Modelo</label>
          <div className="wf-ai-provider-toggle">
            <button
              type="button"
              className={`wf-ai-provider-btn${provider === "anthropic" ? " wf-ai-provider-btn--active" : ""}`}
              onClick={() => setProvider("anthropic")}
            >
              Claude
            </button>
            <button
              type="button"
              className={`wf-ai-provider-btn${provider === "openai" ? " wf-ai-provider-btn--active" : ""}`}
              onClick={() => setProvider("openai")}
            >
              GPT-4o
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="wf-ai-panel-field">
          <label className="wf-ai-panel-label" htmlFor="wf-ai-desc">
            Descrição do workflow <span style={{ color: "var(--n8n-state-error)" }}>*</span>
          </label>
          <textarea
            id="wf-ai-desc"
            className="wf-ai-textarea"
            rows={3}
            placeholder="Ex: Agente que cobra caloteiros: manda email, WhatsApp e faz ligação via Retell AI"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Script */}
        <div className="wf-ai-panel-field">
          <label className="wf-ai-panel-label" htmlFor="wf-ai-script">
            Script do vídeo{" "}
            <span style={{ color: "var(--n8n-text-muted)", fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            id="wf-ai-script"
            className="wf-ai-textarea"
            rows={6}
            placeholder="Cole o script completo aqui — a IA vai extrair o workflow descrito no texto"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
        </div>

        {/* Error */}
        {error ? (
          <div className="wf-ai-error">{error}</div>
        ) : null}

        {/* Generate button */}
        <button
          type="button"
          className="wf-ai-generate-btn"
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="wf-ai-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Gerando…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              Gerar Workflow
            </>
          )}
        </button>
      </div>
    </div>
  );
}
