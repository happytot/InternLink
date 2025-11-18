// app/components/intern/LogbookClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './Logbook.module.css'; // 👈 Import CSS Module
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
  const [internship, setInternship] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !currentUser) throw new Error('You are not logged in. Please log in again.');
        setUser(currentUser);

        const { data: internshipData, error: internshipError } = await supabase
          .from('job_applications')
          .select('id, company_id, job_id')
          .eq('intern_id', currentUser.id)
          .in('status', ['approved_by_coordinator'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (internshipError || !internshipData) throw new Error('No active internship found.');

        const [companyRes, jobRes] = await Promise.all([
          supabase.from('companies').select('name').eq('id', internshipData.company_id).single(),
          supabase.from('job_posts').select('title').eq('id', internshipData.job_id).single()
        ]);
        
        const fullInternshipData = {
          ...internshipData,
          companies: companyRes.data,
          job_posts: jobRes.data,
        };
        if (companyRes.error) console.error("Error fetching company:", companyRes.error.message);
        if (jobRes.error) console.error("Error fetching job post:", jobRes.error.message);
        setInternship(fullInternshipData);

        const { data: logbooksData, error: logbooksError } = await supabase
          .from('logbooks')
          .select('*')
          .eq('intern_id', currentUser.id)
          .order('date', { ascending: false });
        if (logbooksError) throw new Error('Failed to fetch logbooks: ' + logbooksError.message);
        setLogbooks(logbooksData);

        const total = logbooksData.reduce((acc, log) => acc + parseFloat(log.hours_worked || 0), 0);
        setTotalHours(total);
      } catch (err) {
        setError(err.message);
        if (err.message !== 'No active internship found.') toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  const handleAddLog = async (newLog) => {
    if (!user || !internship) return toast.error('User or internship data is missing.');
    try {
      const { data: newEntry, error } = await supabase
        .from('logbooks')
        .insert({ ...newLog, intern_id: user.id, internship_id: internship.id, company_id: internship.company_id, status: 'submitted', submitted_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw new Error('Failed to submit log entry: ' + error.message);
      const updatedLogbooks = [newEntry, ...logbooks];
      setLogbooks(updatedLogbooks);
      const total = updatedLogbooks.reduce((acc, log) => acc + parseFloat(log.hours_worked || 0), 0);
      setTotalHours(total);
      toast.success('Log entry submitted successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!user) return toast.error('User not found.');
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const { error } = await supabase.from('logbooks').delete().eq('id', logId).eq('intern_id', user.id);
      if (error) throw new Error('Failed to delete log entry: ' + error.message);
      const updatedLogbooks = logbooks.filter((log) => log.id !== logId);
      setLogbooks(updatedLogbooks);
      const total = updatedLogbooks.reduce((acc, log) => acc + parseFloat(log.hours_worked || 0), 0);
      setTotalHours(total);
      toast.success('Log entry deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.header}>Digital Logbook</h1>
        <p>Loading your data...</p>
      </div>
    );
  }

  // This is a custom div for the error, not from the CSS file
  if (error && error.includes('internship')) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.header}>Digital Logbook</h1>
        <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#b45309', padding: '1rem', borderRadius: '0.375rem' }}>
          <p style={{ fontWeight: '600' }}>No Active Internship Found</p>
          <p>You must have an "approved_by_coordinator" internship to submit logbook entries.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return <div className={styles.pageContainer}><p style={{ color: '#ef4444' }}>Error: {error}</p></div>
  }

  return (
    <div className={styles.pageContainer}>
      <Toaster richColors position="top-right" />
      <h1 className={styles.header}>Digital Logbook</h1>
      
      {internship && (
        <>
          <p className={styles.subHeader}>
            Submitting for: <strong>{internship.job_posts?.title || 'Unknown Job'}</strong> at <strong>{internship.companies?.name || 'Unknown Company'}</strong>
          </p>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3 className={styles.statTitle}>Total Hours Rendered</h3>
              <p className={styles.statValue}>{totalHours}</p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statTitle}>Progress (486 Hours)</h3>
              <div className={styles.progressContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${Math.min((totalHours / 486) * 100, 100)}%` }}
                ></div>
              </div>
              <p className={styles.progressText}>{((totalHours / 486) * 100).toFixed(1)}% Complete</p>
            </div>
          </div>

          <div className={styles.formContainer}>
            <LogbookForm onSubmit={handleAddLog} />
          </div>
        </>
      )}

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