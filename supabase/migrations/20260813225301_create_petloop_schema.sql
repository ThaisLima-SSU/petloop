/*
# Petloop shared pet care schema

1. New Tables
   - `users`
     - `id` (uuid, primary key) — household member identifier
     - `name` (text, not null) — display name of the person logging care
     - `created_at` (timestamptz) — record creation time
   - `pets`
     - `id` (uuid, primary key) — pet identifier
     - `name` (text, not null) — the pet's name
     - `species` (text, not null) — e.g. Dog, Cat
     - `created_at` (timestamptz) — record creation time
   - `logs`
     - `id` (uuid, primary key) — care log identifier
     - `pet_id` (uuid, not null, FK -> pets) — which pet the log is for
     - `user_id` (uuid, not null, FK -> users) — who logged the activity
     - `type` (text, not null) — activity type: fed, walked, pooped, peed, slept, meds
     - `note` (text) — optional free-text note
     - `created_at` (timestamptz, default now()) — when the activity occurred

2. Security
   - Enable RLS on all three tables.
   - This is a single shared household view with NO authentication yet, so all
     data is intentionally public/shared. Policies allow anon + authenticated
     roles full CRUD so the anon-key frontend can read and write.

3. Indexes
   - Index logs by pet_id and created_at for fast dashboard queries.

4. Seed Data
   - Inserts a couple of household members and one pet so the app has content
     on first load. Seeding is idempotent (guarded by NOT EXISTS).
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  species text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS logs_pet_id_idx ON logs(pet_id);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON logs(created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_pets" ON pets;
CREATE POLICY "anon_select_pets" ON pets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pets" ON pets;
CREATE POLICY "anon_insert_pets" ON pets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pets" ON pets;
CREATE POLICY "anon_update_pets" ON pets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pets" ON pets;
CREATE POLICY "anon_delete_pets" ON pets FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_logs" ON logs;
CREATE POLICY "anon_select_logs" ON logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_logs" ON logs;
CREATE POLICY "anon_insert_logs" ON logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_logs" ON logs;
CREATE POLICY "anon_update_logs" ON logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_logs" ON logs;
CREATE POLICY "anon_delete_logs" ON logs FOR DELETE TO anon, authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users) THEN
    INSERT INTO users (name) VALUES ('Alex'), ('Sam'), ('Jordan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pets) THEN
    INSERT INTO pets (name, species) VALUES ('Biscuit', 'Dog'), ('Miso', 'Cat');
  END IF;
END $$;
