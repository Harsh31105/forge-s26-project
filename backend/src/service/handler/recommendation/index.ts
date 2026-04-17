import { Request, Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Repository } from "../../../storage/storage";
import { course } from "../../../storage/tables/course";
import { department } from "../../../storage/tables/department";
import { courseReview } from "../../../storage/tables/courseReview";
import { BadRequest } from "../../../errs/httpError";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

const RecommendationRequestSchema = z.object({
    semester: z.enum(["fall", "spring", "summer_1", "summer_2"]),
});

export class RecommendationHandler {
    constructor(private readonly repo: Repository) {}

    async handleGetRecommendations(req: Request, res: Response): Promise<void> {
        const studentId = req.user?.id;
        if (!studentId) throw BadRequest("Student Id not found");

        const result = RecommendationRequestSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("semester must be apart of fall/spring/summer_1/summer_2");
        const {semester } = result.data;

        const db = await this.repo.getDB();

        const [courseRows, reviewRows, traceRows, favouriteRows] = await Promise.all([
            db.select().from(course).innerJoin(department, eq(course.departmentId, department.id)),
            db.select().from(courseReview),
            this.repo.traces.getAllTraces(),
            this.repo.favourites.getFavourites(studentId),
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

        let fetchRes: globalThis.Response;
        try {
            fetchRes = await fetch(`${ML_SERVICE_URL}/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("Failed to reach ML service:", err);
            res.status(502).json({ error: "Could not reach recommendation service" });
            return;
        }

        if (!fetchRes.ok) {
            const errText = await fetchRes.text();
            console.error("ML service returned error:", errText);
            res.status(502).json({ error: "Recommendation service failed" });
            return;
        }

        const recommendations = await fetchRes.json();
        res.status(200).json(recommendations);
    }
}
