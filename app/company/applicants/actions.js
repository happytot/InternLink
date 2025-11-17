'use server';

import { supabase } from '../../../lib/supabase';

// 🔑 Update job application status and log history
export async function updateJobApplicationStatus(applicationId, newStatus) {
  
     if (!applicationId || !newStatus) {
      return { success: false, error: 'Application ID and new status are required.' };
    }
    
    try {
 // 0️⃣ Ensure the ID is a valid UUID (optional, prevents PGRST116)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      return { success: false, error: 'Invalid application ID format.' };
    }
    console.log('Updating application ID:', applicationId, 'to status:', newStatus);
    // 1️⃣ Fetch current status safely
    const { data: currentApp, error: fetchError } = await supabase
      .from('job_applications')
      .select('status')
      .eq('id', applicationId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current status:', fetchError);
      return { success: false, error: fetchError.message };
    }
    if (!currentApp) {
        console.error('Job Application not found for ID:', applicationId);
        return { success: false, error: ('Job Application not found.', applicationId)};
    }
    
    const oldStatus = currentApp.status;
    // 2️⃣ Update status in job_applications
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return { success: false, error: updateError.message };
    }

    // 3️⃣ Log status change in application_history
    const { error: historyError } = await supabase
      .from('application_history')
      .insert([
        {
          application_id: applicationId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.error('Error logging application history:', historyError);
      // Don't fail the main update if history logging fails
    }
   return {
      success: true,
      message: `Application ${applicationId} status updated from ${oldStatus} to ${newStatus}.`
    };

  } catch (e) {
    console.error('Server action exception:', e);
    return { success: false, error: 'An unexpected error occurred during status update.' };
  }
}
