'use server';

import { supabase } from '../../lib/supabase'; // Adjust path based on your file structure

// =================================================================
// COORDINATOR ACTIONS
// =================================================================

/**
 * Finalizes the status of an application and links the intern profile upon approval.
 * @param {string} applicationId - The ID of the job_applications record.
 * @param {string} newStatus - 'approved_by_coordinator' or 'rejected_by_coordinator'.
 */
export async function finalizeApplicationStatus(applicationId, newStatus) {
    if (!applicationId || !newStatus) {
        return { success: false, error: 'Application ID and new status are required.' };
    }

    try {
        // 1. Update the application status
        const { error: appUpdateError } = await supabase
            .from('job_applications')
            .update({ status: newStatus })
            .eq('id', applicationId);

        if (appUpdateError) throw appUpdateError;
        
        // 2. If APPROVED, officially link the intern's profile to the company (OJT Start)
if (newStatus === 'approved_by_coordinator') {
            
            // a. Get the intern_id and company_id from the application
            const { data: appData, error: appDataError } = await supabase
                .from('job_applications')
                .select('intern_id, job_posts:job_posts(company_id)') // ✅ FIX: Use 'job_posts' table name
                .eq('id', applicationId)
                .single();
            
            if (appDataError) throw appDataError;

            const internId = appData.intern_id;
            const companyId = appData.job_posts.company_id; // Accessing the ID from the joined table

            // b. Update the intern's profile (Crucial for OJT start)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ company_id: companyId }) 
                .eq('id', internId);

            if (profileError) {
                console.error("Failed to link intern to company:", profileError);
                throw profileError; // Halt if profile link fails
            }
        }

        return { success: true, message: `Application ${applicationId} finalized to ${newStatus}.` };

    } catch (e) {
        console.error('Coordinator application finalize error:', e);
        return { success: false, error: 'An unexpected error occurred during final approval.' };
    }
}

/**
 * Updates the status of a logbook entry (approve/reject/revision).
 * @param {string} logbookId - The ID of the logbooks record.
 * @param {string} newStatus - 'approved' or 'rejected' or 'revision_requested'.
 */
export async function updateLogbookStatus(logbookId, newStatus) {
    if (!logbookId || !newStatus) {
        return { success: false, error: 'Logbook ID and new status are required.' };
    }
    
    try {
        const { error } = await supabase
            .from('logbooks') // Assuming your logbook table is named 'logbooks'
            .update({ status: newStatus, reviewed_at: new Date().toISOString() })
            .eq('id', logbookId);

        if (error) throw error;
        
        return { success: true, message: `Logbook ${logbookId} updated to ${newStatus}.` };

    } catch (e) {
        console.error('Logbook update error:', e);
        return { success: false, error: 'Failed to update logbook status.' };
    }
}