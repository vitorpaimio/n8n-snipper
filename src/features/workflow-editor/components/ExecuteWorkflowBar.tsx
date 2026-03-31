"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";

import type { NodeTemplateId } from "@/workflow-kit";

type TriggerInfo = {
  id: string;
  title: string;
  templateId: NodeTemplateId;
  icon: ComponentType<{ className?: string }>;
};

type ExecuteWorkflowBarProps = {
  isRunning: boolean;
  onExecute: () => void;
  onStop: () => void;
  triggers: TriggerInfo[];
  selectedTriggerId: string | null;
  onSelectTrigger: (id: string) => void;
};

export function ExecuteWorkflowBar({
  isRunning,
  onExecute,
  onStop,
  triggers,
  selectedTriggerId,
  onSelectTrigger,
}: ExecuteWorkflowBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = triggers.find((t) => t.id === selectedTriggerId) ?? triggers[0];
  const triggerName = selected?.title ?? "Trigger";
  const hasChatTrigger = triggers.some((t) => t.templateId === "chatTrigger");
  const multipleTriggers = triggers.length > 1;

  useEffect(() => {
    if (!multipleTriggers) setMenuOpen(false);
  }, [multipleTriggers]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div className="exec-bar">
      {!isRunning ? (
        <div className="exec-bar-split" ref={menuRef}>
          <button
            className={`exec-bar-run${multipleTriggers ? "" : " exec-bar-run--solo"}`}
            type="button"
            onClick={onExecute}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="exec-bar-flask"
              aria-hidden
            >
              <path d="M9 3h6M12 3v7.4a2 2 0 0 0 .6 1.4l5 5a1.5 1.5 0 0 1-1.1 2.6H7.5a1.5 1.5 0 0 1-1.1-2.6l5-5a2 2 0 0 0 .6-1.4V3"/>
            </svg>
            <span className={`exec-bar-text${multipleTriggers ? "" : " exec-bar-text--solo"}`}>
              <span className="exec-bar-label">Execute workflow</span>
              {multipleTriggers ? (
                <span className="exec-bar-from">from <strong>{triggerName}</strong></span>
              ) : null}
            </span>
          </button>
          {multipleTriggers ? (
            <>
              <button
                className="exec-bar-chevron"
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Selecionar trigger"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {menuOpen ? (
                <div className="exec-bar-menu">
                  {triggers.map((trigger) => {
                    const Icon = trigger.icon;
                    const isActive = trigger.id === selected?.id;
                    return (
                      <button
                        key={trigger.id}
                        className={`exec-bar-menu-item${isActive ? " exec-bar-menu-item--active" : ""}`}
                        type="button"
                        onClick={() => { onSelectTrigger(trigger.id); setMenuOpen(false); }}
                      >
                        <span className="exec-bar-menu-icon">
                          <Icon className="exec-bar-menu-icon-svg" />
                        </span>
                        <span>from {trigger.title}</span>
                        {isActive ? (
                          <svg className="exec-bar-menu-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <>
          <button className="exec-bar-running" type="button" disabled>
            <svg className="exec-bar-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            <span>Executando...</span>
          </button>
          <button className="exec-bar-stop" type="button" onClick={onStop}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
            <span>Stop</span>
          </button>
        </>
      )}

      {hasChatTrigger ? (
        <button className="exec-bar-chat" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          Open chat
        </button>
      ) : null}
    </div>
  );
}
