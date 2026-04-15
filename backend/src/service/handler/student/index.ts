import type { AcademicRepository, ProfilePictureRepository, StudentRepository } from "../../../storage/storage";
import {
    StudentPostInputSchema,
    StudentPatchInputSchema,
    StudentMajorPostInputSchema,
    StudentConcentrationPostInputSchema,
    StudentMinorPostInputSchema,
    StudentPatchInputType,
    StudentPostInputType,
    Student
} from "../../../models/student";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { PaginationSchema } from "../../../utils/pagination";
import {isEmail} from "../../../utils/email";

export class StudentHandler {
    constructor(
        private readonly repo: StudentRepository,
        private readonly academicRepo: AcademicRepository,
        private readonly profilePictureRepo: ProfilePictureRepository,
    ) {}

    // GET /students
    async handleGet(req: Request, res: Response): Promise<void> {
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) {
            throw BadRequest("Invalid pagination parameters");
        }

        const pagination = result.data;

        let students: Student[];
        try {
            students = await this.repo.getStudents(pagination);
        } catch (err) {
            console.error("Failed to get students: ", err);
            throw mapDBError(err, "Failed to retrieve students");
        }

        if (students.length === 0) {
            res.status(200).json(students);
            return;
        }

        const studentIds = students.map((s) => s.id);
        const [majorsMap, concentrationsMap, minorsMap] = await Promise.all([
            this.academicRepo.getMajorsForStudents(studentIds),
            this.academicRepo.getConcentrationsForStudents(studentIds),
            this.academicRepo.getMinorsForStudents(studentIds),
        ]);

        const enriched = await Promise.all(students.map(async (s) => ({
            ...s,
            majors: majorsMap[s.id] ?? [],
            concentrations: concentrationsMap[s.id] ?? [],
            minors: minorsMap[s.id] ?? [],
            profilePictureUrl: s.profilePictureKey
                ? await this.profilePictureRepo.getPresignedUrl(s.profilePictureKey)
                : null,
        })));

