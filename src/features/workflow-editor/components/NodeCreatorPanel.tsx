"use client";

import {
  getNodeCreatorCategoryLabel,
  getNodeCreatorSubsections,
  nodeCreatorRootRows,
  subsectionToTemplates,
  type NodeCreatorCategoryId,
  type NodeTemplateId,
} from "@/workflow-kit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppEventTriggerPickerModal } from "./AppEventTriggerPickerModal";

type NodeCreatorPanelProps = {
  open: boolean;
  onClose: () => void;
  onAddNode: (templateId: NodeTemplateId, options?: { appEventIntegrationId?: NodeTemplateId }) => void;
  initialCategory?: NodeCreatorCategoryId;
};

type ViewState = { mode: "root" } | { mode: "category"; id: NodeCreatorCategoryId };

function matchesSearch(q: string, title: string, description: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return title.toLowerCase().includes(n) || description.toLowerCase().includes(n);
}

export function NodeCreatorPanel({ open, onClose, onAddNode, initialCategory }: NodeCreatorPanelProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewState>({ mode: "root" });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [appEventPickerOpen, setAppEventPickerOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setView(initialCategory ? { mode: "category", id: initialCategory } : { mode: "root" });
      setCollapsed({});
      setAppEventPickerOpen(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setAppEventPickerOpen(false);
    }
  }, [open, initialCategory]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (appEventPickerOpen) return;
        if (view.mode === "category") setView({ mode: "root" });
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, view.mode, appEventPickerOpen]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      // Modal de "On App Event" fica fora do aside; sem isso o mousedown fecha o painel
      // antes do click no botão e o nó não é adicionado.
      if (appEventPickerOpen) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose, appEventPickerOpen]);

  const headerTitle = useMemo(() => {
    if (view.mode === "root") return "O que vem a seguir?";
    if (view.id === "triggers") return "Gatilhos";
    return getNodeCreatorCategoryLabel(view.id);
  }, [view]);

  const categorySections = useMemo(() => {
    if (view.mode !== "category") return [];
    return getNodeCreatorSubsections(view.id).map(subsectionToTemplates);
  }, [view]);

  const filteredCategorySections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categorySections;
    return categorySections
      .map((sec) => ({
        ...sec,
        templates: sec.templates.filter((t) => matchesSearch(q, t.title, t.description)),
      }))
      .filter((s) => s.templates.length > 0);
  }, [categorySections, search]);

  const filteredRootRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return nodeCreatorRootRows;
    return nodeCreatorRootRows.filter((row) => {
      if (row.kind === "divider") return true;
      const title = row.title.toLowerCase();
      const desc = row.description.toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [search]);

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSelect = useCallback(
    (templateId: NodeTemplateId) => {
      if (templateId === "appEventTrigger") {
        setAppEventPickerOpen(true);
        return;
      }
      onAddNode(templateId);
      onClose();
    },
    [onAddNode, onClose],
  );

  const handleAppEventIntegrationPick = useCallback(
    (integrationId: NodeTemplateId) => {
      setAppEventPickerOpen(false);
      onAddNode("appEventTrigger", { appEventIntegrationId: integrationId });
      onClose();
    },
    [onAddNode, onClose],
  );

  const closeAppEventPicker = useCallback(() => {
    setAppEventPickerOpen(false);
  }, []);

  const openCategory = useCallback((id: NodeCreatorCategoryId) => {
    setView({ mode: "category", id });
    setSearch("");
  }, []);

  return (
    <>
      <AppEventTriggerPickerModal
        open={appEventPickerOpen}
        onClose={closeAppEventPicker}
        onSelect={handleAppEventIntegrationPick}
      />
      {open && <div className="nc-backdrop" onClick={onClose} />}
      <aside
        ref={panelRef}
        className={`nc-panel${open ? " nc-panel--open" : ""}`}
      >
        <header className="nc-header">
          <div className="nc-header-row">
            {view.mode === "category" ? (
              <button
                className="nc-back-btn"
                type="button"
                aria-label="Voltar"
                onClick={() => setView({ mode: "root" })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <span className="nc-header-spacer" aria-hidden />
            )}
            <h2 className="nc-header-title nc-header-title--center">{headerTitle}</h2>
            <button className="nc-close-btn" type="button" onClick={onClose} aria-label="Fechar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="nc-search-wrapper">
          <svg className="nc-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="nc-search-input"
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button className="nc-search-clear" type="button" onClick={() => setSearch("")} aria-label="Limpar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="nc-list">
          {view.mode === "root" ? (
            <>
              {filteredRootRows.length === 0 && <p className="nc-empty">Nenhum resultado</p>}
              {filteredRootRows.map((row, i) => {
                if (row.kind === "divider") {
                  return <div key={`div-${i}`} className="nc-root-divider" />;
                }
                const Icon = row.icon;
                return (
                  <button
                    key={row.id}
                    className="nc-root-item"
                    type="button"
                    onClick={() => openCategory(row.id)}
                  >
                    <span className="nc-root-item-icon">
                      <Icon className="nc-root-item-icon-svg" />
                    </span>
                    <span className="nc-root-item-text">
                      <span className="nc-root-item-title">{row.title}</span>
                      <span className="nc-root-item-desc">{row.description}</span>
                    </span>
                    <svg className="nc-root-item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {filteredCategorySections.length === 0 && (
                <p className="nc-empty">Nenhum nó encontrado</p>
              )}
              {filteredCategorySections.map((section) => {
                const openSec = !collapsed[section.sectionTitle];
                return (
                  <section key={section.sectionTitle} className="nc-section nc-section--collapse">
                    <button
                      type="button"
                      className="nc-section-toggle"
                      onClick={() => toggleSection(section.sectionTitle)}
                      aria-expanded={openSec}
                    >
                      <h3 className="nc-section-title nc-section-title--inline">{section.sectionTitle}</h3>
                      <svg
                        className={`nc-section-chevron${openSec ? " nc-section-chevron--open" : ""}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {openSec ? (
                      <div className="nc-section-items">
                        {section.templates.map((template) => {
                          const Icon = template.icon;
                          return (
                            <button
                              key={template.id}
                              className="nc-item"
                              type="button"
                              onClick={() => handleSelect(template.id)}
                            >
                              <span className="nc-item-icon">
                                <Icon className="nc-item-icon-svg" />
                              </span>
                              <span className="nc-item-text">
                                <span className="nc-item-title">{template.title}</span>
                                {template.description ? (
                                  <span className="nc-item-desc">{template.description}</span>
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
            </>
          )}
        </div>
      </aside>
    </>
  );
}
