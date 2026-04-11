-- Deleting Duplicates
DELETE FROM professor p
    USING professor p2
WHERE p.first_name = p2.first_name
  AND p.last_name = p2.last_name
  AND p.id > p2.id;

-- Adding unique constraint
ALTER TABLE professor
    ADD CONSTRAINT professor_name_unique
    UNIQUE (first_name, last_name);