import { z } from "zod";
import {LectureType} from "./course";

export type Semester = "fall" | "spring" | "summer_1" | "summer_2";

export interface Trace {
    id: number;
    courseId: string;
    professorId: string;
    courseName: string;
    departmentId: number;
    courseCode: number;
    semester: Semester;
    lectureYear: number;
    lectureType: LectureType | null;
    howOftenPercentage: number;
    hoursDevoted: number;
    professorEfficiency: string;
    eval: string | null;
    createdAt: Date;
    updatedAt: Date;
}