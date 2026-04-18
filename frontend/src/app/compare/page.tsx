"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useCourses } from "../../hooks/useCourses";
import { CourseCard } from "../../components/compare/courseCard";
import { Course } from "../../lib/api/northStarAPI.schemas";

const MAX_COURSES = 4;

function SearchDropdown({
    onSelect,
    onClose,
    selectedIds,
}: {
    onSelect: (course: Course) => void;
    onClose: () => void;
    selectedIds: Set<string>;
}) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // TODO: pagination — limit:100 is the backend max per page; fetching all courses
    // requires paginating through all pages. For now this gets up to 100 courses.
    // TODO: implement "Recently Viewed" courses to show before the user starts typing
    const { courses, isLoading } = useCourses({ limit: 100 });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const filtered = courses.filter(
        (c) =>
            !selectedIds.has(c.id) &&
            c.name.toLowerCase().includes(query.toLowerCase())
    );

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
                    width: 400,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* search input */}
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

                {/* results */}
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {isLoading ? (
                        <div style={{ padding: "16px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
                            Loading courses...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: "16px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
                            No courses found
                        </div>
                    ) : (
                        filtered.map((course) => (
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
                                        {course.department.name} {course.course_code} • {course.num_credits} credits
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>
                        Or type to search all courses
                    </span>
                </div>
            </div>
        </div>
    );
}

// compare page

export default function ComparePage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    const handleAddCourse = (course: Course) => {
        setCourses((prev) => [...prev, course]);
    };

    const handleRemoveCourse = (id: string) => {
        setCourses((prev) => prev.filter((c) => c.id !== id));
    };

    const handleBack = () => {
        router.back();
    };

    const selectedIds = new Set(courses.map((c) => c.id));

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
                    // width grows as cards are added, not the cards themselves
                    width: "fit-content",
                    maxWidth: "95vw",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    overflowX: "auto",
                }}
            >
                {/* header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "22px 28px 18px",
                        borderBottom: "1px solid #e8e0cc",
                        minWidth: 600,
                    }}
                >
                    <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
                        Compare Courses
                    </h2>
                    {/* X navigates back */}
                    <button
                        onClick={handleBack}
                        style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#666" }}
                    >
                        ×
                    </button>
                </div>

                {/* cards, fixed width per card, modal expands */}
                <div style={{ padding: "20px 28px", display: "flex", gap: 14, minWidth: 600 }}>
                    {courses.length === 0 ? (
                        <div style={{ color: "#aaa", fontSize: 14, padding: "40px 0", textAlign: "center", width: "100%" }}>
                            Add a course to start comparing
                        </div>
                    ) : (
                        courses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onRemove={() => handleRemoveCourse(course.id)}
                            />
                        ))
                    )}
                </div>

                {/* add another but hidden when at max */}
                {courses.length < MAX_COURSES && (
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
                )}

                {/* "Back To Course" */}
                <div
                    style={{
                        padding: "14px 28px 22px",
                        display: "flex",
                        justifyContent: "flex-end",
                        borderTop: "1px solid #e8e0cc",
                        minWidth: 600,
                    }}
                >
                    <button
                        onClick={handleBack}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
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
                        Back To Course
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* search dropdown */}
            {showSearch && (
                <SearchDropdown
                    onSelect={handleAddCourse}
                    onClose={() => setShowSearch(false)}
                    selectedIds={selectedIds}
                />
            )}
        </div>
    );
}