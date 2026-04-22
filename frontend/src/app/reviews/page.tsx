"use client";

import { useMemo } from "react";
import { useReviews, useReviewMutations } from "@/src/hooks/useReviews";
import { useCurrentUser } from "@/src/hooks/useAuth";
import { MessageCircle, ThumbsUp, Award, TrendingUp, PenLine } from "lucide-react";
import Navbar from "@/src/components/NavBar";
import { Review } from "@/src/lib/api/northStarAPI.schemas";

export default function ReviewsPage() {
  const { user } = useCurrentUser();
  const { reviews, isLoading } = useReviews({ limit: 100 });
  const { deleteReview, isDeleting } = useReviewMutations();

  const myReviews = useMemo(
    () => reviews.filter(r => r.studentId === user?.id),
    [reviews, user?.id]
  );

  const trendingReviews = useMemo(
    () => [...reviews]
      .filter(r => r.studentId !== user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [reviews, user?.id]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const getReviewLabel = (review: Review) => {
    const courseId = (review as any).courseId;
    const professorId = (review as any).professorId;
    const sem = review.semester
      ? review.semester.charAt(0).toUpperCase() + review.semester.slice(1).replace("_", " ")
      : "";
    const yr = review.year ?? "";
    const semLabel = sem && yr ? `${sem} ${yr}` : sem || yr;
    if (courseId) return `Course Review${semLabel ? ` • ${semLabel}` : ""}`;
    if (professorId) return `Professor Review${semLabel ? ` • ${semLabel}` : ""}`;
    return "Review";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      <Navbar />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px 80px" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--color-text-primary)",
          margin: "0 0 6px 0",
        }}>
          My Reviews & Activity
        </h1>
        <p style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          margin: "0 0 32px 0",
          lineHeight: "var(--line-height-tight)",
        }}>
          Your review contributions and helpful votes across courses and professors
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "32px",
        }}>
          <StatCard icon={<MessageCircle size={26} />} value={myReviews.length} label="Reviews Written" />
          <StatCard icon={<ThumbsUp size={26} />} value={0} label="Helpful Votes Given" />
          <StatCard icon={<Award size={26} />} value={0} label="Your Reviews Marked Helpful" />
        </div>

        {/* My Reviews */}
        <Section title={`Your Reviews (${myReviews.length})`}>
          {isLoading && <SkeletonReviews />}

          {!isLoading && myReviews.length === 0 && (
            <EmptyState icon={<PenLine size={32} style={{ opacity: 0.4 }} />} message="You haven't written any reviews yet." />
          )}

          {!isLoading && myReviews.map((review, idx) => (
            <div key={review.id}>
              <div style={{ display: "flex", gap: "14px", padding: "18px 0" }}>
                <RatingBadge value={review.rating} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <div>
                      <p style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        display: "inline",
                      }}>
                        {getReviewLabel(review)}
                      </p>
                      <p style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-secondary)",
                        marginLeft: "8px",
                        margin: 0,
                        display: "inline",
                      }}>
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button style={linkBtnStyle("var(--color-primary-navy)")}>Edit</button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={isDeleting}
                        style={linkBtnStyle("var(--color-error)")}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-primary)",
                    margin: "6px 0 10px 0",
                    lineHeight: "var(--line-height-tight)",
                  }}>
                    {review.reviewText}
                  </p>

                  {review.tags && review.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {review.tags.map(tag => (
                        <TagPill key={tag} label={tag} />
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                    <ThumbsUp size={11} /> 0 found helpful
                  </p>
                </div>
              </div>
              {idx < myReviews.length - 1 && <Divider />}
            </div>
          ))}
        </Section>

        {/* Reviews You Found Helpful */}
        <Section title="Reviews You Found Helpful (0)">
          <p style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            fontStyle: "italic",
            margin: 0,
          }}>
            Backend ticket needed: helpful votes system not yet implemented
          </p>
        </Section>
        <Section
          title="Trending Reviews This Week"
          titleIcon={<TrendingUp size={18} />}
          subtitle="Showing most recent reviews"
        >
          {isLoading && <SkeletonReviews count={3} />}

          {!isLoading && trendingReviews.length === 0 && (
            <EmptyState icon={<TrendingUp size={32} style={{ opacity: 0.4 }} />} message="No trending reviews yet." />
          )}

          {!isLoading && trendingReviews.map((review, idx) => (
            <div
              key={review.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 0",
                borderBottom: idx < trendingReviews.length - 1
                  ? "var(--border-width) solid var(--color-border-tan)"
                  : "none",
              }}
            >
              <RatingBadge value={review.rating} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: "var(--font-weight-semibold)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-primary)",
                  margin: "0 0 2px 0",
                }}>
                  {getReviewLabel(review)}
                </p>
                <p style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {review.reviewText ?? "No review text"}
                </p>
              </div>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", flexShrink: 0, margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                <ThumbsUp size={11} /> 0
              </p>
            </div>
          ))}
        </Section>
      </main>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

