/*
# Enhance schedules table for per-task-type weekly scheduling

1. Modified Tables
   - `schedules`:
     - `label` is now nullable (not all task types need a custom label)
     - `time_of_day` is now nullable (not all tasks need a specific time)
     - Added `weekdays` (text, nullable) — comma-separated day indices 0-6
       (0=Sun,1=Mon,...,6=Sat). NULL means "every day".
     - Added `med_label` (text, nullable) — specifically for medication name,
       kept separate from the generic `label` field for clarity.

2. Security
   - No policy changes; existing anon+authenticated CRUD policies still apply.

3. Notes
   - Idempotent: uses IF NOT EXISTS for column additions.
   - Existing schedule rows are preserved; their `weekdays` stays NULL (every day).
*/

ALTER TABLE schedules ALTER COLUMN label DROP NOT NULL;
ALTER TABLE schedules ALTER COLUMN time_of_day DROP NOT NULL;

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS weekdays text;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS med_label text;
