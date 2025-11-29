'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { toast, Toaster } from 'sonner';
import { getInternLogbookData, submitNewLogEntry } from '@/app/intern/logbook/actions';
import styles from './Logbook.module.css';
import LogbookForm from './LogbookForm';
import LogbookEntry from './LogbookEntry';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export default function LogbookClient() {
  const [logbooks, setLogbooks] = useState([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    progress: 0,
    requiredHours: 486,
    jobTitle: 'Loading...',
    companyName: 'Loading...'
  });
  
  const [isApproved, setIsApproved] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  // --- REUSABLE FETCH FUNCTION ---
  // We moved this OUT of useEffect so the Realtime listener can call it too.
  const fetchLogbookData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    
    const result = await getInternLogbookData();

    if (result.success) {
      setLogbooks(result.logs || []);
      
      const goal = result.requiredHours || 486;
      
      setStats({
        totalHours: result.totalApprovedHours,
        progress: result.progress,
        requiredHours: goal, 
        jobTitle: result.activeJobTitle || 'Unknown Job', 
        companyName: result.activeCompany || 'Unknown Company'
      });
      
      setIsApproved(result.isInternshipApproved);
    } else {
      if (result.error) toast.error(result.error);
    }
    
    setIsLoading(false);
  };

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchLogbookData(true); // True = show full page loading spinner
  }, []);

  // --- 2. REALTIME LISTENER (The Magic Part) ---
  useEffect(() => {
    console.log("🟢 Intern listening for Company updates...");

    const channel = supabase
      .channel('intern-logbook-updates')
      .on(
        'postgres_changes',
        // Listen specifically for UPDATES on the logbooks table
        { event: 'UPDATE', schema: 'public', table: 'logbooks' },
        (payload) => {
          console.log('Update received:', payload);

          // Check if the status changed to 'Approved'
          const newStatus = (payload.new.status || '').toLowerCase();
          if (newStatus === 'approved') {
            toast.success("Your log entry was just APPROVED!");
          }

          // REFRESH DATA (Updates the list and the progress bar instantly)
          fetchLogbookData(false); // False = don't show full page spinner, just update UI
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 3. HANDLE SUBMISSION ---
  const handleAddLog = async (logData) => {
    const formData = new FormData();
    formData.append('date', logData.date);
    formData.append('hours_worked', logData.hours_worked);
    formData.append('tasks_completed', logData.tasks_completed);
    formData.append('attendance_status', logData.attendance_status || 'Present'); 

    const result = await submitNewLogEntry(formData);

    if (result.success) {
      toast.success('Log entry submitted successfully!');
      
      // We manually add it to the list for instant feedback, 
      // but fetchLogbookData will also run if RLS triggers an INSERT event.
      const newEntry = {
        id: Date.now(), // Temporary ID until refresh
        ...logData,
        status: 'Pending',
        hours_worked: parseFloat(logData.hours_worked)
      };
      
      setLogbooks([newEntry, ...logbooks]);
      fetchLogbookData(false); // Refresh to get the real ID from server
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteLog = (logId) => {
      toast.info("Delete functionality coming soon.");
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.header}>Digital Logbook</h1>
        <p>Loading your data...</p>
      </div>
    );
  }

  // --- 4. LOCKED STATE ---
  if (!isApproved) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.header}>Digital Logbook</h1>
        <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#b45309', padding: '1rem', borderRadius: '0.375rem', marginTop: '1rem' }}>
          <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>No Active Internship Found</p>
          <p style={{ marginTop: '0.5rem' }}>
            You must go to your <strong>Application History</strong> and click 
            <span style={{color: '#16a34a', fontWeight: 'bold'}}> "🚀 Start Internship" </span> 
            on your approved application before you can log hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Toaster richColors position="top-right" />
      
      <h1 className={styles.header}>Digital Logbook</h1>
      
      <>
        {/* Dynamic Header */}
        <p className={styles.subHeader}>
          Submitting for: <strong>{stats.jobTitle}</strong> at <strong>{stats.companyName}</strong>
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Hours Approved</h3>
            <p className={styles.statValue}>{stats.totalHours}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Progress ({stats.requiredHours} Hours)</h3>
            
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
            
            <p className={styles.progressText}>{stats.progress.toFixed(1)}% Complete</p>
          </div>
        </div>

        <div className={styles.formContainer}>
          <LogbookForm onSubmit={handleAddLog} />
        </div>
      </>

      <div className={styles.listContainer}>
        <h2 className={styles.listHeader}>Submitted Entries</h2>
        {logbooks.length === 0 ? (
          <p className={styles.noEntriesText}>No logbook entries found.</p>
        ) : (
          logbooks.map((log) => (
            <LogbookEntry
              key={log.id}
              log={log}
              formatDate={formatDate}
              onDelete={handleDeleteLog}
            />
          ))
        )}
      </div>
    </div>
  );
}