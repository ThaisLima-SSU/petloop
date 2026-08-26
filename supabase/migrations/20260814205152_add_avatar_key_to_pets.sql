/*
# Add avatar_key column to pets

1. Modified Tables
   - `pets`: added `avatar_key` (text, nullable) — stores the chosen avatar
     variant key (e.g. "dog-pointed", "cat-floppy"). Existing pets are
     backfilled with sensible defaults: Sophia -> "dog-pointed", Nala ->
     "dog-floppy".

2. Security
   - No policy changes; avatar_key is writable through existing anon CRUD.
*/

ALTER TABLE pets ADD COLUMN IF NOT EXISTS avatar_key text;

UPDATE pets SET avatar_key = 'dog-pointed' WHERE name = 'Sophia' AND avatar_key IS NULL;
UPDATE pets SET avatar_key = 'dog-floppy' WHERE name = 'Nala' AND avatar_key IS NULL;
