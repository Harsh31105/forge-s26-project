import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { customAxios } from "@/src/lib/api/apiClient";
import type { CourseReview, ProfessorReview } from "@/src/lib/api/northStarAPI.schemas";

export type Review = {
  courseCode:     string;
  courseName:     string;
  professorName?: string;
  text:           string;
  tags:           string[];
  stars:          number;
};

function isCourseReview(r: CourseReview | ProfessorReview): r is CourseReview {
    return "courseId" in r;
}

/**
 * Fetches reviews, courses, and professors from the API and maps them into
 * the Review shape used by the animation components (TypewriterBackground,
 * AmbientReviews, CinematicBackground). Returns [] while loading.
 */
export function useAnimationReviews(): Review[] {
    const { data: apiReviews } = useQuery({
        queryKey: ["animation-reviews"],
        queryFn:  () => customAxios<(CourseReview | ProfessorReview)[]>({ url: "/reviews", method: "GET", params: { limit: 100 } }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: courses } = useQuery({
        queryKey: ["animation-courses"],
        queryFn:  () => customAxios<{ id: string; name: string; course_code: number; department: { name: string } }[]>({ url: "/courses", method: "GET", params: { limit: 100 } }),
        staleTime: 60 * 60 * 1000,
    });

    const { data: professors } = useQuery({
        queryKey: ["animation-professors"],
        queryFn:  () => customAxios<{ id: string; firstName: string; lastName: string }[]>({ url: "/professors", method: "GET", params: { limit: 100 } }),
        staleTime: 60 * 60 * 1000,
    });

    return useMemo(() => {
        if (!apiReviews || !courses || !professors) return [];

        const courseMap = new Map(courses.map((c) => [c.id, c]));
        const profMap   = new Map(professors.map((p) => [p.id, p]));

        const mapped: Review[] = [];

        for (const r of apiReviews) {
            if (!r.reviewText || !r.rating) continue;

            if (isCourseReview(r)) {
                const course = courseMap.get(r.courseId);
                if (!course) continue;
                mapped.push({
                    courseCode: `${course.department.name} ${course.course_code}`,
                    courseName: course.name,
                    text:       r.reviewText,
                    stars:      r.rating,
                    tags:       (r.tags ?? []).map((t) => t.replace(/_/g, "-")),
                });
            } else {
                const prof = profMap.get(r.professorId);
                if (!prof) continue;
                mapped.push({
                    courseCode:    prof.lastName,
                    courseName:    `${prof.firstName} ${prof.lastName}`,
                    professorName: prof.lastName,
                    text:          r.reviewText,
                    stars:         r.rating,
                    tags:          (r.tags ?? []).map((t) => t.replace(/_/g, "-")),
                });
            }
        }

        return mapped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiReviews, courses, professors]);
}
