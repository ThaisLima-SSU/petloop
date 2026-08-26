/*
# Add secure sitter link creation

1. Database Changes
   - Add `create_sitter_access(p_pet_id, p_expires_at)` to insert one
     sitter access record and return only its token and expiration.

2. Security Changes
   - The function is callable by the anonymous and authenticated roles because
     this app has no sign-in screen. It does not grant direct SELECT access to
     the token table.
   - The function uses a fixed search path and validates that expiration is in
     the future and belongs to an existing pet.

3. Important Notes
   - Existing access links remain unchanged.
   - The returned token is the only value needed to construct a shareable link.
*/

CREATE OR REPLACE FUNCTION create_sitter_access(p_pet_id uuid, p_expires_at timestamptz)
RETURNS TABLE (token uuid, expires_at timestamptz)
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
  INSERT INTO sitter_access_tokens (pet_id, expires_at)
  VALUES (p_pet_id, p_expires_at)
  RETURNING sitter_access_tokens.token, sitter_access_tokens.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION create_sitter_access(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sitter_access(uuid, timestamptz) TO anon, authenticated;