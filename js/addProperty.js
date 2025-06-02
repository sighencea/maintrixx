// js/addProperty.js
document.addEventListener('DOMContentLoaded', () => {
  let currentMode = 'add';
  let editingPropertyId = null;
  let editingPropertyImageOldPath = null;
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
    // console.log("Data received by openEditModal:", JSON.stringify(propertyData, null, 2)); // Kept for potential future debugging if commented out

    if (!addPropertyModalInstance || !addPropertyForm) {
      console.error('Add Property Modal or Form not initialized.');
      return;
    }
    currentMode = 'edit';
    editingPropertyId = propertyData.id; // Assuming propertyData has an 'id' field
    editingPropertyImageOldPath = propertyData.old_image_path || null;
    if (propertyIdStoreInput) {
      propertyIdStoreInput.value = propertyData.id;
    }

    // Populate form fields
    const fieldsToPopulate = {
      'propertyName': propertyData.property_name,
      'propertyAddress': propertyData.address,
      'propertyType': propertyData.property_type,
      'propertyOccupier': propertyData.property_occupier,
      'propertyDescription': propertyData.property_details
    };

    for (const id in fieldsToPopulate) {
      const element = addPropertyForm.querySelector(`#${id}`);
      if (element) {
        const valueToSet = fieldsToPopulate[id] || '';
        element.value = valueToSet;
      } else {
        console.error(`Element with ID '${id}' not found during modal population!`);
      }
    }

    // Handle image preview
    if (propertyData.property_image_url && propertyImagePreview) {
      propertyImagePreview.src = propertyData.property_image_url;
      propertyImagePreview.style.display = 'block';
    } else if (propertyImagePreview) {
      propertyImagePreview.src = '#';
      propertyImagePreview.style.display = 'none';
    } else {
      // This case means propertyImagePreview itself was null during DOMContentLoaded
      console.error('propertyImagePreview element reference is missing!');
    }

    // Clear the file input
    if (propertyImageFile) {
        propertyImageFile.value = '';
    } else {
       // This case means propertyImageFile itself was null during DOMContentLoaded
      console.error('propertyImageFile element reference is missing!');
    }

    // Dynamically set/remove 'required' attribute for file input in edit mode
    if (propertyImageFile) { // Ensure propertyImageFile element exists
      if (propertyData.property_image_url) { // If there's an existing image
        propertyImageFile.removeAttribute('required');
        console.log("Edit mode with existing image: 'required' attribute removed from propertyImageFile.");
      } else { // No existing image, so make it required
        propertyImageFile.setAttribute('required', 'required');
        console.log("Edit mode with no existing image: 'required' attribute set for propertyImageFile.");
      }
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
      const formSubmitButton = event.currentTarget.querySelector('button[type="submit"]');

      addPropertyMessage.style.display = 'none';
      addPropertyMessage.textContent = '';
      addPropertyMessage.className = 'alert'; // Reset classes

      // Ensure formSubmitButton is valid before using
      if (!formSubmitButton) {
        console.error("Submit button not found on the form.");
        showMessage('Error: Submit button is missing from the form.', 'danger');
        return;
      }
      formSubmitButton.disabled = true;
      formSubmitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${currentMode === 'edit' ? 'Saving Changes...' : 'Saving...'}`;


      try {
        if (currentMode === 'edit') {
          // Inside the 'if (currentMode === 'edit')' block:

          const propertyId = editingPropertyId || (propertyIdStoreInput ? propertyIdStoreInput.value : null);
          if (!propertyId) {
            throw new Error("Property ID is missing. Cannot update.");
          }

          // const formSubmitButton = this.querySelector('button[type="submit"]'); // 'this' refers to the form. Already defined above.
          const originalButtonText = 'Save Changes'; // Specific for edit mode before spinner

          let newImageFile = propertyImageFile.files[0];
          let newImageUrl = null; // URL of the newly uploaded image
          let newImagePath = null; // Storage path of the newly uploaded image

          const updatedPropertyPayload = {
            property_id: propertyId,
            property_name: addPropertyForm.querySelector('#propertyName').value,
            address: addPropertyForm.querySelector('#propertyAddress').value,
            property_type: addPropertyForm.querySelector('#propertyType').value,
            property_occupier: addPropertyForm.querySelector('#propertyOccupier').value,
            property_details: addPropertyForm.querySelector('#propertyDescription').value,
            // property_image_url will be set below
            // old_property_image_to_delete_path will be set below
          };

          try {
            if (newImageFile) {
              // 1. Upload new image to Supabase Storage (similar to add mode)
              const { data: { user }, error: getUserError } = await window._supabase.auth.getUser();
              if (getUserError || !user) {
                throw new Error("User not authenticated. Cannot upload image.");
              }
              const fileName = `${Date.now()}-${newImageFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
              const filePath = `users/${user.id}/property_images/${fileName}`;

              const { data: uploadData, error: uploadError } = await window._supabase.storage
                .from('property-images')
                .upload(filePath, newImageFile, { cacheControl: '3600', upsert: false });

              if (uploadError) {
                console.error('Error uploading new image:', uploadError);
                throw new Error(`New image upload failed: ${uploadError.message}`);
              }
              newImagePath = uploadData.path; // Store new image path

              const { data: publicUrlData, error: publicUrlError } = window._supabase.storage
                .from('property-images')
                .getPublicUrl(newImagePath);

              if (publicUrlError) {
                throw new Error(`Failed to get new image public URL: ${publicUrlError.message}`);
              }
              newImageUrl = publicUrlData.publicUrl;
              updatedPropertyPayload.property_image_url = newImageUrl;

              // If a new image is uploaded, we must send the path of the old image for deletion.
              if (editingPropertyImageOldPath) { // This was stored when modal opened
                updatedPropertyPayload.old_property_image_to_delete_path = editingPropertyImageOldPath;
              }
            } else {
              // No new image selected, so keep the existing one.
              // The existing image URL is already in the preview.
              // If propertyImagePreview.src is a placeholder or empty, it means no image.
              if (propertyImagePreview.src && propertyImagePreview.src !== '#' && !propertyImagePreview.src.startsWith('data:')) {
                   updatedPropertyPayload.property_image_url = propertyImagePreview.src;
              } else {
                  // If there was no image before and none is selected, explicitly set to null or undefined
                  // depending on backend expectation. Let's assume null if no image.
                  updatedPropertyPayload.property_image_url = null;
              }
              // Do not send old_property_image_to_delete_path if image wasn't changed.
            }

            // 2. Call the 'update-property' Edge Function
            console.log("Calling update-property with payload:", updatedPropertyPayload);
            const { data: functionResponseData, error: functionInvokeError } = await window._supabase.functions.invoke('update-property', {
              body: updatedPropertyPayload,
            });

            if (functionInvokeError) {
              let errMsg = "Failed to update property. Network or function error.";
              if (functionInvokeError.context && typeof functionInvokeError.context.json === 'function') {
                  try {
                      const errJson = await functionInvokeError.context.json();
                      if (errJson.error && errJson.errors) {
                          errMsg = `Validation failed:\n${Object.values(errJson.errors).map(e => `- ${e}`).join('\n')}`;
                      } else if (errJson.error) {
                          errMsg = errJson.error;
                      }
                  } catch(e) { console.error("Could not parse function error JSON:", e); }
              } else if (functionInvokeError.message) {
                  errMsg = functionInvokeError.message;
              }
              throw new Error(errMsg);
            }

            if (functionResponseData && functionResponseData.error) {
              if (functionResponseData.errors) {
                  const messages = Object.values(functionResponseData.errors).map(e => `- ${e}`).join('\n');
                  throw new Error(`Validation failed:\n${messages}`);
              }
              throw new Error(functionResponseData.error);
            }

            if (!functionResponseData || !functionResponseData.success) {
                 console.error('Unexpected response or failure from update-property Edge Function:', functionResponseData);
                 throw new Error('Failed to update property due to an unexpected server response.');
            }

            showMessage('Property updated successfully!', 'success');
            if (addPropertyModalInstance) addPropertyModalInstance.hide();

            // Refresh data on the page
            if (typeof window.loadPropertyDetails === 'function') { // If on property-details.html
              console.log("Refreshing property details on page...");
              window.loadPropertyDetails();
            } else if (typeof window.refreshPropertiesList === 'function') { // If on properties.html (less likely to edit from here)
              console.log("Refreshing properties list...");
              window.refreshPropertiesList();
            }

          } catch (error) {
            console.error('Error updating property:', error);
            showMessage(error.message || 'An unexpected error occurred during update.', 'danger');
          } finally {
            // This will be further correctly handled by 'hidden.bs.modal' to reset to original if needed
            if (formSubmitButton) { // Ensure formSubmitButton is defined
              formSubmitButton.disabled = false;
              // Reset text based on what it should be if modal stayed open (e.g. after error)
              formSubmitButton.innerHTML = originalButtonText;
            }
          }
          return; // Important: exit submit handler after edit mode logic.
        }

        // ADD MODE LOGIC CONTINUES BELOW
        const generateQr = document.getElementById('generateQrCodeCheckbox').checked; // Get checkbox value

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
            if (formSubmitButton) {
                formSubmitButton.disabled = false;
                formSubmitButton.textContent = originalSubmitButtonText || 'Save Property'; // Use outer scope original for add mode
            }
            return;
        }
        if (!formData.imageFile) {
            showMessage('Property image is required.', 'danger');
            if (formSubmitButton) {
                formSubmitButton.disabled = false;
                formSubmitButton.textContent = originalSubmitButtonText || 'Save Property'; // Use outer scope original for add mode
            }
            return;
        }
        if (formData.imageFile.size > 5 * 1024 * 1024) { // Example: 5MB limit
            showMessage('Image file size should not exceed 5MB.', 'danger');
            if (formSubmitButton) {
                formSubmitButton.disabled = false;
                formSubmitButton.textContent = originalSubmitButtonText || 'Save Property'; // Use outer scope original for add mode
            }
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
          if (formSubmitButton) {
            formSubmitButton.disabled = false;
            formSubmitButton.textContent = originalSubmitButtonText || 'Save Property';  // Use outer scope original for add mode
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
          company_id: companyId, // Add the fetched company_id
          generate_qr_on_creation: generateQr, // Added for QR
          qr_code_image_url: null // Added for QR
        };

        // 3. Call the 'create-property' Edge Function
        const { data: functionResponseData, error: functionInvokeError } = await window._supabase.functions.invoke('create-property', {
          body: propertyPayload,
        });

        if (functionInvokeError) {
          console.error('Error invoking Edge Function:', functionInvokeError);
          let errMsg = "Failed to create property. Network or function error.";
          if (functionInvokeError.context && typeof functionInvokeError.context.json === 'function') {
            try {
              const errJson = await functionInvokeError.context.json();
              if (errJson.error && errJson.errors) {
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
        if (formSubmitButton) {
            formSubmitButton.disabled = false;
            // Setting text here might be overridden by hidden.bs.modal, which is better for consistency
            // For now, let hidden.bs.modal handle the text reset to original values for general cases.
            // If an error occurs within 'add' or 'edit' specific try-catch, that takes precedence for text.
            // This primarily ensures the spinner is removed and button is enabled if no other text was set.
            if (currentMode === 'edit' && formSubmitButton.innerHTML.includes('spinner')) {
                 formSubmitButton.textContent = 'Save Changes'; // Or originalButtonText if it was specific to edit's finally
            } else if (currentMode === 'add' && formSubmitButton.innerHTML.includes('spinner')) {
                 formSubmitButton.textContent = originalSubmitButtonText || 'Save Property'; // Outer scope original
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
      editingPropertyImageOldPath = null;
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

      // Ensure file input is marked as required for 'add' mode.
      if (propertyImageFile) {
        propertyImageFile.setAttribute('required', 'required');
        console.log("Modal hidden, reset to ADD mode: 'required' attribute set for propertyImageFile.");
      }

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
