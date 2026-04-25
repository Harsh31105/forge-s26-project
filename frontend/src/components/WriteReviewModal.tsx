"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useReviewMutations } from "@/src/hooks/useReviews";
import { useCourses } from "@/src/hooks/useCourses";
import { useMe } from "@/src/hooks/useMe";
import { ReviewPostInputSemester } from "@/src/lib/api/northStarAPI.schemas";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  professorId?: string;
  professorName?: string;
  courseId?: string;
  courseName?: string;
}

const SEMESTER_OPTIONS: { value: ReviewPostInputSemester; label: string }[] = [
  { value: "fall", label: "Fall" },
  { value: "spring", label: "Spring" },
  { value: "summer_1", label: "Summer 1" },
  { value: "summer_2", label: "Summer 2" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const PROFESSOR_TAGS = [
  { label: "Engaging", value: "engaging" },
  { label: "Fair Grading", value: "fair_grading" },
  { label: "Approachable", value: "approachable" },
  { label: "Tough Grader", value: "tough_grader" },
  { label: "Lenient Grader", value: "lenient_grader" },
  { label: "Passionate", value: "passionate" },
  { label: "Organized", value: "organized" },
];

const COURSE_TAGS = [
  { label: "Challenging", value: "challenging" },
  { label: "Well-structured", value: "well_structured" },
  { label: "Heavy Workload", value: "time_consuming" },
  { label: "Group Work", value: "group_projects" },
  { label: "Exam Heavy", value: "exam_heavy" },
  { label: "Project Heavy", value: "project_heavy" },
  { label: "Fast Paced", value: "fast_paced" },
];

export default function WriteReviewModal({
  isOpen,
  onClose,
  professorId,
  professorName,
  courseId,
  courseName,
}: WriteReviewModalProps) {
const { student: user } = useMe();
  const { createReview, isCreating, createError } = useReviewMutations();
  const { courses } = useCourses({ limit: 1000 });

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [semester, setSemester] = useState<ReviewPostInputSemester | "">("");
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId ?? "");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredRating(0);
      setReviewText("");
      setSelectedTags([]);
      setSemester("");
      setYear(CURRENT_YEAR);
      setSelectedCourseId(courseId ?? "");
      setSubmitted(false);
    }
  }, [isOpen, courseId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tagOptions = professorId ? PROFESSOR_TAGS : COURSE_TAGS;
  const title = professorId
    ? `Write Your Review for ${professorName ?? "Professor"}`
    : `Write Your Review for ${courseName ?? "Course"}`;

  const handleToggleTag = (value: string) => {
  setSelectedTags(prev =>
    prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
  );
};

  const handleSubmit = async () => {
  if (rating === 0 || reviewText.trim().length < 10) return;
  const payload: any = {
    rating,
    reviewText: reviewText.trim(),
    tags: selectedTags.length > 0 ? selectedTags.map(t => t.toLowerCase()) : undefined,
    semester: semester || undefined,
    year: year || undefined,
  };
  if (user?.id) payload.studentId = user.id;

  if (professorId) {
    payload.professorId = professorId;
  } else if (courseId) {
   payload.courseId = selectedCourseId || courseId;
  }

  try {
    await createReview(payload);
    setSubmitted(true);
    setTimeout(() => onClose(), 1500);
  } catch (err: any) {
    console.error("Review submission failed:", err);
  }
};
  const isValid = rating > 0 && reviewText.trim().length >= 10;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--color-white)",
        border: "var(--border-width) solid var(--color-border-tan)",
        borderRadius: "var(--border-radius-md)",
        padding: "36px 40px",
        width: "100%",
        maxWidth: "520px",
        maxHeight: "90vh",
        overflowY: "auto",
        zIndex: 201,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--color-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Check size={28} color="white" />
            </div>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-xl)",
              color: "var(--color-primary-navy)",
              margin: "0 0 8px 0",
            }}>
              Review Submitted!
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              Thank you for your review.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <h2 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-primary)",
                margin: 0,
                flex: 1,
                paddingRight: "16px",
              }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  padding: 0,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", marginBottom: "24px" }} />

            {/* Course selector */}
            {professorId && (
              <FormField label="Which course did you take?">
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.department.name} {c.course_code}: {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {/* Rating */}
            <FormField label="Your Rating *">
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    style={{
                      width: "44px",
                      height: "44px",
                      border: `var(--border-width) solid ${(hoveredRating || rating) >= star ? "var(--color-primary-navy)" : "var(--color-border-tan)"}`,
                      borderRadius: "var(--border-radius-sm)",
                      background: (hoveredRating || rating) >= star ? "var(--color-primary-navy)" : "var(--color-white)",
                      color: (hoveredRating || rating) >= star ? "var(--color-white)" : "var(--color-text-primary)",
                      fontFamily: "var(--font-heading)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "var(--font-size-sm)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Semester + Year */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Semester">
                <select
                  value={semester ?? ""}
                  onChange={e => setSemester(e.target.value as ReviewPostInputSemester)}
                  style={selectStyle}
                >
                  <option value="">Select...</option>
                  {SEMESTER_OPTIONS.map(s => (
                    <option key={s.value} value={s.value as string}>{s.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Year">
                <select
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                  style={selectStyle}
                >
                  {YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Tags */}
            <FormField label="Tags (optional)">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {tagOptions.map(tag => (
                  <button
                    key={tag.value}
                    onClick={() => handleToggleTag(tag.value)}
                    style={{
                      padding: "4px 14px",
                      border: `var(--border-width) solid ${selectedTags.includes(tag.value) ? "var(--color-primary-navy)" : "var(--color-border-tan)"}`,
                      borderRadius: "var(--border-radius-sm)",
                      background: selectedTags.includes(tag.value) ? "var(--color-primary-navy)" : "var(--color-white)",
                      color: selectedTags.includes(tag.value) ? "var(--color-white)" : "var(--color-text-primary)",
                      fontSize: "var(--font-size-xs)",
                      fontFamily: "var(--font-body)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Review text */}
            <FormField label="Your Review *">
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder={professorId
                  ? "Share your experience with this professor. How was their teaching style? Were they helpful during office hours?"
                  : "Share your experience with this course. How was the workload? What did you learn?"
                }
                rows={5}
                maxLength={2000}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  background: "var(--color-surface-light-cream)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-primary)",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: "var(--line-height-tight)",
                }}
              />
              <p style={{
                textAlign: "right",
                fontSize: "var(--font-size-xs)",
                color: reviewText.length < 10 && reviewText.length > 0 ? "var(--color-error)" : "var(--color-text-secondary)",
                margin: "4px 0 0 0",
              }}>
                {reviewText.length} / 2000 characters
                {reviewText.length > 0 && reviewText.length < 10 && " (minimum 10)"}
              </p>
            </FormField>

            {/* Error */}
            {createError && (
              <p style={{
                color: "var(--color-error)",
                fontSize: "var(--font-size-xs)",
                margin: "0 0 16px 0",
              }}>
                {createError}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 24px",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  background: "var(--color-white)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isCreating}
                style={{
                  padding: "10px 24px",
                  border: "none",
                  borderRadius: "var(--border-radius-sm)",
                  background: isValid && !isCreating ? "var(--color-primary-navy)" : "var(--color-border-tan)",
                  color: "var(--color-white)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: isValid && !isCreating ? "pointer" : "not-allowed",
                  transition: "background 0.15s ease",
                }}
              >
                {isCreating ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{
        display: "block",
        fontSize: "var(--font-size-xs)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--color-text-primary)",
        marginBottom: "8px",
        fontFamily: "var(--font-body)",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "var(--border-width) solid var(--color-border-tan)",
  borderRadius: "var(--border-radius-sm)",
  background: "var(--color-surface-light-cream)",
  fontSize: "var(--font-size-xs)",
  fontFamily: "var(--font-body)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
};