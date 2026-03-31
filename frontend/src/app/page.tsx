"use client";

const MOCK_COURSES = [
  { id: "1", code: "CS 3000", rating: 1.1, viewed: "Viewed 3 days ago" },
  { id: "2", code: "CS 2510", rating: 4.2, viewed: "Viewed 5 days ago" },
  { id: "3", code: "CS 3500", rating: 3.8, viewed: "Viewed 1 week ago" },
];

const MOCK_DISCUSSIONS = [
  { id: "1", courseCode: "CS 3000", topic: "How to survive Akshar Verma's class?", replies: 200 },
  { id: "2", courseCode: "CS 2510", topic: "Best study resources for final exam?", replies: 156 },
  { id: "3", courseCode: "CS 3500", topic: "Tips for the midterm project?", replies: 89 },
];

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface-light-cream)",
  borderRadius: 16,
};

function NorthStarLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Compass: thick ring + tilted rounded diamond + blue dot + white arrows */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Thick outer ring */}
        <circle cx="28" cy="28" r="24" stroke="#B45309" strokeWidth="6" fill="none" />
        {/* Diamond: straight edges, rounded corners at each tip */}
        <path
          d="M32,14 L46,25 Q50,28 46,31 L32,42 Q28,45 24,42 L10,31 Q6,28 10,25 L24,14 Q28,11 32,14 Z"
          fill="#B45309"
          transform="rotate(-35 28 28)"
        />
        {/* Blue center dot */}
        <circle cx="28" cy="28" r="7" fill="#1D3A8A" />
        {/* White arrows along the diamond's long axis */}
        <polygon points="11,28 17,23 17,33" fill="white" transform="rotate(-35 28 28)" />
        <polygon points="45,28 39,23 39,33" fill="white" transform="rotate(-35 28 28)" />
      </svg>

      {/* Text */}
      <div>
        <p style={{
          fontFamily: "var(--font-logo)",
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.06em",
          color: "var(--color-text-primary)",
          margin: 0,
          lineHeight: 1.1,
        }}>
          NorthStar
        </p>
        <p style={{
          fontSize: 12,
          color: "var(--color-accent-copper)",
          margin: 0,
          lineHeight: 1,
          letterSpacing: "0.22em",
        }}>
          ✦ ⊕ ◆ ◉ ◇ ❖ ◆ ✤ ◆
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>

      {/* Navbar */}
      <nav style={{ background: "var(--color-surface-light-cream)", borderBottom: "1px solid var(--color-border-tan)" }}>
        <div style={{
          maxWidth: 1060,
          margin: "0 auto",
          padding: "0 32px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <NorthStarLogo />

          <div style={{ display: "flex", gap: 48 }}>
            {[
              { label: "Home", active: true },
              { label: "Courses", active: false },
              { label: "Professors", active: false },
              { label: "Reviews", active: false },
            ].map(({ label, active }) => (
              <a key={label} href="#" style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-size-base)",
                color: active ? "var(--color-primary-navy)" : "var(--color-text-primary)",
                textDecoration: active ? "underline" : "none",
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </a>
            ))}
          </div>

          <button style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid var(--color-border-tan)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 32px 64px" }}>

        {/* Welcome card */}
        <div style={{
          ...cardStyle,
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 36,
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-xl)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}>
              Welcome Back, Patricia!
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: 8, marginBottom: 0 }}>
              Continue planning your semester
            </p>
          </div>
          <button style={{
            background: "var(--color-primary-navy)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "14px 28px",
            fontSize: "var(--font-size-sm)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            Browse Courses
          </button>
        </div>

        {/* Recently Viewed */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 16,
        }}>
          Recently Viewed
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {MOCK_COURSES.map((course) => (
            <div key={course.id} style={{
              ...cardStyle,
              padding: "20px 24px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 130,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}>
                  {course.code}
                </p>
                <span style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--color-primary-navy)",
                  lineHeight: 1,
                }}>
                  {course.rating}
                </span>
              </div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", margin: 0 }}>
                {course.viewed}
              </p>
            </div>
          ))}
        </div>

        {/* Most-Talked About Course Discussion */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 16,
        }}>
          Most-Talked About Course Discussion
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MOCK_DISCUSSIONS.map((item) => (
            <div key={item.id} style={{ ...cardStyle, padding: "20px 24px", cursor: "pointer" }}>
              <p style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}>
                {item.courseCode}
              </p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", marginTop: 4, marginBottom: 0 }}>
                {item.replies} replies
              </p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
