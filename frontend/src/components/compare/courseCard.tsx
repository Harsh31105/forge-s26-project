"use client";
import { Course } from "@/src/lib/api/northStarAPI.schemas";
import { useTraces } from "@/src/hooks/useTraces";

function StatRow({
    label,
    value,
    valueStyle,
    isLast,
}: {
    label: string;
    value: React.ReactNode;
    valueStyle?: React.CSSProperties;
    isLast?: boolean;
}) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: isLast ? "none" : "1px solid #e8e2d0",
        }}>
            <span style={{ color: "#555", fontSize: 14 }}>{label}</span>
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
    // fetch TRACE records for this course to compute averages
    const { traces, isLoading } = useTraces({ courseId: course.id, limit: 100 });

    const avgEfficiency = traces.length > 0
        ? (traces.reduce((sum, t) => sum + Number(t.professorEfficiency), 0) / traces.length).toFixed(2)
        : "N/A";

    const avgHours = traces.length > 0
        ? (traces.reduce((sum, t) => sum + Number(t.hoursDevoted), 0) / traces.length).toFixed(1)
        : "N/A";

    // pick the most common non-null lectureType across all TRACE records for this course
    const lectureType = (() => {
        const counts: Record<string, number> = {};
        for (const t of traces) {
            if (t.lectureType) counts[t.lectureType] = (counts[t.lectureType] ?? 0) + 1;
        }
        const entries = Object.entries(counts);
        if (entries.length === 0) return "N/A";
        return entries.sort((a, b) => b[1] - a[1])[0][0];
    })();

    return (
        <div style={{
            width: 280,
            flexShrink: 0,
            background: "#faf7ee",
            border: "1.5px solid #ddd5b8",
            borderRadius: 10,
            padding: "18px 22px 4px 22px",
            position: "relative",
        }}>
            {/* X removes course from comparison */}
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

            <h3 style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: 14,
                marginTop: 0,
                paddingRight: 20,
            }}>
                {course.name}
            </h3>

            <StatRow label="Overall" value={isLoading ? "..." : `${avgEfficiency}/5`} />
            {/* TODO: Difficulty — no difficulty field exists in TRACE data ..? */}
            <StatRow label="Difficulty" value="N/A" />
            <StatRow label="Hours/Week" value={isLoading ? "..." : avgHours} />
            <StatRow label="Lecture Type" value={isLoading ? "..." : lectureType} />
            <StatRow label="Credits" value={course.num_credits} />
            {/* TODO: NUPath — not available */}
            <StatRow label="NUPath" value="N/A" />
            {/* TODO: Compatibility — not available */}
            <StatRow label="Compatibility" value="N/A" isLast />
        </div>
    );
}