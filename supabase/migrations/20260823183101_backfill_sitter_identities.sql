/*
# Backfill sitter identities for older links

1. Database Changes
   - Add `get_sitter_identity(p_token)` to create and persist the default
     Sitter user for access links created before sitter identities existed.

2. Security
   - Narrow SECURITY DEFINER function; only the supplied token is used.
   - Callable by anon and authenticated to support public sitter links.
*/

CREATE OR REPLACE FUNCTION get_sitter_identity(p_token uuid)
RETURNS TABLE (sitter_name text, sitter_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link_name text;
  link_user_id uuid;
  resolved_name text;
BEGIN
  SELECT sat.sitter_name, sat.sitter_user_id
  INTO link_name, link_user_id
  FROM sitter_access_tokens AS sat
  WHERE sat.token = p_token
  LIMIT 1;

  IF link_name IS NULL THEN
    resolved_name := 'Sitter';
  ELSE
    resolved_name := link_name;
  END IF;

  IF link_user_id IS NULL THEN
    SELECT id INTO link_user_id
    FROM users
    WHERE name = resolved_name AND role = 'Caregiver'
    ORDER BY created_at
    LIMIT 1;

    IF link_user_id IS NULL THEN
      INSERT INTO users (name, role)
      VALUES (resolved_name, 'Caregiver')
      RETURNING id INTO link_user_id;
    END IF;

    UPDATE sitter_access_tokens
    SET sitter_name = resolved_name, sitter_user_id = link_user_id
    WHERE token = p_token;
  END IF;

  RETURN QUERY SELECT resolved_name, link_user_id;
END;
$$;

REVOKE ALL ON FUNCTION get_sitter_identity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_identity(uuid) TO anon, authenticated;