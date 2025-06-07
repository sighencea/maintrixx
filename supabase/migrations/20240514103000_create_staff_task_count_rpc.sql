-- supabase/migrations/YYYYMMDDHHMMSS_create_staff_task_count_rpc.sql

CREATE OR REPLACE FUNCTION get_staff_for_company_with_task_counts(p_company_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    user_role TEXT,
    user_status TEXT,
    assigned_tasks_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the tasks table and assigned_to_user_id column exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tasks'
    ) THEN
        -- If tasks table doesn't exist, return profiles without task counts
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.user_role,
            p.user_status,
            0::BIGINT AS assigned_tasks_count -- Return 0 for task count
        FROM
            profiles p
        WHERE
            p.company_id = p_company_id;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'assigned_to_user_id'
    ) THEN
        -- If assigned_to_user_id column doesn't exist in tasks table, return profiles without task counts
        RAISE WARNING 'Column assigned_to_user_id does not exist in tasks table. Returning 0 for task counts.';
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.user_role,
            p.user_status,
            0::BIGINT AS assigned_tasks_count
        FROM
            profiles p
        WHERE
            p.company_id = p_company_id;
    ELSE
        -- If tasks table and column exist, proceed with the join
        RETURN QUERY
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.user_role,
            p.user_status,
            COUNT(t.id) AS assigned_tasks_count
        FROM
            profiles p
        LEFT JOIN
            tasks t ON p.id = t.assigned_to_user_id
        WHERE
            p.company_id = p_company_id
        GROUP BY
            p.id, p.first_name, p.last_name, p.email, p.user_role, p.user_status;
    END IF;
END;
$$;

-- Grant execution rights to the authenticated role (or any relevant role)
-- This allows the function to be called by your application users.
GRANT EXECUTE ON FUNCTION get_staff_for_company_with_task_counts(UUID) TO authenticated;
-- If you have a service_role or other specific roles that need to execute this, grant them as well.
-- GRANT EXECUTE ON FUNCTION get_staff_for_company_with_task_counts(UUID) TO service_role;

COMMENT ON FUNCTION get_staff_for_company_with_task_counts(UUID) IS
'Retrieves staff members for a given company ID with a count of their assigned tasks.
If the tasks table or the assigned_to_user_id column does not exist, it returns staff with 0 task count and raises a warning.';
