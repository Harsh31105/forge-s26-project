
"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useProfessor } from "@/src/hooks/useProfessors";
import { useRMP } from "@/src/hooks/useRMP";
import { useReviews } from "@/src/hooks/useReviews";
import { useFavourites, useFavouriteMutations } from "@/src/hooks/useFavourites";
import Navbar from "@/src/components/NavBar";
import { Review } from "@/src/lib/api/northStarAPI.schemas";

type SortOption = "newest" | "oldest" | "popular";

export default function ProfessorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reviewSort, setReviewSort] = useState<SortOption>("newest");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const { professor, isLoading: profLoading, error: profError } = useProfessor(id);
  const { rmpData, isLoading: rmpLoading } = useRMP(id);
  const { reviews, isLoading: reviewsLoading } = useReviews();
  const { favourites } = useFavourites();
  const { addFavourite, removeFavourite } = useFavouriteMutations();

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

  const isFavourited = useMemo(
    () => favourites.some(f => (f as any).professorId === id),
    [favourites, id]
  );

  const handleToggleFavourite = async () => {
    if (isFavourited) {
      await removeFavourite(id);
    } else {
      // @ts-expect-error — professor_id not in schema yet;
      await addFavourite({ professor_id: id });
    }
  };

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
      <Navbar activePage="professors" />

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
        <div
          style={{
            background: "var(--color-background-cream)",
            display: "flex",
            alignItems: "flex-start",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "var(--border-radius-full)",
              background: "var(--color-white)",
              border: "var(--border-width) solid var(--color-border-tan)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <h1
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--font-size-2xl)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--color-text-primary)",
                    margin: "0 0 4px 0",
                    lineHeight: "var(--line-height-loose)",
                  }}
                >
                  Professor {professor.firstName} {professor.lastName}
                </h1>
                {professor.tags && professor.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
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
                          background: "var(--color-white)",
                        }}
                      >
                        <span style={{ fontSize: "10px" }}>📍</span>
                        {tagLabel[tag] ?? tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleToggleFavourite}
                title="Backend ticket needed: add professor_id to Favourites API"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "28px",
                  color: isFavourited ? "var(--color-accent-copper)" : "var(--color-border-tan)",
                  transition: "color 0.15s ease",
                  flexShrink: 0,
                  padding: "4px",
                }}
                aria-label={isFavourited ? "Remove from favourites" : "Save professor"}
              >
                {isFavourited ? "♥" : "♡"}
              </button>
            </div>
            {!rmpLoading && (
              <div
                style={{
                  display: "flex",
                  gap: "28px",
                  marginTop: "14px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {rating !== null && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "var(--font-size-display)",
                        fontWeight: "var(--font-weight-bold)",
                        color: "var(--color-primary-navy)",
                        lineHeight: 1,
                      }}
                    >
                      {rating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-secondary)" }}>
                      Overall Rating
                    </span>
                  </div>
                )}
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  {profReviews.length} Reviews
                </span>
                {wta !== null && (
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                    Would Take Again {wta}%
                  </span>
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
                        background: activeTagFilter === tag
                          ? "var(--color-primary-navy)"
                          : "var(--color-white)",
                        color: activeTagFilter === tag
                          ? "var(--color-white)"
                          : "var(--color-text-primary)",
                        fontSize: "var(--font-size-xs)",
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {profReviews.length > 0 && (
          <div
            style={{
              background: "var(--color-white)",
              border: "var(--border-width) solid var(--color-border-tan)",
              borderRadius: "var(--border-radius-md)",
              padding: "28px",
              marginBottom: "28px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-text-secondary)",
                  letterSpacing: "0.08em",
                  margin: "0 0 16px 0",
                  textTransform: "uppercase",
                }}
              >
                RATING DISTRIBUTION
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "10px" }}>
                      {star}
                    </span>
                    <div style={{ flex: 1, height: "12px", background: "var(--color-surface-light-cream)", borderRadius: "6px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(ratingDist[star] / maxRatingCount) * 100}%`,
                          background: "var(--color-primary-navy)",
                          borderRadius: "6px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "20px", textAlign: "right" }}>
                      {ratingDist[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-text-secondary)",
                  letterSpacing: "0.08em",
                  margin: "0 0 16px 0",
                  textTransform: "uppercase",
                }}
              >
                STUDENT FEEDBACK TAGS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(tagCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([tag, count]) => (
                    <div key={tag} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "70px", textTransform: "capitalize" }}>
                        {tag}
                      </span>
                      <div style={{ flex: 1, height: "12px", background: "var(--color-surface-light-cream)", borderRadius: "6px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${(count / maxTagCount) * 100}%`,
                            background: "var(--color-primary-navy)",
                            borderRadius: "6px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", width: "20px", textAlign: "right" }}>
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            background: "var(--color-white)",
            border: "var(--border-width) solid var(--color-border-tan)",
            borderRadius: "var(--border-radius-md)",
            padding: "28px",
            marginBottom: "28px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-bold)",
              margin: "0 0 20px 0",
              color: "var(--color-text-primary)",
            }}
          >
            Offer History
          </h2>
          <div
            style={{
              padding: "24px",
              background: "var(--color-surface-light-cream)",
              borderRadius: "var(--border-radius-sm)",
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-xs)",
              border: "1px dashed var(--color-border-tan)",
            }}
          >
            📋 Offer history coming soon — backend ticket needed: <code>GET /professors/&#123;id&#125;/courses</code>
          </div>
        </div>
        <div
          style={{
            background: "var(--color-white)",
            border: "var(--border-width) solid var(--color-border-tan)",
            borderRadius: "var(--border-radius-md)",
            padding: "28px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-bold)",
                margin: 0,
                color: "var(--color-text-primary)",
              }}
            >
              Reviews ({displayedReviews.length})
            </h2>

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

          {activeTagFilter && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
              }}
            >
              Filtered by: <strong style={{ color: "var(--color-primary-navy)" }}>{activeTagFilter}</strong>
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
                <div
                  key={i}
                  style={{
                    height: "90px",
                    background: "var(--color-surface-light-cream)",
                    borderRadius: "var(--border-radius-sm)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          )}

          {!reviewsLoading && displayedReviews.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 24px",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              No reviews yet for this professor.
            </div>
          )}

          {!reviewsLoading && displayedReviews.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
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
    <div
      style={{
        padding: "20px 0",
        borderBottom: isLast ? "none" : "var(--border-width) solid var(--color-border-tan)",
        display: "flex",
        gap: "16px",
      }}
    >
      <div
        style={{
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
        }}
      >
        {review.rating?.toFixed(1)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          {courseId && (
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Course ID: {courseId}
            </span>
          )}
          {dateStr && (
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              {dateStr}
            </span>
          )}
        </div>

        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", margin: "0 0 8px 0", lineHeight: "var(--line-height-tight)" }}>
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
              <span
                key={tag}
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-secondary)",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "2px 8px",
                  background: "var(--color-surface-light-cream)",
                }}
              >
                {tag}
              </span>
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