/*
# Add emergency/vet info columns to pets

1. Modified Tables
   - `pets`: added five new nullable text columns to store per-pet emergency
     and veterinary information.
     - `vet_name` (text, nullable) — primary veterinarian's name, e.g. "Dr. Lena Park"
     - `vet_phone` (text, nullable) — clinic phone number
     - `vet_address` (text, nullable) — clinic street address
     - `allergies` (text, nullable) — known allergies / sensitivities
     - `microchip_number` (text, nullable) — pet microchip ID

2. Security
   - No policy changes. The `pets` table already has RLS enabled with
     anon + authenticated CRUD (single-tenant shared household, no auth).
     The new columns inherit the existing table-level policies automatically.

3. Notes
   - All columns are nullable so existing pets are unaffected.
   - Idempotent: uses IF NOT EXISTS checks via DO $$ block.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'vet_name') THEN
    ALTER TABLE pets ADD COLUMN vet_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'vet_phone') THEN
    ALTER TABLE pets ADD COLUMN vet_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'vet_address') THEN
    ALTER TABLE pets ADD COLUMN vet_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'allergies') THEN
    ALTER TABLE pets ADD COLUMN allergies text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'microchip_number') THEN
    ALTER TABLE pets ADD COLUMN microchip_number text;
  END IF;
END $$;