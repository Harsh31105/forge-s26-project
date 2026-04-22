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
    recommendation
}: {
    course: Course;
    onRemove: () => void;
    recommendation: string | null;
}) {
    // fetch TRACE records for this course to compute averages
    const { traces, isLoading } = useTraces({ limit: 30000, courseId: course.id });

    const compatibilityStyle: React.CSSProperties = (() => {
        switch (recommendation) {
            case "HIGH":
                return { color: "#16a34a" }; // green
            case "MEDIUM":
                return { color: "#ca8a04" }; // yellow
            case "LOW":
                return { color: "#dc2626" }; // red
            default:
                return { color: "#555" }; // fallback
        }
    })();

    // TODO: @Biak
    const avgEfficiency = traces.length > 0
        ? (traces.reduce((sum, t) => sum + Number(t.professorEfficiency), 0) / traces.length).toFixed(2)
        : "N/A";

    // hoursDevoted is a distribution at runtime, so {"5-7": 38.2, "8-10": 38.2, "More than 10": 18.2}
    // despite being typed as number in the generated schema
    function rangeMidpoint(range: string): number {
        if (range === "More than 10") return 11; // treat as 10-12, midpoint 11
        const m = range.match(/(\d+)-(\d+)/);
        if (m) return (parseInt(m[1]) + parseInt(m[2])) / 2;
        return 0;
    }

    // return one number -- the weighted average hours/week based on the distribution
    function weightedHours(dist: Record<string, number>): number {
        let weightedSum = 0, totalPct = 0;
        for (const [range, pct] of Object.entries(dist)) {
            const mid = rangeMidpoint(range);
            if (mid > 0) { weightedSum += mid * pct; totalPct += pct; }
        }
        return totalPct > 0 ? weightedSum / totalPct : 0;
    }

    const avgHours = traces.length > 0
        ? (traces.reduce((sum, t) => {
            const dist = t.hoursDevoted as unknown as Record<string, number>;
            return sum + (typeof dist === "object" && dist !== null ? weightedHours(dist) : Number(t.hoursDevoted));
        }, 0) / traces.length).toFixed(1)
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

            <StatRow label="Overall" value={isLoading ? "..." : (avgEfficiency === "N/A" ? "N/A" : `${avgEfficiency}/5`)} />
            <StatRow label="Hours/Week" value={isLoading ? "..." : avgHours} />
            <StatRow label="Lecture Type" value={isLoading ? "..." : lectureType} />
            <StatRow label="Credits" value={course.num_credits} />
            {/* TODO: NUPath @itaischwarz */}
            <StatRow label="NUPath" value="N/A" />
            <StatRow
                label="Compatibility"
                value={recommendation ?? "N/A"}
                valueStyle={compatibilityStyle}
                isLast
            />
        </div>
    );
}