'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
// 1. ⛔️ REMOVED your old supabase import
// import { supabase } from '../../../lib/supabaseClient';

// 2. ✅ ADDED this import instead
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import Link from 'next/link';
import './Dashboard.css';
import Header from '../../components/Header';
import InternNav from '../../components/InternNav';
import { toast } from 'sonner';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// --- 1. NEW: Stats Summary Component (No changes) ---
const StatsSummary = ({ applications }) => (
  <section className="stats-summary-bar">
    <div className="stat-card">
      <span className="stat-value">{applications.length}</span>
      <span className="stat-label">Total Applied</span>
    </div>
    <div className="stat-card">
      <span className="stat-value">
        {applications.filter(a => a.status.toLowerCase().includes('interview')).length}
      </span>
      <span className="stat-label">Interviews</span>
    </div>
    <div className="stat-card">
      <span className="stat-value">
        {applications.filter(a => a.status.toLowerCase() === 'accepted').length}
      </span>
      <span className="stat-label">Offers</span>
    </div>
  </section>
);

// --- 2. Reusable Slider Component (No changes) ---
const HorizontalSlider = ({ title, viewAllLink, children, pageCount }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const sliderRef = useRef(null);

  const handleScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const newPage = Math.round(scrollLeft / clientWidth);
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    }
  };

  const slideTo = (pageIndex) => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      sliderRef.current.scrollTo({
        left: clientWidth * pageIndex,
        behavior: 'smooth',
      });
    }
  };

  const slideBy = (direction) => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      sliderRef.current.scrollBy({
        left: clientWidth * direction,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    slideTo(0);
  }, [pageCount]);

  return (
    <section className="card dashboard-slider-card">
      <div className="slider-header">
        <h2>{title}</h2>
        <div className="slider-controls">
          <button
            onClick={() => slideBy(-1)}
            disabled={pageCount <= 1}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            onClick={() => slideBy(1)}
            disabled={pageCount <= 1}
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
      </div>

      <div 
        className="slider-container" 
        ref={sliderRef} 
        onScroll={handleScroll}
      >
        <div className="slider-track">
          {children}
        </div>
      </div>
      
      <div className="slider-dots">
        {Array.from({ length: pageCount }).map((_, i) => (
          <button
            key={i}
            className={`dot ${i === currentPage ? 'active' : ''}`}
            onClick={() => slideTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <Link href={viewAllLink} className="view-all-link">View All →</Link>
    </section>
  );
};

// --- 3. Application Slider (No changes) ---
const ApplicationSlider = ({ applications }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const pageSize = isMobile ? 2 : 4;

  const pages = applications.reduce((acc, _, i) => {
    if (i % pageSize === 0) {
      acc.push(applications.slice(i, i + pageSize));
    }
    return acc;
  }, []);
  const pageCount = pages.length;

  if (applications.length === 0) {
    return (
      <section className="card dashboard-applications">
        <h2>🗓️ Application History</h2>
        <div className="no-applications">
          <p>No applications yet.</p>
          <Link href="/intern/listings" className="btn-primary">Find an Internship</Link>
        </div>
      </section>
    );
  }

  return (
    <HorizontalSlider title="🗓️ Application History" viewAllLink="/intern/history" pageCount={pageCount}>
      {pages.map((page, pageIndex) => (
        <div className="slider-page" key={pageIndex}>
          {page.map(app => (
            <div key={app.id} className="app-card">
              <span className={`status-badge status-${app.status.toLowerCase().replace(/\s/g, '-')}`}>
                {app.status}
              </span>
              <h3 className="app-card-title">{app.job_posts?.title || 'Unknown Job'}</h3>
              <p className="app-card-company">{app.companies?.name || 'Unknown Company'}</p>
              <small className="app-card-date">
                Applied: {new Date(app.created_at).toLocaleDateString()}
              </small>
            </div>
          ))}
          {page.length < pageSize && Array.from({ length: pageSize - page.length }).map((_, i) => (
            <div key={`fill-${i}`} className="app-card-empty" />
          ))}
        </div>
      ))}
    </HorizontalSlider>
  );
};

// --- 4. Recommended Matches Slider (No changes) ---
// (This component was already using fetch() so it's fine)
const RecommendedMatches = ({ user, openModal }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMobile = useMediaQuery('(max-width: 600px)');
  const pageSize = isMobile ? 2 : 4;

  useEffect(() => {
    if (!user?.id) return;
    const fetchMatches = async () => {
      try {
        const res = await fetch(`/api/match/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        console.error("Error fetching matches:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  const pages = matches.reduce((acc, _, i) => {
    if (i % pageSize === 0) {
      acc.push(matches.slice(i, i + pageSize));
    }
    return acc;
  }, []);
  const pageCount = pages.length;

  return (
    <HorizontalSlider title="🌟 Your AI Matches" viewAllLink="/intern/matches" pageCount={pageCount}>
      {loading && (
        <div className="slider-page"><p>Finding your recommendations...</p></div>
      )}
      {!loading && matches.length === 0 && (
          <div className="slider-page"><p>No matches found yet. <Link href="/intern/profile">Update your profile</Link> to get matches.</p></div>
      )}
      {pages.map((page, pageIndex) => (
        <div className="slider-page" key={pageIndex}>
          {page.map(job => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p className="job-location">{job.company}</p>
              <span className="match-score">{(job.similarity * 100).toFixed(0)}% Match</span>
              <button onClick={() => openModal(job)} className="btn-primary">
                View Details
              </button>
            </div>
          ))}
          {page.length < pageSize && Array.from({ length: pageSize - page.length }).map((_, i) => (
            <div key={`fill-job-${i}`} className="app-card-empty" />
          ))}
        </div>
      ))}
    </HorizontalSlider>
  );
};

// --- 5. Announcements (FIXED) ---
const Announcements = () => {
  // 3. ✅ INITIALIZED the client *inside* this component
  const supabase = createClientComponentClient();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data: annData, error: annError } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (annError) throw annError;

        // This N+1 query is slow. We fixed this in the server-side
        // refactor, but for now this will at least *work*.
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, fullname');
        if (profilesError) throw profilesError;

        const combined = annData.map(a => ({
          ...a,
          created_by_profile: profiles.find(p => p.id === a.created_by),
        }));

        setAnnouncements(combined);
      } catch (err) {
        console.error("Error fetching announcements:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [supabase]); // 4. ✅ Added supabase dependency

  return (
    <section className="card dashboard-announcements">
      <h2>📢 Announcements</h2>
      {loading && <p>Loading announcements...</p>}
      {!loading && announcements.length === 0 && <p>No announcements yet.</p>}
      <div className="announcement-list">
        {announcements.map(ann => (
          <div key={ann.id} className="announcement-card">
            {ann.image_url && (
              <img src={ann.image_url} alt={ann.title} className="announcement-image" />
            )}
            <div className="announcement-content">
              <h3>{ann.title}</h3>
              <p>{ann.content}</p>
              <small>
                By {ann.created_by_profile?.fullname || 'Admin'} •{' '}
                {new Date(ann.created_at).toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};


// --- 6. Sidebar Widget (No changes) ---
const ProfileWidget = () => (
  <section className="card profile-card">
    <h3>👤 Your Profile</h3>
    <p>Keep your profile up-to-date to attract recruiters.</p>
    <Link href="/intern/profile" className="btn-secondary">Manage Profile & Resume</Link>
  </section>
);

// --- 7. Main Dashboard Component (FIXED) ---
export default function InternDashboard() {
  // 3. ✅ INITIALIZED the client *inside* this component
  const supabase = createClientComponentClient();

  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [animateClose, setAnimateClose] = useState(false);

  // 4. ✅ Wrapped data-fetching functions in useCallback
  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('fullname')
      .eq('id', userId)
      .single();
    setUserName(data?.fullname || '');
  }, [supabase]); // 5. ✅ Added supabase dependency

  const fetchApplications = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id, created_at, status,
          job_posts:job_posts!fk_job_applications_job ( title ),
          companies:companies!fk_job_applications_company ( name )
        `)
        .eq('intern_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err.message);
    }
  }, [supabase]); // 5. ✅ Added supabase dependency

  // 6. ✅ Main fetchUser effect, now with correct dependencies
  useEffect(() => {
    const fetchUser = async () => {
      // This 'supabase' variable is now the cookie-aware one
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.id);
        await fetchApplications(currentUser.id);
      }
      setLoading(false);
    };
    
    fetchUser();
  }, [supabase, fetchProfile, fetchApplications]); // 7. ✅ Added all dependencies


  // --- Modal handlers (Wrapped in useCallback) ---
  const closeModal = useCallback(() => {
    setAnimateClose(true);
    setTimeout(() => {
      setSelectedJob(null);
      setAnimateClose(false);
      document.body.classList.remove('modal-open');
    }, 300);
  }, []); // This one has no dependencies

  const openJobDetailModal = useCallback((jobData) => {
    const fetchFullJob = async (job) => {
      try {
        const { data, error } = await supabase
          .from('job_posts')
          .select(`
            *,
            companies (name),
            job_applications:job_applications!fk_job_applications_job (intern_id)
          `)
          .eq('id', job.id)
          .single();
        if (error) throw error;
        
        const fullJobData = {
          ...data,
          company: data.companies ? data.companies.name : 'Unknown Company',
          companies: undefined,
          similarity: job.similarity
        };
        
        setSelectedJob(fullJobData);
        document.body.classList.add('modal-open');

      } catch (err) {
        toast.error("Failed to load job details.");
        console.error('Error fetching job details:', err.message);
      }
    };
    fetchFullJob(jobData);
  }, [supabase]); // 8. ✅ Added supabase dependency

  // --- Apply to Job Function (Wrapped in useCallback) ---
  const applyToJob = useCallback(async (jobId, companyId) => {
    if (!user) {
      toast.error("Please login first.");
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("resume_url")
      .eq("id", user.id)
      .single();
    if (profileError || !profile?.resume_url) {
      toast.error("Please upload your resume in your profile before applying.");
      return;
    }
    const { error } = await supabase
      .from("job_applications")
      .insert([
        {
          job_id: jobId,
          intern_id: user.id,
          company_id: companyId,
          resume_url: profile.resume_url,
          status: "Pending",
        },
      ]);
    if (error) {
      if (error.code === "23505") {
        toast("You already applied for this job.");
      } else {
        toast.error("Failed to apply. Try again.");
      }
      return;
    }
    
    // After applying, refetch applications to update the UI
    await fetchApplications(user.id);
    
    closeModal();
    toast.success("Application submitted successfully!");
  }, [supabase, user, closeModal, fetchApplications]); // 9. ✅ Added all dependencies


  if (loading) {
    return (
      <>
        <Header />
        <div className="dashboard-container">
          <div className="dashboard-loading">Loading Dashboard...</div>
        </div>
        <InternNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome Back, {userName.split(' ')[0] || 'Intern'}!</h1>
          <p>Ready to manage your journey and find your next role?</p>
        </div>

        <StatsSummary applications={applications} />

        <div className="dashboard-grid">
          <main className="dashboard-main">
            <ApplicationSlider applications={applications} />
            <RecommendedMatches user={user} openModal={openJobDetailModal} />
          </main>

          <aside className="dashboard-sidebar">
            <ProfileWidget />
            <Announcements />
          </aside>
        </div>
      </div>
      
      <InternNav className={selectedJob ? 'hidden' : ''} />

      {/* --- Advanced Modal --- */}
      {selectedJob && (
        <div
          className={`modal-overlay active ${animateClose ? 'modal-closing-overlay' : ''}`}
          onClick={closeModal}
        >
          <div
            className={`modal-content ${animateClose ? 'modal-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Job Details</h2>
              {selectedJob.similarity && (
                <span className="modal-match-score">
                  {(selectedJob.similarity * 100).toFixed(0)}% Match
                </span>
              )}
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* ... modal content ... */}
              <div className="job-detail-group">
                <h3 className="job-detail-title">{selectedJob.title}</h3>
                <p className="job-detail-company">{selectedJob.company || 'Unknown Company'}</p>
              </div>

              <div className="job-detail-group">
                <div className="job-detail-item">
                  <span className="job-detail-label">Location</span>
                  <span className="job-detail-value">{selectedJob.location}</span>
                </div>
                {selectedJob.work_setup && (
                  <div className="job-detail-item">
                    <span className="job-detail-label">Work Setup</span>
                    <span className="job-detail-value">{selectedJob.work_setup}</span>
                  </div>
                )}
                {selectedJob.work_schedule && (
                  <div className="job-detail-item">
                    <span className="job-detail-label">Work Schedule</span>
                    <span className="job-detail-value">{selectedJob.work_schedule}</span>
                  </div>
                )}
                {selectedJob.salary != null && (
                  <div className="job-detail-item">
                    <span className="job-detail-label">Salary</span>
                    <span className="job-detail-value">{selectedJob.salary}</span>
                  </div>
                )}
              </div>

              <div className="job-detail-group">
                <span className="job-detail-label">Description</span>
                <p className="job-detail-description">{selectedJob.description}</p>
              </div>

              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div className="job-detail-group">
                  <span className="job-detail-label">Responsibilities</span>
                  <ul className="job-detail-list">
                    {selectedJob.responsibilities.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className="job-detail-group">
                  <span className="job-detail-label">Requirements</span>
                  <ul className="job-detail-list">
                    {selectedJob.requirements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={closeModal}>Close</button>
              <button
                className="primary-btn"
                onClick={() => applyToJob(selectedJob.id, selectedJob.company_id)}
                disabled={selectedJob.job_applications?.some(app => app.intern_id === user?.id)}
              >
                {selectedJob.job_applications?.some(app => app.intern_id === user?.id) ? "Applied ✔️" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}