"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import { useCourses } from "@/src/hooks/useCourses";
import { useTraces } from "@/src/hooks/useTraces";
import { useReviews } from "@/src/hooks/useReviews";
import { useProfessors } from "@/src/hooks/useProfessors";
import Navbar from "@/src/components/NavBar";
import CourseCard from "@/src/components/CourseCard";
import SearchableSelect from "@/src/components/SearchableSelect";
import { Trace } from "@/src/lib/api/northStarAPI.schemas";
import { GetTraceSemester } from "@/src/lib/api/northStarAPI.schemas";

type SortOption = "default" | "highest" | "lowest" | "az" | "za";
type RatingFilter = "4" | "3" | null;
type CreditsFilter = "1" | "2" | "3" | "4" | null;
type SemesterFilter = GetTraceSemester | null;


export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);
  const [creditsFilter, setCreditsFilter] = useState<CreditsFilter>(null);
  const [semesterFilter, setSemesterFilter] = useState<SemesterFilter>(null);

  const { courses, isLoading, error } = useCourses({
    num_credits: creditsFilter ? parseInt(creditsFilter) : undefined,
    limit: 2690,
    ...(sortBy === "az" && { sortBy: "name", sortOrder: "asc" }),
    ...(sortBy === "za" && { sortBy: "name", sortOrder: "desc" }),
  });

  const { traces } = useTraces();
  const { reviews } = useReviews();
  const { professors } = useProfessors({ limit: 100 });

  const professorOptions = useMemo(() =>
    professors.map(p => ({
      value: p.id,
      label: `Professor ${p.firstName} ${p.lastName}`,
      sublabel: p.tags?.[0]?.charAt(0).toUpperCase() + (p.tags?.[0]?.slice(1) ?? "") || "",
    })),
    [professors]
  );

  const tracesByCourse = useMemo(() => {
    const map: Record<string, Trace[]> = {};
    traces.forEach(t => {
      if (!map[t.courseId]) map[t.courseId] = [];
      map[t.courseId].push(t);
    });
    return map;
  }, [traces]);

  const ratingByCourse = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    reviews.forEach(r => {
      const cid = (r as any).courseId;
      if (cid) {
        if (!map[cid]) map[cid] = { sum: 0, count: 0 };
        map[cid].sum += r.rating ?? 0;
        map[cid].count += 1;
      }
    });
    const result: Record<string, number> = {};
    Object.entries(map).forEach(([id, { sum, count }]) => {
      result[id] = sum / count;
    });
    return result;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = courses;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        `${c.department.name} ${c.course_code}`.toLowerCase().includes(q)
      );
    }

    if (selectedProfessor) {
      const courseIdsForProf = new Set(
        traces.filter(t => t.professorId === selectedProfessor).map(t => t.courseId)
      );
      list = list.filter(c => courseIdsForProf.has(c.id));
    }

    if (semesterFilter) {
      const courseIdsForSemester = new Set(
        traces.filter(t => t.semester === semesterFilter).map(t => t.courseId)
      );
      list = list.filter(c => courseIdsForSemester.has(c.id));
    }

    if (ratingFilter) {
      const min = parseFloat(ratingFilter);
      list = list.filter(c => {
        const r = ratingByCourse[c.id];
        return r !== undefined && r >= min;
      });
    }

    if (sortBy === "highest") {
      list = [...list].sort((a, b) => (ratingByCourse[b.id] ?? 0) - (ratingByCourse[a.id] ?? 0));
    } else if (sortBy === "lowest") {
      list = [...list].sort((a, b) => (ratingByCourse[a.id] ?? 0) - (ratingByCourse[b.id] ?? 0));
    }

    return list;
  }, [courses, search, selectedProfessor, ratingFilter, sortBy, traces, ratingByCourse]);

  const handleClearFilters = () => {
    setSelectedProfessor("");
    setRatingFilter(null);
    setCreditsFilter(null);
    setSemesterFilter(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      <div style={{ display: "flex", padding: "32px 40px", gap: "32px" }}>
        <aside style={{
          width: "260px",
          flexShrink: 0,
          background: "var(--color-white)",
          border: "var(--border-width) solid var(--color-border-tan)",
          borderRadius: "var(--border-radius-md)",
          padding: "28px 24px",
          alignSelf: "flex-start",
          position: "sticky",
          top: "24px",
        }}>
          <h3 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--font-size-base)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text-primary)",
            margin: "0 0 16px 0",
            letterSpacing: "0.05em",
          }}>
            FILTERS
          </h3>

          <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", marginBottom: "24px" }} />

          <FilterSection label="PROFESSOR">
            <SearchableSelect
              options={professorOptions}
              value={selectedProfessor}
              onChange={setSelectedProfessor}
              placeholder="Search professors..."
              emptyLabel="Any professor"
              isLoading={false}
            />
            {selectedProfessor && (
              <p style={{
                fontSize: "11px",
                color: "var(--color-text-secondary)",
                margin: "4px 0 0 0",
                fontStyle: "italic",
              }}>
              </p>
            )}
          </FilterSection>

          <FilterSection label="RATING">
            <CheckboxItem
              label="4+ stars"
              checked={ratingFilter === "4"}
              onChange={() => setRatingFilter(p => p === "4" ? null : "4")}
            />
            <CheckboxItem
              label="3+ stars"
              checked={ratingFilter === "3"}
              onChange={() => setRatingFilter(p => p === "3" ? null : "3")}
            />
          </FilterSection>

          <FilterSection label="CREDITS">
            {(["1", "2", "3", "4"] as CreditsFilter[]).map(c => (
              <CheckboxItem
                key={c}
                label={`${c} Credit${c !== "1" ? "s" : ""}`}
                checked={creditsFilter === c}
                onChange={() => setCreditsFilter(p => p === c ? null : c)}
              />
            ))}
          </FilterSection>

          <FilterSection label="SEMESTER">
            {([
              ["fall", "Fall"],
              ["spring", "Spring"],
              ["summer_1", "Summer 1"],
              ["summer_2", "Summer 2"],
            ] as [GetTraceSemester, string][]).map(([val, label]) => (
              <CheckboxItem
                key={val}
                label={label}
                checked={semesterFilter === val}
                onChange={() => setSemesterFilter(p => p === val ? null : val)}
              />
            ))}
          </FilterSection>

          <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", margin: "8px 0 16px" }} />

          <button
            onClick={handleClearFilters}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-accent-copper)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Clear all filters
          </button>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "16px",
            flexWrap: "wrap",
          }}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
              {isLoading ? "Loading..." : `${filtered.length} course${filtered.length !== 1 ? "s" : ""} found`}
            </p>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-secondary)",
                  pointerEvents: "none",
                }} />
                <input
                  type="text"
                  placeholder="Search for courses"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    paddingLeft: "36px",
                    paddingRight: "16px",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    border: "var(--border-width) solid var(--color-border-tan)",
                    borderRadius: "var(--border-radius-sm)",
                    background: "var(--color-white)",
                    fontSize: "var(--font-size-xs)",
                    fontFamily: "var(--font-body)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    width: "220px",
                  }}
                />
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: "8px 12px",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  background: "var(--color-white)",
                  fontSize: "var(--font-size-xs)",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort by: Default</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              padding: "16px",
              background: "#FEF2F2",
              border: "1px solid var(--color-error)",
              borderRadius: "var(--border-radius-sm)",
              color: "var(--color-error)",
              fontSize: "var(--font-size-xs)",
              marginBottom: "20px",
            }}>
              Failed to load courses: {error}
            </div>
          )}

          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "64px 24px",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
            }}>
              <BookOpen size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-base)", marginBottom: "8px" }}>
                No courses found
              </p>
              <p>Try adjusting your search or clearing filters.</p>
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  traces={tracesByCourse[course.id] ?? []}
                  reviewCount={0}
                  avgRating={ratingByCourse[course.id] ?? null}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{
        fontSize: "var(--font-size-xs)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-text-primary)",
        letterSpacing: "0.06em",
        margin: "0 0 12px 0",
      }}>
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

function CheckboxItem({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      fontSize: "var(--font-size-xs)",
      color: "var(--color-text-primary)",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: "var(--color-primary-navy)", width: "16px", height: "16px" }}
      />
      {label}
    </label>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "var(--color-white)",
      border: "var(--border-width) solid var(--color-border-tan)",
      borderRadius: "var(--border-radius-md)",
      padding: "24px 28px",
      animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <div style={{ height: 22, width: "50%", background: "var(--color-surface-light-cream)", borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 14, width: "30%", background: "var(--color-surface-light-cream)", borderRadius: 4, marginBottom: 16 }} />
      <div style={{ height: 1, background: "var(--color-border-tan)", marginBottom: 12 }} />
      <div style={{ height: 14, width: "60%", background: "var(--color-surface-light-cream)", borderRadius: 4 }} />
    </div>
  );
}