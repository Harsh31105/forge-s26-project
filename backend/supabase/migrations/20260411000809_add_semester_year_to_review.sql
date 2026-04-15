-- Add semester_enum type if it doesn't already exist
DO $$ BEGIN
CREATE TYPE semester_enum AS ENUM ('fall', 'spring', 'summer_1', 'summer_2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add semester and year columns to the review table
ALTER TABLE review
    ADD COLUMN IF NOT EXISTS semester semester_enum,
    ADD COLUMN IF NOT EXISTS year INT;
