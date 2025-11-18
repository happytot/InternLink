// /app/intern/logbook/actions.js
'use server';

// 🔑 FIX: Import the new server helper using a relative path
import { createSupabaseServerClient } from '../../../lib/supabase/server'; 

const REQUIRED_HOURS = 486; // The goal hours for the OJT

/**
 * Fetches all logbook entries for the logged-in intern and calculates total hours.
 */
export async function getInternLogbookData() {
    // 🔑 CREATE THE SERVER CLIENT
    const supabase = createSupabaseServerClient(); 
    
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("Auth Error in getInternLogbookData:", userError);
        return { success: false, error: 'User not authenticated. Please log in again.' }; 
    }

    const internId = userData.user.id;

    try {
        const { data: logs, error: logsError } = await supabase
            .from('logbook_entries')
            .select('*')
            .eq('intern_id', internId)
            .order('date', { ascending: false });

        if (logsError) throw logsError;

        const totalApprovedHours = logs
            .filter(log => log.status === 'Approved')
            .reduce((sum, log) => sum + (log.hours_worked || 0), 0);

        const progress = Math.min(100, (totalApprovedHours / REQUIRED_HOURS) * 100);

        return {
            success: true,
            logs,
            totalApprovedHours,
            progress,
            requiredHours: REQUIRED_HOURS
        };

    } catch (e) {
        console.error('Error fetching logbook data:', e);
        return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
}

/**
 * Handles the submission of a new logbook entry.
 */
export async function submitNewLogEntry(formData) {
    // 🔑 CREATE THE SERVER CLIENT
    const supabase = createSupabaseServerClient(); 

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("Auth Error in submitNewLogEntry:", userError);
        return { success: false, error: 'User not authenticated. Please log in again.' };
    }

    const internId = userData.user.id;
    const date = formData.get('date');
    const attendance_status = formData.get('attendance_status');
    const hours_worked = parseFloat(formData.get('hours_worked'));
    const tasks_completed = formData.get('tasks_completed');

    if (!date || !attendance_status || isNaN(hours_worked) || !tasks_completed) {
        return { success: false, error: 'All fields must be filled out correctly.' };
    }

    try {
        const { error } = await supabase
            .from('logbook_entries')
            .insert({
                intern_id: internId,
                date,
                attendance_status,
                hours_worked,
                tasks_completed,
                status: 'Pending' 
            });

        if (error) throw error;

        return { success: true, message: 'Logbook entry submitted successfully for review!' };

    } catch (e) {
        console.error('Error submitting log entry:', e);
        return { success: false, error: e.message || 'Failed to submit entry.' };
    }
}