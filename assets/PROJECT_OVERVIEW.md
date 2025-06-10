# Project Overview: Property Hub Management System

## 1. General Project Overview

### 1.1. Purpose
Property Hub is a web application designed for property management agencies and related businesses. It provides a centralized platform to manage properties, associated tasks, staff members, and company administration, streamlining operations and improving efficiency.

### 1.2. Key Features
*   User Authentication: Secure sign-up, sign-in, and session management.
*   Multi-Company Support: Designed for agencies to manage their specific portfolio.
*   Company Setup: Workflow for new agency admins to register and set up their company details.
*   Staff Management: Admins can invite, view, and edit staff member profiles within their company.
*   Property Management: Functionality to add, view, and manage property details.
*   Task Management: Creation of tasks, assignment to staff members, tracking task status, and viewing task details.
*   User Profile Management: Users can edit their own profile information.
*   Role-Based Access Control: Strict permissions differentiate what admins and staff members can see and do.
*   Internationalization (i18n): Supports multiple languages for the user interface.

### 1.3. User Roles
*   **Administrator (Admin):**
    *   Typically the agency owner or manager.
    *   Manages company settings, staff, properties, and tasks within their company.
    *   Has a comprehensive view of all data pertaining to their company.
*   **Staff Member (Non-Admin):**
    *   Invited to join a company by an Admin.
    *   Views and manages tasks assigned to them.
    *   Manages their own user profile.
    *   Access to other data is restricted by RLS.

### 1.4. Technical Stack
*   **Frontend:** HTML, CSS, JavaScript
*   **UI Framework:** Bootstrap 5
*   **Internationalization:** i18next
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Edge Functions, RLS)

### 1.5. Key Database Tables (related to recent RLS work)
*   `public.profiles`: User information, roles (`is_admin`), company affiliation (`company_id`), status.
*   `public.companies`: Company details, linked to `profiles`.
*   `public.properties`: Property details, linked to `companies`.
*   `public.tasks`: Task information, linked to `properties` and `task_assignments`.
*   `public.task_assignments`: Links tasks to assigned users.
*   `public.detailed_task_assignments` (Function): Aggregates task assignment details.

### 1.6. General RLS Strategy
*   Users access/modify their own data.
*   Admins have broader access within their `company_id`.
*   JWT metadata (`app_metadata` for `is_admin`, `company_id`) used via SQL helper functions (`public.current_user_is_admin()`, `public.current_user_company_id()`) for non-recursive RLS policies on `profiles`.
*   Non-admins have restricted views to relevant data.

---

## 2. Recent Updates: RLS Overhaul & Bug Fixing

### 2.1. Summary
Resolved critical "infinite recursion" RLS errors on `profiles`, `tasks`, and `task_assignments`. Overhauled RLS policies, introduced JWT-based helper functions, and fixed related UI/logic bugs. Restored stable sign-in and correct data visibility.

### 2.2. Challenges Faced
*   Initial "infinite recursion" on `profiles` during sign-in.
*   Secondary recursion errors on `tasks` and `task_assignments` with initial JWT-based fixes.
*   Silent `UPDATE` failures for admin staff edits (PGRST116 error, then data not saving).
*   UI bugs: Unresponsive "Save Changes" button in staff edit modal; incomplete `WITH CHECK` clauses in RLS policies causing signup verification errors.

### 2.3. How We Tackled the Challenges
1.  **Isolation & JWT for `profiles` RLS:** Systematically debugged `profiles` RLS. Introduced `current_user_is_admin()` and `current_user_company_id()` functions reading JWT `app_metadata` to make admin `SELECT` policies on `profiles` non-recursive.
2.  **Systematic Policy Re-enablement:** Added back `profiles` policies (`INSERT`, `UPDATE`, other `SELECT`) one by one, testing at each step.
3.  **RLS for `tasks` & `task_assignments`:** Reverted JWT-based policies for these tables when they caused new recursion. Confirmed original user policies were now safe due to stable `profiles` RLS.
4.  **Staff Update Debugging (`PGRST116` & Silent Failures):**
    *   Modified JS `updateStaffMember` to remove `.select().single()` which was conflicting with RLS post-update.
    *   Identified and created the missing `UPDATE` RLS policy `"Profiles - Allow admin to update staff in own company"`.
    *   Corrected incomplete `WITH CHECK` clauses in other `UPDATE` RLS policies.
5.  **UI Fixes:** Corrected HTML form structure for staff edit modal button.
6.  **Function vs. View:** Clarified `detailed_task_assignments` is a function, focusing RLS on its underlying tables.

### 2.4. Features Implemented/Restored
*   Stable user sign-in for all roles.
*   Correct data visibility for admins (staff list, company tasks/assignments).
*   Admins can reliably invite, view, and edit staff.
*   Users can edit their own profiles with restrictions.
*   New user/agency signup and staff invitation flows are functional.

### 2.5. Key RLS Policies (Final Active Set Summary)
*   **`public.profiles`:**
    *   `SELECT`: `"Profiles - Allow user to read own data"`, `"Admins can view staff in their company (JWT)"`.
    *   `INSERT`: `"Profiles - Allow admin to insert staff in their own company"`, `"Profiles - Allow user to insert own initial profile"`.
    *   `UPDATE`: `"Profiles - Allow user to update own profile (restricted)"`, `"Profiles - Allow admin to update staff in own company"`, `"Allow users to update own language preference"` (all with non-recursive logic and complete `WITH CHECK` clauses).
*   **`public.tasks`:**
    *   `SELECT (User)`: `"Allow users to view their assigned tasks (v2)"`.
    *   `SELECT (Admin/Owner)`: `"Allow read access to tasks of owned companies"`.
*   **`public.task_assignments`:**
    *   `SELECT (User)`: `"Allow user to see their own task assignments"`.
    *   `SELECT (Admin)`: `"Admin can read task assignments in own company"`.
    *   `SELECT (Owner)`: `"Allow company owner to read task assignments in their company"`.
*   **`public.detailed_task_assignments` (Function):** No direct RLS policies; access controlled by RLS on tables it queries.

### 2.6. Triggers Implemented
*   **`on_new_user_profile_created`** on `profiles` (`AFTER INSERT`): Calls `handle_new_user_profile_setup` (`SECURITY DEFINER`).

### 2.7. Edge Functions Implemented (Relevant Inferred)
*   `invite-staff-member`, `create-task`, `activate-profile`, `save-company-details`.

### 2.8. Website Operation Overview
*   Supabase Auth for authentication. Admins (`is_admin` in JWT) manage their `company_id` data. Staff access is restricted to their own tasks/profile. Edge Functions handle specific backend operations, often with elevated privileges but implementing business logic for data assignments.

### 2.9. Open Bugs (From this RLS overhaul)
*   User to list any minor non-RLS/non-recursion bugs found during recent comprehensive testing.

### 2.10. Next Steps Planned
*   Address any minor bugs from testing.
*   User review and approval of this document.
*   Merge all code changes (JS, HTML fixes) and this documentation.
*   Monitor application stability.
