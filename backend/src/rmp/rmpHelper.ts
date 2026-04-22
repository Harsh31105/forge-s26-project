import type { Professor } from "../models/professor";
import type { RMPPostInputType } from "../models/rmp";
import { fetchRMPDataForProfessor } from "./rmpClient";

export async function fetchAndMatchRMPData(
    professors: Professor[],
    schoolId: string
): Promise<RMPPostInputType[]> {
    const results: RMPPostInputType[] = [];

    const safeDecimal = (val: string | null): number | null => {
        if (val === null) return null;
        const n = parseFloat(val);
        return Number.isNaN(n) ? null : n;
    };

    for (const prof of professors) {
        const data = await fetchRMPDataForProfessor(prof.firstName, prof.lastName, schoolId);
        if (!data) continue;

        results.push({
            professorId: prof.id,
            ratingAvg: safeDecimal(data.ratingAvg),
            ratingWta: data.ratingWta,
            avgDifficulty: safeDecimal(data.avgDifficulty),
        });
    }

    return results;
}