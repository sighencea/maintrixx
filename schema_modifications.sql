-- Alter profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_company_set_up BOOLEAN DEFAULT FALSE;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_logo_url TEXT,
    company_name TEXT NOT NULL,
    company_address_street TEXT NOT NULL,
    company_phone TEXT,
    company_email TEXT NOT NULL,
    company_address_city TEXT NOT NULL,
    company_address_state TEXT NOT NULL,
    company_address_zip TEXT NOT NULL,
    company_website TEXT,
    company_tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS user_role TEXT,
ADD COLUMN IF NOT EXISTS user_status TEXT;

-- Add new columns to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_secret_code TEXT UNIQUE;

-- Function to get assigned tasks count for a staff member
CREATE OR REPLACE FUNCTION get_assigned_tasks_count(staff_user_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT
  FROM task_assignments
  WHERE user_id = staff_user_id;
$$;

-- Helper function to get the company_id of the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Pause to ensure function is available before policies that use it are created.
-- In Supabase UI, you might run this separately or ensure transactionality.

-- RLS Policies for 'profiles' table

-- Policy Name: "Allow users to read their own profile"
-- Existing Policy: "Allow individual user read access to their own profile"
-- Assuming it's: CREATE POLICY "Allow individual user read access to their own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- This is good. If it doesn't exist, it should be created.

-- Policy Name: "Allow users to view colleagues within the same company"
-- This refines/replaces "Users - View Staff List" and parts of "Admins - Full Access" for SELECT.
CREATE POLICY "Allow users to view colleagues in own company" ON profiles
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL AND
  company_id = get_my_company_id()
);

-- Policy Name: "Allow agency admin to insert new staff into their company"
CREATE POLICY "Allow admin to insert staff in own company" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check 1: The current user must be an admin of a company.
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = TRUE AND p.company_id IS NOT NULL
  ) AND
  -- Check 2: The company_id of the new profile must match the admin's company_id.
  company_id = get_my_company_id() AND
  -- Check 3: The new profile must not be an admin.
  is_admin = FALSE AND
  -- Check 4: The user_status for a new profile is 'New' (enforced by JS, good to have in RLS too)
  user_status = 'New'
);


-- Policy Name: "Allow users to update their own profile (restricted fields)"
-- Existing Policy: "Allow individual user update access to their own profile"
-- To prevent users from changing their own company_id or is_admin status:
CREATE POLICY "Allow user to update own profile (restricted)" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent changing company_id and is_admin through this policy
  company_id = (SELECT company_id FROM profiles p WHERE p.id = auth.uid()) AND
  is_admin = (SELECT is_admin FROM profiles p WHERE p.id = auth.uid())
  -- Note: Column-level privileges (GRANT UPDATE (col1, col2)) are better for restricting *which* fields can be updated.
  -- This RLS focuses on row-level consistency.
);

-- Policy Name: "Allow agency admin to update staff profiles in their company"
-- This means an admin can update any profile that shares their company_id.
CREATE POLICY "Allow admin to update staff in own company" ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE AND admin_profile.company_id IS NOT NULL
  ) AND
  company_id = (SELECT admin_profile.company_id FROM profiles admin_profile WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE)
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE AND admin_profile.company_id IS NOT NULL
  ) AND
  -- Ensure the profile remains in the same company
  company_id = (SELECT admin_profile.company_id FROM profiles admin_profile WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE) AND
  -- Admin should not use this policy to accidentally change their own is_admin status to false.
  -- If they are editing their own profile, is_admin must remain true.
  -- If editing someone else, this doesn't apply to the target's is_admin status (admin can change others).
  (id != auth.uid() OR (id = auth.uid() AND is_admin = TRUE))
);


-- RLS Policies for 'companies' table

-- Policy Name: "Allow authenticated users to create new companies"
-- User's existing policy. Assumed to be:
-- CREATE POLICY "Allow authenticated users to create new companies" ON companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
-- (Or owner_id is set to auth.uid() by default value and RLS just checks true). This is generally okay.

