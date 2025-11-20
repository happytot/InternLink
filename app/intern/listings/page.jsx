'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './Listings.css';
import Header from '../../components/Header';
import InternNav from '../../components/InternNav';
import { toast } from 'sonner';

export default function Listings() {
  const supabase = createClientComponentClient();

  const [user, setUser] = useState(null); // Logged-in intern
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [animateClose, setAnimateClose] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Logged-in Intern (This will now work) ---
  useEffect(() => {
    const getUser = async () => {
      // This 'supabase' variable is now the cookie-aware one
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    getUser();
  }, [supabase]); // Added supabase to dependency array

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
      } catch (err) {
        console.error('Error fetching job listings:', err.message);
        toast.error('Failed to load job listings.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [supabase]); // Added supabase to dependency array

  // --- Apply to Job Function (This will now work) ---
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
    closeModal();
    toast.success("Application submitted successfully!");
  };

  // --- Modal control ---
  const openJobDetailModal = (jobData) => {
    setSelectedJob(jobData);
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    setAnimateClose(true);
    setTimeout(() => {
      setSelectedJob(null);
      setAnimateClose(false);
      document.body.classList.remove('modal-open');
    }, 300);
  };

  // --- Filter Logic ---
  const filteredInternships = listings.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
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
        </div>

        {/* Loading or No Results */}
        {loading && <p className="no-results">Loading listings...</p>}
        {!loading && filteredInternships.length === 0 && (
          <p className="no-results">No internships found matching your criteria.</p>
        )}

        {/* Internship Grid */}
        {filteredInternships.length > 0 && (
          <div className="internship-results">
            {filteredInternships.map((job) => (
              <div key={job.id} className="listing-card">
                <h2 className="job-title">{job.title}</h2>
                <p className="job-company">{job.company}</p>
                <p className="job-meta"><span>{job.location}</span></p>
                <button
                  onClick={() => openJobDetailModal(job)}
                  className="btn-details"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 💎 Animated Modal */}
      {selectedJob && (
        <div
          className={`modal-overlay ${animateClose ? 'modal-closing' : 'active'}`}
          onClick={closeModal}
        >
          <div
            className={`modal-content ${animateClose ? 'modal-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Job Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Main Info */}
              <div className="job-detail-group">
                <h3 className="job-detail-title">{selectedJob.title}</h3>
                <p className="job-detail-company">{selectedJob.company}</p>
              </div>

              {/* Secondary Info */}
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
                    <span className="job-detail-value">₱{
                      isNaN(Number(selectedJob.salary))
                        ? selectedJob.salary
                        : Number(selectedJob.salary).toLocaleString()
                    }</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="job-detail-group">
                <span className="job-detail-label">Description</span>
                <p className="job-detail-description">{selectedJob.description}</p>
              </div>

              {/* Responsibilities */}
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

              {/* Requirements */}
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

      <InternNav className={selectedJob ? 'hidden' : ''} />
    </>
  );
}