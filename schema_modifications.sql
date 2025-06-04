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
