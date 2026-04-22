import type { Course } from "@/src/lib/api/northStarAPI.schemas";

export type CourseMetrics = {
  difficulty: number;
  overallRating: number;
  relevanceToDegree: number;
};

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function seededScore(seed: string, min: number, max: number) {
  const x = Math.sin(hashSeed(seed)) * 10000;
  const normalized = x - Math.floor(x);
  return Number((min + normalized * (max - min)).toFixed(1));
}

export function getMockCourseMetrics(course: Pick<Course, "id" | "course_code">): CourseMetrics {
  const seed = course.id || String(course.course_code);

  return {
    difficulty: seededScore(`${seed}:difficulty`, 2.0, 5.0),
    overallRating: seededScore(`${seed}:overall`, 1.0, 5.0),
    relevanceToDegree: seededScore(`${seed}:relevance`, 1.0, 5.0),
  };
}
