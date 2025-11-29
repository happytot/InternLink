'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server'; 
import { revalidatePath } from 'next/cache';

export async function getApplicationHistory() {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
        .from('job_applications')
        .select(`
            id,
            created_at,
            status,
            job_posts:job_posts!fk_job_applications_job ( title ),
            companies:companies!fk_job_applications_company ( name )
        `)
        .eq('intern_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching history:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function startInternship(applicationId) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Check if we already have an "ongoing" internship
    const { data: existing } = await supabase
        .from('job_applications')
        .select('id, companies!fk_job_applications_company(name)')
        .eq('intern_id', user.id)
        .eq('status', 'ongoing')
        .maybeSingle();

    if (existing && existing.id !== applicationId) {
        return { 
            success: false, 
            error: `You already have an active internship at ${existing.companies?.name}. You cannot start a second one.` 
        };
    }

    // 2. Perform the Update
    const { error, data } = await supabase
        .from('job_applications')
        .update({ status: 'ongoing' })
        .eq('id', applicationId)
        .eq('intern_id', user.id)
        .in('status', ['approved_by_coordinator', 'ongoing']) 
        .select();

    if (error) {
        console.error("Update failed:", error);
        return { success: false, error: "Database update failed. Ensure you have permission." };
    }

    if (!data || data.length === 0) {
        return { success: false, error: "Could not start internship. Status might not be 'Approved by Coordinator'." };
    }

    revalidatePath('/intern/application-history');
    revalidatePath('/intern/logbook'); 
    return { success: true, message: 'Internship started successfully!' };
}