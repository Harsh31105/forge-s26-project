"use client";

import { useAiSummaries } from "@/src/hooks/useAiSummaries";

export default function HomePage() {
  const { summaries, isLoading, error } = useAiSummaries({ limit: 5 });

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
          flex:    1,
          padding: "48px 32px",
          maxWidth: "800px",
          margin:  "0 auto",
          width:   "100%",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize:   "clamp(24px, 4vw, 36px)",
            fontWeight: 700,
            color:      "var(--color-text-primary)",
            margin:     "0 0 8px 0",
          }}
        >
          Welcome to NorthStar
        </h1>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize:   "18px",
            fontWeight: 600,
            color:      "var(--color-text-primary)",
            margin:     "32px 0 16px 0",
          }}
        >
          Trending Reviews
        </h2>

        {isLoading && (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-text-secondary)" }}>
            Loading summaries...
          </p>
        )}

        {error && (
          <p style={{ fontFamily: "var(--font-body)", color: "red" }}>
            {error}
          </p>
        )}

        {summaries.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "var(--color-white)",
              borderRadius:    "8px",
              padding:         "16px 20px",
              marginBottom:    "12px",
              boxShadow:       "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <span
              style={{
                fontFamily:      "var(--font-body)",
                fontSize:        "11px",
                fontWeight:      600,
                textTransform:   "uppercase",
                letterSpacing:   "0.05em",
                color:           "var(--color-text-secondary)",
                backgroundColor: "var(--color-background-cream)",
                padding:         "2px 8px",
                borderRadius:    "4px",
              }}
            >
              {item.reviewType === "course" ? "Course" : "Professor"}
            </span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   "15px",
                color:      "var(--color-text-primary)",
                lineHeight: 1.6,
                margin:     "10px 0 0 0",
              }}
            >
              {item.summary}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}
