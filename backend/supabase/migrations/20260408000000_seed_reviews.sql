-- Seed reviews for animation background
-- Uses ON CONFLICT DO NOTHING throughout so re-running is safe.
-- UUID prefixes: a=courses, b=professors, c=new-courses, d=course-review-parents, e=prof-review-parents, f=seed-student

-- ── Seed departments ───────────────────────────────────────────────────────
INSERT INTO department (name) VALUES
  ('CS'), ('MATH'), ('CY'), ('THTR'), ('DS'), ('EECE'), ('PHYS'), ('ENGW'), ('IS'), ('ARTF')
ON CONFLICT (name) DO NOTHING;

-- ── Seed student that owns all seed reviews ────────────────────────────────
INSERT INTO student (id, first_name, last_name, email, graduation_year)
VALUES ('f0000000-0000-0000-0000-000000000002', 'Seed', 'User', 'seed@husky.neu.edu', 2026)
ON CONFLICT (email) DO NOTHING;

-- ── Seed courses ───────────────────────────────────────────────────────────
INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000001-0000-0000-0000-000000000002', 'Fundamentals of Computer Science 2',
       d.id, 2510, 'Continuation of OOD concepts in Java.', 4, 'lecture'
FROM department d WHERE d.name = 'CS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000002-0000-0000-0000-000000000002', 'Database Design',
       d.id, 3200, 'Relational databases, SQL, and data modeling.', 4, 'lecture'
FROM department d WHERE d.name = 'CS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000003-0000-0000-0000-000000000002', 'Object-Oriented Design',
       d.id, 3500, 'Design patterns and software architecture.', 4, 'lecture'
FROM department d WHERE d.name = 'CS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000004-0000-0000-0000-000000000002', 'Artificial Intelligence',
       d.id, 4100, 'Search, constraint satisfaction, machine learning.', 4, 'lecture'
FROM department d WHERE d.name = 'CS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000005-0000-0000-0000-000000000002', 'Programming Languages',
       d.id, 4400, 'Syntax, semantics, and language paradigms.', 4, 'lecture'
FROM department d WHERE d.name = 'CS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000006-0000-0000-0000-000000000002', 'Calculus 3 for Science and Engineering',
       d.id, 2321, 'Multivariable calculus and vector fields.', 4, 'lecture'
FROM department d WHERE d.name = 'MATH' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000007-0000-0000-0000-000000000002', 'Probability and Statistics',
       d.id, 3081, 'Discrete and continuous probability models.', 4, 'lecture'
FROM department d WHERE d.name = 'MATH' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000008-0000-0000-0000-000000000002', 'Programming with Data',
       d.id, 2000, 'Intro to Python and data analysis.', 4, 'lecture'
FROM department d WHERE d.name = 'DS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c0000009-0000-0000-0000-000000000002', 'Foundations of Data Science',
       d.id, 3000, 'Machine learning, visualization, and pipelines.', 4, 'lecture'
FROM department d WHERE d.name = 'DS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c000000a-0000-0000-0000-000000000002', 'Embedded Design: Enabling Robotics',
       d.id, 2160, 'C programming and hardware interfacing.', 4, 'lab'
FROM department d WHERE d.name = 'EECE' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c000000b-0000-0000-0000-000000000002', 'Physics for Engineering 1',
       d.id, 1151, 'Mechanics, kinematics, and Newtonian physics.', 4, 'lab'
FROM department d WHERE d.name = 'PHYS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c000000c-0000-0000-0000-000000000002', 'Advanced Writing in the Technical Professions',
       d.id, 3302, 'Technical writing, white papers, and documentation.', 4, 'lecture'
FROM department d WHERE d.name = 'ENGW' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c000000d-0000-0000-0000-000000000002', 'Information Systems and Organizations',
       d.id, 2000, 'IT in business and enterprise systems.', 4, 'lecture'
FROM department d WHERE d.name = 'IS' ON CONFLICT (id) DO NOTHING;

INSERT INTO course (id, name, department_id, course_code, description, num_credits, lecture_type)
SELECT 'c000000e-0000-0000-0000-000000000002', 'Introduction to Digital Arts',
       d.id, 1000, 'Creativity, design fundamentals, and visual storytelling.', 4, 'lecture'
FROM department d WHERE d.name = 'ARTF' ON CONFLICT (id) DO NOTHING;

