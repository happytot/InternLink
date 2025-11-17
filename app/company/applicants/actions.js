'use server';

import { supabase } from '../../../lib/supabase';

// 🔑 Update job application status and log history
// We pass companyId as the third argument
export async function updateJobApplicationStatus(applicationId, newStatus, companyId) {
  
  if (!applicationId || !newStatus) {
    return { success: false, error: 'Application ID and new status are required.' };
  }
  
  if (!companyId) {
    return { success: false, error: 'Company ID was not provided.' };
  }

  try {
    console.log('Calling RPC update_application_status_as_company for app:', applicationId);

    // Call the SQL function with all three arguments
    const { data, error } = await supabase
      .rpc('update_application_status_as_company', {
        application_id_in: applicationId,
        new_status_in: newStatus,
        company_id_in: companyId // <-- PASSING THE COMPANY ID
      });

    if (error) {
      console.error('RPC error:', error.message);
      return { success: false, error: error.message };
    }

    // The RPC function returns a JSON object: {success: true/false, ...}
    const result = data; 

    if (result.success === false) {
      // This will catch our manual error: 'Not authorized or application not found'
      console.error('RPC logical error:', result.error);
      return { success: false, error: result.error };
    }

    // If we get here, it worked.
    return {
      success: true,
      message: result.message
    };

  } catch (e) {
    console.error('Server action exception:', e);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}