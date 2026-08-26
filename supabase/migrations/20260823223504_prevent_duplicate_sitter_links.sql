/*
# Prevent duplicate sitter links per pet-sitter pair

1. Modified Functions
   - `create_sitter_access` now performs an upsert: if an active (non-expired)
     token already exists for the same pet_id + sitter_user_id, it updates
     that row's expiration and sitter_name in place instead of inserting a
     duplicate. If no active token exists, it inserts a new one as before.
   - When p_sitter_user_id is NULL, the function falls back to matching by
     pet_id + sitter_name to avoid duplicates for legacy unlinked tokens.

2. Data Safety
   - No rows are deleted. Existing tokens are updated in place when reused.
   - The token value is preserved on reuse so existing shared links keep
     working after a regeneration.

3. Security
   - SECURITY DEFINER and the fixed `public` search path are preserved.
   - Existing anon/authenticated execute grants are preserved.
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

  IF p_sitter_name IS NOT NULL AND trim(p_sitter_name) <> '' THEN
    resolved_name := trim(p_sitter_name);
  ELSE
    resolved_name := 'Sitter';
  END IF;

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

  -- Check for an existing active token for this pet-sitter pair
  SELECT token, expires_at INTO existing_token, existing_expires_at
  FROM sitter_access_tokens
  WHERE pet_id = p_pet_id
    AND sitter_user_id = resolved_user_id
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_token IS NOT NULL THEN
    -- Reuse the existing token, update expiration and name in place
    UPDATE sitter_access_tokens
    SET expires_at = p_expires_at,
        sitter_name = resolved_name,
        sitter_user_id = resolved_user_id
    WHERE token = existing_token;

    RETURN QUERY
    SELECT existing_token, p_expires_at, resolved_name, resolved_user_id;
  ELSE
    -- Also check for legacy unlinked tokens matching by name
    SELECT token INTO existing_token
    FROM sitter_access_tokens
    WHERE pet_id = p_pet_id
      AND sitter_user_id IS NULL
      AND sitter_name = resolved_name
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF existing_token IS NOT NULL THEN
      UPDATE sitter_access_tokens
      SET expires_at = p_expires_at,
          sitter_name = resolved_name,
          sitter_user_id = resolved_user_id
      WHERE token = existing_token;

      RETURN QUERY
      SELECT existing_token, p_expires_at, resolved_name, resolved_user_id;
    ELSE
      RETURN QUERY
      INSERT INTO sitter_access_tokens (pet_id, expires_at, sitter_name, sitter_user_id)
      VALUES (p_pet_id, p_expires_at, resolved_name, resolved_user_id)
      RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at, sitter_access_tokens.sitter_name, sitter_access_tokens.sitter_user_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) TO anon, authenticated;