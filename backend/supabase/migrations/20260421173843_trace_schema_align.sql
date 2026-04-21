-- Bring the `trace` table in line with the Drizzle schema and model nullability.
--   * department_id: add FK to department(id) (was missing)
--   * hours_devoted, how_often_percentage, professor_efficiency: drop NOT NULL
--     (model treats them as nullable since the scraper can't always fill them)
--   * professor_efficiency: widen from DECIMAL(3,2) to REAL to match Drizzle
--   * replace the old DECIMAL-range check with one that tolerates NULL + REAL

ALTER TABLE trace
    ADD CONSTRAINT trace_department_id_fkey
        FOREIGN KEY (department_id) REFERENCES department (id) ON DELETE CASCADE;

ALTER TABLE trace
    ALTER COLUMN hours_devoted DROP NOT NULL,
    ALTER COLUMN how_often_percentage DROP NOT NULL,
    ALTER COLUMN professor_efficiency DROP NOT NULL;

ALTER TABLE trace DROP CONSTRAINT IF EXISTS professor_efficiency_check;
ALTER TABLE trace DROP CONSTRAINT IF EXISTS trace_professor_efficiency_check;

ALTER TABLE trace
    ALTER COLUMN professor_efficiency TYPE REAL USING professor_efficiency::REAL;

ALTER TABLE trace
    ADD CONSTRAINT trace_professor_efficiency_check
        CHECK (professor_efficiency IS NULL OR professor_efficiency BETWEEN 1.0 AND 5.0);
