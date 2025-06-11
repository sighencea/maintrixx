-- Create the storage bucket for agency logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('agency-logo', 'agency-logo', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects table (if not already enabled)
-- Supabase usually has this enabled by default. If this command fails, it's likely already enabled.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'agency-logo' bucket

-- 1. Policy: Authenticated users can upload logos into their own folder
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'agency-logo'
    AND auth.role() = 'authenticated' -- Redundant with "TO authenticated" but good for clarity
    AND (storage.foldername(name))[1] = auth.uid()::text -- Files must be in a folder named after the user's ID
);

-- 2. Policy: Allow public read access to objects in 'agency-logo' bucket
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT TO anon, authenticated -- Or just `public` role if that's how Supabase handles it broadly
USING (
    bucket_id = 'agency-logo'
);

-- 3. Policy: Owners can update their own logos
CREATE POLICY "Owners can update their own logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'agency-logo'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'agency-logo'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Owners can delete their own logos
CREATE POLICY "Owners can delete their own logos"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'agency-logo'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
