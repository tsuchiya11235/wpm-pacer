"use client";

import { useId, useState, type ReactNode } from "react";

interface AccordionItemProps {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * A single collapsible section for the sidebar input-method menu. Each
 * instance owns its own open/closed state so sections can be expanded and
 * collapsed independently.
 */
export default function AccordionItem({
  title,
  hint,
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <div className="accordion-item">
      <button
        type="button"
        className="accordion-item__trigger"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>
          <span className="accordion-item__title">{title}</span>
          {hint && <span className="accordion-item__hint">{hint}</span>}
        </span>
        <span className="accordion-item__chevron" aria-hidden="true">
          ▸
        </span>
      </button>
      {open && (
        <div id={bodyId} className="accordion-item__body">
          {children}
        </div>
      )}
    </div>
  );
}
