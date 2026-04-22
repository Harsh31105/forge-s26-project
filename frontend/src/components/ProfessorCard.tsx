"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
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
}

export default function ProfessorCard({
  professor,
  rmpData,
  reviewCount = 0,
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
        padding: "20px 24px",
        cursor: "pointer",
        transition: "background 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-extra-light)")}
      onMouseLeave={e => (e.currentTarget.style.background = "var(--color-white)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        {/* Avatar */}
        <div style={{
          width: "52px",
          height: "52px",
          borderRadius: "var(--border-radius-full)",
          background: "#E5E7EB",
          border: "var(--border-width) solid var(--color-border-tan)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#9CA3AF"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#9CA3AF"/>
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: "32px" }}>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-lg)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-primary-navy)",
            margin: "0 0 4px 0",
            lineHeight: "var(--line-height-tight)",
          }}>
            Professor {professor.firstName} {professor.lastName}
          </h2>

          {/* Location tags */}
          {professor.tags && professor.tags.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
              {professor.tags.map(tag => (
                <span key={tag} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-secondary)",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "2px 10px",
                  background: "var(--color-surface-light-cream)",
                }}>
                  <MapPin size={10} />
                  {tagLabel[tag] ?? tag}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{
            borderTop: "var(--border-width) solid var(--color-border-tan)",
            margin: "12px 0",
          }} />

          {/* Stats row */}
          <div style={{
            display: "flex",
            gap: "24px",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <p style={{ margin: 0 }}>
              Difficulty:{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {difficulty !== null ? `${difficulty.toFixed(1)}/5` : "—"}
              </strong>
            </p>
            <p style={{ margin: 0 }}>
              Would take again:{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {wta !== null ? `${wta}%` : "—"}
              </strong>
            </p>
            <p style={{ margin: 0 }}>{reviewCount} reviews</p>
          </div>
        </div>

        {/* Rating */}
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: "70px" }}>
          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-display)",
            fontWeight: "var(--font-weight-bold)",
            color: rating !== null ? "var(--color-primary-navy)" : "var(--color-border-tan)",
            lineHeight: 1,
          }}>
            {rating !== null ? rating.toFixed(1) : "—"}
          </div>
          <div style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginTop: "2px",
          }}>
            OVERALL
          </div>
        </div>
      </div>
    </div>
  );
}