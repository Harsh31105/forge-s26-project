"use client";

import { useFavourites } from "@/src/hooks/useFavourites";
import { useCourses } from "@/src/hooks/useCourses";
import { useStudent, useStudents } from "@/src/hooks/useStudents";


type FavoritesCardProps = {
    title: string;
    items: string[];
    showAvatar?: boolean;
};

export function FavoritesCard({
    title,
    items,
    showAvatar = false,
}: FavoritesCardProps) {
    return (
    <section className="rounded-[16px] border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-5 font-heading text-[32px] font-semibold text-foreground">
        {title}
        </h3>

        <div className="space-y-4">
        {items.length > 0 ? (
            items.map((item) => (
            <div
                key={item}
                className="flex items-center justify-between rounded-[10px] bg-surface-light px-5 py-4"
            >
                <div className="flex items-center gap-4">
                {showAvatar && <div className="h-8 w-8 rounded-full bg-white" />}
                <span className="font-body text-[16px] text-foreground">
                    {item}
                </span>
                </div>
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