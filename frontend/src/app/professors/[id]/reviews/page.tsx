"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfessor } from "@/src/hooks/useProfessors";
import { useReviews } from "@/src/hooks/useReviews";
import { useProfThreads, useProfThreadMutations } from "@/src/hooks/useProfThreads";
import { useMe } from "@/src/hooks/useMe";
import { ThumbsUp, MessageCircle, PenLine, ChevronUp, ChevronDown } from "lucide-react";
import WriteReviewModal from "@/src/components/WriteReviewModal";
import { Review } from "@/src/lib/api/northStarAPI.schemas";

type SortOption = "newest" | "oldest" | "highest" | "lowest";

export default function ProfessorReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { student: user } = useMe();
  const { professor, isLoading: profLoading } = useProfessor(id);
  const { reviews, isLoading: reviewsLoading } = useReviews({ limit: 100 });
  const [sort, setSort] = useState<SortOption>("newest");
  const [showModal, setShowModal] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const profReviews = useMemo(
    () => reviews.filter(r => (r as any).professorId === id),
    [reviews, id]
  );

  const sorted = useMemo(() => {
    const list = [...profReviews];
    if (sort === "newest") return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "oldest") return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sort === "highest") return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "lowest") return list.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    return list;
  }, [profReviews, sort]);

  const profName = professor
    ? `Professor ${professor.firstName} ${professor.lastName}`
    : "Professor";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px 100px" }}>
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-xs)",
            fontFamily: "var(--font-body)",
            padding: "0 0 20px 0",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to {profName}
        </button>

        {/* Main card */}
        <div style={{
          background: "var(--color-white)",
          border: "var(--border-width) solid var(--color-border-tan)",
          borderRadius: "var(--border-radius-md)",
          padding: "28px 32px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-lg)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-primary)",
              margin: 0,
            }}>
              Reviews for {profName} ({profReviews.length})
            </h1>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              style={{
                padding: "6px 12px",
                border: "var(--border-width) solid var(--color-border-tan)",
                borderRadius: "var(--border-radius-sm)",
                background: "var(--color-white)",
                fontSize: "var(--font-size-xs)",
                fontFamily: "var(--font-body)",
                cursor: "pointer",
              }}
            >
              <option value="newest">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          <p style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            margin: "0 0 20px 0",
          }}>
            {profReviews.length} total reviews
          </p>

          <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", marginBottom: "8px" }} />

          {/* Reviews */}
          {reviewsLoading || profLoading ? (
            <SkeletonList />
          ) : sorted.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "var(--color-text-secondary)",
            }}>
              <PenLine size={36} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-base)", margin: "0 0 8px 0" }}>
                No reviews yet
              </p>
              <p style={{ fontSize: "var(--font-size-sm)", margin: 0 }}>
                Be the first to review {profName}!
              </p>
            </div>
          ) : (
            sorted.map((review, idx) => (
              <ReviewThread
                key={review.id}
                review={review}
                isLast={idx === sorted.length - 1}
                currentUserId={user?.id}
                isExpanded={expandedReviewId === review.id}
                onToggleExpand={() =>
                  setExpandedReviewId(prev => prev === review.id ? null : review.id)
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Write a Review button */}
      <div style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "14px 36px",
            background: "var(--color-primary-navy)",
            color: "var(--color-white)",
            border: "none",
            borderRadius: "var(--border-radius-sm)",
            fontSize: "var(--font-size-sm)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--font-weight-semibold)",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(32,58,138,0.3)",
          }}
        >
          Write a Review
        </button>
      </div>

      <WriteReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        professorId={id}
        professorName={profName}
      />

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

function ReviewThread({
  review,
  isLast,
  currentUserId,
  isExpanded,
  onToggleExpand,
}: {
  review: Review;
  isLast: boolean;
  currentUserId?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const { threads, isLoading } = useProfThreads(review.id, { limit: 20 });
  const { createThread, isCreating } = useProfThreadMutations(review.id);
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const courseId = (review as any).courseId;
  const semLabel = review.semester && review.year
    ? `${review.semester.charAt(0).toUpperCase() + review.semester.slice(1).replaceAll("_", " ")} ${review.year}`
    : "";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric"
  });

  const handleHelpful = () => {
  if (hasVoted) return;
  setHelpfulCount(prev => prev + 1);
  setHasVoted(true);
};

  const displayName = review.studentId
    ? review.studentId === currentUserId ? "You" : "Student"
    : "Anonymous";

  const handlePostReply = async () => {
    if (!replyText.trim() || !currentUserId) return;
    await createThread({ studentId: currentUserId, content: replyText.trim() });
    setReplyText("");
    setShowReplyBox(false);
  };

  return (
    <div style={{
      padding: "20px 0",
      borderBottom: isLast ? "none" : "var(--border-width) solid var(--color-border-tan)",
    }}>
      <div style={{ display: "flex", gap: "14px" }}>
        {/* Rating badge */}
        <div style={{
          width: "46px",
          height: "46px",
          borderRadius: "var(--border-radius-sm)",
          background: "var(--color-primary-navy)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-heading)",
          fontWeight: "var(--font-weight-bold)",
          fontSize: "var(--font-size-sm)",
          flexShrink: 0,
        }}>
          {review.rating?.toFixed(1) ?? "—"}
        </div>

        <div style={{ flex: 1 }}>
          {/* Name + meta */}
          <p style={{
            fontWeight: "var(--font-weight-semibold)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-primary)",
            margin: "0 0 2px 0",
          }}>
            {displayName}
          </p>
          <p style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            margin: "0 0 10px 0",
          }}>
            {[courseId && `Course ID: ${courseId}`, semLabel, review.createdAt && formatDate(review.createdAt)]
              .filter(Boolean).join(" • ")}
          </p>

          {/* Would take again tag */}
          {review.tags && review.tags.some(t => t.toLowerCase().includes("helpful") || t.toLowerCase().includes("engaging")) && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 12px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "var(--border-width) solid var(--color-success)",
                borderRadius: "var(--border-radius-sm)",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-success)",
                fontWeight: "var(--font-weight-semibold)",
                margin: 0,
              }}>
                ✓ Would take again
              </p>
            </div>
          )}

          {/* Review text */}
          <p style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-primary)",
            margin: "0 0 14px 0",
            lineHeight: "var(--line-height-tight)",
          }}>
            {review.reviewText}
          </p>

          {/* Actions */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              onClick={handleHelpful}
              style={{
                background: hasVoted ? "var(--color-primary-navy)" : "none",
                border: "var(--border-width) solid var(--color-border-tan)",
                borderRadius: "var(--border-radius-sm)",
                padding: "5px 14px",
                fontSize: "var(--font-size-xs)",
                color: hasVoted ? "var(--color-white)" : "var(--color-text-secondary)",
                cursor: hasVoted ? "default" : "pointer",
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <ThumbsUp size={12} />
              Helpful ({helpfulCount})
            </button>

            <button
              onClick={onToggleExpand}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-body)",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <MessageCircle size={12} />
              {threads.length} {threads.length === 1 ? "reply" : "replies"}
              {isExpanded
                ? <ChevronUp size={12} />
                : <ChevronDown size={12} />
              }
            </button>
          </div>

          {/* Threads section */}
          {isExpanded && (
            <div style={{
              marginTop: "16px",
              padding: "16px",
              background: "var(--color-surface-light-cream)",
              borderRadius: "var(--border-radius-sm)",
              border: "var(--border-width) solid var(--color-border-tan)",
            }}>
              {isLoading && (
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                  Loading replies...
                </p>
              )}

              {!isLoading && threads.length === 0 && !showReplyBox && (
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                  No replies yet. Be the first to reply!
                </p>
              )}

              {!isLoading && threads.map((thread, idx) => (
                <div
                  key={thread.id}
                  style={{
                    paddingBottom: idx < threads.length - 1 ? "12px" : "0",
                    marginBottom: idx < threads.length - 1 ? "12px" : "0",
                    borderBottom: idx < threads.length - 1 ? "var(--border-width) solid var(--color-border-tan)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <p style={{
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}>
                      {thread.studentId === currentUserId ? "You" : "Prefrosh"}
                    </p>
                    {thread.createdAt && (
                      <p style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                      }}>
                        {formatDate(thread.createdAt)}
                      </p>
                    )}
                  </div>
                  <p style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-primary)",
                    margin: 0,
                    lineHeight: "var(--line-height-tight)",
                  }}>
                    {thread.content}
                  </p>
                </div>
              ))}

              {/* Reply input */}
              {currentUserId && !showReplyBox && (
                <button
                  onClick={() => setShowReplyBox(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-accent-copper)",
                    fontFamily: "var(--font-body)",
                    padding: threads.length > 0 ? "12px 0 0 0" : "8px 0 0 0",
                    textDecoration: "underline",
                    display: "block",
                  }}
                >
                  + Add a reply
                </button>
              )}

              {showReplyBox && (
                <div style={{ marginTop: threads.length > 0 ? "12px" : "0" }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    maxLength={2000}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "var(--border-width) solid var(--color-border-tan)",
                      borderRadius: "var(--border-radius-sm)",
                      fontSize: "var(--font-size-xs)",
                      fontFamily: "var(--font-body)",
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "var(--color-white)",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                      style={{
                        padding: "6px 16px",
                        border: "var(--border-width) solid var(--color-border-tan)",
                        borderRadius: "var(--border-radius-sm)",
                        background: "var(--color-white)",
                        fontSize: "var(--font-size-xs)",
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostReply}
                      disabled={!replyText.trim() || isCreating}
                      style={{
                        padding: "6px 16px",
                        border: "none",
                        borderRadius: "var(--border-radius-sm)",
                        background: replyText.trim() ? "var(--color-primary-navy)" : "var(--color-border-tan)",
                        color: "var(--color-white)",
                        fontSize: "var(--font-size-xs)",
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                        cursor: replyText.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      {isCreating ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: "100px",
          background: "var(--color-surface-light-cream)",
          borderRadius: "var(--border-radius-sm)",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}