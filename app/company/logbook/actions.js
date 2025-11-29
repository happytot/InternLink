'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getCompanyLogbookEntries() {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Not authenticated' };

    try {
        const { data: logs, error } = await supabase
            .from('logbooks')
            .select(`
                *,
                profiles:intern_id (
                    fullname,
                    email
                ),
                job_applications:application_id (
                    id,
                    required_hours,
                    supervisor_evaluations ( id ),
                    job_posts:job_posts!fk_job_applications_job ( title )
                )
            `)
            // .eq('company_id', user.id) // Uncomment in production
            .order('date', { ascending: false });

        if (error) throw error;

        return { success: true, logs };

    } catch (error) {
        console.error('Error fetching logs:', error);
        return { success: false, error: error.message };
    }
}

// In actions.js
export async function approveLogEntry(logId) {
    const supabase = createSupabaseServerClient();
    
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("DEBUG: Current User ID:", user?.id);
    console.log("DEBUG: Attempting to approve Log ID:", logId);

    try {
        // 2. Attempt Update
        const { data, error, count } = await supabase
            .from('logbooks')
            .update({ status: 'Approved' })
            .eq('id', logId)
            .select(); // This allows us to see the result

        // 3. DETAILED ERROR LOGGING
        if (error) {
            console.error("DEBUG: Database Error:", error.message);
            return { success: false, error: error.message };
        }

        // 4. CHECK IF ROW WAS ACTUALLY TOUCHED
        if (data.length === 0) {
            console.error("DEBUG: Update failed (0 rows changed). RLS likely blocking access.");
            return { success: false, error: "Permission denied. Database blocked the update." };
        }

        console.log("DEBUG: Success! Updated row:", data);
        
        revalidatePath('/company/logbook');       
        revalidatePath('/intern/logbook');        
        revalidatePath('/coordinator/monitoring'); 
        
        return { success: true, message: 'Approved successfully.' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function updateRequiredHours(applicationId, newHours) {
    const supabase = createSupabaseServerClient();
    try {
        const { error } = await supabase
            .from('job_applications')
            .update({ required_hours: newHours })
            .eq('id', applicationId);

        if (error) throw error;
        revalidatePath('/company/logbook');
        return { success: true, message: 'Goal updated.' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function submitEvaluation(formData) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
        const { error } = await supabase.from('supervisor_evaluations').insert({
            supervisor_id: user.id,
            application_id: formData.get('applicationId'),
            quality_of_work: formData.get('quality'),
            productivity: formData.get('productivity'),
            reliability: formData.get('reliability'),
            teamwork: formData.get('teamwork'),
            comments: formData.get('comments'),
            final_grade: 'Completed'
        });

        if (error) throw error;
        revalidatePath('/company/logbook');
        return { success: true, message: 'Evaluation submitted!' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}