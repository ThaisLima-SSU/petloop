/*
# Add optional sitter names to access links

1. Database Changes
   - Add nullable `sitter_name` to `sitter_access_tokens`.
   - Recreate the narrow token functions with sitter_name included in their
     return values and in link creation.

2. Security
   - Preserve the existing anon/authenticated execute grants.
   - Direct token-table SELECT access remains disabled.

3. Important Notes
   - Existing access rows are preserved and use the fallback name "Sitter".
*/

ALTER TABLE sitter_access_tokens
  ADD COLUMN IF NOT EXISTS sitter_name text;

DROP FUNCTION IF EXISTS create_sitter_access(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_sitter_access(uuid);
DROP FUNCTION IF EXISTS get_latest_sitter_token(uuid);

CREATE FUNCTION create_sitter_access(p_pet_id uuid, p_expires_at timestamptz, p_sitter_name text DEFAULT NULL)
RETURNS TABLE (token uuid, expires_at timestamptz, sitter_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_expires_at <= now() THEN
    RAISE EXCEPTION 'Expiration must be in the future';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pets WHERE id = p_pet_id) THEN
    RAISE EXCEPTION 'Pet does not exist';
  END IF;

  RETURN QUERY
  INSERT INTO sitter_access_tokens (pet_id, expires_at, sitter_name)
  VALUES (p_pet_id, p_expires_at, p_sitter_name)
  RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at, sitter_access_tokens.sitter_name;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz, text) TO anon, authenticated;

CREATE FUNCTION get_sitter_access(p_token uuid)
RETURNS TABLE (pet_id uuid, expires_at timestamptz, sitter_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.pet_id, sat.expires_at, sat.sitter_name
  FROM sitter_access_tokens AS sat
  WHERE sat.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_sitter_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_access(uuid) TO anon, authenticated;

CREATE FUNCTION get_latest_sitter_token(p_pet_id uuid)
RETURNS TABLE (token uuid, expires_at timestamptz, sitter_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sat.token, sat.expires_at, sat.sitter_name
  FROM sitter_access_tokens AS sat
  WHERE sat.pet_id = p_pet_id
  ORDER BY sat.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_latest_sitter_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_latest_sitter_token(uuid) TO anon, authenticated;