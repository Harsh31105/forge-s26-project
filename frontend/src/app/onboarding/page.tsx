"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudent } from "@/src/lib/api/student";
import { TOKEN_KEY } from "@/src/lib/api/apiClient";
import { useMe } from "@/src/hooks/useMe";
import type { StudentPatchInputPreferencesItem } from "@/src/lib/api/northStarAPI.schemas";
import { StudentPreferencesItem } from "@/src/lib/api/northStarAPI.schemas";
import AmbientReviews from "@/src/components/onboarding/AmbientReviews";
import { Check, ChevronDown } from "lucide-react";

// ── Static data ───────────────────────────────────────────

const PREFERENCE_LABELS: Record<StudentPatchInputPreferencesItem, string> = {
  "exam-heavy": "Exam Heavy",
  "project-heavy": "Project Heavy",
  "group-work": "Group Work",
  "attendance-required": "Attendance Required",
  strict_deadlines: "Strict Deadlines",
  flexible_deadlines: "Flexible Deadlines",
  extra_credit: "Extra Credit",
  little_to_no_test: "Little to No Tests",
  fast_paced: "Fast Paced",
  slow_paced: "Slow Paced",
};

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + i);

// Mock data — replace with API calls when available
const MAJORS_WITH_CONCENTRATIONS: Record<string, string[]> = {
  Architecture: [],
  Biology: [
    "Biochemistry",
    "Cell & Molecular Biology",
    "Ecology & Evolutionary Biology",
    "Marine Biology",
  ],
  "Business Administration": [
    "Accounting",
    "Entrepreneurship",
    "Finance",
    "Management",
    "Marketing",
    "Supply Chain Management",
  ],
  Chemistry: ["Biochemistry", "Medicinal Chemistry", "Organic Chemistry"],
  "Communication Studies": ["Advertising", "Digital Media", "Journalism", "Public Relations"],
  "Computer Science": [
    "Artificial Intelligence",
    "Cybersecurity",
    "Data Science",
    "Game Development",
    "Human-Computer Interaction",
    "Software",
    "Systems",
  ],
  "Criminal Justice": ["Corrections", "Law Enforcement", "Policy & Planning"],
  "Data Science": ["Business Analytics", "Machine Learning", "Statistics"],
  "Electrical & Computer Engineering": ["Computer Engineering", "Electrical Engineering"],
  "Environmental Science": ["Climate Science", "Ecology", "Environmental Policy"],
  "International Business": ["Finance", "Management", "Marketing"],
  Mathematics: ["Applied Mathematics", "Pure Mathematics", "Statistics"],
  "Mechanical Engineering": ["Manufacturing & Design", "Robotics & Control"],
  Nursing: [],
  Physics: ["Astrophysics", "Condensed Matter"],
  "Political Science": ["American Politics", "International Relations", "Law & Politics"],
  Psychology: ["Clinical", "Cognitive", "Experimental", "Health Psychology"],
};

const MAJORS = Object.keys(MAJORS_WITH_CONCENTRATIONS);

// Mock courses — replace with API call when available
const MOCK_COURSES = [
  { id: "cs2500", code: "CS 2500", name: "Fundamentals of Computer Science 1" },
  { id: "cs2510", code: "CS 2510", name: "Fundamentals of Computer Science 2" },
  { id: "cs3000", code: "CS 3000", name: "Algorithms & Data" },
  { id: "cs3500", code: "CS 3500", name: "Object-Oriented Design" },
  { id: "cs4400", code: "CS 4400", name: "Programming Languages" },
  { id: "cs4500", code: "CS 4500", name: "Software Development" },
  { id: "math1341", code: "MATH 1341", name: "Calculus 1 for Science & Engineering" },
  { id: "math1342", code: "MATH 1342", name: "Calculus 2 for Science & Engineering" },
  { id: "math2321", code: "MATH 2321", name: "Calculus 3 for Science & Engineering" },
  { id: "math2331", code: "MATH 2331", name: "Linear Algebra" },
  { id: "phys1151", code: "PHYS 1151", name: "Physics for Engineering 1" },
  { id: "phys1152", code: "PHYS 1152", name: "Physics for Engineering 2" },
  { id: "econ1115", code: "ECON 1115", name: "Principles of Microeconomics" },
  { id: "econ1116", code: "ECON 1116", name: "Principles of Macroeconomics" },
  { id: "engl1111", code: "ENGL 1111", name: "First-Year Writing" },
  { id: "ds2000", code: "DS 2000", name: "Programming with Data" },
  { id: "ds3000", code: "DS 3000", name: "Foundations of Data Science" },
  { id: "mgmt1000", code: "MGMT 1000", name: "Management & Organizational Analysis" },
];

