"use client";

import Link from "next/link";

const MOCK_COURSES = [
  { id: "1", code: "CS 3000", name: "Algorithms & Data", rating: 1.1, viewed: "Viewed 3 days ago" },
  { id: "2", code: "CS 2510", name: "Fundamentals of CS 2", rating: 4.2, viewed: "Viewed 5 days ago" },
  { id: "3", code: "CS 3500", name: "Object-Oriented Design", rating: 3.8, viewed: "Viewed 1 week ago" },
  { id: "4", code: "CS 1800", name: "Discrete Structures", rating: 4.5, viewed: "Viewed 1 week ago" },
  { id: "5", code: "CS 3200", name: "Database Design", rating: 3.6, viewed: "Viewed 2 weeks ago" },
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
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="24" stroke="#B45309" strokeWidth="6" fill="none" />
        <path
          d="M32,14 L46,25 Q50,28 46,31 L32,42 Q28,45 24,42 L10,31 Q6,28 10,25 L24,14 Q28,11 32,14 Z"
          fill="#B45309"
          transform="rotate(-35 28 28)"
        />
        <circle cx="28" cy="28" r="7" fill="#1D3A8A" />
        <polygon points="11,28 17,23 17,33" fill="white" transform="rotate(-35 28 28)" />
        <polygon points="45,28 39,23 39,33" fill="white" transform="rotate(-35 28 28)" />
      </svg>

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
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 48px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <NorthStarLogo />

          <div style={{ display: "flex", gap: 48 }}>
            {[
              { label: "Home", href: "/", active: true },
              { label: "Courses", href: "/courses", active: false },
              { label: "Professors", href: "/professors", active: false },
              { label: "Reviews", href: "/reviews", active: false },
            ].map(({ label, href, active }) => (
              <Link key={label} href={href} style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-size-base)",
                color: active ? "var(--color-primary-navy)" : "var(--color-text-primary)",
                textDecoration: active ? "underline" : "none",
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </Link>
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
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px 80px" }}>

        {/* Welcome card */}
        <div style={{
          ...cardStyle,
          padding: "36px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 48,
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
          <Link href="/courses" style={{
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
            textDecoration: "none",
          }}>
            Browse Courses
          </Link>
        </div>

        {/* Recently Viewed */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 20,
        }}>
          Recently Viewed
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20, marginBottom: 56 }}>
          {MOCK_COURSES.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                ...cardStyle,
                padding: "20px 24px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 150,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}>
                      {course.code}
                    </p>
                    <p style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-secondary)",
                      margin: "4px 0 0",
                    }}>
                      {course.name}
                    </p>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 28,
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
            </Link>
          ))}
        </div>

        {/* Most-Talked About Course Discussion */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--font-size-xl)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 20,
        }}>
          Most-Talked About Course Discussion
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MOCK_DISCUSSIONS.map((item) => (
            <Link key={item.id} href="/reviews" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ ...cardStyle, padding: "20px 28px", cursor: "pointer" }}>
                <p style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}>
                  {item.courseCode} — {item.topic}
                </p>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", marginTop: 6, marginBottom: 0 }}>
                  {item.replies} replies
                </p>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
