'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all logbook entries for the company.
 * NOW INCLUDES: Weekly evaluations nested inside job_applications.
 */
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
                    status,
                    weekly_evaluations (
                        id,
                        week_start_date,
                        week_end_date,
                        quality_rating,
                        productivity_rating,
                        reliability_rating,
                        teamwork_rating,
                        comments,
                        created_at
                    ),
                    job_posts:job_posts!fk_job_applications_job ( title )
                )
            `)
            // .eq('company_id', user.id) // Uncomment this for production security
            .order('date', { ascending: false });

        if (error) throw error;

        return { success: true, logs };

    } catch (error) {
        console.error('Error fetching logs:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Approves a specific log entry.
 */
export async function approveLogEntry(logId) {
    const supabase = createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
        const { data, error } = await supabase
            .from('logbooks')
            .update({ status: 'Approved' })
            .eq('id', logId)
            .select();

        if (error) {
            console.error("Database Error:", error.message);
            return { success: false, error: error.message };
        }

        if (data.length === 0) {
            return { success: false, error: "Permission denied or Log not found." };
        }

        // Revalidate all relevant pages to show updated status immediately
        revalidatePath('/company/logbook');       
        revalidatePath('/intern/logbook');        
        revalidatePath('/coordinator/monitoring'); 
        
        return { success: true, message: 'Approved successfully.' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Updates the total hours required for an intern's goal.
 */
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

/**
 * NEW: Submits a weekly evaluation.
 * This replaces the old one-time evaluation logic.
 */
export async function submitWeeklyEvaluation(formData) {
    const supabase = createSupabaseServerClient();
    
    // Extract data from formData
    const applicationId = formData.get('applicationId');
    const weekStartDate = formData.get('weekStartDate');
    const weekEndDate = formData.get('weekEndDate');
    const quality = formData.get('quality');
    const productivity = formData.get('productivity');
    const reliability = formData.get('reliability');
    const teamwork = formData.get('teamwork');
    const comments = formData.get('comments');

    try {
        const { error } = await supabase
            .from('weekly_evaluations')
            .insert({
                application_id: applicationId,
                week_start_date: weekStartDate,
                week_end_date: weekEndDate,
                quality_rating: parseInt(quality),
                productivity_rating: parseInt(productivity),
                reliability_rating: parseInt(reliability),
                teamwork_rating: parseInt(teamwork),
                comments: comments
            });

        if (error) {
            // Handle duplicate entry error specifically if needed
            if (error.code === '23505') { // Postgres unique violation code
                return { success: false, error: 'This week has already been evaluated.' };
            }
            throw error;
        }

        revalidatePath('/company/logbook');
        return { success: true, message: 'Weekly evaluation submitted!' };
    } catch (error) {
        console.error("Evaluation Error:", error);
        return { success: false, error: error.message };
    }
}