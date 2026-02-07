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
);

CREATE TABLE major (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE concentration (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE minor (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE student_major (
    student_id UUID NOT NULL REFERENCES student (id) ON DELETE CASCADE,
    major_id   INT  NOT NULL REFERENCES major (id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, major_id)
);

-- Student can have multiple concentrations
CREATE TABLE student_concentration (
    student_id       UUID NOT NULL REFERENCES student (id) ON DELETE CASCADE,
    concentration_id INT  NOT NULL REFERENCES concentration (id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, concentration_id)
);

-- Student can have multiple minors
CREATE TABLE student_minor (
    student_id UUID NOT NULL REFERENCES student (id) ON DELETE CASCADE,
    minor_id   INT  NOT NULL REFERENCES minor (id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, minor_id)
);

-- Student
CREATE TABLE student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    graduation_year INT CHECK ( graduation_year >= 2025 ),
    major VARCHAR(100) NOT NULL,
    concentration VARCHAR(100),
    minor VARCHAR(100),
    preferences pref_enum[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE,
);

-- Course
CREATE TABLE course (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    course_code INT NOT NULL CHECK ( course_code BETWEEN 1000 AND 10000),
    description VARCHAR(1000) NOT NULL,
    num_credits INT NOT NULL CHECK ( num_credits BETWEEN 1 AND 6),
    lecture_type lecture_type_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE CASCADE
);

-- Professor
CREATE TABLE professor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    tags location_tag_enum[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review Parent Table
CREATE TABLE review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
);

-- TODO: So, there exist tags that are not course_tags and prof_tags that go on a review?
-- TODO: IF NOT, delete review_tag and tag tables.
-- Tag
CREATE TABLE tag (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
);

-- Review_Tag
CREATE TABLE review_tag (
    review_id UUID NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (review_id, tag_id),
    FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
);

-- Course_Review Child Table
CREATE TABLE course_review (
    review_id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    rating INT NOT NULL CHECK ( rating BETWEEN 1 AND 5 ),
    review_text VARCHAR(2000) NOT NULL,
    tags course_tag_enum[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);

-- Professor_Review Child Table
CREATE TABLE professor_review (
    review_id UUID PRIMARY KEY,
    professor_id UUID NOT NULL,
    rating INT NOT NULL CHECK ( rating BETWEEN 1 AND 5 ),
    review_text VARCHAR(2000) NOT NULL,
    tags professor_tag_enum[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

CREATE TABLE course_thread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    course_review_id UUID NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_review_id) REFERENCES course_review(id) ON DELETE CASCADE
);

CREATE TABLE professor_thread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    professor_review_id UUID NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_review_id) REFERENCES professor_review(id) ON DELETE CASCADE
);

CREATE TABLE favorite (
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_student_updated_at BEFORE UPDATE ON student
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_course_updated_at BEFORE UPDATE ON course
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_professor_updated_at BEFORE UPDATE ON professor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_review_updated_at BEFORE UPDATE ON review
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_tag_updated_at BEFORE UPDATE ON tag
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_review_tag_updated_at BEFORE UPDATE ON review_tag
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_course_review_updated_at BEFORE UPDATE ON course_review
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_professor_review_updated_at BEFORE UPDATE ON professor_review
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_course_thread_updated_at BEFORE UPDATE ON course_thread
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_professor_thread_updated_at BEFORE UPDATE ON professor_thread
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_favorite_updated_at BEFORE UPDATE ON favorite
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();