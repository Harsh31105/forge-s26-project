"use client";

import { useState, useMemo } from "react";
import { useProfessors } from "@/src/hooks/useProfessors";
import { useCourses } from "@/src/hooks/useCourses";
import { useRMP } from "@/src/hooks/useRMP";
import { useReviews } from "@/src/hooks/useReviews";
import ProfessorCard from "@/src/components/ProfessorCard";
import { Professor } from "@/src/lib/api/northStarAPI.schemas";

type SortOption = "relevance" | "highest" | "lowest";
type CampusFilter = "boston" | "oakland" | "london";
type RatingFilter = "4.5" | "4" | "3" | null;
type WtaFilter = "90" | "80" | "70" | null;
type DifficultyFilter = "easy" | "medium" | "hard" | null;

export default function ProfessorsPage() {
  const [search, setSearch] = useState("");
  const [campusFilters, setCampusFilters] = useState<CampusFilter[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);
  const [wtaFilter, setWtaFilter] = useState<WtaFilter>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const { courses } = useCourses();
  const { professors, isLoading, error } = useProfessors({
    limit: 1000,
    tags: campusFilters.length > 0 ? campusFilters : undefined,
    ...(sortBy === "highest" && { sortBy: "firstName", sortOrder: "asc" }),
    ...(sortBy === "lowest" && { sortBy: "firstName", sortOrder: "desc" }),
  });

  const { reviews } = useReviews({ limit: 1000 });
  const reviewCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach(r => {
      const pid = (r as any).professorId;
      if (pid) map[pid] = (map[pid] ?? 0) + 1;
    });
    return map;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = professors;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [professors, search, ratingFilter, wtaFilter, difficultyFilter]);

  const handleToggleCampus = (tag: CampusFilter) => {
    setCampusFilters(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-cream)" }}>
      <div style={{ display: "flex", padding: "32px 40px", gap: "32px" }}>
        <aside
          style={{
            width: "260px",
            flexShrink: 0,
            background: "var(--color-white)",
            border: "var(--border-width) solid var(--color-border-tan)",
            borderRadius: "var(--border-radius-md)",
            padding: "28px 24px",
            alignSelf: "flex-start",
            position: "sticky",
            top: "24px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-primary)",
              margin: "0 0 16px 0",
              letterSpacing: "0.05em",
            }}
          >
            FILTERS
          </h3>

          <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", marginBottom: "24px" }} />

          <FilterSection label="COURSE">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "var(--border-width) solid var(--color-border-tan)",
                borderRadius: "var(--border-radius-sm)",
                background: "var(--color-surface-light-cream)",
                fontSize: "var(--font-size-xs)",
                color: selectedCourse ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                fontFamily: "var(--font-body)",
                cursor: "pointer",
              }}
            >
              <option value="">All</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.department?.name} {c.course_code}: {c.name}
                </option>
              ))}
            </select>
            {selectedCourse && (
              <p style={{
                fontSize: "11px",
                color: "var(--color-text-secondary)",
                margin: "4px 0 0 0",
                fontStyle: "italic",
              }}>
                ⚠ Professor filtering by course needs backend ticket
              </p>
            )}
          </FilterSection>

          <FilterSection label="CAMPUS / LOCATION">
            {(["boston", "oakland", "london"] as CampusFilter[]).map(tag => (
              <CheckboxItem
                key={tag}
                label={tag.charAt(0).toUpperCase() + tag.slice(1)}
                checked={campusFilters.includes(tag)}
                onChange={() => handleToggleCampus(tag)}
              />
            ))}
          </FilterSection>

          <FilterSection label="OVERALL RATING">
            {([["4.5", "4.5+ stars"], ["4", "4+ stars"], ["3", "3+ stars"]] as [RatingFilter, string][]).map(([val, label]) => (
              <CheckboxItem
                key={val}
                label={label}
                checked={ratingFilter === val}
                onChange={() => setRatingFilter(prev => prev === val ? null : val)}
              />
            ))}
          </FilterSection>

          <FilterSection label="WOULD TAKE AGAIN">
            {([["90", "90%+"], ["80", "80%+"], ["70", "70%+"]] as [WtaFilter, string][]).map(([val, label]) => (
              <CheckboxItem
                key={val}
                label={label}
                checked={wtaFilter === val}
                onChange={() => setWtaFilter(prev => prev === val ? null : val)}
              />
            ))}
          </FilterSection>

          <FilterSection label="DIFFICULTY LEVEL">
            {([["easy", "Easy (1-2)"], ["medium", "Medium (2-3.5)"], ["hard", "Hard (3.5-5)"]] as [DifficultyFilter, string][]).map(([val, label]) => (
              <CheckboxItem
                key={val}
                label={label}
                checked={difficultyFilter === val}
                onChange={() => setDifficultyFilter(prev => prev === val ? null : val)}
              />
            ))}
          </FilterSection>

          <div style={{ borderTop: "var(--border-width) solid var(--color-border-tan)", margin: "8px 0 16px" }} />

          <button
            onClick={() => {
              setCampusFilters([]);
              setSelectedCourse("");
              setRatingFilter(null);
              setWtaFilter(null);
              setDifficultyFilter(null);
            }}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {isLoading ? "Loading..." : `${filtered.length} professor${filtered.length !== 1 ? "s" : ""} found`}
            </span>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-secondary)",
                    fontSize: "14px",
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search for professor"
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
                <option value="relevance">Sort by: Relevance</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "16px",
                background: "#FEF2F2",
                border: "1px solid var(--color-error)",
                borderRadius: "var(--border-radius-sm)",
                color: "var(--color-error)",
                fontSize: "var(--font-size-xs)",
                marginBottom: "20px",
              }}
            >
              Failed to load professors: {error}
            </div>
          )}

          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2, 3].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔭</div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "var(--font-size-base)", marginBottom: "8px" }}>
                No professors found
              </p>
              <p>Try adjusting your search or clearing filters.</p>
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filtered.map(prof => (
                <ProfessorCardWrapper
                  key={prof.id}
                  professor={prof}
                  reviewCount={reviewCountMap[prof.id] ?? 0}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProfessorCardWrapper({
  professor,
  reviewCount,
}: {
  professor: Professor;
  reviewCount: number;
}) {
  const { rmpData } = useRMP(professor.id);
  return (
    <ProfessorCard
      professor={professor}
      rmpData={rmpData}
      reviewCount={reviewCount}
    />
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p
        style={{
          fontSize: "var(--font-size-xs)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--color-text-primary)",
          letterSpacing: "0.06em",
          margin: "0 0 12px 0",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-primary)",
      }}
    >
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
    <div
      style={{
        background: "var(--color-white)",
        border: "var(--border-width) solid var(--color-border-tan)",
        borderRadius: "var(--border-radius-md)",
        padding: "24px 28px",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-surface-light-cream)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 20, width: "40%", background: "var(--color-surface-light-cream)", borderRadius: 4, marginBottom: 12 }} />
          <div style={{ height: 14, width: "20%", background: "var(--color-surface-light-cream)", borderRadius: 4, marginBottom: 16 }} />
          <div style={{ height: 1, background: "var(--color-border-tan)", marginBottom: 14 }} />
          <div style={{ height: 14, width: "60%", background: "var(--color-surface-light-cream)", borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}