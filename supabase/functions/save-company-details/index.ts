import { serve } from 'https://deno.land/std@0.161.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define a type for the expected request body
interface CompanyData {
  company_name: string;
  company_address_street: string;
  company_email: string;
  company_city: string;
  company_state: string;
  company_address_zip: string; // Matched to client-side js/agency_setup.js
  company_phone?: string | null;
  company_website?: string | null;
  company_tax_id?: string | null;
  company_logo_url?: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust for production; '*' is permissive
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Specify allowed methods
};

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Supabase environment variables.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase admin client for privileged operations
    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get User from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
        status: 401, // Unauthorized
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a client with the user's token to verify their identity
    const userSupabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User retrieval error:', userError?.message || 'User not found.');
      return new Response(JSON.stringify({ error: 'Invalid token or user not found.' }), {
        status: 403, // Forbidden
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    // 2. Parse Request Body
    if (req.body === null) {
        return new Response(JSON.stringify({ error: 'Request body is missing.' }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const companyData = (await req.json()) as CompanyData;

    // 3. Server-Side Validation
    const requiredFields: (keyof CompanyData)[] = [
      'company_name', 'company_address_street', 'company_email',
      'company_city', 'company_state', 'company_address_zip'
    ];
    const missingFields = requiredFields.filter(field => !companyData[field]);

    if (missingFields.length > 0) {
      return new Response(JSON.stringify({ error: `Missing required company fields: ${missingFields.join(', ')}.` }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyData.company_email)) {
      return new Response(JSON.stringify({ error: 'Invalid company email format.' }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Database Operations (using admin client)
    // Insert into companies table
    const { data: companyInsertData, error: companyInsertError } = await supabaseAdminClient
      .from('companies')
      .insert([{
        owner_id: userId,
        company_name: companyData.company_name,
        company_address_street: companyData.company_address_street,
        company_email: companyData.company_email,
        company_city: companyData.company_city,
        company_state: companyData.company_state,
        company_address_zip: companyData.company_address_zip,
        company_phone: companyData.company_phone || null,
        company_website: companyData.company_website || null,
        company_tax_id: companyData.company_tax_id || null,
        company_logo_url: companyData.company_logo_url || null,
      }])
      .select()
      .single();

    if (companyInsertError) {
      console.error('Error inserting company:', companyInsertError.message);
      return new Response(JSON.stringify({ error: 'Failed to save company information.', details: companyInsertError.message }), {
        status: 500, // Internal Server Error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profiles table
    const { error: profileUpdateError } = await supabaseAdminClient
      .from('profiles')
      .update({ is_admin: true, has_company_set_up: true })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError.message);
      // CRITICAL: Company was inserted, but profile update failed.
      // This state should be logged for potential manual reconciliation.
      // For now, return an error indicating partial success or specific failure.
      return new Response(JSON.stringify({
        error: 'Company information saved, but failed to update profile status. Please contact support.',
        details: profileUpdateError.message
      }), {
        status: 500, // Internal Server Error (or a custom status code)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Company details saved successfully.', company: companyInsertData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // OK or 201 Created
    });

  } catch (e) {
    console.error('Unexpected error in function:', e.message, e.stack);
    // Check if it's a JSON parsing error
    if (e instanceof SyntaxError && e.message.includes('JSON')) {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body.', details: e.message }), {
            status: 400, // Bad Request
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ error: 'Server error.', details: e.message }), {
      status: 500, // Internal Server Error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