function Section({ title, titleIcon, subtitle, children }: {
  title: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--color-white)",
      border: "var(--border-width) solid var(--color-border-tan)",
      borderRadius: "var(--border-radius-md)",
      padding: "24px 28px",
      marginBottom: "20px",
    }}>
      <h2 style={{
        fontFamily: "var(--font-heading)",
        fontSize: "var(--font-size-lg)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-text-primary)",
        margin: subtitle ? "0 0 4px 0" : "0 0 16px 0",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        {titleIcon}
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-secondary)",
          fontStyle: "italic",
          margin: "0 0 16px 0",
        }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

function StatCard({ icon, value, label, note }: {
  icon: React.ReactNode; value: number; label: string; note?: string;
}) {
  return (
    <div style={{
      background: "var(--color-white)",
      border: "var(--border-width) solid var(--color-border-tan)",
      borderRadius: "var(--border-radius-md)",
      padding: "32px 24px",
      textAlign: "center",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "var(--color-primary-navy)" }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "var(--font-heading)",
        fontSize: "var(--font-size-xl)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-primary-navy)",
        lineHeight: 1,
        marginBottom: "6px",
      }}>
        {value}
      </div>
      <p style={{
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-secondary)",
        margin: 0,
        lineHeight: "var(--line-height-tight)",
      }}>
        {label}
        {note && (
          <span style={{ display: "block", fontStyle: "italic", marginTop: "2px" }}>
            ({note})
          </span>
        )}
      </p>
    </div>
  );
}

function RatingBadge({ value, size = "md" }: { value?: number; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "38px" : "44px";
  return (
    <div style={{
      width: dim,
      height: dim,
      borderRadius: "var(--border-radius-sm)",
      background: "var(--color-primary-navy)",
      color: "var(--color-white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-heading)",
      fontWeight: "var(--font-weight-bold)",
      fontSize: size === "sm" ? "var(--font-size-xs)" : "var(--font-size-sm)",
      flexShrink: 0,
    }}>
      {value?.toFixed(1) ?? "—"}
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span style={{
      padding: "2px 10px",
      border: "var(--border-width) solid var(--color-border-tan)",
      borderRadius: "var(--border-radius-sm)",
      fontSize: "var(--font-size-xs)",
      color: "var(--color-text-secondary)",
      background: "var(--color-surface-light-cream)",
      textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

function Divider() {
  return <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)" }} />;
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "28px",
      color: "var(--color-text-secondary)",
      fontSize: "var(--font-size-sm)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
        {icon}
      </div>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

function SkeletonReviews({ count = 2 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          height: "70px",
          background: "var(--color-surface-light-cream)",
          borderRadius: "var(--border-radius-sm)",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

const linkBtnStyle = (color: string): React.CSSProperties => ({
  background: "none",
  border: "none",
  cursor: "pointer",
  color,
  fontSize: "var(--font-size-xs)",
  fontFamily: "var(--font-body)",
  fontWeight: "var(--font-weight-semibold)",
  textDecoration: "underline",
  padding: 0,
});