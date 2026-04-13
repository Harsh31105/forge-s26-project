"use client";

import { useFavourites } from "@/src/hooks/useFavourites";
import { useCourse } from "@/src/hooks/useCourses";
import { useStudent, useStudents } from "@/src/hooks/useStudents";


type FavoritesCardProps = {
    title: string;
    items: string[];
};

type FavoritesCourseRowProps = {
    courseId: string;
};

export function FavoritesCard({
    title,
    items,
}: FavoritesCardProps) {
    return (
    <section className="rounded-[16px] border border-border bg-surface p-8 shadow-sm">
        <h3 className="mb-5 font-heading text-[32px] font-semibold text-foreground mt-2">
        {title}
        </h3>

        <div className="space-y-4">
        {items.length > 0 ? (
            items.map((item) => (
            <div
                key={item}
                className="flex items-center justify-between rounded-[10px] bg-white px-5 py-4 shadow-sm"
            >
                <span className="font-body text-[18px] font-semibold text-foreground">
                    {item}
                </span>
                <span className="text-[22px] text-foreground">★</span>
            </div>
            ))
        ) : (
            <div className="rounded-[10px] bg-surface-light px-5 py-4 font-body text-[16px] text-text-secondary">
            No favourite courses added yet.
            </div>
        )}
        </div>
    </section>
    );
}

export function FavoritesCourseRow({
    courseId,
}: FavoritesCourseRowProps) {
    const { course, isLoading } = useCourse(courseId);
    if (isLoading || !course) return null;

    return (
        <div className = "flex items-center justify-between bg-white px-5 py-4 shadow-sm">
            <span className="font-body text-[18px] font-semibold text-foreground">
                {course.department.name} {course.course_code}: {course.name}
            </span>
            <span className="text-[22px] text-foreground">★</span>
        </div>
    );
}