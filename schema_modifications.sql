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
