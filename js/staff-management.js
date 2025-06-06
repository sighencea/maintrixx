// js/staff-management.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Staff Management script loaded.');

    // Check if Supabase client is available
    if (!window._supabase) {
        console.error('Supabase client not found. Make sure it is loaded and initialized.');
        alert('Error: Supabase client not found. Staff management functionality may not work.');
        return;
    }
    const supabase = window._supabase;

    // DOM Elements
    const staffTableBody = document.getElementById('staffTableBody');
    const addNewStaffMemberBtn = document.getElementById('addNewStaffMemberBtn');
    const searchInput = document.querySelector('input[data-i18n="staffPage.filters.searchPlaceholder"]');

    // Modals
    const addStaffModalEl = document.getElementById('addStaffModal');
    const addStaffModalInstance = addStaffModalEl ? new bootstrap.Modal(addStaffModalEl) : null;
    // const viewStaffModalEl = document.getElementById('viewStaffModal');
    // const viewStaffModalInstance = viewStaffModalEl ? new bootstrap.Modal(viewStaffModalEl) : null;
    // const editStaffModalEl = document.getElementById('editStaffModal');
    // const editStaffModalInstance = editStaffModalEl ? new bootstrap.Modal(editStaffModalEl) : null;

    if (!addStaffModalInstance) {
        console.error('Add Staff Modal element not found or failed to initialize.');
    }

    if (!staffTableBody) {
        console.error('Staff table body (staffTableBody) not found.');
        return;
    }
    if (!addNewStaffMemberBtn) {
        console.warn('Add New Staff Member button (addNewStaffMemberBtn) not found.');
    }
     if (!searchInput) {
        console.warn('Search input not found.');
    }

    // Placeholder for fetched staff data
    let allStaffData = [];
    let currentAdminProfile = null; // To store admin's profile

    // --- Function Definitions ---

    // Function to fetch current user's profile (including company_id)
    async function getCurrentAdminProfile() {
        console.log('getCurrentAdminProfile called');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('Error fetching user:', userError);
            throw new Error(`Error fetching user: ${userError.message}`);
        }
        if (!user) {
            throw new Error("User not authenticated. Please log in.");
        }

        const { data: profile, error: profileError } = await supabase
           .from('profiles')
           .select('company_id, preferred_ui_language, id') // id is adminUserId
           .eq('id', user.id)
           .single();

        if (profileError) {
            console.error('Error fetching admin profile:', profileError);
            throw new Error(`Error fetching admin profile: ${profileError.message}`);
        }
        if (!profile) {
            throw new Error("Admin profile not found.");
        }
        console.log('Admin profile fetched:', profile);
        return profile;
    }

    // Function to fetch staff for a company
    async function fetchStaffForCompany(companyId, adminUserId) {
        console.log(`fetchStaffForCompany called for companyId: ${companyId}, adminUserId: ${adminUserId}`);
        if (!companyId) {
            console.error('companyId is required to fetch staff.');
            throw new Error('Company ID is required.');
        }
        if (!adminUserId) {
            console.error('adminUserId is required to exclude admin from staff list.');
            // Depending on strictness, you might throw or just warn.
            // For now, let's proceed but this might fetch the admin too if is_admin isn't false for them.
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, user_role, user_status')
          .eq('company_id', companyId)
          .eq('is_admin', false) // Ensure we only fetch non-admin staff members
        // .neq('id', adminUserId); // Alternative or additional check to exclude the admin by their own ID

        if (error) {
            console.error('Error fetching staff for company:', error);
            throw new Error(`Error fetching staff: ${error.message}`);
        }
        console.log('Staff for company fetched:', data);
        return data || [];
    }

    // Function to render staff data to the table
    function renderStaffTable(staffList) {
        console.log('renderStaffTable called with:', staffList);
        staffTableBody.innerHTML = ''; // Clear existing rows

        if (!staffList || staffList.length === 0) {
            staffTableBody.innerHTML = '<tr><td colspan="6" class="text-center" data-i18n="staffPage.table.noStaff">No staff members found.</td></tr>';
            // TODO: Add i18n key staffPage.table.noStaff to en.json and de.json
            // Make sure i18n is initialized and can translate this dynamically if page loads fast
            if (window.i18next && typeof window.updateUI === 'function') {
                window.updateUI(); // Attempt to translate dynamically added content
            }
            return;
        }

        staffList.forEach(staff => {
            const row = staffTableBody.insertRow();
            const status = staff.user_status || 'N/A';
            let statusBadgeClass = 'badge-custom-gray'; // Default for N/A or other statuses
            if (status === 'Active') {
                statusBadgeClass = 'badge-custom-green';
            } else if (status === 'New') { // Assuming 'New' is a possible status
                statusBadgeClass = 'badge-custom-blue';
            } else if (status === 'Invited') { // Example for another status
                statusBadgeClass = 'badge-custom-yellow'; // You'd need to define this style
            } else if (status === 'Inactive') {
                statusBadgeClass = 'badge-custom-gray';
            }

            row.innerHTML = `
                <td class="staff-col-profile"><i class="bi bi-person-circle fa-2x text-secondary"></i></td>
                <td>${staff.first_name || ''} ${staff.last_name || ''}</td>
                <td>${staff.user_role || 'N/A'}</td>
                <td class="staff-col-assigned-tasks">0</td> <!-- Placeholder -->
                <td class="staff-col-status"><span class="badge-custom-base ${statusBadgeClass}">${status}</span></td>
                <td>
                    <button class="btn btn-link text-primary p-0 me-2 view-staff-btn" data-staff-id="${staff.id}" title="View Details" data-i18n="[title]staffPage.table.actions.viewDetailsTooltip"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn btn-link text-warning p-0 edit-staff-btn" data-staff-id="${staff.id}" title="Edit Profile" data-i18n="[title]staffPage.table.actions.editProfileTooltip"><i class="bi bi-pencil-square"></i></button>
                </td>
            `;
            `;
        });
        // Re-apply i18n for dynamically added tooltips if necessary
        if (window.i18next && typeof window.updateUI === 'function') {
            window.updateUI();
        }
    }

    // Function to filter staff based on search input
    function filterStaff() {
        if (!searchInput) { // Guard clause if search input not present
            renderStaffTable(allStaffData); // Render all data if no search input
            return;
        }
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!allStaffData) {
            renderStaffTable([]); // Render empty if no base data
            return;
        }

        const filteredStaff = allStaffData.filter(staff => {
            const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.toLowerCase();
            const email = (staff.email || '').toLowerCase();
            const role = (staff.user_role || '').toLowerCase();
            return fullName.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
        });
        renderStaffTable(filteredStaff);
    }

    // --- Event Listeners ---
    if (addNewStaffMemberBtn && addStaffModalInstance) {
        addNewStaffMemberBtn.addEventListener('click', () => {
            console.log('Add New Staff Member button clicked');
            const addStaffForm = document.getElementById('addStaffForm');
            if (addStaffForm) addStaffForm.reset(); // Reset form before showing
            const addStaffMessage = document.getElementById('addStaffMessage');
            if (addStaffMessage) addStaffMessage.innerHTML = ''; // Clear any previous messages
            addStaffModalInstance.show();
        });
    }

    const addStaffForm = document.getElementById('addStaffForm');
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', handleAddStaffFormSubmit);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterStaff);
    }

    // Event delegation for view/edit buttons (to be implemented more robustly)
    staffTableBody.addEventListener('click', (event) => {
        const viewButton = event.target.closest('.view-staff-btn');
        const editButton = event.target.closest('.edit-staff-btn');

        if (viewButton) {
            const staffId = viewButton.dataset.staffId;
            console.log('View staff:', staffId);
            // const viewModalInstance = bootstrap.Modal.getInstance(document.getElementById('viewStaffModal')) || new bootstrap.Modal(document.getElementById('viewStaffModal'));
            // Populate and show view modal (functionality pending)
            // viewModalInstance.show();
            alert(`View staff ID: ${staffId} (Functionality pending)`);
        } else if (editButton) {
            const staffId = editButton.dataset.staffId;
            console.log('Edit staff:', staffId);
            // const editModalInstance = bootstrap.Modal.getInstance(document.getElementById('editStaffModal')) || new bootstrap.Modal(document.getElementById('editModalInstance'));
            // Populate and show edit modal (functionality pending)
            // editModalInstance.show();
            alert(`Edit staff ID: ${staffId} (Functionality pending)`);
        }
    });

    // --- Helper function to display messages in modals ---
    function displayModalMessage(modalMessageElement, message, isError = false) {
        if (modalMessageElement) {
            modalMessageElement.innerHTML = `<div class="alert ${isError ? 'alert-danger' : 'alert-success'}" role="alert">${message}</div>`;
            if (window.i18next && typeof window.updateUI === 'function') window.updateUI();
        }
    }

    // --- Function to save a new staff member ---
    async function saveStaffMember(staffDataObject) {
        if (!currentAdminProfile || !currentAdminProfile.company_id) {
            console.error('Admin company information not available for saving staff.');
            // Attempt to re-fetch if not available, though ideally it should be there from init
            try {
                currentAdminProfile = await getCurrentAdminProfile();
                if (!currentAdminProfile || !currentAdminProfile.company_id) {
                     throw new Error('Admin company information could not be retrieved.');
                }
            } catch (error) {
                 throw new Error(`Admin company information could not be retrieved: ${error.message}`);
            }
        }

        const newProfile = {
            first_name: staffDataObject.firstName,
            last_name: staffDataObject.lastName,
            email: staffDataObject.email,
            user_role: staffDataObject.role,
            company_id: currentAdminProfile.company_id,
            is_admin: false,
            user_status: 'New', // Or 'Invited' if an invitation flow is implied
            preferred_ui_language: currentAdminProfile.preferred_ui_language || 'en', // Default to 'en'
        };

        const { data, error } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select();

        if (error) {
            console.error('Error saving staff member:', error);
            // Check for specific errors, e.g., unique constraint violation for email
            if (error.code === '23505') { // Postgres unique violation code
                 throw new Error(`Error saving staff: An account with the email ${newProfile.email} already exists.`);
            }
            throw new Error(`Error saving staff: ${error.message}`);
        }
        console.log('Staff member saved:', data);
        return data;
    }

    // --- Function to handle Add Staff form submission ---
    async function handleAddStaffFormSubmit(event) {
        event.preventDefault();
        console.log('Add Staff form submitted');

        const firstNameInput = document.getElementById('addStaffFirstName');
        const lastNameInput = document.getElementById('addStaffLastName');
        const emailInput = document.getElementById('addStaffEmail');
        const roleInput = document.getElementById('addStaffRole');
        const messageDiv = document.getElementById('addStaffMessage');
        const saveBtn = document.getElementById('saveNewStaffBtn');

        if (messageDiv) messageDiv.innerHTML = ''; // Clear previous messages

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const role = roleInput.value;

        if (!firstName || !lastName || !email || !role) {
            displayModalMessage(messageDiv, 'Please fill in all required fields.', true);
            return;
        }

        if (saveBtn) saveBtn.disabled = true;

        try {
            const staffDataObject = { firstName, lastName, email, role };
            const savedData = await saveStaffMember(staffDataObject);

            if (savedData && savedData.length > 0) {
                displayModalMessage(messageDiv, 'Staff member added successfully!', false);

                // Refresh staff list
                if (currentAdminProfile && currentAdminProfile.company_id) {
                    allStaffData = await fetchStaffForCompany(currentAdminProfile.company_id, currentAdminProfile.id);
                    renderStaffTable(allStaffData);
                } else {
                    // Fallback or error if admin profile is somehow lost
                    console.warn("Admin profile not available to refresh staff list, attempting full re-initialization of list.");
                    await initializePage(false); // Pass a flag to avoid re-initializing modals if initializePage is adapted
                }

                setTimeout(() => { // Give user time to see success message
                    if (addStaffModalInstance) addStaffModalInstance.hide();
                    if (addStaffForm) addStaffForm.reset();
                    if (messageDiv) messageDiv.innerHTML = '';
                }, 1500);
            } else {
                 displayModalMessage(messageDiv, 'Failed to save staff member. Please try again.', true);
            }
        } catch (error) {
            console.error('Error during staff saving process:', error);
            displayModalMessage(messageDiv, error.message || 'An unexpected error occurred.', true);
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }


    // --- Initial Load ---
    // Allow initializePage to optionally skip re-fetching admin profile if already available
    async function initializePage(fetchAdmin = true) {
        console.log('Initializing staff page...');
        try {
            if (fetchAdmin || !currentAdminProfile) { // Fetch admin profile if requested or not available
                currentAdminProfile = await getCurrentAdminProfile();
            }

            if (currentAdminProfile && currentAdminProfile.company_id) {
                allStaffData = await fetchStaffForCompany(currentAdminProfile.company_id, currentAdminProfile.id);
                renderStaffTable(allStaffData);
            } else {
                console.error('Could not load admin profile or company ID.');
                staffTableBody.innerHTML = '<tr><td colspan="6" class="text-center" data-i18n="staffPage.table.errorLoadingAdmin">Error loading administrator data. Your company information may not be available.</td></tr>';
                if (window.i18next && typeof window.updateUI === 'function') window.updateUI();
            }
        } catch (error) {
            console.error('Error initializing page:', error.message);
            let errorMessage = error.message;
            // Customize messages based on error content if needed
            if (error.message.includes("User not authenticated")) {
                errorMessage = "You are not logged in. Please log in to view staff.";
                // Potentially redirect to login page or show login modal
            } else if (error.message.includes("Admin profile not found")) {
                 errorMessage = "Your user profile could not be loaded. Please try again or contact support.";
            } else if (error.message.includes("Error fetching staff")) {
                errorMessage = "There was an issue retrieving the staff list for your company.";
            }
            staffTableBody.innerHTML = `<tr><td colspan="6" class="text-center" data-i18n="staffPage.table.errorLoading">${errorMessage}</td></tr>`;
            if (window.i18next && typeof window.updateUI === 'function') window.updateUI();
        }
    }

    initializePage();
});
