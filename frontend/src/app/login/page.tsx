"use client";

import { useEffect, useState } from "react";
import { TOKEN_KEY } from "@/src/lib/api/apiClient";
import SignUpPopup from "@/src/app/login/components/popup";
import TypewriterBackground from "@/src/app/login/components/TypewriterBackground";

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  // Handle OAuth callback token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  return (
    <div
      style={{
        minHeight:       "100vh",
        backgroundColor: "#ffffff",
        position:        "relative",
        overflow:        "hidden",
      }}
    >
      {/* Full-screen cinematic typing loop */}
      <TypewriterBackground />

      {/* Red top bar — matches onboarding nav */}
      <header
        style={{
          position:        "fixed",
          top:             0,
          left:            0,
          right:           0,
          height:          "56px",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          padding:         "0 32px",
          zIndex:          20,
          backgroundColor: "#cc0000",
        }}
      >
        <span
          style={{
            fontFamily:    FONT,
            fontWeight:    700,
            fontSize:      "18px",
            letterSpacing: "-0.01em",
            color:         "#ffffff",
            userSelect:    "none",
          }}
        >
          NorthStar
        </span>

        <button
          onClick={() => setShowSignIn(true)}
          style={{
            padding:         "7px 16px",
            backgroundColor: "transparent",
            color:           "#ffffff",
            border:          "1.5px solid rgba(255,255,255,0.7)",
            borderRadius:    "4px",
            fontFamily:      FONT,
            fontSize:        "14px",
            fontWeight:      500,
            cursor:          "pointer",
            outline:         "none",
            minHeight:       "36px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = "2px solid white";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = "none";
          }}
        >
          Sign in
        </button>
      </header>

      {/* Sign-in popup */}
      {showSignIn && <SignUpPopup onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
