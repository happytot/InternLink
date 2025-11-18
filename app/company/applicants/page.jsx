'use client';

import { useEffect, useState, useCallback } from 'react';
// 1. ⛔️ REMOVED your old supabase import
// import { supabase } from '../../../lib/supabase';

// 2. ✅ ADDED this import instead
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Header from '../../components/Header'
import './applicants.css';
import { updateJobApplicationStatus } from './actions';
import { toast, Toaster } from 'react-hot-toast'; // Import Toaster

export default function ApplicantsPage() {
  // 3. ✅ INITIALIZED the client *inside* the component
  const supabase = createClientComponentClient();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);

  // 4. ✅ Wrapped in useCallback
  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      // This 'supabase' variable is now the cookie-aware one
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // 5. ✅ Added this check to be safe
      if (!userData?.user) {
        setLoading(false);
        toast.error("Your session was not found. Please log in again.");
        return;
      }
      
      const companyId = userData.user.id;
      setCompanyId(companyId);

      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          id,
          created_at,
          status,
          resume_url,
          profiles:profiles!fk_job_applications_intern ( fullname, email ),
          job_posts:job_posts!fk_job_applications_job ( title )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setApplicants(data || []);
    } catch (err) {
      console.error("❌ Error fetching applicants:", err.message);
      toast.error("Error fetching applicants: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]); // 6. ✅ Added supabase dependency

  // 7. ✅ Updated useEffect
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // --- This is your existing, correct logic ---
  const handleStatusUpdate = async (applicationId, action) => {
    // ... (your existing handleStatusUpdate function is fine)
    console.log('Updating application ID:', applicationId, 'Action:', action, 'Company ID:', companyId);
    
    const newStatus =
      action === 'accept'
        ? 'Company_Approved_Waiting_Coordinator'
        : 'Rejected';

    const previousApplicants = applicants; 
    setApplicants(prev =>
      prev.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );

    try {
      const result = await updateJobApplicationStatus(applicationId, newStatus, companyId);
      
      if (result && result.success === false) {
        console.error('Failed to update status (server responded with error):', result.error);
        setApplicants(previousApplicants); 
        toast.error(`Failed to update status: ${result.error}`);
      } else if (result && result.success === true) {
        console.log('Status successfully updated.');
        toast.success(`Status updated to ${action === 'accept' ? 'Company Approved' : 'Rejected'}`);
      } else {
        throw new Error('Server action returned an unexpected response.');
      }

    } catch (err) {
      console.error('Exception during status update:', err);
      setApplicants(previousApplicants); 
      toast.error(`Error updating status: ${err.message}`);
    }
  };


  return (
    <div className="applicants-container">
          <Header />

  
      {/* Add Toaster so you can see errors */}
      <Toaster position="top-right" /> 
      
      <h1 className="page-header">📋 Job Applicants</h1>

      {loading ? (
        <p>Loading applicants...</p>
      ) : applicants.length === 0 ? (
        <p>No applicants found for this company.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-view">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                    <th>Resume</th>
                  <th>Applied For</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map(app => (
                  <tr key={app.id}>
                    <td>{app.profiles?.fullname || 'N/A'}</td>
                    <td>{app.profiles?.email || 'N/A'}</td>
                    <td>
                      {app.resume_url && (
                        <a 
                          href={app.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="resume-link"
                        >
                          View Resume
                        </a>
                      )}
                    </td>
                    <td>{app.job_posts?.title}</td> 
                    <td>
                      <span className={`status ${app.status.toLowerCase()}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      {app.status.toLowerCase() === 'pending' && (
                        <>
                          <button
                            className="action-btn accept-btn"
                            onClick={() => handleStatusUpdate(app.id, 'accept')}
                          >
                            Accept
                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleStatusUpdate(app.id, 'reject')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {app.status.toLowerCase() !== 'pending' && (
                        <span>{app.status.replace(/_/g, ' ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="card-view">
            {/* ... (your existing mobile view is fine) ... */}
            <div className="applicant-grid">
              {applicants.map(app => (
                <div key={app.id} className="applicant-card">
                  <div className="applicant-header">
                    <h3>{app.profiles?.fullname || 'N/A'}</h3>
                    <p><strong>Email:</strong> {app.profiles?.email || 'N/A'}</p>
                    <p><strong>Applied for:</strong> {app.job_posts?.title}</p>
                  </div>

                  <span className={`status ${app.status.toLowerCase()}`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>

                  <div className="action-buttons">
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="resume-link">
                        View Resume
                      </a>
                    )}

                    {app.status.toLowerCase() === 'pending' && (
                      <>
                        <button
                          className="action-btn accept-btn"
                          onClick={() => handleStatusUpdate(app.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => handleStatusUpdate(app.id, 'reject')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                  {app.status.toLowerCase() !== 'pending' && (
                    <div style={{textAlign: 'center', marginTop: '1rem', color: '#333'}}>
                      Status: {app.status.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}