// ── Design tokens ─────────────────────────────────────────

const C = {
  navy: "var(--color-primary-navy)",
  navyDark: "#162b6a",
  error: "var(--color-error)",
  textHeading: "var(--color-text-primary)",
  textBody: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-secondary)",
  textPlaceholder: "var(--color-text-secondary)",
  borderInput: "var(--color-border-tan)",
  borderCard: "var(--color-border-tan)",
  borderSeparator: "var(--color-border-tan)",
  bgPage: "var(--color-background-cream)",
  bgCard: "var(--color-white)",
  bgHover: "var(--color-surface-extra-light)",
  bgSelectedRow: "var(--color-surface-light-cream)",
  white: "var(--color-white)",
};

const FONT = "var(--font-body)";
const FONT_HEADING = "var(--font-heading)";

// ── Reusable styles ───────────────────────────────────────

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${C.borderInput}`,
  borderRadius: "var(--border-radius-sm)",
  fontSize: "15px",
  fontFamily: FONT,
  color: C.textBody,
  backgroundColor: C.bgCard,
  outline: "none",
  minHeight: "44px",
  boxSizing: "border-box",
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: FONT,
  color: C.textHeading,
};

const focusRing = {
  onFocus: (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.outline = `2px solid ${C.navy}`;
    e.currentTarget.style.outlineOffset = "2px";
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.outline = "none";
  },
};

// ── Icon helpers (lucide-react) ──────────────────────────

function Checkmark() {
  return <Check size={11} color="white" strokeWidth={2.5} aria-hidden="true" />;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      size={16}
      color={C.textSecondary}
      aria-hidden="true"
      style={{
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform 0.12s",
        flexShrink: 0,
      }}
    />
  );
}

// ── Skip link ─────────────────────────────────────────────

function SkipLink() {
  const [focused, setFocused] = useState(false);
  return (
    <a
      href="#main-content"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: "absolute",
        left: "8px",
        top: focused ? "8px" : "-100px",
        zIndex: 999,
        backgroundColor: C.bgCard,
        color: C.navy,
        padding: "8px 16px",
        borderRadius: "var(--border-radius-sm)",
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: "14px",
        textDecoration: "none",
        border: `2px solid ${C.navy}`,
        transition: "top 0.1s",
      }}
    >
      Skip to main content
    </a>
  );
}

// ── Nav ───────────────────────────────────────────────────

function Nav() {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "56px",
        backgroundColor: C.navy,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <span
        style={{
          fontFamily: FONT_HEADING,
          fontWeight: 700,
          fontSize: "18px",
          color: C.white,
          letterSpacing: "-0.01em",
        }}
      >
        NorthStar
      </span>
      {/* Nav links intentionally empty during onboarding — main nav appears on homepage */}
    </nav>
  );
}

// ── Page shell ────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.bgPage,
        position: "relative",
      }}
    >
      <SkipLink />
      <Nav />

      {/* Single husky logomark — bottom-right, barely visible */}
      {/* eslint-disable-next-line @next/next/no-img-element */}

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            backgroundColor: C.bgCard,
            borderRadius: "6px",
            border: `1px solid ${C.borderCard}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "36px",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

// ── Course selector ───────────────────────────────────────

