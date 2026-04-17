import { Request, Response } from "express";
import { z } from "zod";
import { Repository } from "../../../storage/storage";
import { CourseReview } from "../../../models/review";
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

        // NOTE: getCourses and getReviews require pagination params, but the ML service needs all records
        // to compute recommendations. We use a large limit to fetch everything in one shot since no
        // getAllCourses/getAllCourseReviews repo methods exist yet.
        const [courses, allReviews, traceRows, favouriteRows] = await Promise.all([
            this.repo.courses.getCourses({ limit: 10000, page: 1 }, { sortOrder: "asc" }),
            this.repo.reviews.getReviews({ limit: 10000, page: 1 }),
            this.repo.traces.getAllTraces(),
            this.repo.favourites.getFavourites(studentId),
        ]);

        const courseReviews = allReviews.filter((r): r is CourseReview => "courseId" in r);

        const deptMap = new Map<number, string>();
        courses.forEach(c => deptMap.set(c.department.id, c.department.name));

        const mlCourses = courses.map(c => ({
            id: c.id,
            name: c.name,
            department_id: c.department.id,
            course_code: c.course_code,
            description: c.description ?? "",
            num_credits: c.num_credits,
            lecture_type: c.lecture_type ?? "lecture",
            created_at: c.created_at.toISOString(),
            updated_at: c.updated_at.toISOString(),
        }));

        const mlDepartments = Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));

        const mlReviews = courseReviews.map(r => ({
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
