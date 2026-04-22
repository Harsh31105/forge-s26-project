"use client";

import { useFavourites } from "@/src/hooks/useFavourites";
import { FavoritesCourseRow } from "@/src/components/profile/profilePage";
import { EditProfileModal } from "@/src/components/profile/EditProfileModal";
import { useStudentMutations } from "@/src/hooks/useStudents";
import { useMe } from "@/src/hooks/useMe";
import ProfilePicture from "@/src/components/ProfilePicture";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStudent } from "@/src/lib/api/student";

export default function ProfilePage() {
    const { student, isLoading, error } = useMe();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { updateStudent } = useStudentMutations();
    const queryClient = useQueryClient();
    const studentAPI = getStudent();
    const { favourites } = useFavourites();

    if (isLoading || !student) {
        return (
            <div className="w-full p-8 font-body text-[16px] text-foreground">
                Loading profile...
            </div>
        );
    }

    if (error) {
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
    const majorName = student.majors?.[0]?.name ?? null;
    const concentrationName = student.concentrations?.[0]?.name ?? null;

    return (
        <div className="w-full">
            <div className="space-y-8 px-12 py-10 mt-16">
                <section className="flex items-start justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <ProfilePicture
                            studentID={student.id}
                            profilePictureUrl={student.profilePictureUrl ?? null}
                            size={192}
                        />

                        <div>
                            <h2 className="font-heading text-[40px] font-semibold text-foreground">
                                {fullName}
                            </h2>
                            <p className="mt-4 font-body text-[20px] text-foreground">
                                {majorLine}
                            </p>
                            {majorName && (
                                <p className="mt-2 font-body text-[20px] text-foreground">
                                    {majorName}
                                </p>
                            )}
                            {concentrationName && (
                                <p className="mt-2 font-body text-[20px] text-foreground">
                                    {concentrationName}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="rounded-[10px] mt-15 border border-foreground bg-primary px-8 py-4 font-body text-[20px] font-semibold text-white shadow-sm">
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
                        setIsSaving(true);
                        try {
                            await updateStudent({ studentID: student.id, input: {
                                firstName: data.firstName,
                                lastName: data.lastName,
                                graduationYear: data.graduationYear,
                            }});

                            const currentMajorId = student.majors?.[0]?.id ?? null;
                            if (data.majorId !== currentMajorId) {
                                if (currentMajorId) await studentAPI.deleteStudentsIdMajorsMajorId(student.id, currentMajorId);
                                if (data.majorId) await studentAPI.postStudentsIdMajors(student.id, { majorId: data.majorId });
                            }

                            const currentConcentrationId = student.concentrations?.[0]?.id ?? null;
                            if (data.concentrationId !== currentConcentrationId) {
                                if (currentConcentrationId) await studentAPI.deleteStudentsIdConcentrationsConcentrationId(student.id, currentConcentrationId);
                                if (data.concentrationId) await studentAPI.postStudentsIdConcentrations(student.id, { concentrationId: data.concentrationId });
                            }

                            await queryClient.invalidateQueries({ queryKey: ["students", student.id] });
                            setIsEditing(false);
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    onClose={() => setIsEditing(false)}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}