/*
# Add latest sitter token lookup for role-preview

1. Database Changes
   - Add `get_latest_sitter_token(p_pet_id)` to return the most recently
     created sitter access token for a given pet. Used by the in-app
     "View as Sitter" demo preview so the owner can see what a sitter
     would see without opening a separate URL.

2. Security
   - SECURITY DEFINER with fixed search_path. Callable by anon and
     authenticated (no-auth single-tenant app). Returns at most one row.

3. Notes
   - Does not expose the token table broadly; only this narrow lookup.
*/

CREATE OR REPLACE FUNCTION get_latest_sitter_token(p_pet_id uuid)
RETURNS TABLE (token uuid, expires_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.token, sat.expires_at
  FROM sitter_access_tokens AS sat
  WHERE sat.pet_id = p_pet_id
  ORDER BY sat.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_latest_sitter_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_latest_sitter_token(uuid) TO anon, authenticated;