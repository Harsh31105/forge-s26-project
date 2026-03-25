"use client";

import { useStudent, useStudents } from "@/src/hooks/useStudents";

type FavoritesCardProps = {
    title: string;
    items: string[];
    showAvatar?: boolean;
};

function FavoritesCard({
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
        {items.map((item) => (
            <div
            key={item}
            className="flex items-center justify-between rounded-[10px] bg-surface-light px-5 py-4"
            >
            <div className="flex items-center gap-4">
                {showAvatar && <div className="h-8 w-8 rounded-full bg-white" />}
                <span className="font-body text-[16px] text-foreground">{item}</span>
            </div>
            <span className="text-[22px] text-foreground">★</span>
            </div>
        ))}
        </div>
    </section>
    );
}

export function ProfilePage() {

    const { students, isLoading: isStudentsLoading } = useStudents({ limit: 1 });
    const studentId = students?.[0]?.id ?? "";

    const { student, isLoading, error } = useStudent(studentId);

    const favoriteCourses = [
        "CS 2500: Fundamentals of Computer Science",
        "CS 3000: Algorithms & Data Structures",
    ];

    const favoriteProfessors = ["Benjamin Shown", "John Rachelin"];

    if (!studentId) {
        return (
        <div className="w-full p-8 font-body text-[16px] text-text-secondary">
        No student selected yet.
        </div>
    );
    }

    if (isLoading) {
        return (
        <div className="w-full p-8 font-body text-[16px] text-foreground">
        Loading profile...
        </div>
    );
    }

    if (error || !student) {
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

    return (
    <div className="w-full">
        <h1 className="mb-4 font-heading text-[42px] font-semibold text-text-secondary">
        Profile
        </h1>

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

            <FavoritesCard title="Favorite Courses" items={favoriteCourses} />

            <FavoritesCard
            title="Favorite Professors"
            items={favoriteProfessors}
            showAvatar
            />
        </div>
        </div>
    </div>
    );
}