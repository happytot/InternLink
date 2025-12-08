'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getInternLogbookData, submitNewLogEntry } from '@/app/intern/logbook/actions';
import styles from './Logbook.module.css';
import LogbookForm from './LogbookForm';
import LogbookEntry from './LogbookEntry';
import WeeklyEvaluations from './WeeklyEvaluations';
import FloatingAIChatWithCharts from '../../components/chatbot';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export default function LogbookClient() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    progress: 0,
    requiredHours: 500,
    jobTitle: 'Loading...',
    companyName: 'Loading...'
  });
  
  const [isApproved, setIsApproved] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  // --- REUSABLE FETCH FUNCTION ---
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
        activeCompany: result.activeCompany || 'Unknown Company'
      });
      
      setIsApproved(result.isInternshipApproved);
    } else {
      if (result.error) toast.error(result.error);
    }
    
    setIsLoading(false);
  };

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchLogbookData(true); 
  }, []);

  // --- 2. REALTIME LISTENER ---
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    getUser();

    const channel = supabase
      .channel('intern-logbook-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'logbooks' },
        (payload) => {
          const newStatus = (payload.new.status || '').toLowerCase();
          if (newStatus === 'approved') {
            toast.success("Your log entry was just APPROVED!");
          }
          fetchLogbookData(false); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // --- 3. HANDLE SUBMISSION ---
  const handleAddLog = async (logData) => {
    const formData = new FormData();
    formData.append('date', logData.date);
    formData.append('hours_worked', logData.hours_worked);
    formData.append('tasks_completed', logData.tasks_completed);
    formData.append('attendance_status', logData.attendance_status || 'Present'); 
    formData.append('time_in', logData.time_in || '');
    formData.append('time_out', logData.time_out || '');

    const result = await submitNewLogEntry(formData);

    if (result.success) {
      toast.success('Log entry submitted successfully!');
      setLogbooks([result.log, ...logbooks]);
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteLog = (logId) => {
      toast.info("Delete functionality coming soon.");
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className={styles.pageWrapper}>
        <h1 className={styles.header}>Digital Logbook</h1>
        <p className={styles.subHeader}>
          Submitting for: <span className={styles.skeleton} style={{width:'150px'}}></span> at <span className={styles.skeleton} style={{width:'200px'}}></span>
        </p>

        {/* --- MOVED SKELETON FOR WEEKLY EVALUATIONS --- */}
        <div className={styles.skeleton} style={{height:'150px', width:'100%', marginBottom:'32px'}}></div>

        <div className={styles.bentoGrid}>
          <div className={styles.leftPane}>
            <div className={styles.statsGrid}>
               <div className={styles.statCard}>
                 <div className={styles.skeleton} style={{height:'16px', width:'50%', marginBottom:'12px'}}></div>
                 <div className={styles.skeleton} style={{height:'48px', width:'70%'}}></div>
                 <div className={styles.skeleton} style={{height:'12px', width:'100%', marginTop:'12px'}}></div>
               </div>
            </div>
            <div className={styles.formContainer}>
               {[1,2,3,4].map(i => <div key={i} className={styles.skeleton} style={{height:'40px', width:'100%', marginBottom:'16px'}}></div>)}
            </div>
          </div>

          <div className={styles.rightPane}>
            <h2 className={styles.listHeader}>Submitted Entries</h2>
            <div className={styles.entriesScroll}>
               {[1,2,3].map(i => (
                 <div key={i} className={styles.entryCard}>
                    <div className={styles.skeleton} style={{height:'48px', width:'100%'}}></div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Locked State
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
        {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>

      <h1 className={styles.header}>Digital Logbook</h1>

      <p className={styles.subHeader}>
        Submitting for: <strong>{stats.jobTitle}</strong> at <strong>{stats.companyName}</strong>
      </p>

      {/* --- 1. PERFORMANCE & WEEKLY EVALUATIONS (Moved to Top) --- */}
      <WeeklyEvaluations />

      {/* --- 2. BENTO GRID (Stats & Form) --- */}
      <div className={styles.bentoGrid} style={{ marginTop: '32px' }}>

        {/* LEFT SIDE — Stats + Form */}
        <div className={styles.leftPane}>

          {/* Merged Stats Card */}
          <div className={styles.statsGrid} style={{gridTemplateColumns: '1fr'}}> 
            <div className={styles.statCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px'}}>
                 <div>
                    <h3 className={styles.statTitle}>Total Hours Approved</h3>
                    <p className={styles.statValue}>{stats.totalHours}</p>
                 </div>
                 <div style={{textAlign: 'right'}}>
                    <span style={{fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600}}>Goal: {stats.requiredHours} hrs</span>
                 </div>
              </div>

              <div className={styles.progressContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${Math.min(stats.progress, 100)}%` }}
                ></div>
              </div>

              <p className={styles.progressText}>
                {stats.progress.toFixed(1)}% Complete
              </p>
            </div>
          </div>

          <div className={styles.formContainer}>
            <LogbookForm onSubmit={handleAddLog} />
          </div>
        </div>

        {/* RIGHT SIDE — Entries */}
        <div className={styles.rightPane}>
          <h2 className={styles.listHeader}>Submitted Entries</h2>

          <div className={styles.entriesScroll}>
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
      
      </div>

      {/* Floating AI Chat */}
      {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
    </div>
  );
}