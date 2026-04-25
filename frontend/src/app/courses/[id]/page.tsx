"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCourse, useBestProfessors } from "@/src/hooks/useCourses";
import { useTraces } from "@/src/hooks/useTraces";
import { useFavourites, useFavouriteMutations } from "@/src/hooks/useFavourites";
import { useAuth } from "@/src/context/AuthContext";
import { useRecentlyViewed } from "@/src/hooks/useRecentlyViewed";
import { useReviews } from "@/src/hooks/useReviews";
import { Review, Trace } from "@/src/lib/api/northStarAPI.schemas";
import { getMockCourseMetrics } from "@/src/lib/mockCourseMetrics";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  return (
    <div style={{ width: "100%", height: 10, background: "#E5E7EB", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ width: `${pct * 100}%`, height: "100%", background: "var(--color-primary-navy)", borderRadius: 5 }} />
    </div>
  );
}

const HOURS_BUCKETS = ["0-2", "3-4", "5-7", "8-10", "More than 10"];
const HOURS_COLORS = ["#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6", "#1D4ED8"];

function HoursDistributionBar({ distribution }: { distribution: Record<string, number> }) {
  const total = HOURS_BUCKETS.reduce((sum, b) => sum + (distribution[b] ?? 0), 0);
  if (total === 0) return <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>—</span>;

  return (
    <div>
      <div style={{ display: "flex", width: "100%", height: 12, borderRadius: 6, overflow: "hidden", gap: 1 }}>
        {HOURS_BUCKETS.map((bucket, i) => {
          const val = distribution[bucket] ?? 0;
          const pct = (val / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={bucket} title={`${bucket} hrs: ${pct.toFixed(0)}%`} style={{ width: `${pct}%`, background: HOURS_COLORS[i], height: "100%", transition: "width 0.3s" }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        {HOURS_BUCKETS.map((bucket, i) => {
          const val = distribution[bucket] ?? 0;
          const pct = (val / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={bucket} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: HOURS_COLORS[i], flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                {bucket}h <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{pct.toFixed(0)}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-display)", fontWeight: 700, color: "var(--color-primary-navy)", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginTop: 6, marginBottom: 0 }}>
        {label}
      </p>
    </div>
  );
}

function isCourseReview(review: Review): review is Review & { courseId: string } {
  return "courseId" in review;
}

function computeTraceAverages(traces: Trace[]) {
  if (!traces.length) return { hoursDistribution: {} as Record<string, number>, courseQuality: null, instructorRating: null };

  // Aggregate hours distribution across all traces
  const hoursDistribution: Record<string, number> = {};
  for (const t of traces) {
    const raw = t.hoursDevoted;
    if (raw && typeof raw === "object") {
      for (const [bucket, val] of Object.entries(raw as Record<string, number>)) {
        hoursDistribution[bucket] = (hoursDistribution[bucket] ?? 0) + (Number(val) || 0);
      }
    }
  }

  const effArr = traces
    .map((t) => parseFloat(t.professorEfficiency))
    .filter((v) => !isNaN(v));
  const effAvg = effArr.length ? effArr.reduce((a, b) => a + b, 0) / effArr.length : null;

  return {
    hoursDistribution,
    courseQuality: effAvg !== null ? effAvg.toFixed(1) : null,
    instructorRating: effAvg !== null ? effAvg.toFixed(1) : null,
  };
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { course, isLoading } = useCourse(courseId);
  const { professors } = useBestProfessors(courseId);
  const { traces } = useTraces({ courseId });
  const { reviews } = useReviews();
  const { favourites } = useFavourites();
  const { addFavourite, removeFavourite, isAdding, isRemoving } = useFavouriteMutations();
  const { student } = useAuth();
  const currentUserId = student?.id ?? null;
  const { trackView } = useRecentlyViewed();

  const isFavourited = favourites.some((f) => f.courseId === courseId);

  const traceStats = computeTraceAverages(traces as Trace[]);
  const courseReviews = reviews.filter((review) => isCourseReview(review) && review.courseId === courseId);
  const avgRating = courseReviews.length
    ? courseReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / courseReviews.length
    : null;

  useEffect(() => {
    if (!course || !currentUserId) return;
    trackView({
      id: course.id,
      code: `${course.department.name.toUpperCase()} ${course.course_code}`,
      name: course.name,
      rating: avgRating,
    });
  }, [course, currentUserId, avgRating, trackView]);

  const nupathTags = course?.nupath
    ? course.nupath.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const handleFavouriteToggle = async () => {
    if (!currentUserId) return;
    if (isFavourited) {
      await removeFavourite(courseId);
    } else {
      await addFavourite({ course_id: courseId });
    }
  };

  const handleCompare = () => {
    router.push(`/compare?courseId=${encodeURIComponent(courseId)}`);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-background-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>Loading...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-background-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>Course not found.</p>
      </div>
    );
  }

  const deptCode = course.department.name.toUpperCase();
  const fullCode = `${deptCode} ${course.course_code}`;
  const courseMetrics = getMockCourseMetrics(course);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      {/* Main content */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 48px 80px" }}>

        {/* Back link */}
        <Link href="/courses" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", textDecoration: "none", marginBottom: 24, fontFamily: "var(--font-body)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Courses
        </Link>

        {/* Course header */}
        <div style={{ background: "var(--color-surface-light-cream)", borderRadius: "var(--border-radius-md)", padding: "32px 40px", marginBottom: 24 }}>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ flex: 1, marginRight: 24 }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, marginBottom: 10 }}>
                {fullCode}: {course.name}
              </h1>

              {/* Pre/Co reqs */}
              <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
                {course.prereqs && (
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0, fontFamily: "var(--font-body)" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Pre Reqs:</span> {course.prereqs}
                  </p>
                )}
                {course.coreqs && (
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0, fontFamily: "var(--font-body)" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Co Reqs:</span> {course.coreqs}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {nupathTags.map((tag) => (
                  <span key={tag} style={{ background: "var(--color-background-cream)", border: "1px solid var(--color-border-tan)", borderRadius: "var(--border-radius-sm)", padding: "4px 12px", fontSize: "var(--font-size-xs)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}>
                    {tag}
                  </span>
                ))}
                <span style={{ background: "var(--color-background-cream)", border: "1px solid var(--color-border-tan)", borderRadius: "var(--border-radius-sm)", padding: "4px 12px", fontSize: "var(--font-size-xs)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}>
                  {course.num_credits} Credits
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={handleFavouriteToggle}
                disabled={isAdding || isRemoving || !currentUserId}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--color-border-tan)", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isFavourited ? "#EF4444" : "var(--color-text-secondary)" }}
                aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
              >
                <HeartIcon filled={isFavourited} />
              </button>
              <button onClick={handleCompare} style={{ background: "white", border: "1px solid var(--color-border-tan)", borderRadius: "var(--border-radius-sm)", padding: "8px 20px", fontSize: "var(--font-size-xs)", fontFamily: "var(--font-body)", fontWeight: 600, cursor: "pointer", color: "var(--color-text-primary)" }}>
                Compare
              </button>
            </div>
          </div>

          {/* Course Description */}
          <div style={{ marginTop: 8 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-base)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 10 }}>
              Course Description
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
              {course.description}
            </p>
          </div>
        </div>

        {/* Ratings row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Aggregate ratings */}
          <div style={{ background: "var(--color-surface-light-cream)", borderRadius: "var(--border-radius-md)", padding: "28px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-around", gap: 16 }}>
              <StatCard label="Overall Rating" value={`${(avgRating ?? courseMetrics.overallRating).toFixed(1)}/5`} />
              <StatCard label="Difficulty" value={`${courseMetrics.difficulty.toFixed(1)}/5`} />
              <StatCard label="Relevance to Degree" value={`${courseMetrics.relevanceToDegree.toFixed(1)}/5`} />
            </div>
          </div>

          {/* TRACE summary */}
          <div style={{ background: "var(--color-surface-light-cream)", borderRadius: "var(--border-radius-md)", padding: "28px 32px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, marginBottom: 20 }}>
              TRACE summary
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", display: "block", marginBottom: 8 }}>Hours/week</span>
                <HoursDistributionBar distribution={traceStats.hoursDistribution} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>Course quality</span>
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}>
                    {traceStats.courseQuality ?? "—"}
                  </span>
                </div>
                <RatingBar value={parseFloat(traceStats.courseQuality ?? "0")} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>Instructor rating</span>
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}>
                    {traceStats.instructorRating ?? "—"}
                  </span>
                </div>
                <RatingBar value={parseFloat(traceStats.instructorRating ?? "0")} />
              </div>
            </div>
          </div>
        </div>

        {/* Best Professors */}
        <div style={{ background: "var(--color-surface-light-cream)", borderRadius: "var(--border-radius-md)", padding: "28px 32px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Best Professors to Take It With
          </h2>

          {professors.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", fontFamily: "var(--font-body)" }}>No professor data available yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {professors.map((prof) => {
                const profTraces = (traces as Trace[]).filter((t) => t.professorId === prof.id);
                const effArr = profTraces.map((t) => parseFloat(t.professorEfficiency)).filter((v) => !isNaN(v));
                const avgRating = effArr.length ? (effArr.reduce((a, b) => a + b, 0) / effArr.length).toFixed(1) : null;

                return (
                  <Link
                    key={prof.id}
                    href={`/professors/${prof.id}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--color-surface-extra-light)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border-tan)", textDecoration: "none", color: "inherit", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-primary-navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16 }}>
                          {prof.firstName[0]}{prof.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", margin: 0 }}>
                          Professor {prof.firstName} {prof.lastName}
                        </p>
                        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: "3px 0 0", fontFamily: "var(--font-body)" }}>
                          {deptCode}
                        </p>
                      </div>
                    </div>
                    {avgRating && (
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700, color: "var(--color-primary-navy)", margin: 0, lineHeight: 1 }}>
                          {avgRating}
                        </p>
                        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: "4px 0 0", fontFamily: "var(--font-body)" }}>
                          RATING
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
