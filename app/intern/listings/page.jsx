'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './Listings.css';
import InternNav from '../../components/InternNav';
import { toast } from 'sonner';
import { useSearchParams } from "next/navigation";
import FloatingAIChatWithCharts from '../../components/chatbot';

export default function Listings() {
  const supabase = createClientComponentClient();

  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // 🔑 State now tracks the ID of the selected job, not the object
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]); // Stores saved job objects
  const [showSavedJobs, setShowSavedJobs] = useState(false); // Toggle modal/panel
  const [postTimeFilter, setPostTimeFilter] = useState(''); // '', '24h', '7d', '30d'
  const [filterType, setFilterType] = useState('');
  
  // 📱 Mobile View State
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const searchParams = useSearchParams();
  const jobIdFromURL = searchParams.get("jobId");

  // ... (Fetch Logged-in Intern useEffect) ...
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    getUser();
  }, [supabase]);

  // Helper: convert timestamp to "time ago"
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const posted = new Date(timestamp);
    const seconds = Math.floor((now - posted) / 1000);
    if (seconds < 5) return 'Just now';

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  // --- Fetch job listings from Supabase ---
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('job_posts')
          .select(`
            id,
            title,
            location,
            salary,
            description,
            responsibilities, 
            requirements,
            work_setup,
            work_schedule,
            company_id,
            created_at,
            companies (name),
            job_applications:job_applications!fk_job_applications_job (intern_id)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData = data.map((job) => ({
          ...job,
          company: job.companies ? job.companies.name : 'Unknown Company',
          companies: undefined,
        }));

        setListings(transformedData);
        // 🆕 Set the first job as automatically selected
        if (transformedData.length > 0) {
          setSelectedJobId(transformedData[0].id);
        }
      } catch (err) {
        console.error('Error fetching job listings:', err.message);
        toast.error('Failed to load job listings.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [supabase]);

  // --- Apply to Job Function ---
  const applyToJob = async (jobId, companyId) => {
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
        toast("You already applied for this job.", { description: "Cannot apply twice." });
      } else {
        console.error(error);
        toast.error("Failed to apply. Try again.");
      }
      return;
    }
    // Re-fetch listings to update 'Applied' status
    setListings(prev => prev.map(job => 
        job.id === jobId 
            ? { ...job, job_applications: [...(job.job_applications || []), { intern_id: user.id }] }
            : job
    ));
    toast.success("Application submitted successfully! 🚀");
  };

  // --- New Job Select Function ---
  const selectJob = (jobId) => {
    setSelectedJobId(jobId);
  };

  // 📱 Handler for Mobile "View Details" button
  const handleMobileView = (jobId) => {
    setSelectedJobId(jobId);
    setShowMobileDetail(true);
  };

  // --- Filter Logic ---
  const filteredInternships = listings
    .filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(job =>
      filterType ? job.work_setup.toLowerCase() === filterType.toLowerCase() : true
    )
    .filter(job => {
      if (!postTimeFilter) return true;
      const now = new Date();
      const posted = new Date(job.created_at);
      const diffHours = (now - posted) / 1000 / 3600; 

      if (postTimeFilter === '24h') return diffHours <= 24;
      if (postTimeFilter === '7d') return diffHours <= 24 * 7;
      if (postTimeFilter === '30d') return diffHours <= 24 * 30;
      return true;
    });

  // 🔑 Get the currently selected job object
  const selectedJob = listings.find(job => job.id === selectedJobId);

  // Helper function to render list items
  const renderList = (items) => (
    <ul className="job-detail-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );

  // --- Job Detail Component ---
  const JobDetailsPane = ({ job, applyFn, user }) => {
    if (!job) {
        return (
            <div className="job-details-pane no-job-selected">
                <h2>Select an Internship to View Details</h2>
                <p>Click on any listing on the left to see the full description, requirements, and apply.</p>
            </div>
        );
    }

    return (
      <div className="job-details-pane">
        <div className="modal-header">
            <h2>Job Details</h2>
        </div>

        <div className="modal-body">
            {/* --- 1. Header & Company Info --- */}
            <div className="job-detail-group">
                <h3 className="job-detail-title">{job.title}</h3>
                <p className="job-detail-company">{job.company}</p>
                 <p className="job-detail-ceo">{job.ceo}</p>
                <p className="posted-ago">Posted {timeAgo(job.created_at)}</p>
            </div>

            {/* --- 2. Secondary Info Grid --- */}
            <div className="job-detail-secondary-grid">
                <div className="job-detail-item">
                    <span className="job-detail-label">Location</span>
                    <span className="job-detail-value">{job.location}</span>
                </div>
            
                {job.work_setup && (
                    <div className="job-detail-item">
                        <span className="job-detail-label">Work Setup</span>
                        <span className="job-detail-value">{job.work_setup}</span>
                    </div>
                )}
                {job.work_schedule && (
                    <div className="job-detail-item">
                        <span className="job-detail-label">Work Status</span>
                        <span className="job-detail-value">{job.work_schedule}</span>
                    </div>
                )}
                {job.salary != null && (
                    <div className="job-detail-item">
                        <span className="job-detail-label">Salary</span>
                        <span className="job-detail-value">₱{
                            isNaN(Number(job.salary))
                                ? job.salary
                                : Number(job.salary).toLocaleString()
                        }</span>
                    </div>
                )}
            </div>
              
            {/* --- 3. Description --- */}
            <div className="detail-card">
                <span className="job-detail-subheading">Job Description</span>
                <p className="job-detail-description">{job.description}</p>
            </div>

            {/* --- 4. Responsibilities --- */}
            {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="detail-card">
                    <span className="job-detail-subheading">Key Responsibilities</span>
                    {renderList(job.responsibilities)}
                </div>
            )}

            {/* --- 5. Requirements --- */}
            {job.requirements && job.requirements.length > 0 && (
                <div className="detail-card">
                    <span className="job-detail-subheading">Minimum Requirements</span>
                    {renderList(job.requirements)}
                </div>
            )}
        </div>

       <div className="modal-footer">
          {/* Save Button */}
          <button
            className={`secondary-btn save-btn ${savedJobs.some(j => j.id === job.id) ? 'saved' : ''}`}
            onClick={() => {
              if (!savedJobs.some(j => j.id === job.id)) {
                setSavedJobs([...savedJobs, job]);
                toast.success("Job saved! ❤️");
              } else {
                setSavedJobs(savedJobs.filter(j => j.id !== job.id));
                toast("Job removed from saved list");
              }
            }}
          >
            {savedJobs.some(j => j.id === job.id) ? 'Saved ❤️' : 'Save'}
          </button>

          {/* Apply Button */}
          <button
            className="primary-btn"
            onClick={() => applyFn(job.id, job.company_id)}
            disabled={job.job_applications?.some(app => app.intern_id === user?.id)}
          >
            {job.job_applications?.some(app => app.intern_id === user?.id) ? "Applied ✔️" : "Apply Now"}
          </button>
        </div>
      </div>
    );
  };

  // URL Auto-scroll effect
  useEffect(() => {
    if (!jobIdFromURL || listings.length === 0) return;
    const exists = listings.some(job => job.id === jobIdFromURL);
    if (exists) {
      setSelectedJobId(jobIdFromURL);
      const el = document.getElementById(`job-${jobIdFromURL}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-job");
      }
    }
  }, [jobIdFromURL, listings]);

  return (
    <>
      <div className="listings-container">
        <h1>Browse Internship Opportunities</h1>
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="Search by title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="saved-jobs-btn" onClick={() => setShowSavedJobs(true)}>
            Saved Jobs ({savedJobs.length})
          </button>
          
          <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="Remote">Remote</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select className="filter-select" value={postTimeFilter} onChange={(e) => setPostTimeFilter(e.target.value)}>
            <option value="">Any time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        <div className="bento-box-layout">
          {/* ⬅️ Left Pane: Listing Cards */}
          <div className="listings-pane">
            {loading && <p className="no-results">Loading listings...</p>}
            {!loading && filteredInternships.length === 0 && (
              <p className="no-results">No internships found matching your criteria.</p>
            )}

            {filteredInternships.length > 0 && (
              <div className="internship-results-list">
                {filteredInternships.map((job) => (
                  <div 
                    id={`job-${job.id}`}
                    key={job.id} 
                    className={`listing-card ${job.id === selectedJobId ? 'selected-card' : ''}`}
                    onClick={() => selectJob(job.id)}
                  >
                    <h2 className="job-title">{job.title}</h2>
                    <p className="job-company">{job.company}</p>
                    <p className="job-meta">
                      <span className="location-pill">{job.location}</span>
                      {job.work_setup && <span className="work-setup-pill">{job.work_setup}</span>}
                    </p>
                    <p className="job-timeago">{timeAgo(job.created_at)}</p>

                    {/* 📱 Mobile Only: View Details Button */}
                    <button 
                      className="view-details-btn-mobile"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the card click
                        handleMobileView(job.id);
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ➡️ Right Pane: Job Details (Hidden on Mobile) */}
          <div className="desktop-details-container">
             <JobDetailsPane 
               job={selectedJob} 
               applyFn={applyToJob} 
               user={user} 
             />
          </div>
        </div>
      </div>

      {/* 📱 Mobile Details Component (Overlay) */}
      <div className={`mobile-details-overlay ${showMobileDetail ? 'active' : ''}`}>
        <button className="mobile-back-btn" onClick={() => setShowMobileDetail(false)}>
           ← Back to Listings
        </button>
        {/* Re-using the same component, but inside the mobile wrapper */}
        <JobDetailsPane 
          job={selectedJob} 
          applyFn={applyToJob} 
          user={user} 
        />
      </div>

      {/* --- Saved Jobs Modal --- */}
      {showSavedJobs && (
        <div className="modal-overlay active" onClick={() => setShowSavedJobs(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Saved Jobs</h2>
              <button className="close-btn" onClick={() => setShowSavedJobs(false)}>×</button>
            </div>
            <div className="modal-body">
              {savedJobs.length === 0 ? (
                <p>You haven't saved any jobs yet.</p>
              ) : (
                savedJobs.map((job) => (
                  <div key={job.id} className="listing-card saved-listing-card">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-company">{job.company}</p>
                    <div className="saved-card-footer">
                      <button
                        className="primary-btn"
                        onClick={() => {
                          handleMobileView(job.id);
                          setShowSavedJobs(false);
                        }}
                      >
                        View Details
                      </button>
                      <button
                        className="secondary-btn remove-btn"
                        onClick={() => setSavedJobs(savedJobs.filter(j => j.id !== job.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
      <InternNav />
    </>
  );
}