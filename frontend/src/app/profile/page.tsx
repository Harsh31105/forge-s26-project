"use client";

import { useFavourites } from "@/src/hooks/useFavourites";
import { useCourses } from "@/src/hooks/useCourses";
import { useStudent } from "@/src/hooks/useStudents";
import {FavoritesCard} from "@/src/components/profilePage";
import { useQuery } from "@tanstack/react-query";
import { customAxios } from "@/src/lib/api/apiClient";



export default function ProfilePage() {
    const { data: me, isLoading: meLoading, error: meError } = useQuery({
        queryKey: ["me"],
        queryFn: () => customAxios<{ id: string; email: string; name: string }>({ url: "/auth/me", method: "GET" }),
    });

    const studentId = me?.id ?? "";

    const {
    student,
    isLoading: studentLoading,
    error: studentError,
    } = useStudent(studentId);

    const { favourites, isLoading: favouritesLoading } = useFavourites();
    const { courses, isLoading: coursesLoading } = useCourses();

    if (meLoading) {
    return (
        <div className="w-full p-8 font-body text-[16px] text-foreground">
        Loading student...
        </div>
    );
    }

    if (meError) {
    return (
        <div className="w-full p-8 font-body text-[16px] text-error">
        Failed to load students.
        </div>
    );
    }

    if (!studentId) {
    return (
        <div className="w-full p-8 font-body text-[16px] text-text-secondary">
        No student selected yet.
        </div>
    );
    }

    if (studentLoading) {
    return (
        <div className="w-full p-8 font-body text-[16px] text-foreground">
        Loading profile...
        </div>
    );
    }

    if (studentError || !student) {
    return (
        <div className="w-full p-8 font-body text-[16px] text-error">
        Failed to load profile.
        </div>
    );
    }

    const fullName =
    `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
    "Student Name";

    const majorLine = `Class of ${student.graduationYear}`;
    const concentrationLine = "Concentration not available";

    const initial =
    student.firstName?.[0]?.toUpperCase() ||
    student.lastName?.[0]?.toUpperCase() ||
    "H";

    const favoriteCourses: string[] =
    favourites
        ?.map(
        (favourite) =>
            courses?.find((course) => course.id === favourite.courseId)?.name ??
            favourite.courseId
        )
        .filter(Boolean) ?? [];

    return (
    <div className="w-full">
        <h1 className="mb-4 font-heading text-[42px] font-semibold text-text-secondary">
        Profile
        </h1>

        // Nav Bar :: leave it for now as ref, but delete it later when we actually have a nav bar
        <div className="overflow-hidden border border-border bg-background">
        <nav className="flex items-center justify-between border-b border-border bg-surface px-10 py-6">
            <div className="font-heading text-[32px] font-semibold tracking-wide text-foreground">
            NorthStar
            </div>

            <div className="flex gap-12 font-body text-[20px] font-semibold text-foreground">
            <span>Home</span>
            <span>Courses</span>
            <span>Professors</span>
            <span>Profile</span>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-[22px] text-foreground">
            👤
            </div>
        </nav>

        <div className="space-y-8 px-12 py-10">
            <section className="flex items-start justify-between gap-8">
            <div className="flex items-start gap-6">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-border bg-surface">
                <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-primary font-heading text-[28px] font-bold text-white shadow-md">
                    {initial}
                </div>
                </div>

                <div className="pt-1">
                <h2 className="font-heading text-[40px] font-semibold text-foreground">
                    {fullName}
                </h2>
                <p className="mt-4 font-body text-[20px] text-foreground">
                    {majorLine}
                </p>
                <p className="mt-2 font-body text-[20px] text-foreground">
                    {concentrationLine}
                </p>
                </div>
            </div>

            <button className="rounded-[10px] border border-foreground bg-primary px-8 py-4 font-body text-[20px] font-semibold text-white shadow-sm">
                Edit Profile
            </button>
            </section>

            {favouritesLoading || coursesLoading ? (
            <div className="font-body text-[16px] text-foreground">
                Loading favourites...
            </div>
            ) : (
            <FavoritesCard title="Favourite Courses" items={favoriteCourses} />
            )}
        </div>
        </div>
    </div>
    );
}