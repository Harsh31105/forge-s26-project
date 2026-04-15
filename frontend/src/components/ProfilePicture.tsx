"use client";

import { useRef } from "react";
import { useUploadProfilePicture } from "@/src/hooks/useStudents";

interface ProfilePictureProps {
    studentID: string;
    profilePictureUrl?: string | null;
    size?: number;
}

export default function ProfilePicture({ studentID, profilePictureUrl, size = 96 }: ProfilePictureProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { uploadProfilePicture, isUploading, uploadError } = useUploadProfilePicture(studentID);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadProfilePicture(file);
        e.target.value = "";
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ width: size, height: size }}
                title="Change profile picture"
            >
                {profilePictureUrl ? (
                    <img
                        src={profilePictureUrl}
                        alt="Profile picture"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                        No photo
                    </div>
                )}
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        </div>
    );
}