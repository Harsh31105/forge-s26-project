-- Also drop the integer check constraints that no longer apply
ALTER TABLE trace DROP CONSTRAINT IF EXISTS hours_devoted_check;
ALTER TABLE trace DROP CONSTRAINT IF EXISTS how_often_percentage_check;

-- Migrate hours_devoted and how_often_percentage from integer to jsonb
-- Run this in the Supabase SQL editor
ALTER TABLE trace
ALTER COLUMN hours_devoted TYPE jsonb USING
    CASE
      WHEN hours_devoted IS NULL THEN NULL
      ELSE to_jsonb(hours_devoted)
END;

ALTER TABLE trace
ALTER COLUMN how_often_percentage TYPE jsonb USING
    CASE
      WHEN how_often_percentage IS NULL THEN NULL
      ELSE to_jsonb(how_often_percentage)
END;