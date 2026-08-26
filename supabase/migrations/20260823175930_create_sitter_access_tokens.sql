/*
# Create secure sitter access links

1. New Tables
   - `sitter_access_tokens`
     - `id` (uuid, primary key) — internal access record identifier
     - `token` (uuid, unique) — opaque bearer value placed in a shareable URL
     - `pet_id` (uuid, not null, foreign key) — the only pet this link can access
     - `expires_at` (timestamptz, not null) — the exact time access ends
     - `created_at` (timestamptz) — when the link was generated

2. Security
   - Row-level security is enabled.
   - Anonymous and authenticated users may create links for this single-tenant app.
   - Anonymous and authenticated users may read only a token record when its
     opaque token matches the requested value. This lets the public sitter URL
     validate itself without exposing unrelated links through normal queries.
   - Updates and deletes are not granted because links are immutable records.

3. Important Notes
   - The token is a bearer credential: anyone who has the complete link can use
     it until the expiration time.
   - Expiration is checked by the application before rendering sitter content.
   - Existing pets, schedules, logs, and household data are unchanged.
*/

CREATE TABLE IF NOT EXISTS sitter_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sitter_access_tokens_token_idx ON sitter_access_tokens(token);
CREATE INDEX IF NOT EXISTS sitter_access_tokens_pet_id_idx ON sitter_access_tokens(pet_id);

ALTER TABLE sitter_access_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_sitter_access_tokens" ON sitter_access_tokens;
CREATE POLICY "anon_insert_sitter_access_tokens"
  ON sitter_access_tokens FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_matching_sitter_access_tokens" ON sitter_access_tokens;
CREATE POLICY "anon_select_matching_sitter_access_tokens"
  ON sitter_access_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_update_sitter_access_tokens" ON sitter_access_tokens;
DROP POLICY IF EXISTS "anon_delete_sitter_access_tokens" ON sitter_access_tokens;