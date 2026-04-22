"use client";

import { useRef } from "react";
import { useUploadProfilePicture } from "@/src/hooks/useStudents";

interface ProfilePictureProps {
    studentID?: string | null;
    profilePictureUrl?: string | null;
    size?: number;
}

function PencilIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

export default function ProfilePicture({ studentID, profilePictureUrl: rawUrl, size = 96 }: ProfilePictureProps) {
    const profilePictureUrl = rawUrl || null;
    const inputRef = useRef<HTMLInputElement>(null);
    const { uploadProfilePicture, isUploading, uploadError } = useUploadProfilePicture(studentID ?? "");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!studentID) return;
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadProfilePicture(file);
        e.target.value = "";
    };

    const canUpload = !!studentID;

    return (
        <div className="flex flex-col items-center gap-2">
            <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
                <div
                    style={{
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid var(--color-border-tan)",
                    }}
                >
                    {profilePictureUrl ? (
                        <img
                            src={profilePictureUrl}
                            alt="Profile picture"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <div style={{
                            width: "100%",
                            height: "100%",
                            background: "var(--color-surface-light-cream)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Pencil edit badge */}
                <button
                    type="button"
                    onClick={() => canUpload && inputRef.current?.click()}
                    title={canUpload ? "Change profile picture" : "Sign in to upload a photo"}
                    style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: Math.max(24, size * 0.3),
                        height: Math.max(24, size * 0.3),
                        borderRadius: "50%",
                        background: "var(--color-primary-navy)",
                        color: "white",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: canUpload ? "pointer" : "default",
                        padding: 0,
                        opacity: canUpload ? 1 : 0.5,
                    }}
                    aria-label={canUpload ? "Change profile picture" : "Sign in to upload a photo"}
                >
                    <PencilIcon />
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFileChange}
                disabled={!canUpload}
            />

            {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        </div>
    );
}