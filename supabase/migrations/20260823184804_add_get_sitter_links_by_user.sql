/*
# Get all sitter links for a specific sitter user

1. Database Changes
   - New function get_sitter_links_by_user(p_sitter_user_id) returns all
     non-expired sitter access tokens for that user, joined with pet names.

2. Security
   - SECURITY DEFINER, callable by authenticated only (owner view).

3. Notes
   - Returns pet_id, pet_name, token, expires_at, sitter_name.
*/

CREATE OR REPLACE FUNCTION get_sitter_links_by_user(p_sitter_user_id uuid)
RETURNS TABLE (pet_id uuid, pet_name text, token uuid, expires_at timestamptz, sitter_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.pet_id, p.name, sat.token, sat.expires_at, sat.sitter_name
  FROM sitter_access_tokens AS sat
  JOIN pets AS p ON p.id = sat.pet_id
  WHERE sat.sitter_user_id = p_sitter_user_id
    AND sat.expires_at > now()
  ORDER BY p.name;
$$;

REVOKE ALL ON FUNCTION get_sitter_links_by_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_links_by_user(uuid) TO authenticated;