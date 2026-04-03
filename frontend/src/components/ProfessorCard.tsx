
"use client";

import { useRouter } from "next/navigation";
import { Professor } from "@/src/lib/api/northStarAPI.schemas";

interface RMPData {
  ratingAvg?: string | null;
  ratingWta?: number | null;
  avgDifficulty?: string | null;
}

interface ProfessorCardProps {
  professor: Professor;
  rmpData?: RMPData;
  reviewCount?: number;
  isFavourited?: boolean;
  onToggleFavourite?: (professorId: string) => void;
}

export default function ProfessorCard({
  professor,
  rmpData,
  reviewCount = 0,
  isFavourited = false,
  onToggleFavourite,
}: ProfessorCardProps) {
  const router = useRouter();

  const rating = rmpData?.ratingAvg ? parseFloat(rmpData.ratingAvg) : null;
  const difficulty = rmpData?.avgDifficulty ? parseFloat(rmpData.avgDifficulty) : null;
  const wta = rmpData?.ratingWta ?? null;

  const tagLabel: Record<string, string> = {
    boston: "Boston",
    oakland: "Oakland",
    london: "London",
  };

  return (
    <div
      onClick={() => router.push(`/professors/${professor.id}`)}
      style={{
        background: "var(--color-white)",
        border: "var(--border-width) solid var(--color-border-tan)",
        borderRadius: "var(--border-radius-md)",
        padding: "24px 28px",
        cursor: "pointer",
        transition: "background 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-extra-light)")}
      onMouseLeave={e => (e.currentTarget.style.background = "var(--color-white)")}
    >
      <button
        onClick={e => {
          e.stopPropagation();
          onToggleFavourite?.(professor.id);
        }}
        title="Backend ticket needed: add professor_id support to Favourites API"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          color: isFavourited ? "var(--color-accent-copper)" : "var(--color-border-tan)",
          transition: "color 0.15s ease",
          lineHeight: 1,
        }}
        aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
      >
        {isFavourited ? "♥" : "♡"}
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--border-radius-full)",
            background: "var(--color-surface-light-cream)",
            border: "var(--border-width) solid var(--color-border-tan)",
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--font-size-lg)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-primary-navy)",
                  margin: 0,
                  lineHeight: "var(--line-height-tight)",
                }}
              >
                Professor {professor.firstName} {professor.lastName}
              </h2>
              {professor.tags && professor.tags.length > 0 && (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  {professor.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-secondary)",
                        border: "var(--border-width) solid var(--color-border-tan)",
                        borderRadius: "var(--border-radius-sm)",
                        padding: "2px 10px",
                        background: "var(--color-surface-light-cream)",
                      }}
                    >
                      <span style={{ fontSize: "10px" }}>📍</span>
                      {tagLabel[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {rating !== null && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--font-size-display)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--color-primary-navy)",
                    lineHeight: 1,
                  }}
                >
                  {rating.toFixed(1)}
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-secondary)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: "2px",
                  }}
                >
                  OVERALL
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: "var(--border-width) solid var(--color-border-tan)",
              margin: "14px 0",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)",
              flexWrap: "wrap",
            }}
          >
            {difficulty !== null && (
              <span>
                Difficulty:{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {difficulty.toFixed(1)}/5
                </strong>
              </span>
            )}
            {wta !== null && (
              <span>
                Would take again:{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{wta}%</strong>
              </span>
            )}
            <span>{reviewCount} reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}