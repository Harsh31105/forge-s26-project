"use client";

import { useRouter } from "next/navigation";
import { Course, Trace } from "@/src/lib/api/northStarAPI.schemas";

interface CourseCardProps {
  course: Course;
  traces?: Trace[];
  reviewCount?: number;
  avgRating?: number | null;
}

export default function CourseCard({
  course,
  traces = [],
  reviewCount = 0,
  avgRating = null,
}: CourseCardProps) {
  const router = useRouter();

  const avgHours = traces.length > 0
    ? (traces.reduce((sum, t) => sum + t.hoursDevoted, 0) / traces.length).toFixed(1)
    : null;

  const avgEfficiency = traces.length > 0
    ? (traces.reduce((sum, t) => sum + parseFloat(t.professorEfficiency), 0) / traces.length).toFixed(1)
    : null;

  const latestTrace = traces.length > 0
    ? [...traces].sort((a, b) => b.lectureYear - a.lectureYear)[0]
    : null;

  const semesterLabel = latestTrace
    ? `${latestTrace.semester.charAt(0).toUpperCase() + latestTrace.semester.slice(1)} ${latestTrace.lectureYear}`
    : null;

  const nupath = (course as any).nupath;
  const prereqs = (course as any).prereqs;

  return (
    <div
      onClick={() => router.push(`/courses/${course.id}`)}
      style={{
        background: "var(--color-white)",
        border: "var(--border-width) solid var(--color-border-tan)",
        borderRadius: "var(--border-radius-md)",
        padding: "20px 24px",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-extra-light)")}
      onMouseLeave={e => (e.currentTarget.style.background = "var(--color-white)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Course title */}
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-lg)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-primary-navy)",
            margin: "0 0 6px 0",
            lineHeight: "var(--line-height-tight)",
          }}>
            {course.department.name} {course.course_code}: {course.name}
          </h2>

          {/* Prereqs */}
          {prereqs && (
            <p style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
              margin: "0 0 6px 0",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              ⚓ Pre Reqs: {prereqs}
            </p>
          )}

          {/* Semester */}
          {semesterLabel && (
            <p style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
              margin: "0 0 10px 0",
            }}>
              {semesterLabel}
            </p>
          )}

          {/* Tag pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {nupath && (
              <span style={{
                padding: "4px 14px",
                border: "var(--border-width) solid var(--color-primary-navy)",
                borderRadius: "var(--border-radius-sm)",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-primary-navy)",
                fontWeight: "var(--font-weight-semibold)",
              }}>
                {nupath}
              </span>
            )}
            <span style={{
              padding: "4px 14px",
              border: "var(--border-width) solid var(--color-border-tan)",
              borderRadius: "var(--border-radius-sm)",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
            }}>
              {course.num_credits} Credit{course.num_credits !== 1 ? "s" : ""}
            </span>
            {course.lecture_type && (
              <span style={{
                padding: "4px 14px",
                border: "var(--border-width) solid var(--color-border-tan)",
                borderRadius: "var(--border-radius-sm)",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                textTransform: "capitalize",
              }}>
                {course.lecture_type}
              </span>
            )}
          </div>

          <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", margin: "0 0 12px 0" }} />

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: "24px",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            flexWrap: "wrap",
          }}>
            <span>
              Difficulty:{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {avgEfficiency !== null ? `${avgEfficiency}/5` : "—"}
              </strong>
            </span>
            <span>
              Relevant:{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {avgRating !== null ? `${avgRating.toFixed(1)}/5` : "—"}
              </strong>
            </span>
            <span>
              Hours/Week:{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {avgHours !== null ? avgHours : "—"}
              </strong>
            </span>
            {reviewCount > 0 && <span>{reviewCount} reviews</span>}
          </div>
        </div>

        {/* Rating on the right */}
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: "80px" }}>
          {avgRating !== null ? (
            <>
              <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-display)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-primary-navy)",
                lineHeight: 1,
              }}>
                {avgRating.toFixed(1)}
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
            </>
          ) : (
            <>
              <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-display)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-border-tan)",
                lineHeight: 1,
              }}>
                —
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}