'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './applicants.css';
import { updateJobApplicationStatus } from './actions';
import Link from 'next/link';

// ✅ 1. Import Sonner here
import { Toaster, toast } from 'sonner';

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
  Filter,
  X,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';

export default function ApplicantsPage() {
  const supabase = createClientComponentClient();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
const [isClosing, setIsClosing] = useState(false);


const openModal = (applicant) => {
  setSelectedApplicant(applicant);
  setIsProfileModalOpen(true);
  setIsClosing(false);
};

const handleCloseModal = () => {
  setIsClosing(true);
  setTimeout(() => {
    setIsProfileModalOpen(false);
    setSelectedApplicant(null);
  }, 200);
};



  // Stats for the Top Bento Grid
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

const fetchApplicants = useCallback(() => {
  const fetchData = async () => {
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
          profiles:profiles!job_applications_intern_id_fkey (
            fullname,
            email,
            phone,
            department,
            location,
            summary,
            profile_pic_url,
            skills,
            education,
            resume_url
          ),
          job_posts:job_posts!fk_job_applications_job ( title )
        `)
        .eq("company_id", cId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApplicants(data || []);

      // Update stats
      setStats({
        total: data.length,
        pending: data.filter(a => a.status === 'Pending').length,
        approved: data.filter(a => a.status.includes('Approved') || a.status === 'Accepted').length,
        rejected: data.filter(a => a.status === 'Rejected').length
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch applicants");
    } finally {
      setLoading(false);
    }
  };

  fetchData(); // Call the async function
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
    if (filterStatus === 'Ongoing') return app.status === 'ongoing' || app.status === 'Company_Approved_Waiting_Coordinator'; 
    return true;
  });


  return (
    <div className="applicants-container">
      {/* ✅ 2. Added Toaster Component here */}
      <Toaster position="top-right" richColors />
      
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
                     <div className="candidate-info clickable" onClick={() => openModal(app)}>
  <div className="avatar-circle">{app.profiles?.fullname?.[0] || 'U'}</div>
  <div>
    <div className="name link-name">{app.profiles?.fullname || 'Unknown'}</div>
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
                <div className="candidate-info clickable" onClick={() => openModal(app)}>
  <div className="avatar-circle">{app.profiles?.fullname?.[0]}</div>
  <div>
    <div className="name link-name">{app.profiles?.fullname}</div>
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
      
{isProfileModalOpen && selectedApplicant && (
  <div
    className={`modal-overlay glass-bg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
    onClick={handleCloseModal}
  >
    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
      <button className="close-x-btn" onClick={handleCloseModal}><X size={20} /></button>

      <h2 className="modal-title">{selectedApplicant.profiles?.fullname}'s Profile</h2>

      <div className="profile-picture-section">
        <img
          src={selectedApplicant.profiles?.profile_pic_url || '/default-avatar.png'}
          alt={selectedApplicant.profiles?.fullname}
          className="profile-picture"
        />
      </div>

      <div className="profile-content-columns">
        {/* LEFT COLUMN */}
        <div className="profile-column left-column">
          <div className="profile-section">
            <h3>Personal & Contact Details</h3>
            <div className="info-grid">
              <p><Mail size={16} className="icon-accent" /> <strong>Email:</strong> {selectedApplicant.profiles?.email || "N/A"}</p>
              <p><Phone size={16} className="icon-accent" /> <strong>Phone:</strong> {selectedApplicant.profiles?.phone || "N/A"}</p>
              <p><Briefcase size={16} className="icon-accent" /><strong>Department:</strong> {selectedApplicant.profiles?.department || "N/A"}</p>
              <p><MapPin size={16} className="icon-accent" /><strong>Location:</strong> {selectedApplicant.profiles?.location || "N/A"}</p>
              <p><Calendar size={16} className="icon-accent" /><strong>Applied On:</strong> {selectedApplicant.created_at ? new Date(selectedApplicant.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>

          <div className="profile-section">
            <h3>Professional Summary</h3>
            <p className="summary-text">{selectedApplicant.profiles?.summary || "N/A"}</p>
          </div>

          <div className="profile-section">
            <h3>Education History</h3>
            {Array.isArray(selectedApplicant.profiles?.education) && selectedApplicant.profiles.education.length > 0 ? (
              selectedApplicant.profiles.education.map((edu, idx) => (
                <div key={idx} className="info-grid border-bottom-light" style={{marginBottom: '10px'}}>
                  <p><strong>Institution:</strong> {edu.institution || "N/A"}</p>
                  <p><strong>Degree:</strong> {edu.degree || "N/A"}</p>
                  <p><strong>Years:</strong> {edu.years || "N/A"}</p>
                </div>
              ))
            ) : <p className="text-muted">No education listed.</p>}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-column right-column">
          <div className="profile-section">
            <h3>Key Skills</h3>
            {Array.isArray(selectedApplicant.profiles?.skills) && selectedApplicant.profiles.skills.length > 0 ? (
              <div className="skills-list">
                {selectedApplicant.profiles.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            ) : <p className="text-muted">No skills listed.</p>}
          </div>

          <div className="profile-section resume-section">
            <h3>Resume</h3>
            {selectedApplicant.profiles?.resume_url ? (
              <a href={selectedApplicant.profiles.resume_url} target="_blank" rel="noopener noreferrer" className="btn primary-btn resume-btn full-width" style={{justifyContent: 'center'}}>
                <FileText size={16} /> View Resume
              </a>
            ) : <p className="text-muted">Resume not uploaded.</p>}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn tertiary-btn" onClick={handleCloseModal}>Close</button>
      </div>
    </div>
  </div>
)}




    </div>
  );
}