/*
# Add "Visible to Sitter" flag to schedules

1. Modified Tables
   - `schedules`: add `visible_to_sitter` boolean column, default false.
     When true, the task appears in the Sitter View and on the sitter's
     Log Care form. When false, the task is hidden from sitters entirely.

2. Data Safety
   - No rows deleted, no columns renamed or retyped. Existing rows get
     the column default (false), so nothing is exposed to sitters until
     a household member explicitly checks the box.
*/

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS visible_to_sitter boolean NOT NULL DEFAULT false;