/*
# Add user roles and medication schedules

1. Modified Tables
   - `users`: added `role` (text, not null, default 'Caregiver') — stores the
     household member's role: 'Owner' or 'Caregiver'. Existing users backfilled
     to 'Caregiver'; Thais specifically set to 'Owner'.

2. New Tables
   - `schedules`
     - `id` (uuid, primary key) — schedule entry identifier
     - `pet_id` (uuid, not null, FK -> pets ON DELETE CASCADE) — which pet
     - `type` (text, not null) — the activity type this schedule represents
       (currently 'meds' for medication schedules)
     - `label` (text, not null) — human-readable name, e.g. "Heartgard Plus"
     - `time_of_day` (text, not null) — HH:MM in 24h format, e.g. "12:00"
     - `frequency` (text, not null, default 'daily') — recurrence pattern
     - `active` (boolean, not null, default true) — whether schedule is active
     - `created_at` (timestamptz, default now())

3. Security
   - Enable RLS on `schedules`.
   - Anon + authenticated CRUD (single-tenant shared household, no auth yet).
   - No policy changes on `users` (existing policies already allow full CRUD).

4. Notes
   - Idempotent: uses IF NOT EXISTS and conditional UPDATEs.
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Caregiver';

UPDATE users SET role = 'Owner' WHERE name = 'Thais';
UPDATE users SET role = 'Caregiver' WHERE name = 'Amanda';

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'meds',
  label text NOT NULL,
  time_of_day text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schedules_pet_id_idx ON schedules(pet_id);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_schedules" ON schedules;
CREATE POLICY "anon_select_schedules" ON schedules FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_schedules" ON schedules;
CREATE POLICY "anon_insert_schedules" ON schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_schedules" ON schedules;
CREATE POLICY "anon_update_schedules" ON schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_schedules" ON schedules;
CREATE POLICY "anon_delete_schedules" ON schedules FOR DELETE
  TO anon, authenticated USING (true);
