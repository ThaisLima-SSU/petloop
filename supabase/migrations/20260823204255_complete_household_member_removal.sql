/*
# Preserve all household member removal behavior

1. Modified Database Behavior
   - Update `remove_sitter_member(p_user_id)` so it can remove any existing
     household member, preserving the app's existing caregiver and owner
     removal flow.
   - Sitter members still have all associated access tokens invalidated first.
   - Older unlinked tokens matching a deleted sitter's saved name are also
     invalidated.

2. Security
   - SECURITY DEFINER and the fixed `public` search path remain in place.
   - Existing anon and authenticated execution grants remain in place for the
     app's shared, no-sign-in household model.

3. Data Safety
   - Only the selected member and, for sitters, that member's access links are
     affected. No logs, pets, or schedules are removed by this function.
*/

CREATE OR REPLACE FUNCTION remove_sitter_member(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_name text;
  member_role text;
BEGIN
  SELECT name, role INTO member_name, member_role
  FROM users
  WHERE id = p_user_id;

  IF member_role IS NULL THEN
    RAISE EXCEPTION 'Household member not found';
  END IF;

  IF member_role = 'Sitter' THEN
    DELETE FROM sitter_access_tokens
    WHERE sitter_user_id = p_user_id
       OR (sitter_user_id IS NULL AND sitter_name = member_name);
  END IF;

  DELETE FROM users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION remove_sitter_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION remove_sitter_member(uuid) TO anon, authenticated;