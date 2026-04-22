import { getProfessorRatingAtSchoolId, searchSchool } from "ratemyprofessor-api";

const NORTHEASTERN_SCHOOL_NAME = "Northeastern University";

export type RMPApiData = {
    firstName: string;
    lastName: string;
    ratingAvg: string | null;
    ratingWta: number | null;
    avgDifficulty: string | null;
};

function cleanNumber(val: unknown): number | null {
    if (typeof val !== "number") return null;
    if (!Number.isFinite(val) || Number.isNaN(val)) return null;
    if (val <= 0) return null;
    return val;
}

export async function fetchRMPDataForProfessor(
    firstName: string,
    lastName: string,
    schoolId: string
): Promise<RMPApiData | null> {
    const result = await getProfessorRatingAtSchoolId(
        `${firstName} ${lastName}`,
        schoolId
    );

    if (!result) return null;

    const rawDifficulty = typeof result.avgDifficulty === "string"
        ? parseFloat(result.avgDifficulty)
        : result.avgDifficulty;

    return {
        firstName,
        lastName,
        ratingAvg: cleanNumber(result.avgRating)?.toString() ?? null,
        ratingWta: result.wouldTakeAgainPercent === -1
            ? null
            : cleanNumber(result.wouldTakeAgainPercent),
        avgDifficulty: cleanNumber(rawDifficulty)?.toString() ?? null,
    };
}

export async function getNortheasternSchoolId(): Promise<string> {
    const schools = await searchSchool(NORTHEASTERN_SCHOOL_NAME);
    if (!schools || schools.length === 0 || !schools[0]) {
        throw new Error("Could not find Northeastern University on RMP");
    }
    return schools[0].node.id;
}
