"use client";

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
}

interface ProfessorData {
  id: string;
  name: string;
  overall: string;
  difficulty: string;
  wouldTakeAgain: string;
  department: string;
  compatibility: CompatibilityLevel;
}

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
];

const MOCK_PROFESSORS: ProfessorData[] = [
  {
    id: "1",
    name: "Ben Lerner",
    overall: "4.2/5",
    difficulty: "2.1/5",
    wouldTakeAgain: "92%",
    department: "CS",
    compatibility: "High",
  },
  {
    id: "2",
    name: "Olin Shivers",
    overall: "3.8/5",
    difficulty: "4.2/5",
    wouldTakeAgain: "74%",
    department: "CS",
    compatibility: "Medium",
  },
];

function compatibilityColor(level: CompatibilityLevel): string {
  if (level === "High") return "#2d7a2d";
  if (level === "Medium") return "#b87800";
  return "#c0392b";
}

function StatRow({ label, value, valueStyle }: {
  label: string;
  value: React.ReactNode;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #ede8d8" }}>
      <span style={{ color: "#555", fontSize: 15 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 15, ...valueStyle }}>{value}</span>
    </div>
  );
}

function CourseCard({ course }: { course: CourseData }) {
  return (
    <div style={{ flex: 1, background: "#fdf8ee", border: "1.5px solid #d6ccb0", borderRadius: 12, padding: "20px 24px" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{course.name}</h3>
      <StatRow label="Overall" value={course.overall} />
      <StatRow label="Difficulty" value={course.difficulty} />
      <StatRow label="Hours/Week" value={course.hoursPerWeek} />
      <StatRow label="Credits" value={course.credits} />
      <StatRow label="NUPath" value={course.nupath} />
      <StatRow label="Compatibility" value={course.compatibility} valueStyle={{ color: compatibilityColor(course.compatibility) }} />
    </div>
  );
}

function ProfessorCard({ professor }: { professor: ProfessorData }) {
  return (
    <div style={{ flex: 1, background: "#fdf8ee", border: "1.5px solid #d6ccb0", borderRadius: 12, padding: "20px 24px" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{professor.name}</h3>
      <StatRow label="Overall" value={professor.overall} />
      <StatRow label="Difficulty" value={professor.difficulty} />
      <StatRow label="Would Take Again" value={professor.wouldTakeAgain} />
      <StatRow label="Department" value={professor.department} />
      <StatRow label="Compatibility" value={professor.compatibility} valueStyle={{ color: compatibilityColor(professor.compatibility) }} />
    </div>
  );
}

export function ComparePage({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#f5f0c8", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", width: "min(800px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px 20px", borderBottom: "1px solid #e8e0cc" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Compare Courses</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {/* card */}
        <div style={{ padding: "24px 32px", display: "flex", gap: 16 }}>
          {MOCK_COURSES.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* to add another */}
        <div style={{ textAlign: "center", paddingBottom: 16 }}>
          <button style={{ background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>
            + Add another course to compare
          </button>
        </div>

        {/* footer */}
        <div style={{ padding: "16px 32px 24px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e8e0cc" }}>
          <button onClick={onClose} style={{ padding: "10px 32px", borderRadius: 8, border: "2px solid #1a1a1a", background: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}