'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import './applicants.css';
import { updateJobApplicationStatus } from './actions';
import { toast } from 'react-hot-toast';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const companyId = userData?.user?.id;

      setCompanyId(companyId);

      // --- THIS IS THE FINAL, CORRECTED QUERY ---
      // We are now using the explicit Foreign Key names that we
      // know work from your Coordinator pages.
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
        .eq("company_id", companyId) // Filter directly on the application's company_id
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setApplicants(data || []);
    } catch (err) {
      console.error("❌ Error fetching applicants:", err.message);
      toast.error("Error fetching applicants: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  // --- This is your existing, correct logic ---
  const handleStatusUpdate = async (applicationId, action) => {
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
                    <td>{app.profiles?.fullname}</td>
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
                    {/* This will now be populated by the corrected query */}
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
            <div className="applicant-grid">
              {applicants.map(app => (
                <div key={app.id} className="applicant-card">
                  <div className="applicant-header">
                    <h3>{app.profiles?.fullname}</h3>
                    <p><strong>Email:</strong> {app.profiles?.email || 'N/A'}</p>
                    {/* This will now be populated by the corrected query */}
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