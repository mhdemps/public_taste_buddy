import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import imgQuestion from "@project-assets/question.svg";

export function HeaderPageHelp({
  children,
  /** When set, the ? sits in this frame (e.g. `tb-nav-icon-frame tb-nav-tilt-0`) for nav bar tilt. */
  iconFrameClassName,
  /** Rendered below the button, still inside the hover/focus group (e.g. nav label). */
  afterButton,
}: {
  children: ReactNode;
  iconFrameClassName?: string;
  afterButton?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = `${panelId}-trigger`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="tb-header-help-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        id={triggerId}
        className={`tb-header-help-btn${iconFrameClassName ? " tb-header-help-btn--nav-icon" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        title="About this page"
        aria-label={afterButton ? undefined : "About this page"}
      >
        {iconFrameClassName ? (
          <span className={iconFrameClassName}>
            <img src={imgQuestion} alt="" className="tb-header-help-icon tb-nav-icon-img" draggable={false} />
          </span>
        ) : (
          <img src={imgQuestion} alt="" className="tb-header-help-icon" draggable={false} />
        )}
        {afterButton}
        {!afterButton ? <span className="tb-visually-hidden">About this page</span> : null}
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={triggerId} className="tb-header-help-panel share-tech-regular">
          {children}
        </div>
      ) : null}
    </div>
  );
}
