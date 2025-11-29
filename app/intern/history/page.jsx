'use client';

import Link from 'next/link';
import './ApplicationHistory.css';
import Header from '../../components/Header';
import InternNav from '../../components/InternNav';
import { useState, useEffect, useCallback } from 'react';
import { getApplicationHistory, startInternship } from './actions'; // 1. Import Actions

// ✅ Helper to format status text (Updated with new statuses)
const formatStatusText = (status) => {
  switch (status) {
    case 'Pending':
      return 'Pending';
    case 'Company_Approved_Waiting_Coordinator':
      return 'Waiting Coordinator Approval';
    case 'approved_by_coordinator': // The status before starting
      return 'Approved! Ready to Start';
    case 'ongoing': // The active status
      return 'Active Internship';
    case 'Accepted':
      return 'Accepted';
    case 'Rejected':
      return 'Rejected';
    default:
      return status;
  }
};

// ✅ Helper for CSS classes
const getStatusClass = (status) => {
  switch (status) {
    case 'Pending':
    case 'Company_Approved_Waiting_Coordinator':
      return 'pending'; // Yellow/Orange
    case 'approved_by_coordinator':
      return 'ready'; // Blue/Purple (You might need to add this class in CSS)
    case 'ongoing':
    case 'Accepted':
      return 'accepted'; // Green
    case 'Rejected':
      return 'rejected'; // Red
    default:
      return 'pending';
  }
};

export default function ApplicationHistory() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [processingId, setProcessingId] = useState(null); // To handle button loading state

  // 2. Fetch data using Server Action
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const result = await getApplicationHistory();

    if (result.success) {
      setApplications(result.data || []);
    } else {
      setMessage(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 3. Handle Start Internship Click
  const handleStartInternship = async (appId) => {
    const confirmed = window.confirm("Are you ready to officially start your OJT hours? This will unlock your logbook.");
    if (!confirmed) return;

    setProcessingId(appId);
    const result = await startInternship(appId);

    if (result.success) {
      alert(result.message);
      fetchApplications(); // Refresh list to show new status
    } else {
      alert(result.error);
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="history-container">
          <h1>📜 Your Application History</h1>
          <div className="skeleton-table">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-row">
                 {/* Skeleton styling */}
                <div className="skeleton-cell" style={{ width: '100%', height: '50px', background: '#eee' }} />
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
      <Header />
      <div className="history-container">
        <h1>📜 Your Application History</h1>

        {message && <p className="history-summary error">{message}</p>}

        <p className="history-summary">
          You have applied to <strong>{applications.length}</strong> positions.
        </p>

        {/* --- TABLE VIEW (Desktop) --- */}
        <div className="history-table-wrapper table-view">
          <table>
            <thead>
              <tr>
                <th>Internship Title</th>
                <th>Company</th>
                <th>Date Applied</th>
                <th>Status</th>
                <th>Action</th> {/* Changed 'Details' to 'Action' */}
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
                      {/* 🚀 THE START BUTTON LOGIC */}
                      {app.status === 'approved_by_coordinator' ? (
                        <button 
                            onClick={() => handleStartInternship(app.id)}
                            disabled={processingId === app.id}
                            style={{ 
                                backgroundColor: '#16a34a', color: 'white', 
                                padding: '6px 12px', borderRadius: '4px', 
                                border: 'none', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            {processingId === app.id ? 'Starting...' : '🚀 Start Internship'}
                        </button>
                      ) : app.status === 'ongoing' ? (
                        <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            ✅ Active
                        </span>
                      ) : (
                        <Link href="/intern/listings" className="view-link">View Job</Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- CARD VIEW (Mobile) --- */}
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
              
              <div style={{ marginTop: '10px' }}>
                  {app.status === 'approved_by_coordinator' ? (
                    <button 
                        onClick={() => handleStartInternship(app.id)}
                        disabled={processingId === app.id}
                        style={{ 
                            width: '100%', backgroundColor: '#16a34a', color: 'white', 
                            padding: '10px', borderRadius: '4px', 
                            border: 'none', cursor: 'pointer', fontWeight: 'bold' 
                        }}
                    >
                        {processingId === app.id ? 'Starting...' : '🚀 Start Internship'}
                    </button>
                  ) : app.status === 'ongoing' ? (
                    <div style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold', padding: '10px' }}>
                        ✅ Internship Active
                    </div>
                  ) : (
                    <Link href="/intern/listings" className="view-link resume-link">View Job</Link>
                  )}
              </div>
            </div>
          ))}
        </div>

        <div className="history-stats">
            <p>Active/Ongoing: <strong>{applications.filter(a => a.status === 'ongoing').length}</strong></p>
            <p>Total Applications: <strong>{applications.length}</strong></p>
        </div>
      </div>

      <InternNav />
    </>
  );
}