        res.status(200).json(enriched);
    }

    // GET /students/email/:email
    async handleGetByEmail(req: Request, res: Response): Promise<void> {
        const email = req.params.email as string;
        if (!isEmail(email)) throw BadRequest("failed to parse email properly");

        let student: Student;
        try {
            student = await this.repo.getStudentByEmail(email);
        } catch (err) {
            console.error(err);
            if (err instanceof NotFoundError) throw NotFound("Student not found");
            throw mapDBError(err, "Failed to retrieve student");
        }

        const [majors, concentrations, minors] = await Promise.all([
            this.academicRepo.getStudentMajors(student.id),
            this.academicRepo.getStudentConcentrations(student.id),
            this.academicRepo.getStudentMinors(student.id),
        ]);

        let profilePictureUrl: string | null = null;
        if (student.profilePictureKey) {
            try {
                profilePictureUrl = await this.profilePictureRepo.getPresignedUrl(student.profilePictureKey);
            } catch (err) {
                console.error("Failed to generate presigned URL:", err);
            }
        }

        res.status(200).json({ ...student, majors, concentrations, minors, profilePictureUrl });
    }

    // GET /students/:id
    async handleGetByID(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid student ID");

        let student: Student;
        try {
            student = await this.repo.getStudentByID(id);
        } catch (err) {
            console.error(err);
            if (err instanceof NotFoundError) throw NotFound("Student not found");
            throw mapDBError(err, "Failed to retrieve student");
        }

        const [majors, concentrations, minors] = await Promise.all([
            this.academicRepo.getStudentMajors(id),
            this.academicRepo.getStudentConcentrations(id),
            this.academicRepo.getStudentMinors(id),
        ]);

        let profilePictureUrl: string | null = null;
        if (student.profilePictureKey) {
            try {
                profilePictureUrl = await this.profilePictureRepo.getPresignedUrl(student.profilePictureKey);
            } catch (err) {
                console.error("Failed to generate presigned URL:", err);
            }
        }

        res.status(200).json({ ...student, majors, concentrations, minors, profilePictureUrl });
    }

    // POST /students
    async handlePost(req: Request, res: Response): Promise<void> {
        const result = StudentPostInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("Unable to parse input for student POST");

        const postStudent: StudentPostInputType = result.data;

        let newStudent: Student;
        try {
            newStudent = await this.repo.createStudent(postStudent);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to create student");
        }
        res.status(201).json(newStudent);
    }

    // PATCH /students/:id
    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid student ID was given");

        const rawBody = { ...req.body };
        if (typeof rawBody.graduationYear === "string") {
            if (rawBody.graduationYear === "" || rawBody.graduationYear === "0") {
                delete rawBody.graduationYear;
            } else {
                rawBody.graduationYear = Number(rawBody.graduationYear);
            }
        }
        if (typeof rawBody.preferences === "string") {
            rawBody.preferences = rawBody.preferences === "" ? undefined : [rawBody.preferences];
        }
        for (const key of ["firstName", "lastName", "email"] as const) {
            if (rawBody[key] === "") delete rawBody[key];
        }

        const result = StudentPatchInputSchema.safeParse(rawBody);
        if (!result.success) throw BadRequest("Unable to parse input for student PATCH");

        let profilePictureKey: string | undefined;
        if (req.file) {
            const { mimetype, buffer } = req.file;
            if (!["image/jpeg", "image/png", "image/webp"].includes(mimetype)) {
                throw BadRequest("Profile picture must be a JPEG, PNG, or WebP image");
            }
            try {
                // Upload to S3 and capture the key so it can be stored in the DB below
                profilePictureKey = await this.profilePictureRepo.upload(id, buffer, mimetype);
            } catch (err) {
                console.error(err);
                throw BadRequest("Failed to upload profile picture");
            }
        }

        const patchInput: StudentPatchInputType = {
            ...result.data,
            ...(profilePictureKey !== undefined ? { profilePictureKey } : {}),
        };

        let updatedStudent: Student;
        try {
            updatedStudent = await this.repo.patchStudent(id, patchInput);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to patch student");
        }

        const profilePictureUrl = updatedStudent.profilePictureKey
            ? await this.profilePictureRepo.getPresignedUrl(updatedStudent.profilePictureKey)
            : null;

        res.status(200).json({ ...updatedStudent, profilePictureUrl });
    }

    // DELETE /students/:id
    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid student ID was given");

        try {
            await this.repo.deleteStudent(id);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to delete student");
        }
        res.sendStatus(204);
    }

    // POST /students/:id/majors
    async handlePostMajor(req: Request, res: Response): Promise<void> {
        const studentId = req.params.id as string;
        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");

        const result = StudentMajorPostInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("Unable to parse input: expected { majorId: number }");

        try {
            await this.academicRepo.addStudentMajor(studentId, result.data.majorId);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to add major to student");
        }
        res.sendStatus(204);
    }

    // DELETE /students/:id/majors/:majorId
    async handleDeleteMajor(req: Request, res: Response): Promise<void> {
        const studentId = req.params.id as string;
        const majorId = parseInt(req.params.majorId as string, 10);

        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");
        if (isNaN(majorId)) throw BadRequest("Invalid major ID");

        try {
            await this.academicRepo.deleteStudentMajor(studentId, majorId);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to remove major from student");
        }
        res.sendStatus(204);
    }

    // POST /students/:id/concentrations
    async handlePostConcentration(req: Request, res: Response): Promise<void> {
        const studentId = req.params.id as string;
        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");

        const result = StudentConcentrationPostInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("Unable to parse input: expected { concentrationId: number }");

        try {
            await this.academicRepo.addStudentConcentration(studentId, result.data.concentrationId);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to add concentration to student");
        }
        res.sendStatus(204);
    }

    // DELETE /students/:id/concentrations/:concentrationId
    async handleDeleteConcentration(req: Request, res: Response): Promise<void> {
        const studentId = req.params.id as string;
        const concentrationId = parseInt(req.params.concentrationId as string, 10);

        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");
        if (isNaN(concentrationId)) throw BadRequest("Invalid concentration ID");

        try {
            await this.academicRepo.deleteStudentConcentration(studentId, concentrationId);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to remove concentration from student");
        }
        res.sendStatus(204);
    }

    // POST /students/:id/minors
    async handlePostMinor(req: Request, res: Response): Promise<void> {
        const studentId = req.params.id as string;
        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");

        const result = StudentMinorPostInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("Unable to parse input: expected { minorId: number }");

        try {
            await this.academicRepo.addStudentMinor(studentId, result.data.minorId);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to add minor to student");
        }
        res.sendStatus(204);
    }

    // DELETE /students/:id/minors/:minorId
    async handleDeleteMinor(req: Request, res: Response): Promise<void> {
        const studentId = req.params.id as string;
        const minorId = parseInt(req.params.minorId as string, 10);

        if (!isUUID(studentId)) throw BadRequest("Invalid student ID");
        if (isNaN(minorId)) throw BadRequest("Invalid minor ID");

        try {
            await this.academicRepo.deleteStudentMinor(studentId, minorId);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to remove minor from student");
        }
        res.sendStatus(204);
    }
}