-- Policy Name: "Allow owner to read their own company (protect secret code)"
-- User's existing: "Allow owner read access to their own company"
-- Modification: If company_secret_code needs to be protected from the owner even, this needs a view or column-level grants.
-- For now, assume owner can read all their company's fields.
-- CREATE POLICY "Allow owner to read own company" ON companies FOR SELECT TO authenticated USING (auth.uid() = owner_id);
-- This is fine. The client-side code for company code validation will need a different approach if this is strictly enforced without a way for an unauthenticated/activating user to trigger a code check.
-- For the company code check (`js/main.js`):
-- A SECURITY DEFINER function `validate_company_code(p_code TEXT)` returning `companies.id` and `companies.company_name` would be ideal.
-- Or, if the user activating is 'authenticated' (e.g. signed up but not yet active):
CREATE POLICY "Allow users activating to validate company code" ON companies
FOR SELECT
TO authenticated -- Or 'anon' if they are not yet authenticated at all
USING (
  -- This policy is permissive for SELECT but assumes client only queries specific fields
  -- and uses the company_secret_code in a WHERE clause.
  -- This is NOT ideal for protecting the code if users can craft arbitrary SELECTs.
  -- A SQL function is better. For now, this allows the current JS to work if the user is 'authenticated'.
  EXISTS (SELECT 1 FROM companies c WHERE c.company_secret_code = company_secret_code) -- This is a placeholder logic.
  -- A better version for a specific lookup:
  -- (company_secret_code = current_setting('request.arg.code_to_check', true)) -- if using a parameter
  -- For now, let's rely on the owner-only read and assume the JS code for validation needs a secure function.
  -- The existing owner-only SELECT is fine if we assume only owner needs to see company details.
  -- The company code validation step needs a separate secure mechanism (e.g. an edge function or a specific SQL function).
  -- Let's assume the existing "Allow owner read access to their own company" is sufficient for owners.
  -- No new SELECT policy for `companies` for now, pending clarification on secure code validation.

-- Policy Name: "Allow owner to update their own company"
-- User's existing. Assumed to be:
-- CREATE POLICY "Allow owner update access to their own company" ON companies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
-- This is good.

-- Policy Name: "Allow owner to delete their own company"
-- User's existing. Assumed to be:
-- CREATE POLICY "Allow owner delete access to own company" ON companies FOR DELETE TO authenticated USING (auth.uid() = owner_id);
-- This is good.


-- RLS Policies for 'task_assignments' table
-- (Based on user feedback for task_assignments RLS and new needs)

-- Policy Name: "Allow user to see their own task assignments"
-- User's existing. Assumed: CREATE POLICY "User can see own task assignments" ON task_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- This is good.

-- Policy Name: "Allow company owner/admin to read task assignments in their company"
-- This supports the get_assigned_tasks_count function if it's SECURITY INVOKER.
CREATE POLICY "Admin can read task assignments in own company" ON task_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE
    AND admin_profile.company_id = (SELECT p.company_id FROM profiles p WHERE p.id = task_assignments.user_id)
  )
);

-- Policy Name: "Allow company owner to create task assignments in their company"
-- User's existing. It should check that the task assignment's user_id belongs to a user in the admin's company.
-- Assuming it's:
-- CREATE POLICY "Admin can create task assignments in own company" ON task_assignments FOR INSERT TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM profiles admin_profile
--     WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE
--     AND admin_profile.company_id = (SELECT p.company_id FROM profiles p WHERE p.id = task_assignments.user_id)
--   )
-- );
-- This is good.

-- Policy Name: "Allow company owner to delete task assignments in their company"
-- User's existing. Similar logic to INSERT.
-- CREATE POLICY "Admin can delete task assignments in own company" ON task_assignments FOR DELETE TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM profiles admin_profile
--     WHERE admin_profile.id = auth.uid() AND admin_profile.is_admin = TRUE
--     AND admin_profile.company_id = (SELECT p.company_id FROM profiles p WHERE p.id = task_assignments.user_id)
--   )
-- );
-- This is good.

-- Policy Name: "Allow user to delete their own task assignment"
-- User's existing. Assumed: CREATE POLICY "User can delete own task assignment" ON task_assignments FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- This is good.

-- Note: Storage RLS for 'agency-logo' bucket is separate and managed in Supabase Storage policies.
-- The user's description of storage policies (owner CUD, public read) is standard.
