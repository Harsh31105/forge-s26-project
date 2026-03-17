import { pgEnum} from "drizzle-orm/pg-core";
import { professor } from "./professor";

export const courseTagEnum = pgEnum("course_tag_enum", [
  'easy_a',
  'challenging',
  'fast_paced',
  'slow_paced',
  'time_consuming',
  'exam_heavy',
  'project_heavy',
  'quiz_heavy',
  'participation_based',
  'presentation_heavy',
  'coding_heavy',
  'math_heavy',
  'reading_heavy',
  'writing_heavy',
  'group_projects',
  'solo_projects',
  'well_structured',
  'poorly_structured',
  'lecture_based',
  'discussion_based',
  'lab_required',
  'mandatory_attendance',
  'optional_attendance',
  'mandatory_textbook',
  'no_textbook'
]);