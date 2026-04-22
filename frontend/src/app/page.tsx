"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useRecentlyViewed } from "@/src/hooks/useRecentlyViewed";
import { useAiSummaries } from "@/src/hooks/useAiSummaries";

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface-light-cream)",
  borderRadius: 16,
};

export default function Home() {
  const router = useRouter();
  const { student, isLoading } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  const { summaries, isLoading: summariesLoading } = useAiSummaries({ limit: 5 });


  useEffect(() => {
    if (!isLoading && !student) {
      router.push("/onboarding");
    }
  }, [student, isLoading, router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      {/* Page content */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px 80px" }}>
        {/* Welcome card */}
        <div
          style={{
            ...cardStyle,
            padding: "36px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 48,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-xl)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              Welcome Back{student?.firstName ? `, ${student.firstName}` : ""}!
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-sm)",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Continue planning your semester
            </p>
          </div>
          <Link
            href="/courses"
            style={{
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
            }}
          >
            Browse Courses
          </Link>
        </div>

        {/* Recently Viewed */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 20,
        }}>
          Recently Viewed
        </h2>
        {recentlyViewed.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: 56 }}>
            No courses viewed yet. Browse courses to get started.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 56 }}>
            {recentlyViewed.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  ...cardStyle,
                  padding: "28px 32px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 160,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "var(--font-size-base)",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}>
                        {course.code}
                      </p>
                      <p style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-secondary)",
                        margin: "6px 0 0",
                      }}>
                        {course.name}
                      </p>
                    </div>
                    {course.rating !== null && (
                      <span style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: 48,
                        fontWeight: 700,
                        color: "var(--color-primary-navy)",
                        lineHeight: 1,
                      }}>
                        {course.rating}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", margin: 0 }}>
                    {course.viewed}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

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

        {/* Most-Talked About Course Discussion */}
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 20,
          }}
        >
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