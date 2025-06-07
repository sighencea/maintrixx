-- Function to create a profile for a new user from auth.users
-- This function assumes metadata (first_name, last_name, user_role, company_id, is_admin, user_status)
-- is passed during user invitation via `inviteUserByEmail` in the `data` property.

CREATE OR REPLACE FUNCTION public.handle_new_invited_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Necessary to write to public.profiles from auth context
AS $$
DECLARE
  metadata JSONB;
  profile_company_id UUID;
  profile_user_role TEXT;
  profile_is_admin BOOLEAN;
  profile_user_status TEXT;
  profile_first_name TEXT;
  profile_last_name TEXT;
BEGIN
  -- Extract metadata passed during invitation
  metadata := NEW.raw_app_meta_data; -- Data from inviteUserByEmail is in raw_app_meta_data

  profile_company_id := (metadata ->> 'company_id')::UUID;
  profile_user_role := metadata ->> 'user_role';
  profile_is_admin := COALESCE((metadata ->> 'is_admin')::BOOLEAN, FALSE); -- Default to FALSE if not present
  profile_user_status := COALESCE(metadata ->> 'user_status', 'Active'); -- Default to 'Active' as user has accepted invite
  profile_first_name := metadata ->> 'first_name';
  profile_last_name := metadata ->> 'last_name';

  -- Create a new profile entry
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    user_role,
    company_id,
    is_admin,
    user_status,
    preferred_ui_language -- consider adding this to invite metadata or using a default
  )
  VALUES (
    NEW.id,
    NEW.email,
    profile_first_name,
    profile_last_name,
    profile_user_role,
    profile_company_id,
    profile_is_admin,
    profile_user_status,
    COALESCE((metadata ->> 'preferred_ui_language')::TEXT, 'en') -- Default to 'en'
  );

  -- Additionally, you might want to update the app_metadata on the auth.user object
  -- if you want to store some of this information directly on the auth user as well,
  -- for example, for RLS policies that directly use jwt app_metadata.
  -- This is optional and depends on your RLS strategy.
  -- Example:
  -- UPDATE auth.users
  -- SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', profile_company_id, 'user_role', profile_user_role, 'is_admin', profile_is_admin)
  -- WHERE id = NEW.id;
  -- For simplicity, this example focuses on populating public.profiles.

  RETURN NEW;
END;
$$;

-- Drop existing trigger on auth.users if it was named differently or for cleanup
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Be cautious if you have other triggers

-- Create the trigger to call this function after a new user is inserted in auth.users
CREATE TRIGGER on_auth_user_invited_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_invited_user();

COMMENT ON FUNCTION public.handle_new_invited_user() IS
'Handles creation of a public.profiles entry for a new user created via invitation, using metadata from inviteUserByEmail.';
COMMENT ON TRIGGER on_auth_user_invited_created ON auth.users IS
'After a new user is created in auth.users (e.g. after accepting an invitation), create their corresponding profile in public.profiles.';

-- Advise user:
-- IMPORTANT: Review your existing trigger 'on_new_user_profile_created' on 'public.profiles'.
-- It appears to be designed for a different signup flow or profile creation process.
-- If users are now primarily added via invitation or a standard Supabase signup that creates an auth.users entry first,
-- the old trigger 'on_new_user_profile_created' might be redundant or could cause conflicts
-- (e.g., trying to update a profile that this new trigger already created).
-- You may need to modify or remove it depending on your overall user management strategy.
-- The trigger 'handle_new_user_profile_setup' which is called by 'on_new_user_profile_created'
-- might still be relevant if you have other flows that insert directly into public.profiles first,
-- or if users can sign up without an invitation and then have their profile updated.
-- This new 'on_auth_user_invited_created' trigger is specifically for the invite flow.
