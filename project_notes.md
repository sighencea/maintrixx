## Feature: Dynamic Recent Activity Section (Discussed 2024-07-30)

**Goal:** Replace the hardcoded "Recent Activity" section on `pages/dashboard.html` with dynamic data from a database table (e.g., `activity_log`).

**General Approach Discussed:**

1.  **Database Design (User Task, Agent Input if needed):**
    *   Define activities to log (e.g., property added, task created/completed).
    *   Design/confirm `activity_log` table (columns: id, timestamp, user_id, activity_type, description, details_json, related_entity_id, related_entity_type).
    *   User to set up the table and RLS in Supabase.

2.  **Logging Activities (User Task - Backend/Triggers):**
    *   Implement database triggers or application code to record activities in `activity_log`.

3.  **Fetching Activity Data (Agent Task - Frontend JS):**
    *   New JS function to query `activity_log` via Supabase client (fetch recent, order by timestamp).

4.  **Displaying Activity Data (Agent Task - HTML & JS):**
    *   Modify `pages/dashboard.html`: Clear hardcoded table body, give `<tbody>` an ID.
    *   JS DOM manipulation to dynamically create and append table rows from fetched data.
    *   Handle "No recent activity" case.

5.  **Styling and Formatting (Agent Task, User Feedback):**
    *   Ensure consistent styling, format timestamps.

**Pending Input from User:**

*   What specific activities should be logged?
*   Is there an existing table structure for `activity_log`, or should a new one be defined based on requirements?
*   Preferred method for logging activities (database triggers, application code)?
