"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useProfessor } from "@/src/hooks/useProfessors";
import { useRMP } from "@/src/hooks/useRMP";
import { useReviews } from "@/src/hooks/useReviews";
import { useTraces } from "@/src/hooks/useTraces";
import { MapPin } from "lucide-react";
import { Review, Trace } from "@/src/lib/api/northStarAPI.schemas";

type SortOption = "newest" | "oldest" | "popular";
const formatTag = (tag: string) =>
  tag.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function ProfessorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reviewSort, setReviewSort] = useState<SortOption>("newest");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const { professor, isLoading: profLoading, error: profError } = useProfessor(id);
  const { rmpData, isLoading: rmpLoading } = useRMP(id);
  const { reviews, isLoading: reviewsLoading } = useReviews({ limit: 1000 });
  const { traces } = useTraces({ professorId: id, limit: 1000 });

  // Group this professor's traces by courseId to build offer history
  const offerHistory = useMemo(() => {
    const byCourse = new Map<string, {
      courseId: string;
      courseName: string;
      courseCode: number;
      offerings: Array<{ semester: string; year: number }>;
    }>();
    for (const t of traces as Trace[]) {
      const existing = byCourse.get(t.courseId);
      const offering = { semester: t.semester, year: t.lectureYear };
      if (existing) {
        // Dedupe offerings (multiple sections per term)
        const has = existing.offerings.some(
          (o) => o.semester === offering.semester && o.year === offering.year,
        );
        if (!has) existing.offerings.push(offering);
      } else {
        byCourse.set(t.courseId, {
          courseId: t.courseId,
          courseName: t.courseName,
          courseCode: t.courseCode,
          offerings: [offering],
        });
      }
    }
    return Array.from(byCourse.values());
  }, [traces]);

  const formatSemester = (sem: string, year: number) => {
    const map: Record<string, string> = {
      fall: "Fall",
      spring: "Spring",
      summer_1: "Summer 1",
      summer_2: "Summer 2",
    };
    return `${map[sem] ?? sem} ${year}`;
  };
  
  const profReviews = useMemo(
    () => reviews.filter(r => (r as any).professorId === id),
    [reviews, id]
  );

  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    profReviews.forEach(r => {
      (r.tags ?? []).forEach(tag => {
        map[tag] = (map[tag] ?? 0) + 1;
      });
    });
    return map;
  }, [profReviews]);

  const ratingDist = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    profReviews.forEach(r => {
      const rating = r.rating ?? 0;
      if (rating >= 1 && rating <= 5) dist[rating]++;
    });
    return dist;
  }, [profReviews]);

  const displayedReviews = useMemo(() => {
    let list = activeTagFilter
      ? profReviews.filter(r => r.tags?.includes(activeTagFilter))
      : profReviews;

    if (reviewSort === "newest") {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (reviewSort === "oldest") {
      list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (reviewSort === "popular") {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [profReviews, reviewSort, activeTagFilter]);

  const rating = rmpData?.ratingAvg ? parseFloat(rmpData.ratingAvg) : null;
  const difficulty = rmpData?.avgDifficulty ? parseFloat(rmpData.avgDifficulty) : null;
  const wta = rmpData?.ratingWta ?? null;
  const maxTagCount = Math.max(...Object.values(tagCounts), 1);
  const maxRatingCount = Math.max(...Object.values(ratingDist), 1);

  const tagLabel: Record<string, string> = {
    boston: "Boston",
    oakland: "Oakland",
    london: "London",
  };

  if (profLoading) return <LoadingScreen />;
  if (profError || !professor) return <ErrorScreen message={profError ?? "Professor not found"} onBack={() => router.push("/professors")} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      <div style={{ padding: "32px 40px" }}>
        <button
          onClick={() => router.push("/professors")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "var(--color-text-secondary)",
            padding: "0 0 20px 0",
            display: "block",
          }}
          aria-label="Back to professors"
        >
          ←
        </button>

        {/* Professor header */}
        <div style={{
          background: "var(--color-background-cream)",
          display: "flex",
          alignItems: "flex-start",
          gap: "24px",
          marginBottom: "32px",
        }}>
          <div style={{
            width: "96px",
            height: "96px",
            borderRadius: "var(--border-radius-full)",
            background: "var(--color-white)",
            border: "var(--border-width) solid var(--color-border-tan)",
            flexShrink: 0,
          }} />

          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-2xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-primary)",
              margin: "0 0 4px 0",
              lineHeight: "var(--line-height-loose)",
            }}>
              Professor {professor.firstName} {professor.lastName}
            </h1>

            {professor.tags && professor.tags.length > 0 && (
              <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                {professor.tags.map(tag => (
                  <p key={tag} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-secondary)",
                    border: "var(--border-width) solid var(--color-border-tan)",
                    borderRadius: "var(--border-radius-sm)",
                    padding: "2px 10px",
                    background: "var(--color-white)",
                    margin: 0,
                  }}>
                    <MapPin size={10} />
                    {tagLabel[tag] ?? tag}
                  </p>
                ))}
              </div>
            )}

            {!rmpLoading && (
              <div style={{
                display: "flex",
                gap: "28px",
                marginTop: "14px",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                {rating !== null && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <p style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--font-size-display)",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--color-primary-navy)",
                      lineHeight: 1,
                      margin: 0,
                    }}>
                      {rating.toFixed(1)}
                    </p>
                    <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-secondary)", margin: 0 }}>
                      Overall Rating
                    </p>
                  </div>
                )}
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                  {profReviews.length} Reviews
                </p>
                {wta !== null && (
                  <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                    Would Take Again {wta}%
                  </p>
                )}
              </div>
            )}

            {Object.keys(tagCounts).length > 0 && (
              <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                {Object.entries(tagCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([tag]) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTagFilter(prev => (prev === tag ? null : tag))}
                      style={{
                        padding: "4px 14px",
                        borderRadius: "var(--border-radius-sm)",
                        border: "var(--border-width) solid var(--color-border-tan)",
                        background: activeTagFilter === tag ? "var(--color-primary-navy)" : "var(--color-white)",
                        color: activeTagFilter === tag ? "var(--color-white)" : "var(--color-text-primary)",
                        fontSize: "var(--font-size-xs)",
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {formatTag(tag)}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Rating distribution + feedback tags */}
        {profReviews.length > 0 && (
          <div style={{
            background: "var(--color-white)",
            border: "var(--border-width) solid var(--color-border-tan)",
            borderRadius: "var(--border-radius-md)",
            padding: "28px",
            marginBottom: "28px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
          }}>
            <div>
              <p style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-secondary)",
                letterSpacing: "0.08em",
                margin: "0 0 16px 0",
                textTransform: "uppercase",
              }}>
                RATING DISTRIBUTION
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "10px", margin: 0 }}>
                      {star}
                    </p>
                    <div style={{ flex: 1, height: "12px", background: "var(--color-surface-light-cream)", borderRadius: "6px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(ratingDist[star] / maxRatingCount) * 100}%`,
                        background: "var(--color-primary-navy)",
                        borderRadius: "6px",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "20px", textAlign: "right", margin: 0 }}>
                      {ratingDist[star]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-secondary)",
                letterSpacing: "0.08em",
                margin: "0 0 16px 0",
                textTransform: "uppercase",
              }}>
                STUDENT FEEDBACK TAGS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(tagCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([tag, count]) => (
                    <div key={tag} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "100px", textTransform: "capitalize", margin: 0 }}>
                        {formatTag(tag)}
                      </p>
                      <div style={{ flex: 1, height: "12px", background: "var(--color-surface-light-cream)", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(count / maxTagCount) * 100}%`,
                          background: "var(--color-primary-navy)",
                          borderRadius: "6px",
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "20px", textAlign: "right", margin: 0 }}>
                        {count}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Offer History */}
        <div style={{
          background: "var(--color-white)",
          border: "var(--border-width) solid var(--color-border-tan)",
          borderRadius: "var(--border-radius-md)",
          padding: "28px",
          marginBottom: "28px",
        }}>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-xl)",
            fontWeight: "var(--font-weight-bold)",
            margin: "0 0 20px 0",
            color: "var(--color-text-primary)",
          }}>
            Offer History
          </h2>
          {offerHistory.length === 0 ? (
            <div style={{
              padding: "24px",
              background: "var(--color-surface-light-cream)",
              borderRadius: "var(--border-radius-sm)",
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-xs)",
              border: "1px dashed var(--color-border-tan)",
            }}>
              No offer history available
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {offerHistory.map((course) => (
                <div
                  key={course.courseId}
                  style={{
                    padding: "16px 20px",
                    background: "var(--color-surface-light-cream)",
                    borderRadius: "var(--border-radius-sm)",
                    border: "1px solid var(--color-border-tan)",
                  }}
                >
                  <div style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--font-weight-bold)",
                    fontSize: "var(--font-size-md)",
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}>
                    {course.courseCode}: {course.courseName}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {course.offerings.map((o, i) => (
                      <span
                        key={`${o.semester}-${o.year}-${i}`}
                        style={{
                          padding: "4px 12px",
                          background: "var(--color-border-tan)",
                          borderRadius: "999px",
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {formatSemester(o.semester, o.year)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div style={{
          background: "var(--color-white)",
          border: "var(--border-width) solid var(--color-border-tan)",
          borderRadius: "var(--border-radius-md)",
          padding: "28px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-bold)",
              margin: 0,
              color: "var(--color-text-primary)",
            }}>
              Reviews ({displayedReviews.length})
            </h2>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => router.push(`/professors/${id}/reviews`)}
                style={{
                  padding: "8px 20px",
                  background: "var(--color-primary-navy)",
                  color: "var(--color-white)",
                  border: "none",
                  borderRadius: "var(--border-radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: "pointer",
                }}
              >
                See Reviews
              </button>

              <select
                value={reviewSort}
                onChange={e => setReviewSort(e.target.value as SortOption)}
                style={{
                  padding: "6px 12px",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  background: "var(--color-white)",
                  fontSize: "var(--font-size-xs)",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                }}
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {activeTagFilter && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
            }}>
              Filtered by: <strong style={{ color: "var(--color-primary-navy)" }}>{formatTag(activeTagFilter)}</strong>
              <button
                onClick={() => setActiveTagFilter(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-accent-copper)",
                  fontSize: "var(--font-size-xs)",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Clear
              </button>
            </div>
          )}

          {reviewsLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: "90px",
                  background: "var(--color-surface-light-cream)",
                  borderRadius: "var(--border-radius-sm)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          )}

          {!reviewsLoading && displayedReviews.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "40px 24px",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
            }}>
              No reviews yet for this professor.
            </div>
          )}

          {!reviewsLoading && displayedReviews.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {displayedReviews.map((review, idx) => (
                <ReviewItem key={review.id} review={review} isLast={idx === displayedReviews.length - 1} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

function ReviewItem({ review, isLast }: { review: Review; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const text = review.reviewText ?? "";
  const isLong = text.length > 200;
  const displayText = isLong && !expanded ? text.slice(0, 200) + "..." : text;

  const courseId = (review as any).courseId;
  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  return (
    <div style={{
      padding: "20px 0",
      borderBottom: isLast ? "none" : "var(--border-width) solid var(--color-border-tan)",
      display: "flex",
      gap: "16px",
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "var(--border-radius-sm)",
        background: "var(--color-primary-navy)",
        color: "var(--color-white)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-heading)",
        fontWeight: "var(--font-weight-bold)",
        fontSize: "var(--font-size-base)",
        flexShrink: 0,
      }}>
        {review.rating?.toFixed(1)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          {courseId && (
            <p style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
              fontWeight: "var(--font-weight-semibold)",
              margin: 0,
            }}>
              Course ID: {courseId}
            </p>
          )}
          {dateStr && (
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
              {dateStr}
            </p>
          )}
        </div>

        <p style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-primary)",
          margin: "0 0 8px 0",
          lineHeight: "var(--line-height-tight)",
        }}>
          {displayText}
          {isLong && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-accent-copper)",
                fontSize: "var(--font-size-xs)",
                padding: "0 0 0 4px",
                fontFamily: "var(--font-body)",
              }}
            >
              {expanded ? "less" : "more..."}
            </button>
          )}
        </p>

        {review.tags && review.tags.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {review.tags.map(tag => (
              <p key={tag} style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                border: "var(--border-width) solid var(--color-border-tan)",
                borderRadius: "var(--border-radius-sm)",
                padding: "2px 8px",
                background: "var(--color-surface-light-cream)",
                margin: 0,
                display: "inline-block",
              }}>
                {formatTag(tag)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>Loading professor...</p>
    </div>
  );
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <p style={{ color: "var(--color-error)", fontFamily: "var(--font-body)" }}>{message}</p>
      <button
        onClick={onBack}
        style={{
          padding: "10px 24px",
          background: "var(--color-primary-navy)",
          color: "var(--color-white)",
          border: "none",
          borderRadius: "var(--border-radius-sm)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
        }}
      >
        Back to Professors
      </button>
    </div>
  );
}