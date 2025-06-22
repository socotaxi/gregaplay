-- Relax profiles insert policy so trigger can insert new rows
DROP POLICY IF EXISTS "Allow insertion of profiles" ON profiles;
CREATE POLICY "Allow insertion of profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (true);
