/*
# Rename seed pets and household members

1. Data Changes
   - Pets: Biscuit -> Sophia (Dog), Miso -> Nala (Dog). Both species set to 'Dog'.
   - Users: existing three members replaced by exactly two: Thais and Amanda.
     Existing logs (if any) are reassigned to Thais to preserve referential
     integrity; any logs referencing a removed user are deleted first.

2. Security
   - No schema or policy changes.

3. Notes
   - Idempotent: uses UPDATE ... WHERE name = ... so re-running is safe.
*/

-- Reassign or clean up any logs whose user will be removed, then remove the
-- extra user so the household is exactly Thais + Amanda.
-- Ensure at least one user named Thais exists (the keeper).
INSERT INTO users (name)
SELECT 'Thais'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE name = 'Thais');

-- Reassign logs from non-keeper users to Thais.
UPDATE logs
SET user_id = (SELECT id FROM users WHERE name = 'Thais' LIMIT 1)
WHERE user_id NOT IN (SELECT id FROM users WHERE name IN ('Thais', 'Amanda'));

-- Delete users that are neither Thais nor Amanda.
DELETE FROM users
WHERE name NOT IN ('Thais', 'Amanda');

-- Ensure Amanda exists.
INSERT INTO users (name)
SELECT 'Amanda'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE name = 'Amanda');

-- Rename pets and set species to Dog.
UPDATE pets SET name = 'Sophia', species = 'Dog' WHERE name = 'Biscuit';
UPDATE pets SET name = 'Nala', species = 'Dog' WHERE name = 'Miso';

-- If the old names somehow did not exist, ensure Sophia and Nala exist.
INSERT INTO pets (name, species)
SELECT 'Sophia', 'Dog'
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE name = 'Sophia');

INSERT INTO pets (name, species)
SELECT 'Nala', 'Dog'
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE name = 'Nala');
