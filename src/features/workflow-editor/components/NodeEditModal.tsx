"use client";

import { useEffect } from "react";

import { SWITCH_DEFAULT_OUTPUT_COUNT, SWITCH_MAX_OUTPUTS, defaultSwitchLabels } from "../switch-node";
import type { WorkflowCanvasNode } from "../types";
import { parseDescriptionToAction, SUGGESTED_ACTION_KEYS } from "../utils/node-subtitle";

type NodeEditModalProps = {
  open: boolean;
  node: WorkflowCanvasNode | null;
  onClose: () => void;
  onUpdate: (
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
    },
  ) => void;
};

export function NodeEditModal({ open, node, onClose, onUpdate }: NodeEditModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !node) return null;

  const parsed = parseDescriptionToAction(node.data.description);
  const displayKey = node.data.actionKey ?? parsed?.actionKey ?? "";
  const displayValue = node.data.actionValue ?? parsed?.actionValue ?? "";

  return (
    <>
      <div className="node-edit-modal-backdrop" onClick={onClose} aria-hidden />
      <div
        className="node-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-edit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="node-edit-modal-header">
          <h2 id="node-edit-modal-title" className="node-edit-modal-title">
            Editar nó
          </h2>
          <button className="node-edit-modal-close" type="button" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="node-edit-modal-fields">
          <label className="node-edit-modal-label" htmlFor={`nem-title-${node.id}`}>
            Nome
          </label>
          <input
            id={`nem-title-${node.id}`}
            className="node-edit-modal-input"
            value={node.data.title}
            onChange={(e) => onUpdate(node.id, { title: e.target.value })}
            autoComplete="off"
          />

          {node.data.templateId === "ifNode" ? (
            <>
              <span className="node-edit-modal-label">Execução do fluxo</span>
              <p className="node-edit-modal-hint">
                Só o ramo escolhido é executado (o outro fica inativo nesta simulação).
              </p>
              <div className="node-edit-modal-radio-row" role="radiogroup" aria-label="Ramo IF">
                <label className="node-edit-modal-radio">
                  <input
                    type="radio"
                    name={`if-branch-${node.id}`}
                    checked={node.data.ifBranchOutcome !== "false"}
                    onChange={() => onUpdate(node.id, { ifBranchOutcome: "true" })}
                  />
                  <span>Verdadeiro (true)</span>
                </label>
                <label className="node-edit-modal-radio">
                  <input
                    type="radio"
                    name={`if-branch-${node.id}`}
                    checked={node.data.ifBranchOutcome === "false"}
                    onChange={() => onUpdate(node.id, { ifBranchOutcome: "false" })}
                  />
                  <span>Falso (false)</span>
                </label>
              </div>
            </>
          ) : null}

          {node.data.templateId === "switchNode" ? (() => {
            const count = node.data.switchOutputCount ?? SWITCH_DEFAULT_OUTPUT_COUNT;
            const labels = node.data.switchOutputLabels ?? defaultSwitchLabels(count);
            const active = node.data.switchActiveOutput ?? 0;
            return (
              <>
                <span className="node-edit-modal-label">Quantidade de saídas</span>
                <div className="node-edit-modal-stepper">
                  <button
                    type="button"
                    className="node-edit-modal-stepper-btn"
                    disabled={count <= 1}
                    onClick={() => {
                      const next = Math.max(1, count - 1);
                      const newLabels = labels.slice(0, next);
                      onUpdate(node.id, {
                        switchOutputCount: next,
                        switchOutputLabels: newLabels,
                        switchActiveOutput: Math.min(active, next - 1),
                      });
                    }}
                  >−</button>
                  <span className="node-edit-modal-stepper-value">{count}</span>
                  <button
                    type="button"
                    className="node-edit-modal-stepper-btn"
                    disabled={count >= SWITCH_MAX_OUTPUTS}
                    onClick={() => {
                      const next = Math.min(SWITCH_MAX_OUTPUTS, count + 1);
                      const newLabels = [...labels];
                      while (newLabels.length < next) newLabels.push(String(newLabels.length));
                      onUpdate(node.id, {
                        switchOutputCount: next,
                        switchOutputLabels: newLabels,
                      });
                    }}
                  >+</button>
                </div>

                <span className="node-edit-modal-label">Nomes das saídas</span>
                <div className="node-edit-modal-switch-labels">
                  {Array.from({ length: count }, (_, i) => (
                    <input
                      key={i}
                      className="node-edit-modal-input node-edit-modal-input--sm"
                      value={labels[i] ?? String(i)}
                      onChange={(e) => {
                        const newLabels = [...labels];
                        newLabels[i] = e.target.value;
                        onUpdate(node.id, { switchOutputLabels: newLabels });
                      }}
                      placeholder={String(i)}
                      autoComplete="off"
                    />
                  ))}
                </div>

                <span className="node-edit-modal-label">Saída ativa na execução</span>
                <p className="node-edit-modal-hint">
                  Apenas a saída selecionada será executada na simulação.
                </p>
                <div className="node-edit-modal-radio-col" role="radiogroup" aria-label="Saída ativa do Switch">
                  {Array.from({ length: count }, (_, i) => (
                    <label key={i} className="node-edit-modal-radio">
                      <input
                        type="radio"
                        name={`switch-active-${node.id}`}
                        checked={active === i}
                        onChange={() => onUpdate(node.id, { switchActiveOutput: i })}
                      />
                      <span>{labels[i] ?? String(i)}</span>
                    </label>
                  ))}
                </div>
              </>
            );
          })() : null}

          {node.data.templateId === "ifNode" || node.data.templateId === "switchNode" ? null : (
            <>
              <label className="node-edit-modal-label" htmlFor={`nem-key-${node.id}`}>
                Função — chave
              </label>
              <input
                id={`nem-key-${node.id}`}
                className="node-edit-modal-input"
                list="node-edit-modal-action-keys"
                value={displayKey}
                onChange={(e) =>
                  onUpdate(node.id, {
                    actionKey: e.target.value,
                    actionValue: displayValue,
                  })
                }
                placeholder="message, mode…"
                autoComplete="off"
              />

              <label className="node-edit-modal-label" htmlFor={`nem-val-${node.id}`}>
                Função — valor
              </label>
              <input
                id={`nem-val-${node.id}`}
                className="node-edit-modal-input"
                value={displayValue}
                onChange={(e) =>
                  onUpdate(node.id, {
                    actionKey: displayKey,
                    actionValue: e.target.value,
                  })
                }
                placeholder="send, create…"
                autoComplete="off"
              />
            </>
          )}

          <div className="node-edit-modal-toggle-row">
            <label className="node-edit-modal-label" htmlFor={`nem-error-${node.id}`}>
              Simular erro na execução
            </label>
            <button
              id={`nem-error-${node.id}`}
              type="button"
              role="switch"
              aria-checked={node.data.simulateError ?? false}
              className={`node-edit-modal-switch${node.data.simulateError ? " node-edit-modal-switch--on" : ""}`}
              onClick={() => onUpdate(node.id, { simulateError: !node.data.simulateError })}
            >
              <span className="node-edit-modal-switch-thumb" />
            </button>
          </div>
        </div>
        <datalist id="node-edit-modal-action-keys">
          {SUGGESTED_ACTION_KEYS.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
      </div>
    </>
  );
}
