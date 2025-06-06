// supabase/functions/create-initial-profile/index.ts

import { serve } from 'https://deno.land/std@0.161.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Create Initial Profile Edge Function starting up...');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permissive for local dev; restrict in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  firstName?: string;
  accountType?: 'agency' | 'user'; // Define expected account types
  preferredUiLanguage?: string;
}

interface ProfileData {
  id: string;
  email?: string;
  first_name: string;
  preferred_ui_language: string;
  user_status: 'New';
  is_admin: boolean;
  has_company_set_up: boolean;
  company_id: null; // Explicitly null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Request received:', req.method, req.url);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables (URL or Service Role Key).');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing environment variables.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdminClient: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);
    console.log('Supabase admin client initialized.');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('Missing Authorization header.');
      return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const jwt = authHeader.replace('Bearer ', '');
    console.log('JWT extracted from Authorization header.');

    const { data: { user }, error: userError } = await supabaseAdminClient.auth.getUser(jwt);

    if (userError) {
      console.error('Error getting user from JWT:', userError.message);
      return new Response(JSON.stringify({ error: 'Invalid token or user retrieval failed.', details: userError.message }), {
        status: 403, // Forbidden or Unauthorized
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!user) {
      console.error('No user found for the provided JWT.');
      return new Response(JSON.stringify({ error: 'User not found for token.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User retrieved successfully from JWT:', user.id, user.email);

    if (!req.body) {
        console.warn('Request body is missing.');
        return new Response(JSON.stringify({ error: 'Request body is missing.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let requestBody: RequestBody;
    try {
        requestBody = await req.json();
        console.log('Request body parsed:', requestBody);
    } catch (e) {
        console.error('Error parsing request body as JSON:', e.message);
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body.', details: e.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }


    if (!requestBody.firstName || typeof requestBody.firstName !== 'string' || requestBody.firstName.trim() === '') {
      console.warn('Validation failed: firstName is required.');
      return new Response(JSON.stringify({ error: 'Validation failed: firstName is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!requestBody.accountType || (requestBody.accountType !== 'agency' && requestBody.accountType !== 'user')) {
        console.warn('Validation failed: accountType must be "agency" or "user".');
        return new Response(JSON.stringify({ error: 'Validation failed: accountType must be "agency" or "user".' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    const profileDataToInsert: ProfileData = {
      id: user.id,
      email: user.email,
      first_name: requestBody.firstName.trim(),
      preferred_ui_language: requestBody.preferredUiLanguage || 'en',
      user_status: 'New',
      is_admin: requestBody.accountType === 'agency',
      has_company_set_up: false,
      company_id: null,
    };
    console.log('Constructed profile data for insertion:', profileDataToInsert);

    const { data: insertedProfile, error: insertError } = await supabaseAdminClient
      .from('profiles')
      .insert([profileDataToInsert])
      .select()
      .single(); // Use single() if you expect only one row and want the object directly

    if (insertError) {
      console.error('Error inserting profile:', insertError.message);
      // Check for specific error codes, e.g., unique constraint violation (23505 for PostgreSQL)
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Profile already exists for this user.', details: insertError.message }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to create profile.', details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Profile created successfully:', insertedProfile);
    return new Response(JSON.stringify({ success: true, profile: insertedProfile }), {
      status: 201, // Created
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Unexpected error in function:', e.message, e.stack);
    return new Response(JSON.stringify({ error: 'Server error.', details: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
