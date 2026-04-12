"use client";

// Placeholder homepage — the real dashboard will be built here.
// TODO: replace with actual homepage once the other contributor's PR is merged.

export default function HomePage() {
  return (
    <div
      style={{
        minHeight:       "100vh",
        backgroundColor: "var(--color-background-cream)",
        display:         "flex",
        flexDirection:   "column",
      }}
    >
      <header
        style={{
          height:          "56px",
          backgroundColor: "var(--color-primary-navy)",
          display:         "flex",
          alignItems:      "center",
          padding:         "0 32px",
        }}
      >
        <span
          style={{
            fontFamily:    "var(--font-heading)",
            fontWeight:    700,
            fontSize:      "18px",
            color:         "var(--color-white)",
            letterSpacing: "-0.01em",
          }}
        >
          NorthStar
        </span>
      </header>

      <main
        style={{
          flex:           1,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize:   "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              color:      "var(--color-text-primary)",
              margin:     "0 0 12px 0",
            }}
          >
            Welcome to NorthStar
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize:   "16px",
              color:      "var(--color-text-secondary)",
              lineHeight: 1.6,
              margin:     0,
            }}
          >
            Homepage coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
