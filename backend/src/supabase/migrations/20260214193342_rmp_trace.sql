CREATE TYPE semester_enum AS ENUM (
    'fall',
    'spring',
    'summer_1',
    'summer_2'
);

-- degree_requirement: What students is required to take for their degree.
CREATE TABLE degree_requirement (
    course_id UUID NOT NULL,
    major_id INT NOT NULL,
    required BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (course_id, major_id),
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    FOREIGN KEY (major_id) REFERENCES major(id) ON DELETE CASCADE
);

-- RMP
CREATE TABLE rmp (
    id SERIAL PRIMARY KEY,
    professor_id UUID NOT NULL,
    rating_avg DECIMAL(3, 2) CHECK (rating_avg >= 1 AND rating_avg <= 5),
    rating_wta INT CHECK (rating_wta BETWEEN 0 AND 100),
    avg_difficulty DECIMAL(3, 2) NOT NULL CHECK (avg_difficulty >= 1 AND avg_difficulty <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

-- TRACE
CREATE TABLE trace (
    id SERIAL PRIMARY KEY,
    course_id UUID NOT NULL,
    professor_id UUID NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    course_code INT NOT NULL CHECK (course_code BETWEEN 1000 AND 10000),
    semester semester_enum NOT NULL,
    lecture_year INT NOT NULL CHECK (lecture_year >= 2000 AND lecture_year <= 10000),
    lecture_type lecture_type_enum,
    how_often_percentage INT NOT NULL CHECK (how_often_percentage BETWEEN 0 AND 100),
    hours_devoted INT NOT NULL CHECK (hours_devoted >= 0),
    professor_efficiency DECIMAL(3,2) NOT NULL CHECK (professor_efficiency BETWEEN 1.00 AND 5.00),
    eval TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_degree_requirement_updated_at BEFORE UPDATE ON degree_requirement
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_rmp_updated_at BEFORE UPDATE ON rmp
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_trace_updated_at BEFORE UPDATE ON trace
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
