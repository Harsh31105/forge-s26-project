"use client";

import Link from "next/link";
import { useState } from "react";
import { useCourses } from "@/src/hooks/useCourses";
import { GetCoursesParams } from "@/src/lib/api/northStarAPI.schemas";

const NUPATH_OPTIONS = [
  "Writing Intensive",
  "Creative Expression",
  "Formal and Quantitative Reasoning",
  "Natural and Designed World",
  "Societies and Institutions",
  "Cultures and Civilizations",
  "Ethics and Social Responsibility",
  "Integration Experience",
  "Capstone Experience",
  "Difference, Power, and Discrimination",
];

const CREDITS_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function CoursesPage() {
  const [filters, setFilters] = useState<GetCoursesParams>({});
  const [search, setSearch] = useState("");

  const { courses, isLoading } = useCourses(filters);

  const filtered = courses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      `${c.department.name} ${c.course_code}`.toLowerCase().includes(q)
    );
  });

  const toggleNupath = (val: string) => {
    setFilters((prev) => ({
      ...prev,
      nupath: prev.nupath === val ? undefined : val,
    }));
  };

  const toggleCredits = (val: number) => {
    setFilters((prev) => ({
      ...prev,
      num_credits: prev.num_credits === val ? undefined : val,
    }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>

      {/* Navbar */}
      <nav style={{ background: "var(--color-surface-light-cream)", borderBottom: "1px solid var(--color-border-tan)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="40" height="40" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="28" cy="28" r="24" stroke="#B45309" strokeWidth="6" fill="none" />
              <path d="M32,14 L46,25 Q50,28 46,31 L32,42 Q28,45 24,42 L10,31 Q6,28 10,25 L24,14 Q28,11 32,14 Z" fill="#B45309" transform="rotate(-35 28 28)" />
              <circle cx="28" cy="28" r="7" fill="#1D3A8A" />
            </svg>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "var(--color-text-primary)" }}>NorthStar</span>
          </div>

          <div style={{ display: "flex", gap: 40 }}>
            {[
              { label: "Home", href: "/home" },
              { label: "Courses", href: "/courses", active: true },
              { label: "Professors", href: "/professors" },
              { label: "Profile", href: "/profile" },
            ].map(({ label, href, active }) => (
              <Link key={label} href={href} style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-sm)", color: active ? "var(--color-primary-navy)" : "var(--color-text-primary)", textDecoration: active ? "underline" : "none", fontWeight: active ? 600 : 400 }}>
                {label}
              </Link>
            ))}
          </div>

          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 48px 80px", display: "flex", gap: 32 }}>

        {/* Sidebar filters */}
        <aside style={{ width: 240, flexShrink: 0 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-base)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 24, marginTop: 0 }}>
            FILTERS
          </h2>

          {/* NUPath */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 12, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              NUPATH
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {NUPATH_OPTIONS.map((opt) => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.nupath === opt}
                    onChange={() => toggleNupath(opt)}
                    style={{ accentColor: "var(--color-primary-navy)", width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 12, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              CREDITS
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CREDITS_OPTIONS.map((c) => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.num_credits === c}
                    onChange={() => toggleCredits(c)}
                    style={{ accentColor: "var(--color-primary-navy)", width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                    {c} Credit{c !== 1 ? "s" : ""}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {(filters.nupath || filters.num_credits) && (
            <button
              onClick={() => setFilters({})}
              style={{ background: "none", border: "none", color: "var(--color-accent-copper)", fontSize: "var(--font-size-xs)", fontFamily: "var(--font-body)", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Course list */}
        <div style={{ flex: 1 }}>
          {/* Search */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--color-border-tan)", borderRadius: "var(--border-radius-md)", fontSize: "var(--font-size-sm)", fontFamily: "var(--font-body)", background: "white", color: "var(--color-text-primary)", boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {isLoading ? (
            <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: "var(--font-size-sm)" }}>Loading courses...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: "var(--font-size-sm)" }}>No courses found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((course) => {
                const deptCode = course.department.name.toUpperCase();
                const nupathTags = course.nupath
                  ? course.nupath.split(",").map((s) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "var(--color-surface-light-cream)", borderRadius: "var(--border-radius-md)", padding: "20px 28px", border: "1px solid transparent", cursor: "pointer", transition: "border-color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-tan)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <p style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                            {deptCode} {course.course_code}: {course.name}
                          </p>
                          {course.prereqs && (
                            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: "4px 0 0", fontFamily: "var(--font-body)" }}>
                              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Pre Reqs:</span> {course.prereqs}
                              {course.coreqs && (
                                <span>  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Co Reqs:</span> {course.coreqs}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {nupathTags.map((tag) => (
                          <span key={tag} style={{ background: "var(--color-background-cream)", border: "1px solid var(--color-border-tan)", borderRadius: "var(--border-radius-sm)", padding: "3px 10px", fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                            {tag}
                          </span>
                        ))}
                        <span style={{ background: "var(--color-background-cream)", border: "1px solid var(--color-border-tan)", borderRadius: "var(--border-radius-sm)", padding: "3px 10px", fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                          {course.num_credits} Credits
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
