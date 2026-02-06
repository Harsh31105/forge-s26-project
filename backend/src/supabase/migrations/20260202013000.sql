CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE lecture_type_enum AS ENUM (
  'lecture',
  'lab',
  'online'
);

CREATE TYPE requirement_type_enum AS ENUM (
  'prereq',
  'coreq'
);

CREATE TYPE location_tag_enum AS ENUM (
  'boston',
  'oakland',
  'london'
);

CREATE TYPE professor_tag_enum AS ENUM (
  'clear_lectures',
  'confusing_lectures',
  'organized',
  'disorganized',
  'engaging',
  'boring',
  'reads_slides',
  'fair_grading',
  'tough_grader',
  'lenient_grader',
  'unclear_rubrics',
  'curve_based',
  'no_curve',
  'tricky_exams',
  'straightforward_exams',
  'heavy_workload',
  'manageable_workload',
  'busywork',
  'high_expectations',
  'low_expectations',
  'approachable',
  'unapproachable',
  'responsive',
  'slow_responder',
  'caring',
  'intimidating',
  'passionate',
  'monotone',
  'attendance_required',
  'attendance_optional',
  'strict_deadlines',
  'flexible_deadlines',
  'extra_credit',
  'no_extra_credit',
  'little_to_no_test'
);

CREATE TYPE course_tag_enum AS ENUM (
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
);

CREATE TYPE pref_enum AS ENUM (
  'exam-heavy',
  'project-heavy',
  'group-work',
  'attendance-required',
  'morning-classes',
  'afternoon-classes',
  'evening-classes',
  'strict_deadlines',
  'flexible_deadlines',
  'extra_credit',
  'little_to_no_test'
  'fast_paced',
  'slow_paced',
)

-- Student
CREATE TABLE student (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  graduation_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student_Major
CREATE TABLE major (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Student_Concentration
CREATE TABLE concentration (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Student_Minor
CREATE TABLE minor (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Join Tables for Student_Major/Concentration/Minor
CREATE TABLE student_major (
  id UUID REFERENCES student(id) ON DELETE CASCADE,
  major_id INT REFERENCES major(id),
  PRIMARY KEY (id, major_id)
);

CREATE TABLE student_concentration (
  id UUID REFERENCES student(id) ON DELETE CASCADE,
  concentration_id INT REFERENCES concentration(id),
  PRIMARY KEY (id, concentration_id)
);

CREATE TABLE student_minor (
  id UUID REFERENCES student(id) ON DELETE CASCADE,
  minor_id INT REFERENCES minor(id),
  PRIMARY KEY (id, minor_id)
);

-- Course
CREATE TABLE course (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  number VARCHAR(50) NOT NULL,
  description VARCHAR(1000),
  credits INT,
  usual_semester VARCHAR(100),
  lecture_type lecture_type_enum,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course_Offering??
-- CREATE TABLE course_offering (
-- id SERIAL PRIMARY KEY,
-- course_id INT REFERENCES course(id) ON DELETE CASCADE,
-- term VARCHAR(20) NOT NULL,
-- year INT NOT NULL,
-- instructor VARCHAR(255),
-- lecture_type lecture_type_enum,
-- ...
-- );

-- Professor-Course Bridge Table
CREATE TABLE professor (
  professor_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  tags location_tag_enum[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

—- Professor
CREATE TABLE professor_course (
  professor_id INT REFERENCES professor(professor_id) ON DELETE CASCADE,
  course_id INT REFERENCES course(course_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (professor_id, course_id)
);

—- RMP
CREATE TABLE rmp (
  rmp_id INT PRIMARY KEY,
  professor_id INT REFERENCES professor(professor_id) ON DELETE CASCADE,
  rating_avg INT,
  rating_wta INT,
  rating_difficulty INT,
  prof_department VARCHAR(100),
  prof_top_tags TEXT[],
  attendance_req BOOLEAN
  textbook_req BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
—- TRACE
CREATE TABLE trace (
  trace_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id INT REFERENCES course(course_id) ON DELETE CASCADE,
  professor_id INT REFERENCES professor(professor_id) ON DELETE CASCADE,
  course_name VARCHAR(255),
  course_num INT,
  course_hist TEXT,
  prof_course_hist VARCHAR(255),
  lecture_type lecture_type_enum,
  how_often_percentage INT CHECK (how_often_percentage BETWEEN 0 AND 100),
  hours_devoted INT CHECK (hours_devoted >= 0),
  professor_efficiency INT CHECK (professor_efficiency BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Requirements
CREATE TABLE course_requirements (
  parent_course_id INT REFERENCES course(course_id) ON DELETE CASCADE,
  req_course_id INT REFERENCES course(course_id) ON DELETE CASCADE,
  req_type requirement_type_enum,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parent_course_id, req_course_id, req_type)
);

—- Tag
CREATE TABLE tag (
  tag_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Parent Table
CREATE TABLE review (
  review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id INT REFERENCES student(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_text VARCHAR(2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review_Tag
CREATE TABLE review_tag ( -- ENUM
  review_id INT REFERENCES review(review_id) ON DELETE CASCADE,
  tag_id INT REFERENCES tag(tag_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, tag_id)
);

-- Course_Review Child Table
CREATE TABLE course_review (
  review_id INT PRIMARY KEY REFERENCES review(review_id) ON DELETE CASCADE,
  course_id INT REFERENCES course(course_id) ON DELETE CASCADE,
  tags course_tag_enum[]
);

-- Professor_Review Child Table
CREATE TABLE professor_review (
  review_id INT PRIMARY KEY REFERENCES review(review_id) ON DELETE CASCADE,
  professor_id INT REFERENCES professor(professor_id) ON DELETE CASCADE,
  tags professor_tag_enum[]
);

-- Thread
CREATE TABLE thread (
  thread_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id INT REFERENCES review(review_id) ON DELETE CASCADE,
  thread_desc VARCHAR(2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorite (Course)
CREATE TABLE favorite (
  id INT REFERENCES student(id) ON DELETE CASCADE,
  course_id INT REFERENCES course(course_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, course_id)
);
