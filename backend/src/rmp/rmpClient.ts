import { getProfessorRatingAtSchoolId, searchSchool } from "ratemyprofessor-api";

const NORTHEASTERN_SCHOOL_NAME = "Northeastern University";

export type RMPApiData = {
    firstName: string;
    lastName: string;
    ratingAvg: string | null;
    ratingWta: number | null;
    avgDifficulty: string;
};

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

    return {
        firstName,
        lastName,
        ratingAvg: result.avgRating !== 0 ? result.avgRating.toString() : null,
        ratingWta: result.wouldTakeAgainPercent === -1 ? null : result.wouldTakeAgainPercent,
        avgDifficulty: result.avgDifficulty.toString(),
    };
}

export async function getNortheasternSchoolId(): Promise<string> {
    const schools = await searchSchool(NORTHEASTERN_SCHOOL_NAME);
    if (!schools || schools.length === 0 || !schools[0]) {
        throw new Error("Could not find Northeastern University on RMP");
    }
    return schools[0].node.id;
}