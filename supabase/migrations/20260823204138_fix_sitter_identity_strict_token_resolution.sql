/*
# Fix sitter attribution: resolve identity strictly from the token

1. Modified Functions
   - `get_sitter_identity(p_token)` now returns the sitter_user_id that is
     stored directly on the token row — it never falls back to a name-based
     user lookup.  If the token has no linked user (or the linked user was
     deleted), the function returns NULL so the app can refuse to log.
   - `get_sitter_access(p_token)` already returns `sitter_user_id`; no
     change needed there.

2. Data Safety
   - No rows deleted, no columns renamed or retyped.

3. Security
   - SECURITY DEFINER preserved; anon/authenticated execute grants preserved.
*/

CREATE OR REPLACE FUNCTION get_sitter_identity(p_token uuid)
RETURNS TABLE (sitter_name text, sitter_user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.sitter_name, sat.sitter_user_id
  FROM sitter_access_tokens AS sat
  WHERE sat.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_sitter_identity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_identity(uuid) TO anon, authenticated;