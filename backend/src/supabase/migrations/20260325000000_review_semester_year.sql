-- Add semester and year to the review table.
-- semester_enum already exists (defined in rmp_trace migration).
ALTER TABLE review ADD COLUMN semester semester_enum;
ALTER TABLE review ADD COLUMN year INT CHECK (year >= 2000);
