import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers directly in the function file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust as necessary for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskPayload {
  task_title: string;
  task_description?: string;
  task_due_date?: string | null;
  property_id: string;
  staff_id: string; // This is the profile_id of the staff member
  task_status: string;
  task_priority?: string; // Add this line
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Only admin users should be able to create tasks through this function
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin, company_id') // Also fetch company_id of the admin/staff directly from their profile
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Profile error:', profileError)
      return new Response(JSON.stringify({ error: 'Could not retrieve user profile' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!userProfile.is_admin) {
      return new Response(JSON.stringify({ error: 'User is not authorized to create tasks' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Get the company_id of the admin.
    // An admin should have an associated company they own/manage.
    // We'll use this to ensure properties and staff belong to the same company.
    let adminCompanyId = userProfile.company_id;

    // If admin's profile doesn't directly have a company_id (e.g., if they are pure owner not listed as staff of their own company)
    // then fetch it from the 'companies' table via owner_id
    if (!adminCompanyId) {
        const { data: companyData, error: companyError } = await supabaseClient
            .from('companies')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (companyError || !companyData) {
            console.error('Company fetch error:', companyError);
            return new Response(JSON.stringify({ error: 'Admin is not associated with a company.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403, // Forbidden, as they can't manage resources without a company
            });
        }
        adminCompanyId = companyData.id;
    }

    if (!adminCompanyId) {
         return new Response(JSON.stringify({ error: 'Could not determine admin company ID.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    const payload: TaskPayload = await req.json()

    // Validate payload
    if (!payload.task_title || !payload.property_id || !payload.staff_id || !payload.task_status || !payload.task_priority) {
      return new Response(JSON.stringify({ error: 'Missing required fields: task_title, property_id, staff_id, task_status, task_priority' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Server-side validation: Check if the property_id belongs to the admin's company
    const { data: propertyData, error: propertyError } = await supabaseClient
      .from('properties')
      .select('id, company_id')
      .eq('id', payload.property_id)
      .single()

    if (propertyError || !propertyData) {
      console.error('Property validation error:', propertyError);
      return new Response(JSON.stringify({ error: 'Invalid property ID or property not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (propertyData.company_id !== adminCompanyId) {
      return new Response(JSON.stringify({ error: 'Property does not belong to your company.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      })
    }

    // Server-side validation: Check if the staff_id (profile_id) belongs to the admin's company
    const { data: staffProfileData, error: staffProfileError } = await supabaseClient
      .from('profiles')
      .select('id, company_id')
      .eq('id', payload.staff_id)
      .single()

    if (staffProfileError || !staffProfileData) {
       console.error('Staff profile validation error:', staffProfileError);
      return new Response(JSON.stringify({ error: 'Invalid staff ID or staff member not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (staffProfileData.company_id !== adminCompanyId) {
      return new Response(JSON.stringify({ error: 'Assigned staff member does not belong to your company.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      })
    }

    const taskToInsert = {
      task_title: payload.task_title,
      task_description: payload.task_description,
      task_due_date: payload.task_due_date || null,
      property_id: payload.property_id,
      staff_id: payload.staff_id, // This is the profile_id of the staff
      task_status: payload.task_status, // Already exists
      task_priority: payload.task_priority || 'Medium', // Add this, default to 'Medium' if not provided
      company_id: adminCompanyId, // Associate task with the admin's company
      created_by: user.id, // Track who created the task
    }

    const { data: newTask, error: insertError } = await supabaseClient
      .from('tasks')
      .insert(taskToInsert)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting task:', insertError)
      return new Response(JSON.stringify({ error: 'Could not create task', details: insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true, data: newTask }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // 201 Created
    })

  } catch (error) {
    console.error('General error in create-task function:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
