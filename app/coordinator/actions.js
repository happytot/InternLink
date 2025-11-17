'use server';

import { supabase } from '../../lib/supabase'; // Adjust path based on your file structure

// =================================================================
// COORDINATOR ACTIONS
// =================================================================

/**
 * Finalizes the status of an application by calling a trusted SQL function.
 * @param {string} applicationId - The ID of the job_applications record.
 * @param {string} newStatus - 'approved_by_coordinator' or 'rejected_by_coordinator'.
 */
export async function finalizeApplicationStatus(applicationId, newStatus) {
  if (!applicationId || !newStatus) {
    return { success: false, error: 'Application ID and new status are required.' };
  }
  
  console.log(`[Action] Calling RPC 'coordinator_finalize_application' for app: ${applicationId}`);

  try {
    // --- THIS IS THE FIX ---
    // We are no longer using .from('job_applications').
    // We are calling the SQL function we just created.
    const { data, error } = await supabase
      .rpc('coordinator_finalize_application', {
        application_id_in: applicationId,
        new_status_in: newStatus
      });

    if (error) {
      // This will catch network errors
      console.error('RPC call error:', error.message);
      throw new Error(error.message);
    }
    
    // This is the JSON object returned from our SQL function
    const result = data; 
    
    if (result.success === false) {
      // This will catch logical errors from the SQL (e.g., "Not found")
      console.error('RPC logical error:', result.error);
      return { success: false, error: result.error };
    }

    // If we get here, it worked.
    return { success: true, message: result.message };

  } catch (e) {
    console.error('Coordinator application finalize error:', e.message);
    return { success: false, error: e.message || 'An unexpected error occurred during final approval.' };
  }
}

/**
 * Updates the status of a logbook entry (approve/reject/revision).
 * (This function is unchanged and fine as-is)
 */
export async function updateLogbookStatus(logbookId, newStatus) {
    if (!logbookId || !newStatus) {
        return { success: false, error: 'Logbook ID and new status are required.' };
    }
    
    try {
        const { error } = await supabase
            .from('logbooks') 
            .update({ status: newStatus, reviewed_at: new Date().toISOString() })
            .eq('id', logbookId);

        if (error) throw error;
        
        return { success: true, message: `Logbook ${logbookId} updated to ${newStatus}.` };

    } catch (e) {
        console.error('Logbook update error:', e);
        return { success: false, error: 'Failed to update logbook status.' };
    }
}