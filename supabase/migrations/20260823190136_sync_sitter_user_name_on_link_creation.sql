/*
# Sync sitter names when creating access links

1. Modified Functions
   - Update `create_sitter_access` so an existing sitter user's display name
     is synchronized with the name supplied when a link is created.

2. Data Safety
   - No rows are deleted and no columns are changed.
   - Existing link creation behavior remains unchanged except that the linked
     user's name now matches the sitter name used by the link.

3. Security
   - Preserve SECURITY DEFINER and the existing anon/authenticated execute
     grants.
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

  RETURN QUERY
  INSERT INTO sitter_access_tokens (pet_id, expires_at, sitter_name, sitter_user_id)
  VALUES (p_pet_id, p_expires_at, resolved_name, resolved_user_id)
  RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at, sitter_access_tokens.sitter_name, sitter_access_tokens.sitter_user_id;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) TO anon, authenticated;