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
    lectureType: LectureType;
    howOftenPercentage: number;
    hoursDevoted: number;
    professorEfficiency: number;
    eval: string;
    createdAt: Date;
    updatedAt: Date;
}