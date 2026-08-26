/*
# Give every sitter link a dedicated log identity

1. Database Changes
   - Add `sitter_user_id` to access tokens.
   - Link creation creates or reuses a named Caregiver-style user record,
     defaulting to "Sitter", and stores that ID with the link.
   - Token lookup functions return the dedicated user ID.

2. Security
   - Preserve narrow SECURITY DEFINER access through the existing functions.
   - Household users are never selected by the sitter logging flow.

3. Important Notes
   - Existing links with no stored user ID fall back to the first generated
     sitter identity at log time through the app's compatibility path.
*/

ALTER TABLE sitter_access_tokens
  ADD COLUMN IF NOT EXISTS sitter_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

DROP FUNCTION IF EXISTS create_sitter_access(uuid, timestamptz, text);
DROP FUNCTION IF EXISTS get_sitter_access(uuid);
DROP FUNCTION IF EXISTS get_latest_sitter_token(uuid);

CREATE FUNCTION create_sitter_access(p_pet_id uuid, p_expires_at timestamptz, p_sitter_name text DEFAULT NULL)
RETURNS TABLE (token uuid, expires_at timestamptz, sitter_name text, sitter_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name text := COALESCE(NULLIF(trim(p_sitter_name), ''), 'Sitter');
  resolved_user_id uuid;
BEGIN
  IF p_expires_at <= now() THEN
    RAISE EXCEPTION 'Expiration must be in the future';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pets WHERE id = p_pet_id) THEN
    RAISE EXCEPTION 'Pet does not exist';
  END IF;

  SELECT id INTO resolved_user_id
  FROM users
  WHERE name = resolved_name AND role = 'Caregiver'
  ORDER BY created_at
  LIMIT 1;

  IF resolved_user_id IS NULL THEN
    INSERT INTO users (name, role)
    VALUES (resolved_name, 'Caregiver')
    RETURNING id INTO resolved_user_id;
  END IF;

  RETURN QUERY
  INSERT INTO sitter_access_tokens (pet_id, expires_at, sitter_name, sitter_user_id)
  VALUES (p_pet_id, p_expires_at, resolved_name, resolved_user_id)
  RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at, sitter_access_tokens.sitter_name, sitter_access_tokens.sitter_user_id;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz, text) TO anon, authenticated;

CREATE FUNCTION get_sitter_access(p_token uuid)
RETURNS TABLE (pet_id uuid, expires_at timestamptz, sitter_name text, sitter_user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.pet_id, sat.expires_at, sat.sitter_name, sat.sitter_user_id
  FROM sitter_access_tokens AS sat
  WHERE sat.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_sitter_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_access(uuid) TO anon, authenticated;

CREATE FUNCTION get_latest_sitter_token(p_pet_id uuid)
RETURNS TABLE (token uuid, expires_at timestamptz, sitter_name text, sitter_user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.token, sat.expires_at, sat.sitter_name, sat.sitter_user_id
  FROM sitter_access_tokens AS sat
  WHERE sat.pet_id = p_pet_id
  ORDER BY sat.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_latest_sitter_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_latest_sitter_token(uuid) TO anon, authenticated;