"use client";
import { Course } from "@/src/lib/api/northStarAPI.schemas";

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

export function CourseCard({
    course,
    onRemove,
}: {
    course: Course;
    onRemove: () => void;
}) {
    return (
        <div
            style={{
                width: 280, // fixed width — modal expands, not cards
                flexShrink: 0,
                background: "#faf7ee",
                border: "1.5px solid #ddd5b8",
                borderRadius: 10,
                padding: "18px 22px",
                position: "relative",
            }}
        >
            {/* X button — navigates back (handled by parent) */}
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
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: 14,
                    marginTop: 0,
                    paddingRight: 20,
                }}
            >
                {course.name}
            </h3>

            <StatRow label="Course Code" value={course.course_code} />
            <StatRow label="Credits" value={course.num_credits} />
            <StatRow label="Lecture Type" value={course.lecture_type ?? "N/A"} />
            <StatRow label="Department" value={course.department.name} />

            {/* TODO: add NUPath once available */}
            {/* TODO: add Compatibility once available */}
        </div>
    );
}