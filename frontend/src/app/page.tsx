"use client";

import Link from "next/link";
import { useCourses } from "@/src/hooks/useCourses";
import { useMe } from "@/src/hooks/useMe";
import ProfilePicture from "@/src/components/ProfilePicture";

const MOCK_DISCUSSIONS = [
  { id: "1", courseCode: "CS 3000", topic: "How to survive Akshar Verma's class?", replies: 200 },
  { id: "2", courseCode: "CS 2510", topic: "Best study resources for final exam?", replies: 156 },
  { id: "3", courseCode: "CS 3500", topic: "Tips for the midterm project?", replies: 89 },
];

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface-light-cream)",
  borderRadius: 16,
};


export default function Home() {
  const { student } = useMe();
  const { courses } = useCourses({ limit: 5 });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      {/* Page content */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px 80px" }}>
        {/* Welcome card */}
        <div
          style={{
            ...cardStyle,
            padding: "36px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ProfilePicture
              studentID={student?.id ?? null}
              profilePictureUrl={student?.profilePictureUrl ?? null}
              size={72}
            />
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--font-size-xl)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Welcome Back{student ? `, ${student.firstName}` : ""}!
              </h1>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "var(--font-size-sm)",
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                Continue planning your semester
              </p>
            </div>
          </div>
          <Link
            href="/courses"
            style={{
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
            }}
          >
            Browse Courses
          </Link>
        </div>

        {/* Recently Viewed */}
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 20,
          }}
        >
          Recently Viewed
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 20,
            marginBottom: 56,
          }}
        >
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  ...cardStyle,
                  padding: "20px 24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 150,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {course.department.name} {course.course_code}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-secondary)",
                        margin: "4px 0 0",
                      }}
                    >
                      {course.name}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-size-xs)",
                    margin: 0,
                  }}
                >
                  {course.num_credits} credits
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Most-Talked About Course Discussion */}
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 20,
          }}
        >
          Most-Talked About Course Discussion
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MOCK_DISCUSSIONS.map((item) => (
            <Link
              key={item.id}
              href="/reviews"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ ...cardStyle, padding: "20px 28px", cursor: "pointer" }}>
                <p
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {item.courseCode} — {item.topic}
                </p>
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-size-xs)",
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
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
