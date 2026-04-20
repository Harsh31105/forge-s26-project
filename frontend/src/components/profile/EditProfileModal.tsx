"use client";

import { useState } from "react";
import { Student } from "@/src/lib/api/northStarAPI.schemas";

const MAJORS_WITH_CONCENTRATIONS: Record<string, string[]> = {
    "Architecture": [],
    "Biology": ["Biochemistry", "Cell & Molecular Biology", "Ecology & Evolutionary Biology", "Marine Biology"],
    "Business Administration": ["Accounting", "Entrepreneurship", "Finance", "Management", "Marketing", "Supply Chain Management"],
    "Chemistry": ["Biochemistry", "Medicinal Chemistry", "Organic Chemistry"],
    "Computer Science": ["Artificial Intelligence", "Cybersecurity", "Data Science", "Game Development", "Human-Computer Interaction", "Software", "Systems"],
    "Criminal Justice": ["Corrections", "Law Enforcement", "Policy & Planning"],
    "Data Science": ["Business Analytics", "Machine Learning", "Statistics"],
    "Electrical & Computer Engineering": ["Computer Engineering", "Electrical Engineering"],
    "Environmental Science": ["Climate Science", "Ecology", "Environmental Policy"],
    "International Business": ["Finance", "Management", "Marketing"],
    "Mathematics": ["Applied Mathematics", "Pure Mathematics", "Statistics"],
    "Mechanical Engineering": ["Manufacturing & Design", "Robotics & Control"],
    "Nursing": [],
    "Physics": ["Astrophysics", "Condensed Matter"],
    "Political Science": ["American Politics", "International Relations", "Law & Politics"],
    "Psychology": ["Clinical", "Cognitive", "Experimental", "Health Psychology"],
};

const MAJORS = Object.keys(MAJORS_WITH_CONCENTRATIONS);
const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

type EditProfileModalProps = {
    student: Student;
    onSave: (data: { firstName: string; lastName: string; graduationYear: number }) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
};

export function EditProfileModal({ student, onSave, onClose, isSaving }: EditProfileModalProps) {
    const [firstName, setFirstName] = useState(student.firstName ?? "");
    const [lastName, setLastName] = useState(student.lastName ?? "");
    const [graduationYear, setGraduationYear] = useState<number | "">(student.graduationYear ?? "");
    const [major, setMajor] = useState("");
    const concentrations = major ? (MAJORS_WITH_CONCENTRATIONS[major] ?? []) : [];
    const [concentration, setConcentration] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!graduationYear) return;
        await onSave({ firstName, lastName, graduationYear: Number(graduationYear) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-[12px] bg-white p-8 shadow-xl">
                <h2 className="mb-6 font-heading text-[28px] font-semibold text-foreground">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="flex flex-1 min-w-0 flex-col gap-1">
                            <label className="font-body text-[14px] font-semibold text-foreground">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full rounded-[8px] border border-border px-3 py-2 font-body text-[16px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div className="flex flex-1 min-w-0 flex-col gap-1">
                            <label className="font-body text-[14px] font-semibold text-foreground">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full rounded-[8px] border border-border px-3 py-2 font-body text-[16px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="font-body text-[14px] font-semibold text-foreground">Graduation Year</label>
                        <select
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(Number(e.target.value))}
                            className="rounded-[8px] border border-border px-3 py-2 font-body text-[16px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        >
                            <option value="">Select a year</option>
                            {GRAD_YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="font-body text-[14px] font-semibold text-foreground">Major</label>
                        <select
                            value={major}
                            onChange={(e) => { setMajor(e.target.value); setConcentration(""); }}
                            className="rounded-[8px] border border-border px-3 py-2 font-body text-[16px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Select a major</option>
                            {MAJORS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {concentrations.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <label className="font-body text-[14px] font-semibold text-foreground">Concentration</label>
                            <select
                                value={concentration}
                                onChange={(e) => setConcentration(e.target.value)}
                                className="rounded-[8px] border border-border px-3 py-2 font-body text-[16px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select a concentration</option>
                                {concentrations.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-[8px] border border-border px-6 py-2 font-body text-[16px] text-foreground hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-[8px] bg-primary px-6 py-2 font-body text-[16px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
