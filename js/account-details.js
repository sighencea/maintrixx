document.addEventListener('DOMContentLoaded', async () => {
    // Main page elements
    const fullNameElement = document.getElementById('fullName');
    const emailAddressElement = document.getElementById('emailAddress');
    const phoneNumberElement = document.getElementById('phoneNumber');
    const languageDisplayElement = document.getElementById('languageDisplay');

    // Modal elements
    const editProfileModalElement = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const modalFirstNameElement = document.getElementById('modalFirstName');
    const modalLastNameElement = document.getElementById('modalLastName');
    const modalEmailAddressElement = document.getElementById('modalEmailAddress');
    const modalPhoneNumberElement = document.getElementById('modalPhoneNumber');
    const modalLanguageSelectorElement = document.getElementById('modalLanguageSelector');
    const saveProfileChangesButton = document.getElementById('saveProfileChanges');
    const editProfileButton = document.getElementById('editProfileButton');
    const editProfileMessageElement = document.getElementById('editProfileMessage');

    // Loading state elements
    const profileDataContainer = document.getElementById('profileDataContainer');
    const profileLoadingIndicator = document.getElementById('profileLoadingIndicator');

    if (profileDataContainer && profileLoadingIndicator) {
        profileDataContainer.style.display = 'none';
        profileLoadingIndicator.classList.add('visible');
    } else {
        console.error('Profile data container or loading indicator not found.');
    }

    if (!fullNameElement || !emailAddressElement || !phoneNumberElement || !languageDisplayElement ||
        !editProfileModalElement || !editProfileForm || !modalFirstNameElement || !modalLastNameElement ||
        !modalEmailAddressElement || !modalPhoneNumberElement || !modalLanguageSelectorElement ||
        !saveProfileChangesButton || !editProfileButton || !editProfileMessageElement) {
        console.error('One or more profile or modal elements not found in account.html');
        return;
    }

    window.loadAndDisplayAccountDetails = async function() {
        if (!window._supabase) {
            console.error('Supabase client is not available.');
            fullNameElement.value = 'Error: Supabase client not found';
            emailAddressElement.value = 'Error: Supabase client not found';
            phoneNumberElement.value = 'Error: Supabase client not found';
            languageDisplayElement.value = 'Error: Supabase client not found';
            return;
        }

        try {
            const { data: { user }, error: userError } = await window._supabase.auth.getUser();

            if (userError) {
                console.error('Error fetching user:', userError);
                fullNameElement.value = 'Error fetching user';
                emailAddressElement.value = 'Error fetching user';
                phoneNumberElement.value = 'Error fetching user';
                languageDisplayElement.value = 'Error fetching user';
                return;
            }

            if (!user) {
                console.log('No user logged in.');
                fullNameElement.value = 'N/A';
                emailAddressElement.value = 'N/A';
                phoneNumberElement.value = 'N/A';
                languageDisplayElement.value = 'N/A';
                return;
            }

            const { data: profile, error: profileError } = await window._supabase
                .from('profiles')
                .select('first_name, last_name, email, phone_number, preferred_ui_language')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                fullNameElement.value = 'Error loading profile data';
                emailAddressElement.value = 'Error loading profile data';
                phoneNumberElement.value = 'Error loading profile data';
                languageDisplayElement.value = 'Error loading profile data';
                return;
            }

            if (profile) {
                const firstName = profile.first_name || '';
                const lastName = profile.last_name || '';
                fullNameElement.value = `${firstName} ${lastName}`.trim() || 'Name not set';
                emailAddressElement.value = profile.email || 'Email not set';

                if (profile.phone_number && profile.phone_number.trim() !== '') {
                    phoneNumberElement.value = profile.phone_number;
                } else {
                    phoneNumberElement.value = 'Not provided';
                }

                if (languageDisplayElement) {
                    if (profile.preferred_ui_language) {
                        let langFullName = 'Unknown';
                        if (profile.preferred_ui_language === 'en') {
                            langFullName = 'English';
                        } else if (profile.preferred_ui_language === 'de') {
                            langFullName = 'German';
                        } else {
                            langFullName = profile.preferred_ui_language;
                        }
                        languageDisplayElement.value = langFullName;
                    } else {
                        languageDisplayElement.value = 'Not set';
                    }
                }
            } else {
                console.log('No profile found for the user.');
                fullNameElement.value = 'Profile not found';
                emailAddressElement.value = 'Profile not found';
                phoneNumberElement.value = 'Profile not found';
                languageDisplayElement.value = 'Profile not found';
            }
        } catch (error) {
            console.error('An unexpected error occurred in loadAndDisplayAccountDetails:', error);
            fullNameElement.value = 'Failed to load profile';
            emailAddressElement.value = 'Failed to load profile';
            phoneNumberElement.value = 'Failed to load profile';
            languageDisplayElement.value = 'Failed to load profile';
        } finally {
            if (profileDataContainer && profileLoadingIndicator) {
                profileLoadingIndicator.classList.remove('visible');
                profileDataContainer.style.display = 'block';
            }
        }
    };

    await window.loadAndDisplayAccountDetails(); // Initial load

    // Populate Modal on Show Event
    if (editProfileModalElement && editProfileButton) {
        // const modalInstance = new bootstrap.Modal(editProfileModalElement); // Not strictly needed if only using button's data-bs-toggle

        editProfileButton.addEventListener('click', async () => {
            editProfileMessageElement.style.display = 'none'; // Clear previous messages
            try {
                const { data: { user } , error: userErr } = await window._supabase.auth.getUser();
                if (userErr || !user) {
                    editProfileMessageElement.textContent = 'User not logged in or session expired.';
                    editProfileMessageElement.className = 'alert alert-danger';
                    editProfileMessageElement.style.display = 'block';
                    console.error('Error fetching user for modal:', userErr);
                    // Consider not opening the modal or disabling save button if this happens
                    // For now, we allow modal to open but fields might be empty or save will fail
                    return;
                }

                const { data: profile, error: profileErr } = await window._supabase
                    .from('profiles')
                    .select('first_name, last_name, email, phone_number, preferred_ui_language')
                    .eq('id', user.id)
                    .single();

                if (profileErr || !profile) {
                    editProfileMessageElement.textContent = 'Error fetching profile for editing.';
                    editProfileMessageElement.className = 'alert alert-danger';
                    editProfileMessageElement.style.display = 'block';
                    console.error('Error fetching profile for modal:', profileErr);
                     // Populate with whatever is available or defaults
                    modalFirstNameElement.value = '';
                    modalLastNameElement.value = '';
                    modalEmailAddressElement.value = user.email || ''; // Email from auth user as fallback
                    modalPhoneNumberElement.value = '';
                    modalLanguageSelectorElement.value = 'en';
                    return; // Keep modal open but show error.
                }

                // Populate modal fields
                modalFirstNameElement.value = profile.first_name || '';
                modalLastNameElement.value = profile.last_name || '';
                modalEmailAddressElement.value = profile.email || ''; // Should be readonly, but populate anyway
                modalPhoneNumberElement.value = profile.phone_number || '';
                modalLanguageSelectorElement.value = profile.preferred_ui_language || 'en';

            } catch (e) {
                editProfileMessageElement.textContent = 'An unexpected error occurred preparing the form.';
                editProfileMessageElement.className = 'alert alert-danger';
                editProfileMessageElement.style.display = 'block';
                console.error('Error in editProfileButton click listener:', e);
            }
        });
    }

    // Handle Save Changes
    if (saveProfileChangesButton && editProfileForm) {
        saveProfileChangesButton.addEventListener('click', async () => {
            const firstName = modalFirstNameElement.value.trim();
            const lastName = modalLastNameElement.value.trim();
            const phoneNumber = modalPhoneNumberElement.value.trim();
            const preferredLanguage = modalLanguageSelectorElement.value;

            if (!firstName || !lastName) {
                editProfileMessageElement.textContent = 'First Name and Last Name are required.';
                editProfileMessageElement.className = 'alert alert-danger';
                editProfileMessageElement.style.display = 'block';
                return;
            }

            try {
                const { data: { user }, error: getUserError } = await window._supabase.auth.getUser();
                if (getUserError || !user) {
                    editProfileMessageElement.textContent = 'User session expired. Please log in again.';
                    editProfileMessageElement.className = 'alert alert-danger';
                    editProfileMessageElement.style.display = 'block';
                    return;
                }

                const updates = {
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber || null,
                    preferred_ui_language: preferredLanguage,
                    updated_at: new Date()
                };

                const { error: updateError } = await window._supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error updating profile:', updateError);
                    editProfileMessageElement.textContent = `Error updating profile: ${updateError.message}`;
                    editProfileMessageElement.className = 'alert alert-danger';
                    editProfileMessageElement.style.display = 'block';
                } else {
                    editProfileMessageElement.textContent = 'Profile updated successfully!';
                    editProfileMessageElement.className = 'alert alert-success';
                    editProfileMessageElement.style.display = 'block';

                    window.location.reload();

                    if (window.loadAndDisplayAccountDetails) {
                        await window.loadAndDisplayAccountDetails();
                    }

                    setTimeout(() => {
                        const modalInstance = bootstrap.Modal.getInstance(editProfileModalElement);
                        if (modalInstance) {
                           modalInstance.hide();
                        }
                        editProfileMessageElement.style.display = 'none';
                    }, 1500);
                }
            } catch (e) {
                console.error('Error saving profile changes:', e);
                editProfileMessageElement.textContent = 'An unexpected error occurred while saving.';
                editProfileMessageElement.className = 'alert alert-danger';
                editProfileMessageElement.style.display = 'block';
            }
        });
    }
});
