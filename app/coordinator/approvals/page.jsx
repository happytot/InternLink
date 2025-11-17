'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import CoordinatorSidebar from '../../components/CoordinatorSidebar';
import { toast } from 'sonner';
import './approvals.css'; // We will create this CSS file next

export default function CoordinatorApprovals() {
  const [loading, setLoading] = useState(true);
  const [pendingGroups, setPendingGroups] = useState({}); // This will hold our grouped data

// --- Fetch and Group Pending Applications ---
  const fetchPendingApps = async () => {
    setLoading(true);
    try {
      // 1. Fetch all applications that need our approval
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          status,
          company_id,
          job_id,
          companies:companies!fk_job_applications_company ( name ),
          profiles:profiles!fk_job_applications_intern ( id, fullname, department )
        `)
        .eq('status', 'Pending_Coordinator_Approval'); // Only get this status

      if (error) throw error;
      if (!data) return;

      // 2. Group the data by Company, then by Department
      const grouped = data.reduce((acc, app) => {
        // Get company and department names
        const companyName = app.companies?.name || 'Unknown Company';
        const dept = app.profiles?.department || 'No Department Specified';

        // Create company group if it doesn't exist
        if (!acc[companyName]) {
          acc[companyName] = {};
        }
        // Create department group if it doesn't exist
        if (!acc[companyName][dept]) {
          acc[companyName][dept] = [];
        }

        // Add the student application to the correct group
        acc[companyName][dept].push(app);
        
        return acc;
      }, {});

      setPendingGroups(grouped);

    } catch (err) {
      console.error("Error fetching approvals:", err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApps();
  }, []);

  // --- Handle Batch Actions ---
const handleBatchUpdate = async (applications, newStatus) => {
  if (!applications || applications.length === 0) {
    toast.warning("No applications selected.");
    return;
  }

  const appIds = applications.map(app => app.id);

  try {
    // 1. Update job_applications table
    const { error } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .in('id', appIds);

    if (error) throw error;

    // 2. If coordinator approved -> create internships
    if (newStatus === 'Accepted') {
      for (const app of applications) {
        // Prevent duplicates
        const { data: existing } = await supabase
          .from('internships')
          .select('id')
          .eq('student_id', app.profiles.id)
          .eq('job_id', app.job_id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('internships').insert([
            {
              student_id: app.profiles.id,
              company_id: app.company_id,
              job_id: app.job_id,
              start_date: new Date().toISOString(),
              status: 'active',
            },
          ]);
        }
      }

      toast.success(`✅ Approved ${appIds.length} student${appIds.length > 1 ? 's' : ''} and created internship${appIds.length > 1 ? 's' : ''}.`);
    } else {
      toast.info(`🚫 Rejected ${appIds.length} student${appIds.length > 1 ? 's' : ''}.`);
    }

    // 3. Refresh UI
    fetchPendingApps();

  } catch (err) {
    console.error("Error in batch update:", err);
    toast.error(`Error: ${err.message}`);
  }
};



  if (loading) return <div className="dash-center">Loading approvals...</div>;

  return (
    <div className="dashboard-root">
      <CoordinatorSidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2>Student Application Approvals</h2>
          <div className="small-info">
            Approve or reject applications that companies have shortlisted.
          </div>
        </header>

        <div className="approval-groups-container">
          {Object.keys(pendingGroups).length === 0 ? (
            <div className="panel no-data">
              <h3>All clear!</h3>
              <p>There are no applications waiting for your approval.</p>
            </div>
          ) : (
            // 1. Loop over Companies
            Object.entries(pendingGroups).map(([companyName, departments]) => (
              <div key={companyName} className="panel company-group">
                <h2>{companyName}</h2>

                {/* 2. Loop over Departments */}
                {Object.entries(departments).map(([deptName, applications]) => (
                  <div key={deptName} className="department-group">
                    <h3>{deptName} ({applications.length} students)</h3>
                    
                    <ul className="student-list">
                      {/* 3. List Students */}
                      {applications.map(app => (
                        <li key={app.id}>
                          {app.profiles?.fullname || 'Unknown Student'}
                        </li>
                      ))}
                    </ul>

                    <div className="batch-actions">
                      <button 
                        className="batch-approve"
                        onClick={() => handleBatchUpdate(applications, 'Accepted')}
                      >
                        Approve All {applications.length}
                      </button>
                      <button 
                        className="batch-reject"
                        onClick={() => handleBatchUpdate(applications, 'Rejected')}
                      >
                        Reject All
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}