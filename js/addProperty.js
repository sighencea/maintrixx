// js/addProperty.js
document.addEventListener('DOMContentLoaded', () => {
  let currentMode = 'add';
  let editingPropertyId = null;
  const propertyIdStoreInput = document.getElementById('propertyIdStore'); // Get the hidden input
  const modalTitleElement = document.getElementById('addPropertyModalLabel');
  // Note: submitButton will be properly queried after addPropertyForm is confirmed to exist.
  let submitButton;
  let originalModalTitle = modalTitleElement ? modalTitleElement.textContent : 'Add New Property';
  let originalSubmitButtonText; // Will be set after submitButton is queried.

  const addPropertyModalElement = document.getElementById('addPropertyModal');
  const addPropertyForm = document.getElementById('addPropertyForm');
  const propertyImageFile = document.getElementById('propertyImageFile');
  const propertyImagePreview = document.getElementById('propertyImagePreview');
  const addPropertyMessage = document.getElementById('addPropertyMessage');

  let addPropertyModalInstance;
  if (addPropertyModalElement) {
    addPropertyModalInstance = new bootstrap.Modal(addPropertyModalElement);
  }

  // Query for submit button after ensuring addPropertyForm exists.
  if (addPropertyForm) {
    submitButton = addPropertyForm.querySelector('button[type="submit"]');
    if (submitButton) {
      originalSubmitButtonText = submitButton.textContent;
    }
  }

  // Set originalModalTitle again in case it was fetched before modalTitleElement was ready (though unlikely with DOMContentLoaded)
  if (modalTitleElement && !originalModalTitle) {
      originalModalTitle = modalTitleElement.textContent;
  }


  // Image preview logic
  if (propertyImageFile && propertyImagePreview) {
    propertyImageFile.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          propertyImagePreview.src = e.target.result;
          propertyImagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
      } else {
        propertyImagePreview.src = '#';
        propertyImagePreview.style.display = 'none';
      }
    });
  }

  function openEditModal(propertyData) {
    if (!addPropertyModalInstance || !addPropertyForm) {
      console.error('Add Property Modal or Form not initialized.');
      return;
    }
    currentMode = 'edit';
    editingPropertyId = propertyData.id; // Assuming propertyData has an 'id' field
    if (propertyIdStoreInput) {
      propertyIdStoreInput.value = propertyData.id;
    }

    // Populate form fields
    document.getElementById('propertyName').value = propertyData.property_name || '';
    document.getElementById('propertyAddress').value = propertyData.address || '';
    document.getElementById('propertyType').value = propertyData.property_type || '';
    document.getElementById('propertyOccupier').value = propertyData.occupier || propertyData.property_occupier || ''; // property_occupier from DB
    document.getElementById('propertyDescription').value = propertyData.description || propertyData.property_details || ''; // property_details from DB

    // Handle image preview
    if (propertyData.property_image_url && propertyImagePreview) {
      propertyImagePreview.src = propertyData.property_image_url;
      propertyImagePreview.style.display = 'block';
    } else if (propertyImagePreview) {
      propertyImagePreview.src = '#';
      propertyImagePreview.style.display = 'none';
    }
    // Clear the file input, as we're not replacing the image by default
    if (propertyImageFile) {
        propertyImageFile.value = '';
    }

    if (modalTitleElement) modalTitleElement.textContent = 'Edit Property';
    if (submitButton) submitButton.textContent = 'Save Changes';

    addPropertyModalInstance.show();
  }
  window.openEditModal = openEditModal; // Expose globally

  // Handle form submission
  if (addPropertyForm && window._supabase) {
    // Re-assign submitButton here if it wasn't assigned due to addPropertyForm not being found initially
    // This is a bit redundant if DOMContentLoaded works as expected, but safe.
    if (!submitButton) {
        submitButton = addPropertyForm.querySelector('button[type="submit"]');
        if (submitButton && !originalSubmitButtonText) { // Set original text if not already set
            originalSubmitButtonText = submitButton.textContent;
        }
    }

    addPropertyForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      addPropertyMessage.style.display = 'none';
      addPropertyMessage.textContent = '';
      addPropertyMessage.className = 'alert'; // Reset classes

      // Ensure submitButton is valid before using
      if (!submitButton) {
        console.error("Submit button not found.");
        showMessage('Error: Submit button is missing.', 'danger');
        return;
      }
      submitButton.disabled = true;
      submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${currentMode === 'edit' ? 'Saving Changes...' : 'Saving...'}`;


      try {
        if (currentMode === 'edit') {
          // Logic for updating property
          const propertyId = editingPropertyId || (propertyIdStoreInput ? propertyIdStoreInput.value : null);
          if (!propertyId) {
            throw new Error("Property ID is missing. Cannot update.");
          }

          let imageUrl = document.getElementById('propertyImagePreview').src; // Existing image
          let newImageFile = propertyImageFile.files[0];

          if (newImageFile) {
            // TODO: Handle new image upload similar to add mode (upload, get URL)
            // For now, just log and use a placeholder for new image URL
            console.log("New image selected for update:", newImageFile.name);
            // This part would involve uploading the new image and getting its URL.
            // Then, potentially deleting the old image from storage.
            // imageUrl = "placeholder_new_image_url.jpg"; // Placeholder
            showMessage('Image updating is not fully implemented in this version.', 'info');
             // For now, we won't actually upload the new image in edit mode to simplify
             // We'll just use the existing image URL or clear it if no new one is provided
             // and the user somehow cleared the preview (though not standard)
          }

          const updatedPropertyPayload = {
            property_id: propertyId,
            property_name: document.getElementById('propertyName').value,
            address: document.getElementById('propertyAddress').value,
            property_type: document.getElementById('propertyType').value,
            property_occupier: document.getElementById('propertyOccupier').value,
            property_details: document.getElementById('propertyDescription').value,
            // If a new image was uploaded and its URL obtained:
            // property_image_url: newImageUrl,
            // otherwise, if no new image, don't include property_image_url in payload
            // or send the existing one, depending on backend function's expectation.
            // For this placeholder, we'll assume the backend handles not changing the image if URL isn't sent.
          };

          // If a new image was selected, add its (future) URL to the payload
          // For this step, we are not implementing the actual image upload for edit.
          // We will just send the existing URL. If a new file is selected, we acknowledge it.
          if (newImageFile) {
             updatedPropertyPayload.new_image_selected = true; // Flag for backend or further FE logic
             updatedPropertyPayload.property_image_url = imageUrl; // Send existing, backend would need to handle
          } else {
             updatedPropertyPayload.property_image_url = imageUrl; // Send existing
          }

          console.log("Attempting to update property with payload:", updatedPropertyPayload);
          // Placeholder for actual Supabase update function call
          // await window._supabase.functions.invoke('update-property', { body: updatedPropertyPayload });

          showMessage('Update functionality simulated. Property data logged to console.', 'success');
          // Simulate success for now:
          if (addPropertyModalInstance) addPropertyModalInstance.hide();

          // Refresh logic based on where this modal might be used
          if (typeof window.refreshPropertiesList === 'function') {
            window.refreshPropertiesList();
          } else {
            // Attempt to find if we are on property-details.html and reload if so
            // This is a basic check; a more robust solution might involve a global event bus or specific callbacks
            if (document.querySelector('body.property-details-page')) { // Assuming a class is added to body on details page
                // Or check URL: window.location.pathname.includes('property-details.html')
                // window.location.reload(); // Or call a specific loadPropertyDetails function if available
                console.log("Simulating property details refresh after edit.");
            }
          }


          // Button state will be reset by 'hidden.bs.modal' event
          return; // Exit submit handler for edit mode placeholder
        }

        // ADD MODE LOGIC CONTINUES BELOW
        const formData = {
            property_name: document.getElementById('propertyName').value,
            address: document.getElementById('propertyAddress').value,
            property_type: document.getElementById('propertyType').value,
            occupier: document.getElementById('propertyOccupier').value,
            description: document.getElementById('propertyDescription').value,
            imageFile: propertyImageFile.files[0]
        };

        // --- Basic Client-Side Validation (enhance as needed) ---
        if (!formData.property_name || !formData.address || !formData.property_type || !formData.occupier) {
            showMessage('Property Name, Address, Property Type, and Occupier are required.', 'danger');
            submitButton.disabled = false;
            submitButton.textContent = originalSubmitButtonText || 'Save Property';
            return;
        }
        if (!formData.imageFile) {
            showMessage('Property image is required.', 'danger');
            submitButton.disabled = false;
            submitButton.textContent = originalSubmitButtonText || 'Save Property';
            return;
        }
        if (formData.imageFile.size > 5 * 1024 * 1024) { // Example: 5MB limit
            showMessage('Image file size should not exceed 5MB.', 'danger');
            submitButton.disabled = false;
            submitButton.textContent = originalSubmitButtonText || 'Save Property';
            return;
        }

        // 1. Upload image to Supabase Storage
        const file = formData.imageFile;

        // Ensure we have user object to build the path, if your RLS for upload depends on it.
        // The RLS policy (INSERT): (bucket_id = 'property-images') AND ((storage.foldername(name))[1] = 'users') AND ((storage.foldername(name))[2] = (auth.uid())::text)
        // requires the path to start with 'users/{user_id}'.
        const { data: { user }, error: getUserError } = await window._supabase.auth.getUser();
        if (getUserError || !user) {
            console.error("User not authenticated for image upload:", getUserError);
            throw new Error("User not authenticated. Cannot upload image or create property.");
        }

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`; // Sanitize filename a bit
        const filePath = `users/${user.id}/property_images/${fileName}`;


        const { data: uploadData, error: uploadError } = await window._supabase.storage
          .from('property-images') // Bucket name
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData, error: publicUrlError } = window._supabase.storage
            .from('property-images')
            .getPublicUrl(uploadData.path);

        if (publicUrlError) {
            console.error('Error getting public URL:', publicUrlError);
            throw new Error(`Failed to get image public URL: ${publicUrlError.message}`);
        }
        const imageUrl = publicUrlData.publicUrl;

        // --- Fetch company_id ---
        let companyId;
        try {
          const { data: companyData, error: companyError } = await window._supabase
            .from('companies')
            .select('id')
            .eq('owner_id', user.id) // user object should be available from image upload section
            .limit(1)
            .single(); // .single() is good if we expect exactly one or zero

          if (companyError) {
            console.error('Error fetching company_id:', companyError);
            throw new Error('Could not determine your company. Please ensure your company is set up correctly.');
          }
          if (!companyData || !companyData.id) {
            throw new Error('No company found for your account. Cannot create property.');
          }
          companyId = companyData.id;
          console.log('Fetched company_id:', companyId);

        } catch (e) {
          // Re-throw or handle specific error for company_id fetching
          showMessage(e.message || 'Failed to fetch company details.', 'danger');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalSubmitButtonText || 'Save Property';
          }
          return; // Stop submission
        }
        // --- End Fetch company_id ---

        // 2. Prepare data for Edge Function
        const propertyPayload = {
          property_name: formData.property_name,
          address: formData.address,
          property_type: formData.property_type,
          property_occupier: formData.occupier, // Key changed here
          // rent_price removed
          // bedrooms, bathrooms, square_footage are removed
          property_details: formData.description, // Key changed here
          property_image_url: imageUrl,
          company_id: companyId // Add the fetched company_id
        };

        // 3. Call the 'create-property' Edge Function
        const { data: functionResponseData, error: functionInvokeError } = await window._supabase.functions.invoke('create-property', {
          body: propertyPayload,
        });

        if (functionInvokeError) {
          console.error('Error invoking Edge Function:', functionInvokeError);
          // Try to get specific JSON error response from the function if it's a HttpError from Deno.serve
          let errMsg = "Failed to create property. Network or function error.";
          if (functionInvokeError.context && typeof functionInvokeError.context.json === 'function') {
            try {
              const errJson = await functionInvokeError.context.json();
              if (errJson.error && errJson.errors) { // Our specific validation structure
                errMsg = `Validation failed:\n${Object.values(errJson.errors).map(e => `- ${e}`).join('\n')}`;
              } else if (errJson.error) {
                errMsg = errJson.error;
              }
            } catch(e) { console.error("Could not parse function error JSON:", e); }
          } else if (functionInvokeError.message) {
            errMsg = functionInvokeError.message;
          }
          throw new Error(errMsg); // Throw to be caught by the outer catch
        }

        // Edge function might have run but returned an error in its JSON response (e.g. if we didn't throw HTTP error)
        // Our current Edge Function returns { success: true, ... } or an HTTP error for validation.
        // So, if functionInvokeError is null, functionResponseData contains the body.
        // The previous Edge Function returns `{ error: "message" }` OR `{ success: true }`
        // The NEW Edge Function returns `{ error: "Validation failed", errors: {...} }` OR `{ success: true }`

        // This check is more for functions that don't use HTTP status codes for errors
        if (functionResponseData && functionResponseData.error) {
          if (functionResponseData.errors) { // Our structured validation errors
            const messages = Object.values(functionResponseData.errors).map(e => `- ${e}`).join('\n');
            throw new Error(`Validation failed:\n${messages}`);
          }
          throw new Error(functionResponseData.error);
        }

        // If we reach here, it implies success from the function's perspective
        if (!functionResponseData || !functionResponseData.success) {
             console.error('Unexpected response or failure from Edge Function:', functionResponseData);
             throw new Error('Failed to create property due to an unexpected server response.');
        }

        showMessage('Property created successfully!', 'success');
        addPropertyForm.reset();
        propertyImagePreview.style.display = 'none';
        if (addPropertyModalInstance) {
          addPropertyModalInstance.hide();
        }

        if (typeof window.refreshPropertiesList === 'function') {
          console.log('Refreshing properties list after creation...');
          window.refreshPropertiesList();
        } else {
          console.warn('refreshPropertiesList function not found. Consider reloading page or manual refresh.');
          // Fallback, though ideally refreshPropertiesList should always be available on properties.html
          alert("Property created successfully! Please refresh the page to see the updated list.");
          // location.reload();
        }

      } catch (error) {
        console.error('Submission error object:', error); // Log the whole error object for inspection
        let displayMessage = error.message || 'An unexpected error occurred.';

        // The detailed message construction is now expected to happen before throwing the error that gets caught here.
        // So, error.message should already be formatted if it was a validation error.

        showMessage(displayMessage, 'danger');
      } finally {
        // Reset button state. Text content will be handled by 'hidden.bs.modal' or upon next submission attempt.
        if (submitButton) {
            submitButton.disabled = false;
            // Setting text here might be overridden by hidden.bs.modal, which is better for consistency
            // For now, let hidden.bs.modal handle the text reset to original values.
            // If an error occurs, the button text should reflect the current mode (e.g. "Try Saving Again")
            // For simplicity, we'll ensure it's at least re-enabled.
            // The spinner will be removed by the textContent reset in hidden.bs.modal.
            if (currentMode === 'edit' && submitButton.innerHTML.includes('spinner')) {
                 submitButton.textContent = 'Save Changes';
            } else if (currentMode === 'add' && submitButton.innerHTML.includes('spinner')) {
                 submitButton.textContent = originalSubmitButtonText || 'Save Property';
            }
        }
      }
    });
  } else {
    if (!addPropertyForm) console.error('Add Property Form (`addPropertyForm`) not found on this page.');
    if (!window._supabase) console.error('Supabase client (`window._supabase`) not found. Make sure supabase-client.js is loaded before addProperty.js');
  }

  function showMessage(message, type = 'info') {
    if (addPropertyMessage) {
      addPropertyMessage.textContent = message;
      addPropertyMessage.className = `alert alert-${type} alert-dismissible fade show`; // Added more bootstrap classes
      addPropertyMessage.style.display = 'block';
      // Optional: Add a close button to the alert
      // if (!addPropertyMessage.querySelector('.btn-close')) {
      //    const closeButton = document.createElement('button');
      //    closeButton.type = 'button';
      //    closeButton.className = 'btn-close';
      //    closeButton.setAttribute('data-bs-dismiss', 'alert');
      //    closeButton.setAttribute('aria-label', 'Close');
      //    addPropertyMessage.appendChild(closeButton);
      // }
    } else {
      console.log (`Message for user (${type}):`, message);
    }
  }

  if (addPropertyModalElement) {
    addPropertyModalElement.addEventListener('hidden.bs.modal', function () {
      currentMode = 'add';
      editingPropertyId = null;
      if (propertyIdStoreInput) {
        propertyIdStoreInput.value = '';
      }
      if (modalTitleElement) {
        modalTitleElement.textContent = originalModalTitle || 'Add New Property'; // Reset title
      }
      if (submitButton) {
        submitButton.textContent = originalSubmitButtonText || 'Save Property'; // Reset button text
        submitButton.disabled = false; // Ensure button is re-enabled
      }

      if (addPropertyForm) addPropertyForm.reset(); // This will clear propertyImageFile.value

      if (propertyImagePreview) {
        propertyImagePreview.src = '#';
        propertyImagePreview.style.display = 'none';
      }
      if (addPropertyMessage) {
        addPropertyMessage.style.display = 'none';
        addPropertyMessage.textContent = '';
        addPropertyMessage.className = 'alert';
      }
    });
  }
});
