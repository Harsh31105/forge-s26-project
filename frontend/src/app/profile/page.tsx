"use client";

import { useFavourites } from "@/src/hooks/useFavourites";
import { useStudent } from "@/src/hooks/useStudents";
import { FavoritesCourseRow } from "@/src/components/profilePage";
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

    const { favourites } = useFavourites();

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

    const majorLine = student.graduationYear ? `Class of ${student.graduationYear}` : "";
    const concentrationLine = "Concentration not available";

    const initial =
    student.firstName?.[0]?.toUpperCase() ||
    student.lastName?.[0]?.toUpperCase() ||
    "H";


    return (
    <div className="w-full">
        <div className="space-y-8 px-12 py-10 mt-16">
            <section className="flex items-start justify-between gap-8">
            <div className="flex items-start gap-6">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border border-border bg-surface">
                <div className="flex h-20 w-20 items-center justify-center rounded-[10px] bg-primary font-heading text-[28px] font-bold text-white shadow-md">
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

            <section className="border border-border bg-surface p-8 shadow-sm">
                <h3 className="mb-5 mt-2 font-heading text-[32px] font-semibold text-foreground">
                Favorite Courses
                </h3>
                <div className="space-y-4">
                    {favourites?.length > 0 ? (
                    favourites.map((favourite) => (
                        <FavoritesCourseRow key={favourite.courseId} courseId={favourite.courseId} />
                    ))
                    ) : (
                        <div className="bg-surface-light px-5 py-4 font-body text-[16px] text-text-secondary rounded-[10px]">
                        No favourite courses added yet.
                        </div>
                    )}
                </div>
            </section>
        </div>
    </div>
    );
}