-- ── Seed professors ────────────────────────────────────────────────────────
INSERT INTO professor (id, first_name, last_name) VALUES
  ('b0000006-0000-0000-0000-000000000002', 'Benjamin', 'Lerner'),
  ('b0000007-0000-0000-0000-000000000002', 'Sarah',    'Finkel'),
  ('b0000008-0000-0000-0000-000000000002', 'Marcus',   'Webb'),
  ('b0000009-0000-0000-0000-000000000002', 'Diana',    'Kwon'),
  ('b000000a-0000-0000-0000-000000000002', 'Thomas',   'Nguyen')
ON CONFLICT (id) DO NOTHING;

-- ── Course reviews ─────────────────────────────────────────────────────────
-- CS 2510
INSERT INTO review (id, student_id) VALUES ('d0000001-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000001-0000-0000-0000-000000000002','c0000001-0000-0000-0000-000000000002',4,'Great follow-up to CS 2500. The labs really solidify the concepts from lecture. Expect a lot of coding.',ARRAY['coding_heavy','project_heavy','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000002-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000002-0000-0000-0000-000000000002','c0000001-0000-0000-0000-000000000002',3,'Conceptually interesting but the pacing is brutal. The assignments are long and office hours fill up fast.',ARRAY['fast_paced','time_consuming','coding_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000003-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000003-0000-0000-0000-000000000002','c0000001-0000-0000-0000-000000000002',5,'One of the best CS courses at Northeastern. You build real things and the feedback is actually useful.',ARRAY['project_heavy','well_structured','coding_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- CS 3200
INSERT INTO review (id, student_id) VALUES ('d0000004-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000004-0000-0000-0000-000000000002','c0000002-0000-0000-0000-000000000002',4,'SQL becomes second nature by the end. The project where you design your own schema from scratch is super rewarding.',ARRAY['project_heavy','coding_heavy','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000005-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000005-0000-0000-0000-000000000002','c0000002-0000-0000-0000-000000000002',3,'Exams are harder than the homeworks suggest. Make sure you really understand normalization and indexing.',ARRAY['exam_heavy','challenging','math_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000006-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000006-0000-0000-0000-000000000002','c0000002-0000-0000-0000-000000000002',5,'Incredibly practical. Everything you learn here you will use in every coop and job after.',ARRAY['coding_heavy','well_structured','project_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- CS 3500
INSERT INTO review (id, student_id) VALUES ('d0000007-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000007-0000-0000-0000-000000000002','c0000003-0000-0000-0000-000000000002',5,'This course changed how I think about writing code. Design patterns are introduced in a way that actually makes sense.',ARRAY['coding_heavy','project_heavy','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000008-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000008-0000-0000-0000-000000000002','c0000003-0000-0000-0000-000000000002',4,'The pair programming assignments are a grind but worth it. Start early every single time.',ARRAY['time_consuming','project_heavy','coding_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000009-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000009-0000-0000-0000-000000000002','c0000003-0000-0000-0000-000000000002',3,'Good content but the grading is inconsistent. Rubrics are vague for creative design decisions.',ARRAY['project_heavy','coding_heavy','poorly_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- CS 4100
INSERT INTO review (id, student_id) VALUES ('d000000a-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000000a-0000-0000-0000-000000000002','c0000004-0000-0000-0000-000000000002',4,'Fascinating material. The search algorithms and game trees section was my favorite part of my whole CS degree.',ARRAY['math_heavy','challenging','lecture_based']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d000000b-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000000b-0000-0000-0000-000000000002','c0000004-0000-0000-0000-000000000002',3,'Theory heavy. If you are not comfortable with proofs you will struggle with the exams.',ARRAY['exam_heavy','math_heavy','challenging']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- CS 4400
INSERT INTO review (id, student_id) VALUES ('d000000c-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000000c-0000-0000-0000-000000000002','c0000005-0000-0000-0000-000000000002',5,'Mind bending in the best way. You will never look at a for-loop the same after studying lambda calculus.',ARRAY['challenging','math_heavy','lecture_based']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d000000d-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000000d-0000-0000-0000-000000000002','c0000005-0000-0000-0000-000000000002',4,'Functional programming blew my mind. Racket is weird at first but the concepts carry into every language.',ARRAY['coding_heavy','challenging','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- MATH 2321
INSERT INTO review (id, student_id) VALUES ('d000000e-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000000e-0000-0000-0000-000000000002','c0000006-0000-0000-0000-000000000002',3,'Surface integrals and Stokes theorem are genuinely hard. Do every practice problem you can find.',ARRAY['exam_heavy','math_heavy','challenging']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d000000f-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000000f-0000-0000-0000-000000000002','c0000006-0000-0000-0000-000000000002',4,'The transition from single to multivariable takes a week to click but then it feels natural. Weekly quizzes keep you honest.',ARRAY['quiz_heavy','math_heavy','lecture_based']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- MATH 3081
INSERT INTO review (id, student_id) VALUES ('d0000010-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000010-0000-0000-0000-000000000002','c0000007-0000-0000-0000-000000000002',5,'Probability is taught rigorously here. The problem sets are tough but the exams are fair if you do them.',ARRAY['math_heavy','exam_heavy','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000011-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000011-0000-0000-0000-000000000002','c0000007-0000-0000-0000-000000000002',4,'Essential if you are going into ML or data science. The Bayesian statistics section alone is worth the credit.',ARRAY['math_heavy','challenging','lecture_based']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- DS 2000
INSERT INTO review (id, student_id) VALUES ('d0000012-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000012-0000-0000-0000-000000000002','c0000008-0000-0000-0000-000000000002',4,'Perfect intro to Python for people who want to work with data. Pandas and matplotlib are covered well.',ARRAY['coding_heavy','project_heavy','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000013-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000013-0000-0000-0000-000000000002','c0000008-0000-0000-0000-000000000002',5,'I came in knowing zero Python and left feeling confident. The final project is genuinely fun to work on.',ARRAY['project_heavy','easy_a','coding_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- DS 3000
INSERT INTO review (id, student_id) VALUES ('d0000014-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000014-0000-0000-0000-000000000002','c0000009-0000-0000-0000-000000000002',4,'Scikit-learn and model evaluation are taught hands on. If you want to go into ML this is the right starting point.',ARRAY['coding_heavy','project_heavy','challenging']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000015-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000015-0000-0000-0000-000000000002','c0000009-0000-0000-0000-000000000002',3,'The jump from DS 2000 to here is steep. Plan to spend time debugging weird pandas behavior every week.',ARRAY['challenging','time_consuming','coding_heavy']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- EECE 2160
INSERT INTO review (id, student_id) VALUES ('d0000016-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000016-0000-0000-0000-000000000002','c000000a-0000-0000-0000-000000000002',4,'Writing C that actually runs on hardware feels incredible. The labs are long but you leave knowing exactly what you built.',ARRAY['lab_required','coding_heavy','time_consuming']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000017-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000017-0000-0000-0000-000000000002','c000000a-0000-0000-0000-000000000002',3,'Lab reports eat your weekends. The content is interesting but the workload is not proportional to the credits.',ARRAY['lab_required','time_consuming','challenging']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- PHYS 1151
INSERT INTO review (id, student_id) VALUES ('d0000018-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000018-0000-0000-0000-000000000002','c000000b-0000-0000-0000-000000000002',3,'Mastering Physics homework is a weekly battle. Go to every recitation, they actually explain the hard stuff.',ARRAY['exam_heavy','math_heavy','lab_required']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d0000019-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d0000019-0000-0000-0000-000000000002','c000000b-0000-0000-0000-000000000002',4,'Not as scary as people say. If you keep up with problem sets you will be fine on the exams.',ARRAY['math_heavy','exam_heavy','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- ENGW 3302
INSERT INTO review (id, student_id) VALUES ('d000001a-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000001a-0000-0000-0000-000000000002','c000000c-0000-0000-0000-000000000002',5,'Every engineer should take this. Learning to write clearly for non-technical audiences is an underrated skill.',ARRAY['writing_heavy','discussion_based','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d000001b-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000001b-0000-0000-0000-000000000002','c000000c-0000-0000-0000-000000000002',4,'Peer review workshops are genuinely helpful. The professor gives real feedback not just platitudes.',ARRAY['writing_heavy','participation_based','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- IS 2000
INSERT INTO review (id, student_id) VALUES ('d000001c-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000001c-0000-0000-0000-000000000002','c000000d-0000-0000-0000-000000000002',4,'Good overview of how IT actually works in businesses. Case studies make the material feel real.',ARRAY['reading_heavy','discussion_based','easy_a']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- ARTF 1000
INSERT INTO review (id, student_id) VALUES ('d000001d-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000001d-0000-0000-0000-000000000002','c000000e-0000-0000-0000-000000000002',5,'Best NUPath course I took. You actually make things and critique each other. Totally changed how I see design.',ARRAY['project_heavy','discussion_based','participation_based']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('d000001e-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO course_review (review_id, course_id, rating, review_text, tags) VALUES ('d000001e-0000-0000-0000-000000000002','c000000e-0000-0000-0000-000000000002',4,'Chill and creative. Great way to balance a heavy CS semester.',ARRAY['project_heavy','easy_a','well_structured']::course_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- ── Professor reviews ──────────────────────────────────────────────────────
-- Lerner
INSERT INTO review (id, student_id) VALUES ('e0000001-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000001-0000-0000-0000-000000000002','b0000006-0000-0000-0000-000000000002',5,'Lerner is exceptional. Every lecture builds on the last in a way that feels inevitable in hindsight.',ARRAY['clear_lectures','organized','engaging','passionate']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('e0000002-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000002-0000-0000-0000-000000000002','b0000006-0000-0000-0000-000000000002',4,'Tough but fair. He expects you to read carefully and will call on you in class. Office hours are gold.',ARRAY['high_expectations','approachable','fair_grading','responsive']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- Finkel
INSERT INTO review (id, student_id) VALUES ('e0000003-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000003-0000-0000-0000-000000000002','b0000007-0000-0000-0000-000000000002',5,'Professor Finkel makes statistics feel intuitive. She draws out concepts visually and it really sticks.',ARRAY['clear_lectures','organized','engaging','caring']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('e0000004-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000004-0000-0000-0000-000000000002','b0000007-0000-0000-0000-000000000002',4,'Very organized, posts everything early. Grading is consistent and she responds to emails quickly.',ARRAY['organized','responsive','fair_grading','straightforward_exams']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- Webb
INSERT INTO review (id, student_id) VALUES ('e0000005-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000005-0000-0000-0000-000000000002','b0000008-0000-0000-0000-000000000002',3,'Webb knows the material deeply but lectures can feel scattered. Read the slides before class or you will be lost.',ARRAY['confusing_lectures','disorganized','heavy_workload','tough_grader']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('e0000006-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000006-0000-0000-0000-000000000002','b0000008-0000-0000-0000-000000000002',4,'Challenging but you come out of the course actually understanding things deeply. Worth the effort.',ARRAY['high_expectations','tricky_exams','heavy_workload','passionate']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- Kwon
INSERT INTO review (id, student_id) VALUES ('e0000007-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000007-0000-0000-0000-000000000002','b0000009-0000-0000-0000-000000000002',5,'Professor Kwon is the best professor I have had at Northeastern. She genuinely cares whether you understand.',ARRAY['caring','approachable','clear_lectures','responsive','engaging']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('e0000008-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000008-0000-0000-0000-000000000002','b0000009-0000-0000-0000-000000000002',5,'Incredible teacher. Explains things multiple ways until everyone gets it. Never makes you feel dumb for asking.',ARRAY['clear_lectures','lenient_grader','caring','passionate']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

-- Nguyen
INSERT INTO review (id, student_id) VALUES ('e0000009-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e0000009-0000-0000-0000-000000000002','b000000a-0000-0000-0000-000000000002',4,'Very structured. Slides are detailed and he posts recordings. Exams are straightforward if you attend.',ARRAY['organized','clear_lectures','straightforward_exams','attendance_optional']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;

INSERT INTO review (id, student_id) VALUES ('e000000a-0000-0000-0000-000000000002',(SELECT id FROM student WHERE email='seed@husky.neu.edu')) ON CONFLICT (id) DO NOTHING;
INSERT INTO professor_review (review_id, professor_id, rating, review_text, tags) VALUES ('e000000a-0000-0000-0000-000000000002','b000000a-0000-0000-0000-000000000002',3,'Gets the job done but lectures are dry. If you are self-motivated you will do fine.',ARRAY['monotone','manageable_workload','fair_grading','no_curve']::professor_tag_enum[]) ON CONFLICT (review_id) DO NOTHING;
