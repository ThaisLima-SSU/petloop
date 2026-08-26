/*
# Secure sitter member removal and link invalidation

1. Modified Database Behavior
   - Add `remove_sitter_member(p_user_id)` as the single operation used when
     a household member is removed.
   - It first invalidates every sitter access token linked to that member, then
     removes the member record.
   - Older tokens with no stored user ID are also invalidated when their saved
     sitter name matches the member being removed.

2. Security
   - The function is SECURITY DEFINER with a fixed `public` search path so
     token invalidation cannot be bypassed by row-level permissions.
   - It is callable by anon and authenticated because this app has no sign-in
     screen and its existing household management actions use the shared app.
   - No table policies are widened and no user data outside the selected
     member's sitter links and member row is removed.

3. Important Notes
   - Link invalidation and member removal happen in one database operation,
     preventing a deleted sitter's link from remaining usable between steps.
*/

CREATE OR REPLACE FUNCTION remove_sitter_member(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_name text;
BEGIN
  SELECT name INTO member_name
  FROM users
  WHERE id = p_user_id AND role = 'Sitter';

  IF member_name IS NULL THEN
    RAISE EXCEPTION 'Sitter member not found';
  END IF;

  DELETE FROM sitter_access_tokens
  WHERE sitter_user_id = p_user_id
     OR (sitter_user_id IS NULL AND sitter_name = member_name);

  DELETE FROM users
  WHERE id = p_user_id AND role = 'Sitter';
END;
$$;

REVOKE ALL ON FUNCTION remove_sitter_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION remove_sitter_member(uuid) TO anon, authenticated;