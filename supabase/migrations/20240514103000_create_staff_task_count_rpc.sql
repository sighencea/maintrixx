-- supabase/migrations/20240514103000_create_staff_task_count_rpc.sql

CREATE OR REPLACE FUNCTION get_staff_for_company_with_task_counts(p_company_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    user_role TEXT,
    user_status TEXT,
    assigned_tasks_count BIGINT,
    is_owner BOOLEAN -- New column
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the companies table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'companies'
    ) THEN
        RAISE WARNING 'Companies table not found. Cannot determine ownership. Returning staff without owner status.';
        -- Fallback to original logic if companies table is missing
        -- Return is_owner as FALSE in this case.
         RETURN QUERY
            SELECT
                p.id,
                p.first_name,
                p.last_name,
                p.email,
                p.user_role,
                p.user_status,
                0::BIGINT AS assigned_tasks_count,
                FALSE AS is_owner -- Default is_owner to FALSE
            FROM
                profiles p
            WHERE
                p.company_id = p_company_id;
    -- Check if the tasks table exists
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tasks'
    ) THEN
        RAISE WARNING 'Tasks table not found. Returning 0 for task counts.';
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.user_role,
            p.user_status,
            0::BIGINT AS assigned_tasks_count,
            (p.id = c.owner_id) AS is_owner
        FROM
            profiles p
        JOIN
            companies c ON p.company_id = c.id -- Join companies table
        WHERE
            p.company_id = p_company_id;
    -- Check if assigned_to_user_id column exists in tasks table
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'assigned_to_user_id'
    ) THEN
        RAISE WARNING 'Column assigned_to_user_id does not exist in tasks table. Returning 0 for task counts.';
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.user_role,
            p.user_status,
            0::BIGINT AS assigned_tasks_count,
            (p.id = c.owner_id) AS is_owner
        FROM
            profiles p
        JOIN
            companies c ON p.company_id = c.id -- Join companies table
        WHERE
            p.company_id = p_company_id;
    ELSE
        -- If all tables and columns exist, proceed with the full join logic
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.user_role,
            p.user_status,
            COUNT(t.id) AS assigned_tasks_count,
            (p.id = c.owner_id) AS is_owner -- Determine if the profile user is the company owner
        FROM
            profiles p
        JOIN
            companies c ON p.company_id = c.id -- Join companies table to check owner_id
        LEFT JOIN
            tasks t ON p.id = t.assigned_to_user_id
        WHERE
            p.company_id = p_company_id
        GROUP BY
            p.id, p.first_name, p.last_name, p.email, p.user_role, p.user_status, c.owner_id; -- Add c.owner_id to GROUP BY
    END IF;
END;
$$;

-- Grant execution rights to the authenticated role (or any relevant role)
GRANT EXECUTE ON FUNCTION get_staff_for_company_with_task_counts(UUID) TO authenticated;

COMMENT ON FUNCTION get_staff_for_company_with_task_counts(UUID) IS
'Retrieves staff members for a given company ID with a count of their assigned tasks and an is_owner flag.
If the tasks table or the assigned_to_user_id column does not exist, it returns staff with 0 task count.
If the companies table doesn''t exist, is_owner will be false and a warning raised.';
