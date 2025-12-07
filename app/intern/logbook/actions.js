'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to convert 24-hour time to 12-hour format with AM/PM
function formatTime12Hour(timeStr) {
  if (!timeStr) return null;
  const [hourStr, min] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // convert 0 => 12
  return `${hour}:${min} ${ampm}`;
}

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

        const goalHours = activeApp?.required_hours || 486;

        if (!activeApp) {
            return {
                success: true,
                isInternshipApproved: false,
                logs: [], 
                totalApprovedHours: 0, 
                progress: 0, 
                requiredHours: goalHours,
                activeJobTitle: '',       
                activeCompany: ''
            };
        }

        // 2. Fetch Job and Company names
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

        // Convert time_in and time_out to 12-hour format
        const formattedLogs = logs.map(log => ({
          ...log,
          time_in: formatTime12Hour(log.time_in),
          time_out: formatTime12Hour(log.time_out)
        }));

        const totalApprovedHours = logs
            .filter(log => log.status === 'Approved')
            .reduce((sum, log) => sum + (log.hours_worked || 0), 0);

        const progress = Math.min(100, (totalApprovedHours / goalHours) * 100);

        return {
            success: true,
            logs: formattedLogs,
            totalApprovedHours,
            progress,
            requiredHours: goalHours,
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

  const { data: activeApp } = await supabase
    .from('job_applications')
    .select('id, company_id')
    .eq('intern_id', user.id)
    .eq('status', 'ongoing') 
    .maybeSingle();

  if (!activeApp) return { success: false, error: 'No active internship found.' };

  const date = formData.get('date');
  const attendance_status = formData.get('attendance_status');
  const hours_worked = parseFloat(formData.get('hours_worked'));
  const tasks_completed = formData.get('tasks_completed');
  const time_in = formData.get('time_in') || null;
  const time_out = formData.get('time_out') || null;

  try {
    // Insert and return the inserted row
    const { data: insertedLog, error } = await supabase
      .from('logbooks')
      .insert({
        intern_id: user.id,
        application_id: activeApp.id,
        company_id: activeApp.company_id,
        date,
        attendance_status,
        hours_worked,
        tasks_completed,
        status: 'Pending',
        time_in,
        time_out,
      })
      .select()
      .single();

    if (error) throw error;

    // Convert time to 12-hour format before returning
    insertedLog.time_in = formatTime12Hour(insertedLog.time_in);
    insertedLog.time_out = formatTime12Hour(insertedLog.time_out);

    return { success: true, log: insertedLog };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
