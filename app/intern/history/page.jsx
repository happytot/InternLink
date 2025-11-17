'use client';

import Link from 'next/link';
import './ApplicationHistory.css';
import InternNav from '../../components/InternNav';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// ✅ Helper function to format the status text
const formatStatusText = (status) => {
  switch (status) {
    case 'Pending':
      return 'Pending';
    case 'Company_Approved_Waiting_Coordinator':
      return 'Company Approved, Waiting for Coordinator';
    case 'Pending_Coordinator_Approval':
      return 'Pending Coordinator Approval';
    case 'Accepted':
      return 'Accepted';
    case 'Rejected':
      return 'Rejected';
    default:
      return status;
  }
};

// ✅ Helper function to get the correct CSS class
const getStatusClass = (status) => {
  switch (status) {
    case 'Pending':
    case 'Company_Approved_Waiting_Coordinator':
    case 'Pending_Coordinator_Approval':
      return 'pending';
    case 'Accepted':
      return 'accepted';
    case 'Rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

export default function ApplicationHistory() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);

      // 1️⃣ Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('You must be logged in to view this page.');
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch applications for this intern
      try {
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

        if (error) throw error;

        setApplications(data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setMessage('Could not fetch application history.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    // ✅ Skeleton / loading animation placeholder
    return (
      <>
        <div className="history-container">
          <h1>📜 Your Application History</h1>
          <div className="skeleton-table">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-cell" style={{ width: '25%' }} />
                <div className="skeleton-cell" style={{ width: '20%' }} />
                <div className="skeleton-cell" style={{ width: '15%' }} />
                <div className="skeleton-cell" style={{ width: '20%' }} />
                <div className="skeleton-cell" style={{ width: '20%' }} />
              </div>
            ))}
          </div>
        </div>
        <InternNav />
      </>
    );
  }

  return (
    <>
      <div className="history-container">
        <h1>📜 Your Application History</h1>

        {message && <p className="history-summary error">{message}</p>}

        <p className="history-summary">
          You have applied to <strong>{applications.length}</strong> positions. Keep tracking your progress!
        </p>

        {/* Table View for larger screens */}
        <div className="history-table-wrapper table-view">
          <table>
            <thead>
              <tr>
                <th>Internship Title</th>
                <th>Company</th>
                <th>Date Applied</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    You have not applied to any jobs yet.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>{app.job_posts?.title || 'Unknown Job'}</td>
                    <td>{app.companies?.name || 'Unknown Company'}</td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${getStatusClass(app.status)}`}>
                        {formatStatusText(app.status)}
                      </span>
                    </td>
                    <td>
                      <Link href="/intern/listings" className="view-link">View Job</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card View for smaller screens */}
        <div className="job-grid card-view">
          {applications.map(app => (
            <div key={app.id} className="job-card">
              <div className="job-header">
                <h2>{app.job_posts?.title || 'Unknown Job'}</h2>
              </div>
              <p className="location">{app.companies?.name || 'Unknown Company'}</p>
              <p className="date">{new Date(app.created_at).toLocaleDateString()}</p>
              <p className={`status status-${getStatusClass(app.status)}`}>
                {formatStatusText(app.status)}
              </p>
              <Link href="/intern/listings" className="view-link resume-link">View Job</Link>
            </div>
          ))}
        </div>

        <div className="history-stats">
          <p>Accepted: <strong>{applications.filter(a => a.status === 'Accepted').length}</strong></p>
          <p>Pending Review: <strong>{applications.filter(a => a.status.startsWith('Pending') || a.status === 'Company_Approved_Waiting_Coordinator').length}</strong></p>
        </div>
      </div>

      <InternNav />
    </>
  );
}
