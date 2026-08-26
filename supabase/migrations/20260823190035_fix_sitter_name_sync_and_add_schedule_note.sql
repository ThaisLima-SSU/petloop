/*
# 1. Fix sitter attribution: sync user name with token name
   When get_sitter_identity finds a token with sitter_user_id set, it now
   updates that user's name to match the token's sitter_name when they
   differ. This fixes logs showing "by Sitter" when the user record was
   created with the generic "Sitter" name but the token carries the real
   name (e.g., "Jordan").

# 2. Add optional note column to schedules table
   Allows storing a free-text note per schedule row (e.g., groomer info
   for bath schedules).
*/

-- Add note column to schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS note text;

-- Recreate get_sitter_identity to sync user name
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
  current_user_name text;
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
  ELSE
    -- Sync the user's name with the token's sitter_name
    SELECT name INTO current_user_name FROM users WHERE id = link_user_id;
    IF current_user_name IS NOT NULL AND current_user_name <> resolved_name THEN
      UPDATE users SET name = resolved_name WHERE id = link_user_id;
    END IF;
  END IF;

  RETURN QUERY SELECT resolved_name, link_user_id;
END;
$$;

REVOKE ALL ON FUNCTION get_sitter_identity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_sitter_identity(uuid) TO anon, authenticated;