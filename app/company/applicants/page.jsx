'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './applicants.css';
import { updateJobApplicationStatus } from './actions';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';



// Icons
import { 
  Users, 
  Mail, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Briefcase,
  Search,
  Filter
} from 'lucide-react';

export default function ApplicantsPage() {
  const supabase = createClientComponentClient();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
const [modalOpen, setModalOpen] = useState(false);

const openModal = (applicant) => {
  setSelectedApplicant(applicant);
  setModalOpen(true);
};

const closeModal = () => {
  setSelectedApplicant(null);
  setModalOpen(false);
};


  // Stats for the Top Bento Grid
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        toast.error("Please log in.");
        return;
      }
      
      const cId = userData.user.id;
      setCompanyId(cId);

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
        .eq("company_id", cId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const apps = data || [];
      setApplicants(apps);

      // Calculate Stats
      setStats({
        total: apps.length,
        pending: apps.filter(a => a.status === 'Pending').length,
        approved: apps.filter(a => a.status.includes('Approved') || a.status === 'Accepted').length,
        rejected: apps.filter(a => a.status === 'Rejected').length
      });

    } catch (err) {
      console.error("❌ Error:", err.message);
      toast.error("Error loading applicants.");
    } finally {
      setLoading(false);
    }
  }, [supabase]); 

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const handleStatusUpdate = async (applicationId, action) => {
    const newStatus = action === 'accept' ? 'Company_Approved_Waiting_Coordinator' : 'Rejected';

    // Optimistic Update
    setApplicants(prev =>
      prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
    );

    try {
      const result = await updateJobApplicationStatus(applicationId, newStatus, companyId);
      if (result?.success) {
        toast.success(`Applicant ${action === 'accept' ? 'Approved' : 'Rejected'}`);
        // Update stats locally
        setStats(prev => ({
            ...prev, 
            pending: prev.pending - 1, 
            [action === 'accept' ? 'approved' : 'rejected']: prev[action === 'accept' ? 'approved' : 'rejected'] + 1
        }));
      } else {
        throw new Error(result?.error || 'Unknown error');
      }
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
      fetchApplicants(); // Revert on error
    }
  };

  // Filter Logic
