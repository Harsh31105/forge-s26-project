-- Add profile picture S3 key column to student table
ALTER TABLE student
    ADD COLUMN profile_picture_key VARCHAR(500);

-- Seed majors from onboarding data
INSERT INTO major (name)
VALUES ('Architecture'),
       ('Biology'),
       ('Business Administration'),
       ('Chemistry'),
       ('Communication Studies'),
       ('Computer Science'),
       ('Criminal Justice'),
       ('Data Science'),
       ('Electrical & Computer Engineering'),
       ('Environmental Science'),
       ('International Business'),
       ('Mathematics'),
       ('Mechanical Engineering'),
       ('Nursing'),
       ('Physics'),
       ('Political Science'),
       ('Psychology')
ON CONFLICT (name) DO NOTHING;

-- Seed concentrations (deduplicated across all majors)
INSERT INTO concentration (name)
VALUES
-- Biology
('Biochemistry'),
('Cell & Molecular Biology'),
('Ecology & Evolutionary Biology'),
('Marine Biology'),
-- Business Administration
('Accounting'),
('Entrepreneurship'),
('Finance'),
('Management'),
('Marketing'),
('Supply Chain Management'),
-- Chemistry
('Medicinal Chemistry'),
('Organic Chemistry'),
-- Communication Studies
('Advertising'),
('Digital Media'),
('Journalism'),
('Public Relations'),
-- Computer Science
('Artificial Intelligence'),
('Cybersecurity'),
('Data Science'),
('Game Development'),
('Human-Computer Interaction'),
('Software'),
('Systems'),
-- Criminal Justice
('Corrections'),
('Law Enforcement'),
('Policy & Planning'),
-- Data Science
('Business Analytics'),
('Machine Learning'),
('Statistics'),
-- Electrical & Computer Engineering
('Computer Engineering'),
('Electrical Engineering'),
-- Environmental Science
('Climate Science'),
('Ecology'),
('Environmental Policy'),
-- Mathematics
('Applied Mathematics'),
('Pure Mathematics'),
-- Mechanical Engineering
('Manufacturing & Design'),
('Robotics & Control'),
-- Physics
('Astrophysics'),
('Condensed Matter'),
-- Political Science
('American Politics'),
('International Relations'),
('Law & Politics'),
-- Psychology
('Clinical'),
('Cognitive'),
('Experimental'),
('Health Psychology')
ON CONFLICT (name) DO NOTHING;