"use client";

import Link from "next/link";
import { useMe } from "@/src/hooks/useMe";
import { useAiSummaries } from "@/src/hooks/useAiSummaries";
import ProfilePicture from "@/src/components/ProfilePicture";

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface-light-cream)",
  borderRadius: 16,
};

export default function Home() {
  const { student } = useMe();
  const { summaries, isLoading: summariesLoading } = useAiSummaries({ limit: 5 });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      {/* Page content */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px 80px" }}>

        {/* Welcome card */}
        <div style={{
          ...cardStyle,
          padding: "36px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 48,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ProfilePicture
              studentID={student?.id ?? null}
              profilePictureUrl={student?.profilePictureUrl ?? null}
              size={72}
            />
            <div>
              <h1 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-xl)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}>
                Welcome Back{student ? `, ${student.firstName}` : ""}!
              </h1>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: 8, marginBottom: 0 }}>
                Continue planning your semester
              </p>
            </div>
          </div>
          <Link href="/courses" style={{
            background: "var(--color-primary-navy)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "14px 28px",
            fontSize: "var(--font-size-sm)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}>
            Browse Courses
          </Link>
        </div>

        {/* Most-Talked About Course Discussion */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 20,
        }}>
          Most-Talked About Course Discussion
        </h2>
        {summariesLoading && (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-text-secondary)" }}>
              Loading summaries...
            </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {summaries.map((item) => (
              <div key={item.id} style={{ ...cardStyle, padding: "20px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <p style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}>
                    {item.displayName}
                  </p>
                  <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                    color: "var(--color-text-secondary)",
                    background: "var(--color-background-cream)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}>
                  {item.reviewType === "course" ? "Course" : "Professor"}
                </span>
                </div>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-primary)",
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {item.summary}
                </p>
              </div>
          ))}
        </div>

      </main>
    </div>
  );
}