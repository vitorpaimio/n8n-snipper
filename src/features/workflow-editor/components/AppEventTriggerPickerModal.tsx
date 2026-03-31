"use client";

import { getNodeCreatorSubsections, subsectionToTemplates, type NodeTemplateId } from "@/workflow-kit";
import { Radio } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AppEventTriggerPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (integrationTemplateId: NodeTemplateId) => void;
};

function matchesSearch(q: string, title: string, description: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return title.toLowerCase().includes(n) || description.toLowerCase().includes(n);
}

export function AppEventTriggerPickerModal({ open, onClose, onSelect }: AppEventTriggerPickerModalProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categorySections = useMemo(() => {
    return getNodeCreatorSubsections("actionInApp").map(subsectionToTemplates);
  }, []);

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categorySections;
    return categorySections
      .map((sec) => ({
        ...sec,
        templates: sec.templates.filter((t) => matchesSearch(q, t.title, t.description)),
      }))
      .filter((s) => s.templates.length > 0);
  }, [categorySections, search]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setCollapsed({});
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const pick = useCallback(
    (id: NodeTemplateId) => {
      onSelect(id);
    },
    [onSelect],
  );

  if (!open) return null;

  return (
    <>
      <div className="aet-backdrop" aria-hidden onClick={onClose} />
      <div ref={panelRef} className="aet-modal" role="dialog" aria-modal="true" aria-labelledby="aet-title">
        <header className="aet-header">
          <h2 id="aet-title" className="aet-title">
            Escolher app para o gatilho
          </h2>
          <button className="aet-close" type="button" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <p className="aet-subtitle">Mesmos apps de “Ação em um app”. O fluxo inicia quando algo acontece no app.</p>

        <div className="aet-search-wrap">
          <svg className="aet-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="aet-search-input"
            type="search"
            placeholder="Buscar app..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="aet-list">
          {filteredSections.length === 0 && <p className="aet-empty">Nenhum app encontrado</p>}
          {filteredSections.map((section) => {
            const openSec = !collapsed[section.sectionTitle];
            return (
              <section key={section.sectionTitle} className="aet-section">
                <button
                  type="button"
                  className="aet-section-toggle"
                  onClick={() => toggleSection(section.sectionTitle)}
                  aria-expanded={openSec}
                >
                  <h3 className="aet-section-title">{section.sectionTitle}</h3>
                  <svg
                    className={`aet-chevron${openSec ? " aet-chevron--open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openSec ? (
                  <div className="aet-section-items">
                    {section.templates.map((template) => {
                      const AppIcon = template.icon;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          className="aet-trigger-item"
                          onClick={() => pick(template.id)}
                        >
                          <span className="aet-trigger-item-radio" aria-hidden>
                            <Radio className="aet-trigger-item-radio-icon" strokeWidth={2} />
                          </span>
                          <span className="aet-trigger-item-icon">
                            <AppIcon className="aet-trigger-item-icon-svg" />
                          </span>
                          <span className="aet-trigger-item-text">
                            <span className="aet-trigger-item-title">{template.title}</span>
                            {template.description ? (
                              <span className="aet-trigger-item-desc">{template.description}</span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
