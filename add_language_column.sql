-- Alter profiles table to add preferred_ui_language column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_ui_language TEXT DEFAULT 'en';

-- Note: While the column is added with a default, existing rows will have NULL
-- for this new column. If existing users should also default to 'en',
-- a subsequent UPDATE statement would be needed:
-- UPDATE profiles SET preferred_ui_language = 'en' WHERE preferred_ui_language IS NULL;
-- However, this subtask only asks for the ADD COLUMN statement.
