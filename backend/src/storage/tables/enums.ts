import { pgEnum } from "drizzle-orm/pg-core";

export const lectureTypeEnum = pgEnum("lecture_type_enum", [
  "lecture",
  "lab",
  "online",
]);

export const requirementTypeEnum = pgEnum("requirement_type_enum", [
  "prereq",
  "coreq",
]);

export const locationTagEnum = pgEnum("location_tag_enum", [
  "boston",
  "oakland",
  "london",
]);

export const professorTagEnum = pgEnum("professor_tag_enum", [
  "clear_lectures",
  "confusing_lectures",
  "organized",
  "disorganized",
  "engaging",
  "boring",
  "reads_slides",
  "fair_grading",
  "tough_grader",
  "lenient_grader",
  "unclear_rubrics",
  "curve_based",
  "no_curve",
  "tricky_exams",
  "straightforward_exams",
  "heavy_workload",
  "manageable_workload",
  "busywork",
  "high_expectations",
  "low_expectations",
  "approachable",
  "unapproachable",
  "responsive",
  "slow_responder",
  "caring",
  "intimidating",
  "passionate",
  "monotone",
  "attendance_required",
  "attendance_optional",
  "strict_deadlines",
  "flexible_deadlines",
  "extra_credit",
  "no_extra_credit",
  "little_to_no_test",
]);

export const courseTagEnum = pgEnum("course_tag_enum", [
  "easy_a",
  "challenging",
  "fast_paced",
  "slow_paced",
  "time_consuming",
  "exam_heavy",
  "project_heavy",
  "quiz_heavy",
  "participation_based",
  "presentation_heavy",
  "coding_heavy",
  "math_heavy",
  "reading_heavy",
  "writing_heavy",
  "group_projects",
  "solo_projects",
  "well_structured",
  "poorly_structured",
  "lecture_based",
  "discussion_based",
  "lab_required",
  "mandatory_attendance",
  "optional_attendance",
  "mandatory_textbook",
  "no_textbook",
]);

export const prefEnum = pgEnum("pref_enum", [
  "exam-heavy",
  "project-heavy",
  "group-work",
  "attendance-required",
  "strict_deadlines",
  "flexible_deadlines",
  "extra_credit",
  "little_to_no_test",
  "fast_paced",
  "slow_paced",
]);

export const semesterEnum = pgEnum("semester_enum", [
  "fall",
  "spring",
  "summer_1",
  "summer_2",
]);