const filteredApplicants = applicants.filter(app => {
  if (filterStatus === 'All') return true;
  if (filterStatus === 'Pending') return app.status === 'Pending';
  if (filterStatus === 'Approved') return app.status.includes('Approved');
  if (filterStatus === 'Rejected') return app.status === 'Rejected';
  if (filterStatus === 'Ongoing') return app.status === 'ongoing' || app.status === 'Company_Approved_Waiting_Coordinator'; // adjust according to your DB
  return true;
});


  return (
    <div className="applicants-container">
      {/* 2. ✅ Sonner Toaster (Styling is in globals.css) */}
      <Toaster position="bottom-right" richColors />
      
      {/* ========================================================
          🍱 NEW BENTO HEADER BOX
         ======================================================== */}
      <div className="bento-header">
        <div className="header-left">
          <div className="header-icon-box">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div className="header-info">
            <h1>Applicant Management</h1>
            <p>Review and manage incoming intern applications.</p>
          </div>
        </div>
      </div>
      {/* ======================================================== */}

      {/* --- BENTO STATS GRID --- */}
      <div className="bento-stats">
        <div className="stat-card blue">
          <div className="stat-icon"><Users size={20} /></div>
          <div>
            <h3>{stats.total}</h3>
            <span>Total Applicants</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><Clock size={20} /></div>
          <div>
            <h3>{stats.pending}</h3>
            <span>Pending Review</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><CheckCircle2 size={20} /></div>
          <div>
            <h3>{stats.approved}</h3>
            <span>Approved</span>
          </div>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="filter-bar">
       <div className="filter-group">
  <Filter size={16} className="filter-icon"/>
  <button className={filterStatus === 'All' ? 'active' : ''} onClick={() => setFilterStatus('All')}>All</button>
  <button className={filterStatus === 'Pending' ? 'active' : ''} onClick={() => setFilterStatus('Pending')}>Pending</button>
  <button className={filterStatus === 'Approved' ? 'active' : ''} onClick={() => setFilterStatus('Approved')}>Approved</button>
  <button className={filterStatus === 'Rejected' ? 'active' : ''} onClick={() => setFilterStatus('Rejected')}>Rejected</button>
  <button className={filterStatus === 'Ongoing' ? 'active' : ''} onClick={() => setFilterStatus('Ongoing')}>Ongoing</button>
</div>

      </div>

      {/* --- LIST / TABLE --- */}
      {loading ? (
        <div className="loading-state">Loading applicants...</div>
      ) : filteredApplicants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={40} /></div>
          <p>No applicants found matching this filter.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-wrapper">
            <table className="applicants-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied For</th>
                  <th>Resume</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className="candidate-info">
                        <div className="avatar-circle">{app.profiles?.fullname?.[0] || 'U'}</div>
                        <div>
                          <div className="name">{app.profiles?.fullname || 'Unknown'}</div>
                          <div className="email">{app.profiles?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="job-info">
                        <Briefcase size={14} />
                        <span>{app.job_posts?.title}</span>
                      </div>
                    </td>
                    <td>
                      {app.resume_url ? (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="resume-btn">
                          <FileText size={14} /> View CV
                        </a>
                      ) : <span className="text-muted">No CV</span>}
                    </td>
                    <td>
                      <span className={`status-badge ${app.status.toLowerCase().includes('approved') ? 'approved' : app.status.toLowerCase()}`}>
                        {app.status === 'Company_Approved_Waiting_Coordinator' ? 'Approved' : app.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        {app.status === 'Pending' ? (
                          <>
                            <button className="icon-btn accept" onClick={() => handleStatusUpdate(app.id, 'accept')} title="Accept">
                              <CheckCircle2 size={18} />
                            </button>
                            <button className="icon-btn reject" onClick={() => handleStatusUpdate(app.id, 'reject')} title="Reject">
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="text-muted-sm">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Responsive) */}
          <div className="mobile-grid">
            {filteredApplicants.map(app => (
              <div key={app.id} className="mobile-card">
                <div className="card-top">
                  <div className="candidate-info">
                    <div className="avatar-circle">{app.profiles?.fullname?.[0]}</div>
                    <div>
                      <div className="name">{app.profiles?.fullname}</div>
                      <div className="email">{app.job_posts?.title}</div>
                    </div>
                  </div>
                  <span className={`status-badge ${app.status.toLowerCase().includes('approved') ? 'approved' : app.status.toLowerCase()}`}>
                    {app.status === 'Company_Approved_Waiting_Coordinator' ? 'Approved' : app.status}
                  </span>
                </div>
                
                <div className="card-actions">
                  {app.resume_url && (
                    <a href={app.resume_url} target="_blank" className="resume-btn">View Resume</a>
                  )}
                  {app.status === 'Pending' && (
                    <div className="btn-group">
                      <button className="mobile-btn accept" onClick={() => handleStatusUpdate(app.id, 'accept')}>Accept</button>
                      <button className="mobile-btn reject" onClick={() => handleStatusUpdate(app.id, 'reject')}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {modalOpen && selectedApplicant && (
  <div className="modal-overlay" onClick={closeModal}>
    <div className="profile-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header-section">
        <h2>{selectedApplicant.profiles?.fullname || 'Applicant Profile'}</h2>
        <button className="modal-close-btn" onClick={closeModal}>×</button>
      </div>

      <div className="profile-content-grid">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-card">
            <h3>{selectedApplicant.profiles?.fullname}</h3>
            {/* Displaying Job Title as Department/Role */}
            <div className="profile-dept">Applied for: {selectedApplicant.job_posts?.title || 'N/A'}</div> 
            
            <div className="contact-item">
              <Mail size={16} /> {selectedApplicant.profiles?.email || 'N/A'}
            </div>
            <div className="contact-item">
              <Briefcase size={16} /> {selectedApplicant.job_posts?.title || 'N/A'}
            </div>
            
            <div className="status-card">
              <div className="status-title">Current Status</div>
              <div>
                <span className={`status-badge ${selectedApplicant.status.toLowerCase().includes('approved') ? 'approved' : selectedApplicant.status.toLowerCase()}`}>
                  {selectedApplicant.status === 'Company_Approved_Waiting_Coordinator' ? 'Approved' : selectedApplicant.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main-content">
          <div className="profile-section">
            <h3><FileText size={18} /> Resume & Documents</h3>
            {selectedApplicant.resume_url ? (
              <a href={selectedApplicant.resume_url} target="_blank" rel="noopener noreferrer" className="resume-btn">
                <FileText size={14} /> View Full Resume (PDF)
              </a>
            ) : (
              <p className="text-muted">No Resume uploaded by the applicant.</p>
            )}
          </div>
          {/* You can add more profile info here if your profiles table contained it (e.g., Education, Skills, Bio) */}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}