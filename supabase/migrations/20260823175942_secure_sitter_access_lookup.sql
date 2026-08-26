/*
# Secure sitter token lookup

1. Database Changes
   - Add `get_sitter_access(p_token)` to validate one supplied bearer token
     and return only its linked pet and expiration time.

2. Security Changes
   - Remove anonymous direct SELECT access to `sitter_access_tokens`, which
     prevents listing or querying unrelated token rows.
   - Expose only the narrow token lookup function to anon and authenticated
     callers. The function uses a fixed public search path and returns no row
     when the token does not exist.

3. Important Notes
   - Expired records still return their expiration time so the app can show
     the required "This link has expired" message.
   - The function does not expose the opaque token or internal record ID.
*/

DROP POLICY IF EXISTS "anon_select_matching_sitter_access_tokens" ON sitter_access_tokens;

CREATE OR REPLACE FUNCTION get_sitter_access(p_token uuid)
RETURNS TABLE (pet_id uuid, expires_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.pet_id, sat.expires_at
  FROM sitter_access_tokens AS sat
  WHERE sat.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_sitter_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_access(uuid) TO anon, authenticated;