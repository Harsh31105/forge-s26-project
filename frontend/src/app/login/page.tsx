"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/src/lib/api/me";
import SignUpPopup from "@/src/components/login/popup";
import TypewriterBackground from "@/src/components/login/TypewriterBackground";

export default function LoginPage() {
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const [authError, setAuthError]   = useState<string | null>(null);

  // Handle OAuth callback errors from URL, then check if already authenticated
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error  = params.get("error");

    if (error) {
      if (error === "not_northeastern" || error.includes("northeastern")) {
        setAuthError("Only @husky.neu.edu accounts are supported. Please sign in with your Northeastern email.");
      } else {
        setAuthError("Sign-in failed. Please try again.");
      }
      window.history.replaceState({}, "", "/login");
      return;
    }

    // Check if cookie session is active — if so, route accordingly
    const meAPI = getMe();
    meAPI.getAuthMe()
      .then((student) => {
        // Already has a session; go to onboarding if not set up, else dashboard
        if (!student.graduationYear || student.graduationYear === 0) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      })
      .catch(() => {
        // Not authenticated — stay on login page
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight:       "100vh",
        backgroundColor: "var(--color-background-cream)",
        position:        "relative",
        overflow:        "hidden",
      }}
    >
      {/* Full-screen cinematic typing loop */}
      <TypewriterBackground />

      {/* Top nav — only Sign In, no extra links */}
      <header
        style={{
          position:        "fixed",
          top:             0,
          left:            0,
          right:           0,
          height:          "60px",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          padding:         "0 32px",
          zIndex:          20,
          backgroundColor: "var(--color-primary-navy)",
          boxShadow:       "0 2px 8px rgba(0,0,0,0.18)",
        }}
      >
        <span
          style={{
            fontFamily:    "var(--font-heading)",
            fontWeight:    700,
            fontSize:      "20px",
            letterSpacing: "-0.01em",
            color:         "var(--color-white)",
            userSelect:    "none",
          }}
        >
          NorthStar
        </span>

        {/* Prominent Sign In button */}
        <button
          onClick={() => setShowSignIn(true)}
          style={{
            padding:         "9px 22px",
            backgroundColor: "var(--color-white)",
            color:           "var(--color-primary-navy)",
            border:          "none",
            borderRadius:    "var(--border-radius-sm)",
            fontFamily:      "var(--font-body)",
            fontSize:        "14px",
            fontWeight:      700,
            cursor:          "pointer",
            outline:         "none",
            minHeight:       "38px",
            letterSpacing:   "0.01em",
            boxShadow:       "0 1px 4px rgba(0,0,0,0.12)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-surface-light-cream)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-white)";
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = "2px solid white";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = "none";
          }}
        >
          Sign in →
        </button>
      </header>

      {/* Auth error banner */}
      {authError && (
        <div
          role="alert"
          style={{
            position:        "fixed",
            top:             "72px",
            left:            "50%",
            transform:       "translateX(-50%)",
            zIndex:          30,
            backgroundColor: "#fff1f2",
            border:          "1px solid #fca5a5",
            borderRadius:    "var(--border-radius-sm)",
            padding:         "12px 20px",
            maxWidth:        "460px",
            width:           "calc(100% - 32px)",
            display:         "flex",
            alignItems:      "flex-start",
            gap:             "10px",
            boxShadow:       "0 4px 12px rgba(0,0,0,0.1)",
            fontFamily:      "var(--font-body)",
            fontSize:        "14px",
            color:           "#dc2626",
            lineHeight:      1.5,
          }}
        >
          <span style={{ flexShrink: 0, fontSize: "16px" }}>⚠</span>
          <span style={{ flex: 1 }}>{authError}</span>
          <button
            onClick={() => setAuthError(null)}
            aria-label="Dismiss error"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#dc2626", fontSize: "18px", lineHeight: 1,
              padding: "0 2px", flexShrink: 0, outline: "none",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Sign-in popup */}
      {showSignIn && <SignUpPopup onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
