"use client";

import { useFavourites } from "@/src/hooks/useFavourites";
import { useStudent } from "@/src/hooks/useStudents";
import { FavoritesCourseRow } from "@/src/components/profile/profilePage";
import { useCurrentUser } from "@/src/hooks/useAuth";
import { EditProfileModal } from "@/src/components/profile/EditProfileModal";
import { useStudentMutations } from "@/src/hooks/useStudents";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, isLoading: meLoading, error: meError } = useCurrentUser();
    const studentId = user?.id as string;
    const [isEditing, setIsEditing] = useState(false);
    const { updateStudent, isUpdating} = useStudentMutations();
    const router = useRouter();

    const {
    student,
    isLoading: studentLoading,
    error: studentError,
    refetch: refetchStudent,
    } = useStudent(studentId);

    const { favourites } = useFavourites();

    if (meLoading || !user) {
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
            <div className="flex items-center gap-6">
                <div className="flex h-48 w-48 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                <div className="flex h-20 w-20 items-center justify-center rounded-[10px] bg-primary font-heading text-[24px] font-bold text-white shadow-md">
                    {initial}
                </div>
                </div>

                <div>
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

            <button 
                onClick={() => setIsEditing(true)}
                className="rounded-[10px] border border-foreground bg-primary px-8 py-4 font-body text-[20px] font-semibold text-white shadow-sm">
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

        {isEditing && student && (
            <EditProfileModal
                student={student}
                onSave={async (data) => {
                    await updateStudent({ studentID: studentId, input: data });
                    await refetchStudent();
                    setIsEditing(false);
                    router.refresh();
                }}
                onClose={() => setIsEditing(false)}
                isSaving={isUpdating}
            />
        )}
    </div>
    );
}