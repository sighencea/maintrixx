// js/addProperty.js
document.addEventListener('DOMContentLoaded', () => {
  const addPropertyModalElement = document.getElementById('addPropertyModal');
  const addPropertyForm = document.getElementById('addPropertyForm');
  const propertyImageFile = document.getElementById('propertyImageFile');
  const propertyImagePreview = document.getElementById('propertyImagePreview');
  const addPropertyMessage = document.getElementById('addPropertyMessage');

  let addPropertyModalInstance;
  if (addPropertyModalElement) {
    addPropertyModalInstance = new bootstrap.Modal(addPropertyModalElement);
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

  // Handle form submission
  if (addPropertyForm && window._supabase) {
    addPropertyForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      addPropertyMessage.style.display = 'none';
      addPropertyMessage.textContent = '';
      addPropertyMessage.className = 'alert'; // Reset classes

      const submitButton = document.querySelector('button[type="submit"][form="addPropertyForm"]');
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

      const formData = {
        property_name: document.getElementById('propertyName').value,
        address: document.getElementById('propertyAddress').value,
        property_type: document.getElementById('propertyType').value,
        occupier: document.getElementById('propertyOccupier').value, // Added
        // rent_price removed
        // bedrooms, bathrooms, square_footage removed
        description: document.getElementById('propertyDescription').value,
        imageFile: propertyImageFile.files[0] // The actual file object
      };

      // --- Basic Client-Side Validation (enhance as needed) ---
      if (!formData.property_name || !formData.address || !formData.property_type || !formData.occupier) { // Added occupier
        showMessage('Property Name, Address, Property Type, and Occupier are required.', 'danger'); // Updated message
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Property';
        return;
      }
      if (!formData.imageFile) {
        showMessage('Property image is required.', 'danger');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Property';
        return;
      }
      if (formData.imageFile.size > 5 * 1024 * 1024) { // Example: 5MB limit
        showMessage('Image file size should not exceed 5MB.', 'danger');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Property';
        return;
      }


      try {
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


        // 2. Prepare data for Edge Function
        const propertyPayload = {
          property_name: formData.property_name,
          address: formData.address,
          property_type: formData.property_type,
          occupier: formData.occupier, // Add new field
          // rent_price removed
          // bedrooms, bathrooms, square_footage are removed
          property_details: formData.description, // Key changed here
          property_image_url: imageUrl
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
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Property';
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
      if (addPropertyForm) addPropertyForm.reset();
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
