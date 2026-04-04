"use client";
import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompatibilityLevel = "High" | "Medium" | "Low";

interface CourseData {
  id: string;
  name: string;
  overall: string;
  difficulty: string;
  hoursPerWeek: number;
  credits: number;
  nupath: string;
  compatibility: CompatibilityLevel;
  daysAgo?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_COURSES: CourseData[] = [
  {
    id: "1",
    name: "CS 3000: Algorithms",
    overall: "3.2/5",
    difficulty: "1.0/5",
    hoursPerWeek: 7.8,
    credits: 4,
    nupath: "Creative, Writing",
    compatibility: "High",
  },
  {
    id: "2",
    name: "CS 3500: Object-Oriented",
    overall: "4.1/5",
    difficulty: "2.3/5",
    hoursPerWeek: 9.2,
    credits: 4,
    nupath: "None",
    compatibility: "Medium",
  },
  {
    id: "3",
    name: "CS 2500: Fundamentals of CS",
    overall: "4.1/5",
    difficulty: "2.5/5",
    hoursPerWeek: 8.5,
    credits: 4,
    nupath: "None",
    compatibility: "High",
    daysAgo: "2 days ago",
  },
  {
    id: "4",
    name: "CS 4500: Software Development",
    overall: "3.8/5",
    difficulty: "3.2/5",
    hoursPerWeek: 11.2,
    credits: 4,
    nupath: "None",
    compatibility: "Medium",
    daysAgo: "5 days ago",
  },
  {
    id: "5",
    name: "BUSN 2301: Marketing Principles",
    overall: "3.5/5",
    difficulty: "1.8/5",
    hoursPerWeek: 6.0,
    credits: 4,
    nupath: "None",
    compatibility: "Low",
    daysAgo: "1 week ago",
  },
];

const RECENTLY_VIEWED = MOCK_COURSES.slice(2);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compatibilityColor(level: CompatibilityLevel): string {
  if (level === "High") return "#2a7a2a";
  if (level === "Medium") return "#c8860a";
  return "#c0392b";
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: React.ReactNode;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 0",
        borderBottom: "1px solid #e8e2d0",
      }}
    >
      <span style={{ color: "#444", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 14, ...valueStyle }}>{value}</span>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onRemove,
}: {
  course: CourseData;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "#faf7ee",
        border: "1.5px solid #ddd5b8",
        borderRadius: 10,
        padding: "18px 22px",
        minWidth: 0,
        position: "relative",
      }}
    >
      {/* X button */}
      <button
        onClick={onRemove}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "none",
          border: "none",
          fontSize: 16,
          cursor: "pointer",
          color: "#aaa",
          lineHeight: 1,
          padding: 2,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#555")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
      >
        ×
      </button>

      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 14,
          marginTop: 0,
          paddingRight: 20,
        }}
      >
        {course.name}
      </h3>
      <StatRow label="Overall" value={course.overall} />
      <StatRow label="Difficulty" value={course.difficulty} />
      <StatRow label="Hours/Week" value={course.hoursPerWeek} />
      <StatRow label="Credits" value={course.credits} />
      <StatRow label="NUPath" value={course.nupath} />
      <StatRow
        label="Compatibility"
        value={course.compatibility}
        valueStyle={{ color: compatibilityColor(course.compatibility) }}
      />
    </div>
  );
}

// ─── Search Dropdown ──────────────────────────────────────────────────────────

function SearchDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (course: CourseData) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query
    ? MOCK_COURSES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : RECENTLY_VIEWED;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "2px solid #4a90d9",
          width: 380,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
          }}
        >
          <span style={{ color: "#888", fontSize: 16 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a course..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#333",
              background: "transparent",
            }}
          />
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}
          >
            ×
          </button>
        </div>

        {/* Recently viewed label */}
        {!query && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px 6px",
            }}
          >
            <span style={{ fontSize: 12, color: "#888" }}>🕐</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
              Recently Viewed
            </span>
          </div>
        )}

        {/* Results */}
        <div>
          {filtered.map((course) => (
            <div
              key={course.id}
              onClick={() => { onSelect(course); onClose(); }}
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8f8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
                  {course.name}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Rating: {course.overall.replace("/5", "")} • Difficulty: {course.difficulty.replace("/5", "")} • {course.hoursPerWeek} hrs/wk
                </div>
              </div>
              {course.daysAgo && (
                <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", marginLeft: 8 }}>
                  {course.daysAgo}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "10px 16px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>
            Or type to search all courses
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Compare Page ────────────────────────────────────────────────────────

export function ComparePage({ onClose }: { onClose?: () => void }) {
  const [courses, setCourses] = useState<CourseData[]>([
    MOCK_COURSES[0]!,
    MOCK_COURSES[1]!,
  ]);
  const [showSearch, setShowSearch] = useState(false);

  const handleAddCourse = (course: CourseData) => {
    setCourses((prev) => [...prev, course]);
  };

  const handleRemoveCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f5f0c0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          width: "min(780px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 28px 18px",
            borderBottom: "1px solid #e8e0cc",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
            Compare Courses
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#666" }}
          >
            ×
          </button>
        </div>

        {/* Cards */}
        <div style={{ padding: "20px 28px", display: "flex", gap: 14 }}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onRemove={() => handleRemoveCourse(course.id)}
            />
          ))}
        </div>

        {/* Add another */}
        <div style={{ textAlign: "center", paddingBottom: 18 }}>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              background: "none",
              border: "none",
              color: "#4a7a9b",
              fontSize: 14,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            + Add another course to compare
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 28px 22px",
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e8e0cc",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 28px",
              borderRadius: 8,
              border: "2px solid #1a1a1a",
              background: "#fff",
              fontSize: 15,
              fontWeight: 600,
              color: "#1a1a1a",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      {showSearch && (
        <SearchDropdown
          onSelect={handleAddCourse}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}