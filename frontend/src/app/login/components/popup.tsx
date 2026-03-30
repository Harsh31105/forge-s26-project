"use client";

import { useEffect, useRef } from "react";
import GoogleAuth from "@/src/app/login/googleAuth";

export default function SignUpPopup({ onClose }: { onClose: () => void }) {
  const dialogRef   = useRef<HTMLDivElement>(null);
  const headingId   = "signup-dialog-title";

  // Focus the dialog on mount; restore focus to trigger on unmount
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => { previouslyFocused?.focus(); };
  }, []);

  // Trap focus inside modal + close on Escape
  useEffect(() => {
    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Dialog card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-white)",
          borderRadius: "var(--border-radius-sm)",
          border: "1px solid var(--color-border-tan)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          position: "relative",
          outline: "none",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close sign-in dialog"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--border-radius-sm)",
            fontSize: "18px",
            lineHeight: 1,
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-surface-extra-light)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)"; }}
          onFocus={(e) => { e.currentTarget.style.outline = "2px solid var(--color-primary-navy)"; e.currentTarget.style.outlineOffset = "2px"; }}
          onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
        >
          ×
        </button>

        <h2
          id={headingId}
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-base)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: "0 0 10px 0",
          }}
        >
          Sign in to NorthStar
        </h2>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 24px 0",
          }}
        >
          Access course reviews and share your own experiences with the NEU community.
          Only <strong>@husky.neu.edu</strong> accounts are supported.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--color-border-tan)", margin: "0 0 20px 0" }} />

        <GoogleAuth buttonText="Sign in with Google" />
      </div>
    </div>
  );
}
