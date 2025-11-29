'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getInternLogbookData() {
    const supabase = createSupabaseServerClient(); 
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // 1. Fetch Active App IDs AND the Custom Goal
        const { data: activeApp, error: appError } = await supabase
            .from('job_applications')
            .select(`
                id, 
                company_id, 
                job_id,
                required_hours
            `) 
            .eq('intern_id', user.id)
            .eq('status', 'ongoing')     
            .maybeSingle();

        if (appError) console.error("Error fetching app:", appError);

        // Define the Goal (Use DB value, fallback to 486 if missing)
        const goalHours = activeApp?.required_hours || 486;

        // Case: No Active Internship found
        if (!activeApp) {
            return {
                success: true,
                isInternshipApproved: false,
                logs: [], 
                totalApprovedHours: 0, 
                progress: 0, 
                requiredHours: goalHours, // Send to UI
                activeJobTitle: '',       
                activeCompany: ''
            };
        }

        // 2. Manual Fetch for Names (Prevents Ambiguous FK errors)
        const { data: jobData } = await supabase
            .from('job_posts')
            .select('title')
            .eq('id', activeApp.job_id)
            .maybeSingle();

        const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('id', activeApp.company_id)
            .maybeSingle();

        // 3. Fetch Logs
        const { data: logs, error: logsError } = await supabase
            .from('logbooks')
            .select('*')
            .eq('application_id', activeApp.id) 
            .order('date', { ascending: false });

        if (logsError) throw logsError;

        const totalApprovedHours = logs
            .filter(log => log.status === 'Approved')
            .reduce((sum, log) => sum + (log.hours_worked || 0), 0);

        // Calculate progress dynamically based on goalHours
        const progress = Math.min(100, (totalApprovedHours / goalHours) * 100);

        return {
            success: true,
            logs,
            totalApprovedHours,
            progress,
            requiredHours: goalHours, // 🟢 Send the dynamic goal to UI
            isInternshipApproved: true,
            activeJobTitle: jobData?.title || 'Unknown Job', 
            activeCompany: companyData?.name || 'Unknown Company'
        };

    } catch (e) {
        console.error("Logbook Data Error:", e);
        return { success: false, error: e.message };
    }
}

export async function submitNewLogEntry(formData) {
    const supabase = createSupabaseServerClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // Gatekeeper: Check for ongoing internship
    const { data: activeApp } = await supabase
        .from('job_applications')
        .select('id, company_id')
        .eq('intern_id', user.id)
        .eq('status', 'ongoing') 
        .maybeSingle();

    if (!activeApp) {
        return { success: false, error: 'No active internship found. Please check your history page.' };
    }

    const date = formData.get('date');
    const attendance_status = formData.get('attendance_status');
    const hours_worked = parseFloat(formData.get('hours_worked'));
    const tasks_completed = formData.get('tasks_completed');

    if (!date || !attendance_status || isNaN(hours_worked) || !tasks_completed) {
        return { success: false, error: 'All fields must be filled out correctly.' };
    }

    try {
        const { error } = await supabase.from('logbooks').insert({
            intern_id: user.id,
            application_id: activeApp.id,
            company_id: activeApp.company_id,
            date,
            attendance_status,
            hours_worked,
            tasks_completed,
            status: 'Pending' 
        });

        if (error) throw error;

        // Force refresh so the new entry shows up immediately
        revalidatePath('/intern/logbook');

        return { success: true, message: 'Logbook entry submitted!' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}