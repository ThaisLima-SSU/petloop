/*
# Fix token update reference in create_sitter_access

1. Modified Functions
   - Qualify both token update predicates in `create_sitter_access` so the
     function's output column named `token` cannot conflict with the table
     column during regeneration.

2. Data Safety
   - No rows or columns are changed by this migration itself.
   - Existing active links continue to be reused in place.

3. Security
   - SECURITY DEFINER, fixed search_path, and existing execution grants remain
     unchanged.
*/

CREATE OR REPLACE FUNCTION create_sitter_access(
  p_pet_id uuid,
  p_expires_at timestamptz,
  p_sitter_name text DEFAULT NULL,
  p_sitter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (token uuid, expires_at timestamptz, sitter_name text, sitter_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name text;
  resolved_user_id uuid := p_sitter_user_id;
  existing_token uuid;
  existing_expires_at timestamptz;
BEGIN
  IF p_expires_at <= now() THEN
    RAISE EXCEPTION 'Expiration must be in the future';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pets WHERE id = p_pet_id) THEN
    RAISE EXCEPTION 'Pet does not exist';
  END IF;

  resolved_name := COALESCE(NULLIF(trim(p_sitter_name), ''), 'Sitter');

  IF resolved_user_id IS NULL THEN
    SELECT id INTO resolved_user_id
    FROM users
    WHERE name = resolved_name
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF resolved_user_id IS NULL THEN
    INSERT INTO users (name, role)
    VALUES (resolved_name, 'Sitter')
    RETURNING id INTO resolved_user_id;
  ELSE
    UPDATE users
    SET name = resolved_name
    WHERE id = resolved_user_id AND name IS DISTINCT FROM resolved_name;
  END IF;

  SELECT sat.token, sat.expires_at INTO existing_token, existing_expires_at
  FROM sitter_access_tokens AS sat
  WHERE sat.pet_id = p_pet_id
    AND sat.sitter_user_id = resolved_user_id
    AND sat.expires_at > now()
  ORDER BY sat.created_at DESC
  LIMIT 1;

  IF existing_token IS NOT NULL THEN
    UPDATE sitter_access_tokens AS sat
    SET expires_at = p_expires_at,
        sitter_name = resolved_name,
        sitter_user_id = resolved_user_id
    WHERE sat.token = existing_token;

    RETURN QUERY SELECT existing_token, p_expires_at, resolved_name, resolved_user_id;
    RETURN;
  END IF;

  SELECT sat.token INTO existing_token
  FROM sitter_access_tokens AS sat
  WHERE sat.pet_id = p_pet_id
    AND sat.sitter_user_id IS NULL
    AND sat.sitter_name = resolved_name
    AND sat.expires_at > now()
  ORDER BY sat.created_at DESC
  LIMIT 1;

  IF existing_token IS NOT NULL THEN
    UPDATE sitter_access_tokens AS sat
    SET expires_at = p_expires_at,
        sitter_name = resolved_name,
        sitter_user_id = resolved_user_id
    WHERE sat.token = existing_token;

    RETURN QUERY SELECT existing_token, p_expires_at, resolved_name, resolved_user_id;
    RETURN;
  END IF;

  RETURN QUERY
  INSERT INTO sitter_access_tokens (pet_id, expires_at, sitter_name, sitter_user_id)
  VALUES (p_pet_id, p_expires_at, resolved_name, resolved_user_id)
  RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at, sitter_access_tokens.sitter_name, sitter_access_tokens.sitter_user_id;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) TO anon, authenticated;