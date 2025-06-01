document.addEventListener('DOMContentLoaded', async () => {
    const fullNameElement = document.getElementById('fullName');
    const emailAddressElement = document.getElementById('emailAddress');
    const phoneNumberElement = document.getElementById('phoneNumber');
    const languageSelectorElement = document.getElementById('languageSelector');

    if (!fullNameElement || !emailAddressElement || !phoneNumberElement || !languageSelectorElement) {
        console.error('One or more profile elements not found in account.html');
        return;
    }

    if (!window._supabase) {
        console.error('Supabase client is not available.');
        // Potentially display a message to the user in an alert or a designated div
        return;
    }

    try {
        const { data: { user }, error: userError } = await window._supabase.auth.getUser();

        if (userError) {
            console.error('Error fetching user:', userError);
            // Display error to user if appropriate
            return;
        }

        if (!user) {
            console.log('No user logged in.');
            // Redirect to login or display message
            // For now, just ensure fields are empty or show placeholder text
            fullNameElement.value = 'N/A';
            emailAddressElement.value = 'N/A';
            phoneNumberElement.value = 'N/A';
            return;
        }

        // User is available, fetch their profile
        const { data: profile, error: profileError } = await window._supabase
            .from('profiles')
            .select('first_name, last_name, email, phone_number, preferred_ui_language')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Display error to user, perhaps keeping dummy data or clearing fields
            fullNameElement.value = 'Error loading data';
            emailAddressElement.value = 'Error loading data';
            phoneNumberElement.value = 'Error loading data';
            return;
        }

        if (profile) {
            // Populate Full Name
            const firstName = profile.first_name || '';
            const lastName = profile.last_name || '';
            fullNameElement.value = `${firstName} ${lastName}`.trim() || 'Name not set';

            // Populate Email Address
            emailAddressElement.value = profile.email || 'Email not set';

            // Populate Phone Number
            if (profile.phone_number && profile.phone_number.trim() !== '') {
                phoneNumberElement.value = profile.phone_number;
            } else {
                phoneNumberElement.value = 'Not provided'; // Hint text
            }

            // Set Language Selector
            // The existing i18next setup might handle this, but we can set it based on fetched profile
            // This ensures the selector matches the profile data if i18next hasn't initialized with it yet
            if (profile.preferred_ui_language) {
                languageSelectorElement.value = profile.preferred_ui_language;
            }
            // The existing event listener on languageSelector should still handle changes
            // and i18next's initial language setting. This just aligns the selector
            // if data is fetched before i18next fully syncs the display.

        } else {
            console.log('No profile found for the user.');
            // Clear fields or show 'Not available'
            fullNameElement.value = 'Profile not found';
            emailAddressElement.value = 'Profile not found';
            phoneNumberElement.value = 'Profile not found';
        }

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        // Display a generic error message
        fullNameElement.value = 'Failed to load profile';
        emailAddressElement.value = 'Failed to load profile';
        phoneNumberElement.value = 'Failed to load profile';
    }
});