function CourseSelector({
  selectedCourses,
  onToggle,
}: {
  selectedCourses: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [announcement, setAnnouncement] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showResults = query.length >= 3;
  const filteredCourses = showResults
    ? MOCK_COURSES.filter((c) => {
        const q = query.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
    : [];

  // Announce filtered count to screen readers
  useEffect(() => {
    if (showResults) {
      setAnnouncement(
        `${filteredCourses.length} course${filteredCourses.length !== 1 ? "s" : ""} found`,
      );
    } else {
      setAnnouncement("");
    }
  }, [showResults, filteredCourses.length]);

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  // Move DOM focus when keyboard-navigating options
  useEffect(() => {
    if (focusedIdx >= 0) optionRefs.current[focusedIdx]?.focus();
  }, [focusedIdx]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFocusedIdx(-1);
    setTimeout(() => triggerRef.current?.focus(), 10);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeDropdown();
    } else if (e.key === "ArrowDown" && filteredCourses.length > 0) {
      e.preventDefault();
      setFocusedIdx(0);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, idx: number, id: string) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (idx < filteredCourses.length - 1) setFocusedIdx(idx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) {
        setFocusedIdx(-1);
        searchRef.current?.focus();
      } else setFocusedIdx(idx - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(id);
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Live region */}
      <span
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {announcement}
      </span>

      <label htmlFor="course-trigger" style={fieldLabel}>
        Courses{" "}
        <span style={{ fontWeight: 400, color: C.textPlaceholder, fontSize: "13px" }}>
          — optional
        </span>
      </label>

      {/* Trigger — div with role="button" to avoid nested <button> inside chips */}
      <div
        id="course-trigger"
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="course-listbox"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        style={{
          width: "100%",
          minHeight: "44px",
          padding: "8px 12px 8px 14px",
          border: `1px solid ${C.borderInput}`,
          borderRadius: "var(--border-radius-sm)",
          backgroundColor: C.bgCard,
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
          fontFamily: FONT,
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
        }}
        {...focusRing}
      >
        {/* Chips or placeholder */}
        <span style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1, paddingTop: "2px" }}>
          {selectedCourses.length === 0 ? (
            <span style={{ color: C.textPlaceholder, lineHeight: "26px" }}>Select courses…</span>
          ) : (
            selectedCourses.map((id) => {
              const course = MOCK_COURSES.find((c) => c.id === id);
              if (!course) return null;
              return (
                <span
                  key={id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    backgroundColor: C.navy,
                    color: C.white,
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "2px 4px 2px 8px",
                    borderRadius: "3px",
                    lineHeight: "22px",
                  }}
                >
                  {course.code}
                  <button
                    type="button"
                    aria-label={`Remove ${course.code}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(id);
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = "2px solid white";
                      e.currentTarget.style.outlineOffset = "1px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.9)",
                      cursor: "pointer",
                      padding: "0 2px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "2px",
                      fontSize: "16px",
                      lineHeight: 1,
                      fontFamily: FONT,
                      outline: "none",
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </span>
        <Chevron open={open} />
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: C.bgCard,
            border: `1px solid ${C.borderCard}`,
            borderRadius: "var(--border-radius-sm)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            zIndex: 50,
          }}
        >
          {/* Search input */}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSeparator}` }}>
            <input
              ref={searchRef}
              type="text"
              aria-label="Search courses by code or name"
              aria-controls="course-listbox"
              placeholder="Search by code or name…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIdx(-1);
              }}
              onKeyDown={handleSearchKeyDown}
              style={{
                width: "100%",
                padding: "0",
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontFamily: FONT,
                color: C.textBody,
                backgroundColor: "transparent",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Results */}
          <div
            id="course-listbox"
            role="listbox"
            aria-label="Available courses"
            aria-multiselectable="true"
            style={{ maxHeight: "240px", overflowY: "auto" }}
          >
            {!showResults ? (
              <p
                style={{
                  padding: "12px 14px",
                  margin: 0,
                  fontSize: "14px",
                  color: C.textMuted,
                  fontFamily: FONT,
                }}
              >
                Type at least 3 letters to search…
              </p>
            ) : filteredCourses.length === 0 ? (
              <p
                style={{
                  padding: "12px 14px",
                  margin: 0,
                  fontSize: "14px",
                  color: C.textMuted,
                  fontFamily: FONT,
                }}
              >
                No courses found
              </p>
            ) : (
              filteredCourses.map((course, idx) => {
                const checked = selectedCourses.includes(course.id);
                return (
                  <div
                    key={course.id}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    role="option"
                    id={`course-option-${course.id}`}
                    aria-selected={checked}
                    tabIndex={focusedIdx === idx ? 0 : -1}
                    onClick={() => onToggle(course.id)}
                    onKeyDown={(e) => handleOptionKeyDown(e, idx, course.id)}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${C.navy}`;
                      e.currentTarget.style.outlineOffset = "-2px";
                      setFocusedIdx(idx);
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                    onMouseEnter={(e) => {
                      if (!checked) e.currentTarget.style.backgroundColor = C.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = checked
                        ? C.bgSelectedRow
                        : "transparent";
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      minHeight: "44px",
                      cursor: "pointer",
                      backgroundColor: checked ? C.bgSelectedRow : "transparent",
                      borderBottom: `1px solid ${C.borderSeparator}`,
                      fontFamily: FONT,
                      userSelect: "none",
                      outline: "none",
                    }}
                  >
                    {/* Custom checkbox */}
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        borderRadius: "3px",
                        border: checked ? "none" : `2px solid ${C.borderInput}`,
                        backgroundColor: checked ? C.navy : C.bgCard,
                        flexShrink: 0,
                      }}
                    >
                      {checked && <Checkmark />}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: C.textBody,
                        flexShrink: 0,
                      }}
                    >
                      {course.code}
                    </span>
                    <span style={{ fontSize: "14px", color: C.textSecondary }}>{course.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // Save token from URL synchronously before hooks fire
  const [tokenReady] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      window.history.replaceState({}, "", "/onboarding");
    }
    return Boolean(localStorage.getItem(TOKEN_KEY));
  });

  const { student, isLoading, error: loadError } = useMe();
  const studentAPI = getStudent(); // kept for PATCH only

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [graduationYear, setGraduationYear] = useState<number | "">("");
  const [major, setMajor] = useState("");
  const [concentration, setConcentration] = useState("");
  const [minors, setMinors] = useState<string[]>([]);
  const [step1Errors, setStep1Errors] = useState<{ year?: string; major?: string }>({});

  // Step 2 state
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  // General learning preferences (pref_enum) — not tied to individual courses
  const [selectedPreferences, setSelectedPreferences] = useState<
    StudentPatchInputPreferencesItem[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const concentrations = major ? (MAJORS_WITH_CONCENTRATIONS[major] ?? []) : [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!tokenReady) {
      router.push("/login");
    }
  }, [tokenReady, router]);

  // Redirect to homepage if onboarding is already complete
  useEffect(() => {
    if (student?.graduationYear && student.graduationYear > 0) {
      router.push("/");
    }
  }, [student, router]);

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const togglePreference = (pref: StudentPatchInputPreferencesItem) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  };

  const handleFinish = async () => {
    if (!student) return;
    setSaving(true);
    setSaveError(null);

    try {
      await studentAPI.patchStudentsId(student.id, {
        graduationYear: Number(graduationYear),
        preferences: selectedPreferences,
        // TODO: send major, concentration once Major/Concentration endpoints exist (tag Biak's PR)
        // TODO: send minors once Minor endpoints exist (tag Biak's PR)
        // TODO: send selectedCourses once course-history endpoints exist
      });
      router.push("/");
    } catch {
      setSaveError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  // ── Single return ──────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-background-cream)",
        position: "relative",
      }}
    >
      {/* Ambient review boxes floating in the background */}
      <AmbientReviews />

      {/* Form layer — always visible */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 5,
        }}
      >
        <SkipLink />
        <Nav />

        {/* eslint-disable-next-line @next/next/no-img-element */}

        <main
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              backgroundColor: C.bgCard,
              borderRadius: "6px",
              border: `1px solid ${C.borderCard}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              padding: "36px",
            }}
          >
            {/* ── Loading / error ── */}
            {loadError ? (
              <p
                style={{ fontSize: "15px", color: C.error, textAlign: "center", fontFamily: FONT }}
              >
                {loadError}
              </p>
            ) : !student ? (
              <p
                style={{
                  fontSize: "15px",
                  color: C.textSecondary,
                  textAlign: "center",
                  fontFamily: FONT,
                }}
              >
                Loading…
              </p>
            ) : step === 1 ? (
              /* ── Step 1 ── */
              <>
                <h2
                  style={{
                    fontFamily: FONT_HEADING,
                    fontSize: "22px",
                    fontWeight: 600,
                    color: C.textHeading,
                    margin: "0 0 6px 0",
                  }}
                >
                  Welcome, {student.firstName}!
                </h2>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: "15px",
                    color: C.textSecondary,
                    lineHeight: 1.6,
                    margin: "0 0 28px 0",
                  }}
                >
                  Tell us a bit about yourself to personalize your experience.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Graduation Year */}
                  <div>
                    <label htmlFor="grad-year" style={fieldLabel}>
                      Graduation Year <span style={{ color: C.error }}>*</span>
                    </label>
                    <select
                      id="grad-year"
                      value={graduationYear}
                      onChange={(e) => {
                        setGraduationYear(e.target.value ? Number(e.target.value) : "");
                        setStep1Errors((p) => ({ ...p, year: undefined }));
                      }}
                      aria-describedby={step1Errors.year ? "grad-year-error" : undefined}
                      aria-invalid={!!step1Errors.year}
                      style={{
                        ...fieldInput,
                        borderColor: step1Errors.year ? C.error : C.borderInput,
                      }}
                      {...focusRing}
                    >
                      <option value="">Select a year</option>
                      {GRAD_YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {step1Errors.year && (
                      <p
                        id="grad-year-error"
                        role="alert"
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "13px",
                          color: C.error,
                          fontFamily: FONT,
                        }}
                      >
                        {step1Errors.year}
                      </p>
                    )}
                  </div>

                  {/* Major */}
                  <div>
                    <label htmlFor="major" style={fieldLabel}>
                      Major <span style={{ color: C.error }}>*</span>
                    </label>
                    <select
                      id="major"
                      value={major}
                      onChange={(e) => {
                        setMajor(e.target.value);
                        setConcentration("");
                        setStep1Errors((p) => ({ ...p, major: undefined }));
                      }}
                      aria-describedby={step1Errors.major ? "major-error" : undefined}
                      aria-invalid={!!step1Errors.major}
                      style={{
                        ...fieldInput,
                        borderColor: step1Errors.major ? C.error : C.borderInput,
                      }}
                      {...focusRing}
                    >
                      <option value="">Select a major</option>
                      {MAJORS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    {step1Errors.major && (
                      <p
                        id="major-error"
                        role="alert"
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "13px",
                          color: C.error,
                          fontFamily: FONT,
                        }}
                      >
                        {step1Errors.major}
                      </p>
                    )}
                  </div>

                  {/* Concentration — only when major has concentrations */}
                  {concentrations.length > 0 && (
                    <div>
                      <label htmlFor="concentration" style={fieldLabel}>
                        Concentration
                      </label>
                      <select
                        id="concentration"
                        value={concentration}
                        onChange={(e) => setConcentration(e.target.value)}
                        style={fieldInput}
                        {...focusRing}
                      >
                        <option value="">Select a concentration</option>
                        {concentrations.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Minors — multi-select, users can have more than one
                      TODO: replace MAJORS dummy list with a real Minor API endpoint
                            when available; tag Biak's PR for those changes */}
                  <div>
                    <label style={fieldLabel}>
                      Minor(s){" "}
                      <span style={{ fontWeight: 400, color: C.textPlaceholder, fontSize: "13px" }}>
                        — optional, select all that apply
                      </span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {MAJORS.map((m) => {
                        const selected = minors.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setMinors((prev) =>
                                prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
                              )
                            }
                            style={{
                              padding: "5px 12px",
                              borderRadius: "20px",
                              fontSize: "13px",
                              fontFamily: FONT,
                              fontWeight: selected ? 600 : 400,
                              border: `1px solid ${selected ? C.navy : C.borderInput}`,
                              backgroundColor: selected ? C.bgSelectedRow : C.bgCard,
                              color: selected ? C.navy : C.textSecondary,
                              cursor: "pointer",
                              minHeight: "30px",
                              outline: "none",
                            }}
                            onMouseEnter={(e) => {
                              if (!selected)
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                  C.bgHover;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                selected ? C.bgSelectedRow : C.bgCard;
                            }}
                            {...focusRing}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const errors: { year?: string; major?: string } = {};
                      if (graduationYear === "") errors.year = "Please select a graduation year.";
                      if (!major) errors.major = "Please select a major.";
                      if (Object.keys(errors).length > 0) {
                        setStep1Errors(errors);
                        return;
                      }
                      setStep(2);
                    }}
                    style={{
                      marginTop: "8px",
                      padding: "12px 24px",
                      backgroundColor: C.navy,
                      color: C.white,
                      border: "none",
                      borderRadius: "var(--border-radius-sm)",
                      fontSize: "15px",
                      fontFamily: FONT,
                      fontWeight: 600,
                      cursor: "pointer",
                      minHeight: "44px",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.navyDark;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.navy;
                    }}
                    {...focusRing}
                  >
                    Get started
                  </button>
                </div>
              </>
            ) : (
              /* ── Step 2 ── */
              <>
                <h2
                  style={{
                    fontFamily: FONT_HEADING,
                    fontSize: "22px",
                    fontWeight: 600,
                    color: C.textHeading,
                    margin: "0 0 6px 0",
                  }}
                >
                  Your experience
                </h2>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: "15px",
                    color: C.textSecondary,
                    lineHeight: 1.6,
                    margin: "0 0 28px 0",
                  }}
                >
                  Tell us about your learning style and any courses you&apos;ve taken — we&apos;ll
                  use this to tailor your recommendations.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Courses taken — optional
                      TODO: replace MOCK_COURSES with a real API call when the course-history
                            endpoint is ready */}
                  <CourseSelector selectedCourses={selectedCourses} onToggle={toggleCourse} />

                  {/* TODO: search-based course discovery (commented out until search endpoint ready)
                  <CourseSearch onSelect={...} /> */}

                  {/* Learning preferences (pref_enum) — what the student generally looks for */}
                  <div>
                    <hr
                      style={{
                        border: "none",
                        borderTop: `1px solid ${C.borderSeparator}`,
                        margin: "0 0 20px 0",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: "14px",
                        fontWeight: 500,
                        color: C.textHeading,
                        margin: "0 0 10px 0",
                      }}
                    >
                      What kind of learning environment do you prefer?{" "}
                      <span style={{ fontWeight: 400, color: C.textPlaceholder, fontSize: "13px" }}>
                        — optional, pick any that resonate
                      </span>
                    </p>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                      role="group"
                      aria-label="Learning preferences"
                    >
                      {Object.values(StudentPreferencesItem).map((pref) => {
                        const isSelected = selectedPreferences.includes(
                          pref as StudentPatchInputPreferencesItem,
                        );
                        return (
                          <button
                            key={pref}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                              togglePreference(pref as StudentPatchInputPreferencesItem)
                            }
                            style={{
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "13px",
                              fontFamily: FONT,
                              fontWeight: isSelected ? 600 : 400,
                              border: `1px solid ${isSelected ? C.navy : C.borderInput}`,
                              backgroundColor: isSelected ? C.bgSelectedRow : C.bgCard,
                              color: isSelected ? C.navy : C.textSecondary,
                              cursor: "pointer",
                              minHeight: "32px",
                              outline: "none",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected)
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                  C.bgHover;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                isSelected ? C.bgSelectedRow : C.bgCard;
                            }}
                            {...focusRing}
                          >
                            {PREFERENCE_LABELS[pref as StudentPatchInputPreferencesItem]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {saveError && (
                    <p
                      role="alert"
                      style={{
                        fontSize: "14px",
                        color: C.error,
                        backgroundColor: C.bgSelectedRow,
                        border: `1px solid ${C.error}`,
                        borderRadius: "var(--border-radius-sm)",
                        padding: "10px 14px",
                        fontFamily: FONT,
                        margin: 0,
                      }}
                    >
                      {saveError}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        padding: "12px 20px",
                        border: `1px solid ${C.borderInput}`,
                        borderRadius: "var(--border-radius-sm)",
                        backgroundColor: C.bgCard,
                        color: C.textSecondary,
                        fontFamily: FONT,
                        fontSize: "15px",
                        fontWeight: 500,
                        cursor: "pointer",
                        minHeight: "44px",
                        outline: "none",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.bgCard;
                      }}
                      {...focusRing}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: "12px 24px",
                        backgroundColor: saving ? "#999" : C.navy,
                        color: C.white,
                        border: "none",
                        borderRadius: "var(--border-radius-sm)",
                        fontSize: "15px",
                        fontFamily: FONT,
                        fontWeight: 600,
                        cursor: saving ? "not-allowed" : "pointer",
                        minHeight: "44px",
                        opacity: saving ? 0.7 : 1,
                        outline: "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!saving)
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.navyDark;
                      }}
                      onMouseLeave={(e) => {
                        if (!saving)
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.navy;
                      }}
                      {...focusRing}
                    >
                      {saving ? "Saving…" : "Finish →"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
