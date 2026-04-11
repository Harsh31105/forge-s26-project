import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { validate as isUUID } from "uuid";
import { Repository } from "../../../storage/storage";
import { course } from "../../../storage/tables/course";
import { department } from "../../../storage/tables/department";
import { courseReview } from "../../../storage/tables/courseReview";
import { trace } from "../../../storage/tables/trace";
import { favorite } from "../../../storage/tables/favourite";
import { BadRequest } from "../../../errs/httpError";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

export class RecommendationHandler {
    constructor(private readonly repo: Repository) {}

    async handleGetRecommendations(req: Request, res: Response): Promise<void> {
        const studentId = req.params.studentId as string;
        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");

        const semester = req.query.semester as string | undefined;
        if (!semester || typeof semester !== "string") throw BadRequest("semester query param is required (fall | spring | summer_1 | summer_2)");

        const db = await this.repo.getDB();

        const [courseRows, reviewRows, traceRows, favouriteRows] = await Promise.all([
            db.select().from(course).innerJoin(department, eq(course.departmentId, department.id)),
            db.select().from(courseReview),
            db.select().from(trace),
            db.select().from(favorite).where(eq(favorite.studentId, studentId)),
        ]);

        const deptMap = new Map<number, string>();
        for (const row of courseRows) {
            deptMap.set(row.department.id, row.department.name);
        }

        const mlCourses = courseRows.map(r => ({
            id: r.course.id,
            name: r.course.name,
            department_id: r.course.departmentId,
            course_code: r.course.courseCode,
            description: r.course.description ?? "",
            num_credits: r.course.numCredits,
            lecture_type: r.course.lectureType ?? "lecture",
            created_at: r.course.createdAt.toISOString(),
            updated_at: r.course.updatedAt.toISOString(),
        }));

        const mlDepartments = Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));

        const mlReviews = reviewRows.map(r => ({
            review_id: r.reviewId,
            course_id: r.courseId,
            rating: r.rating,
            review_text: r.reviewText,
            tags: r.tags ?? [],
            created_at: r.createdAt.toISOString(),
            updated_at: r.updatedAt.toISOString(),
        }));

        const mlTraceRows = traceRows.map(r => ({
            id: r.id,
            course_id: r.courseId,
            professor_id: r.professorId,
            course_name: r.courseName,
            department_id: r.departmentId,
            course_code: r.courseCode,
            semester: r.semester,
            lecture_year: r.lectureYear,
            lecture_type: r.lectureType ?? "",
            how_often_percentage: r.howOftenPercentage,
            hours_devoted: r.hoursDevoted,
            professor_efficiency: parseFloat(r.professorEfficiency),
            created_at: r.createdAt.toISOString(),
            updated_at: r.updatedAt.toISOString(),
        }));

        const mlFavorites = favouriteRows.map(r => ({
            student_id: r.studentId,
            course_id: r.courseId,
            created_at: r.createdAt.toISOString(),
            updated_at: r.updatedAt.toISOString(),
        }));

        const payload = {
            student_id: studentId,
            preferred_semester: semester,
            courses: mlCourses,
            departments: mlDepartments,
            reviews: mlReviews,
            trace_rows: mlTraceRows,
            favorites: mlFavorites,
            top_k: 5,
        };

        let mlRes: Response;
        try {
            mlRes = await fetch(`${ML_SERVICE_URL}/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }) as unknown as Response;
        } catch (err) {
            console.error("Failed to reach ML service:", err);
            res.status(502).json({ error: "Could not reach recommendation service" });
            return;
        }

        if (!(mlRes as any).ok) {
            const errText = await (mlRes as any).text();
            console.error("ML service returned error:", errText);
            res.status(502).json({ error: "Recommendation service failed" });
            return;
        }

        const recommendations = await (mlRes as any).json();
        res.status(200).json(recommendations);
    }
}
