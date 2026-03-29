"use client";

import { useEffect, useState } from "react";
import { TOKEN_KEY } from "@/src/lib/api/apiClient";
import GoogleAuth from "@/src/app/login/googleAuth";
import SignUpPopup from "@/src/app/login/components/popup";

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

const C = {
  red:         "#cc0000",
  redDark:     "#aa0000",
  textHeading: "#1a1a1a",
  textBody:    "#333333",
  textMuted:   "#555555",
  border:      "#e0e0e0",
  bgPage:      "#f7f7f8",
  bgCard:      "#ffffff",
  bgHover:     "#f5f5f5",
  white:       "#ffffff",
};

// ── Skip link ─────────────────────────────────────────────

function SkipLink() {
  const [focused, setFocused] = useState(false);
  return (
    <a
      href="#main-content"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: "absolute",
        left: "8px",
        top: focused ? "8px" : "-100px",
        zIndex: 999,
        backgroundColor: C.bgCard,
        color: C.red,
        padding: "8px 16px",
        borderRadius: "4px",
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: "14px",
        textDecoration: "none",
        border: `2px solid ${C.red}`,
        transition: "top 0.1s",
      }}
    >
      Skip to main content
    </a>
  );
}

// ── Nav ───────────────────────────────────────────────────

function Nav({ onSignUp }: { onSignUp: () => void }) {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "56px",
        backgroundColor: C.red,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: "18px", color: C.white, letterSpacing: "-0.01em" }}>
        NorthStar
      </span>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {["Home", "About", "Contact"].map((label) => (
          <a
            key={label}
            href="#"
            style={{ color: C.white, textDecoration: "none", fontFamily: FONT, fontSize: "15px", fontWeight: 500, outline: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
            onFocus={(e) => { e.currentTarget.style.outline = "2px solid white"; e.currentTarget.style.outlineOffset = "2px"; }}
            onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
          >
            {label}
          </a>
        ))}
        <button
          onClick={onSignUp}
          style={{
            padding: "7px 16px",
            backgroundColor: "transparent",
            color: C.white,
            border: "1.5px solid rgba(255,255,255,0.7)",
            borderRadius: "4px",
            fontFamily: FONT,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            minHeight: "36px",
            outline: "none",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
          onFocus={(e) => { e.currentTarget.style.outline = "2px solid white"; e.currentTarget.style.outlineOffset = "2px"; }}
          onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
        >
          Sign up
        </button>
      </div>
    </nav>
  );
}

// ── Login page ────────────────────────────────────────────

export default function LoginPage() {
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: C.bgPage, position: "relative" }}>
      <SkipLink />
      <Nav onSignUp={() => setShowSignUp(true)} />

      {/* Single husky logomark — bottom-right, barely visible */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/husky.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-40px",
          right: "-40px",
          width: "400px",
          height: "400px",
          objectFit: "contain",
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
      />

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            backgroundColor: C.bgCard,
            borderRadius: "6px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "40px 36px 36px",
            textAlign: "center",
          }}
        >
          {/* Wordmark */}
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontFamily: FONT, fontSize: "36px", fontWeight: 800, color: C.textHeading, letterSpacing: "-0.02em", lineHeight: 1 }}>
              North
            </span>
            <span style={{ fontFamily: FONT, fontSize: "36px", fontWeight: 800, color: C.red, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Star
            </span>
          </div>

          {/* Motto */}
          <p style={{ fontFamily: FONT, fontSize: "15px", color: C.textMuted, margin: "0 0 28px 0", lineHeight: 1.5 }}>
            Know everything about your courses
          </p>

          <hr style={{ border: "none", borderTop: `1px solid #eeeeee`, margin: "0 0 28px 0" }} />

          {/* Sign in */}
          <GoogleAuth buttonText="Sign in with Google" />

          <p style={{ fontFamily: FONT, fontSize: "13px", color: "#888888", margin: "16px 0 0 0" }}>
            Only <strong>@husky.neu.edu</strong> accounts are allowed
          </p>
        </div>
      </main>

      {showSignUp && <SignUpPopup onClose={() => setShowSignUp(false)} />}
    </div>
  );
}
