-- Create review_type enum if it doesn't already exist
DO $$ BEGIN
    CREATE TYPE review_type AS ENUM ('course', 'professor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ai_summary table
CREATE TABLE IF NOT EXISTS ai_summary (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id           UUID NOT NULL REFERENCES review(id) ON DELETE CASCADE,
    review_type         review_type NOT NULL,
    summary             TEXT NOT NULL,
    score               REAL NOT NULL DEFAULT 0,
    summary_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint so upserts work correctly
CREATE UNIQUE INDEX IF NOT EXISTS ai_summary_review_id_type_idx
    ON ai_summary (review_id, review_type);
