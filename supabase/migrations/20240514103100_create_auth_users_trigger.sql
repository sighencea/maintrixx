-- supabase/migrations/20240514103100_create_auth_users_trigger.sql

CREATE OR REPLACE FUNCTION public.handle_new_invited_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metadata JSONB;
  profile_id UUID;
  profile_email TEXT;
  profile_company_id UUID;
  profile_user_role TEXT;
  profile_is_admin BOOLEAN;
  profile_user_status TEXT;
  profile_first_name TEXT;
  profile_last_name TEXT;
  profile_preferred_ui_language TEXT;
BEGIN
  RAISE NOTICE '[handle_new_invited_user] Trigger fired for new user ID: %, Email: %', NEW.id, NEW.email;
  metadata := NEW.raw_app_meta_data;
  RAISE NOTICE '[handle_new_invited_user] Raw metadata from invite: %', metadata;

  profile_id := NEW.id;
  profile_email := NEW.email; -- Email from the auth user

  profile_company_id := (metadata ->> 'company_id')::UUID;
  RAISE NOTICE '[handle_new_invited_user] Extracted company_id: %', profile_company_id;
  profile_user_role := metadata ->> 'user_role';
  RAISE NOTICE '[handle_new_invited_user] Extracted user_role: %', profile_user_role;
  profile_is_admin := COALESCE((metadata ->> 'is_admin')::BOOLEAN, FALSE);
  RAISE NOTICE '[handle_new_invited_user] Extracted is_admin: %', profile_is_admin;
  profile_user_status := COALESCE(metadata ->> 'user_status', 'Active'); -- Default to 'Active' as user has accepted invite
  RAISE NOTICE '[handle_new_invited_user] Extracted user_status: %', profile_user_status;
  profile_first_name := metadata ->> 'first_name';
  RAISE NOTICE '[handle_new_invited_user] Extracted first_name: %', profile_first_name;
  profile_last_name := metadata ->> 'last_name';
  RAISE NOTICE '[handle_new_invited_user] Extracted last_name: %', profile_last_name;
  profile_preferred_ui_language := COALESCE((metadata ->> 'preferred_ui_language')::TEXT, 'en');
  RAISE NOTICE '[handle_new_invited_user] Extracted preferred_ui_language: %', profile_preferred_ui_language;

  RAISE NOTICE '[handle_new_invited_user] Attempting to UPDATE public.profiles for ID: % with Email: %, CompID: %, Role: %, Admin: %, Status: %, Name: % %',
    profile_id, profile_email, profile_company_id, profile_user_role, profile_is_admin, profile_user_status, profile_first_name, profile_last_name;

  BEGIN
    UPDATE public.profiles
    SET
      email = profile_email, -- Ensure email is updated from auth.users
      first_name = profile_first_name,
      last_name = profile_last_name,
      user_role = profile_user_role,
      company_id = profile_company_id,
      is_admin = profile_is_admin,
      user_status = profile_user_status,
      preferred_ui_language = profile_preferred_ui_language,
      updated_at = now() -- Also update the updated_at timestamp
    WHERE
      id = profile_id;

    -- Check if the update affected any row. If not, a profile didn't exist.
    IF NOT FOUND THEN
      RAISE NOTICE '[handle_new_invited_user] UPDATE found no existing profile for ID: %. Attempting INSERT instead.', profile_id;
      -- This INSERT is a fallback, assuming the primary issue is the duplicate key due to an existing profile.
      -- If the other mechanism reliably creates a profile, this INSERT might not be strictly necessary
      -- but adds robustness.
      INSERT INTO public.profiles (id, email, first_name, last_name, user_role, company_id, is_admin, user_status, preferred_ui_language)
      VALUES (profile_id, profile_email, profile_first_name, profile_last_name, profile_user_role, profile_company_id, profile_is_admin, profile_user_status, profile_preferred_ui_language);
      RAISE NOTICE '[handle_new_invited_user] Fallback INSERT into public.profiles successful for ID: %', profile_id;
    ELSE
      RAISE NOTICE '[handle_new_invited_user] UPDATE of public.profiles successful for ID: %', profile_id;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '[handle_new_invited_user] EXCEPTION during UPDATE/INSERT for ID: %. SQLSTATE: %, SQLERRM: %', profile_id, SQLSTATE, SQLERRM;
      RAISE;
  END;
  RETURN NEW;
END;
$$;

-- Create the trigger to call this function after a new user is inserted in auth.users
-- DROP TRIGGER IF EXISTS on_auth_user_invited_created ON auth.users; -- Keep commented unless known safe
CREATE TRIGGER on_auth_user_invited_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_invited_user();

COMMENT ON FUNCTION public.handle_new_invited_user() IS
'Handles creation or update of a public.profiles entry for a new user created via invitation, using metadata from inviteUserByEmail. Attempts UPDATE first, then INSERT. Includes detailed logging.';
COMMENT ON TRIGGER on_auth_user_invited_created ON auth.users IS
'After a new user is created in auth.users (e.g. after accepting an invitation), create or update their corresponding profile in public.profiles.';

-- Advise user:
-- IMPORTANT: Review your existing trigger 'on_new_user_profile_created' on 'public.profiles'.
-- It appears to be designed for a different signup flow or profile creation process.
-- If users are now primarily added via invitation or a standard Supabase signup that creates an auth.users entry first,
-- the old trigger 'on_new_user_profile_created' might be redundant or could cause conflicts
-- (e.g., trying to update a profile that this new trigger already created/updated).
-- You may need to modify or remove it depending on your overall user management strategy.
-- The trigger 'handle_new_user_profile_setup' which is called by 'on_new_user_profile_created'
-- might still be relevant if you have other flows that insert directly into public.profiles first,
-- or if users can sign up without an invitation and then have their profile updated.
-- This new 'on_auth_user_invited_created' trigger is specifically for the invite flow.
