/*
# Add Sitter role and user_id-aware link creation

1. Database Changes
   - Recreate create_sitter_access with optional p_sitter_user_id parameter.
     When provided, use it directly instead of searching/creating a user.
     When not provided, search by name regardless of role (previously
     filtered to Caregiver only). New auto-created users get role 'Sitter'.
   - Recreate get_sitter_identity to search by name regardless of role
     and create fallback users with role 'Sitter'.

2. Security
   - Preserve existing anon/authenticated execute grants.

3. Notes
   - The users.role column is free-text with no check constraint, so
     'Sitter' is already a valid value.
*/

DROP FUNCTION IF EXISTS create_sitter_access(uuid, timestamptz, text);
DROP FUNCTION IF EXISTS get_sitter_identity(uuid);

CREATE FUNCTION create_sitter_access(p_pet_id uuid, p_expires_at timestamptz, p_sitter_name text DEFAULT NULL, p_sitter_user_id uuid DEFAULT NULL)
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
  END IF;

  RETURN QUERY
  INSERT INTO sitter_access_tokens (pet_id, expires_at, sitter_name, sitter_user_id)
  VALUES (p_pet_id, p_expires_at, resolved_name, resolved_user_id)
  RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at, sitter_access_tokens.sitter_name, sitter_access_tokens.sitter_user_id;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz, text, uuid) TO anon, authenticated;

CREATE FUNCTION get_sitter_identity(p_token uuid)
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
    WHERE name = resolved_name
    ORDER BY created_at
    LIMIT 1;

    IF link_user_id IS NULL THEN
      INSERT INTO users (name, role)
      VALUES (resolved_name, 'Sitter')
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