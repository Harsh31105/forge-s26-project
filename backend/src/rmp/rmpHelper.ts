import type { Professor } from "../models/professor";
import type { RMPPostInputType } from "../models/rmp";
import { fetchRMPDataForProfessor } from "./rmpClient";

export async function fetchAndMatchRMPData(
    professors: Professor[],
    schoolId: string
): Promise<RMPPostInputType[]> {
    const results: RMPPostInputType[] = [];

    for (const prof of professors) {
        const data = await fetchRMPDataForProfessor(prof.firstName, prof.lastName, schoolId);
        if (!data) continue;

        results.push({
            professorId: prof.id,
            ratingAvg: data.ratingAvg ? parseFloat(data.ratingAvg) : null,
            ratingWta: data.ratingWta,
            avgDifficulty: parseFloat(data.avgDifficulty),
        });
    }

    return results;
}