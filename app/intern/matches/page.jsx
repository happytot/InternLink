"use client";

import { useEffect, useState } from "react";
// Kept your original absolute path
import { supabase } from "../../../lib/supabaseClient"; 
// Import the CSS module
import styles from "./page.module.css";
// Import toast notifications
import { toast } from 'sonner';
// ✨ IMPORTED THE INTERN NAV
import InternNav from "../../components/InternNav";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State from your Listings page
  const [user, setUser] = useState(null); // Logged-in intern
  const [selectedJob, setSelectedJob] = useState(null);
  const [animateClose, setAnimateClose] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("You must be logged in to see matches.");

        // Set the user for the "Apply" button
        setUser(session.user);

        const res = await fetch(`/api/match/${session.user.id}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch matches");
        }

        const data = await res.json();
        setMatches(data);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []); // Empty dependency array ensures this runs once

  
  // --- Apply to Job Function (from Listings.jsx) ---
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

  // --- Modal control (from Listings.jsx) ---
  const openJobDetailModal = (jobData) => {
    setSelectedJob(jobData);
    document.body.classList.add('modal-open'); // You might need a global CSS file for this
  };

  const closeModal = () => {
    setAnimateClose(true); // Triggers the closing animation
    setTimeout(() => {
      setSelectedJob(null);
      setAnimateClose(false);
      document.body.classList.remove('modal-open');
    }, 300); // Must match animation duration
  };

  // --- Render logic based on state ---
  if (loading) {
    return <div className={styles.loading}>Loading your matches...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (matches.length === 0) {
    return <div className={styles.noMatches}>No matches found yet.</div>;
  }

  // --- Main content render ---
  return (
    <>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Recommended Internships</h1>
        
        {/* Updated card to match Listings.css style */}
        <div className={styles.internshipResults}>
          {matches.map((job) => (
            <div key={job.id} className={styles.matchCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.matchTitle}>{job.title}</h2>
                <p className={styles.matchCompany}>{job.company}</p>
              </div>
              <p className={styles.matchDescription}>
                Match Score: {(job.similarity * 100).toFixed(0)}%
              </p>
              <button
                onClick={() => openJobDetailModal(job)}
                className={styles.btnDetails}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- Modal (Copied from Listings.jsx) --- */}
      {selectedJob && (
        <div
          // Use `modalClosing` class to trigger slide-out animation
          className={`${styles.modalOverlay} ${styles.active} ${animateClose ? styles.modalClosingOverlay : ''}`}
          onClick={closeModal}
        >
          <div
            // Use `modalClosing` class to trigger slide-out animation
            className={`${styles.modalContent} ${animateClose ? styles.modalClosing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Job Details</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.jobDetailGroup}>
                <h3 className={styles.jobDetailTitle}>{selectedJob.title}</h3>
                <p className={styles.jobDetailCompany}>{selectedJob.company}</p>
              </div>

              <div className={styles.jobDetailGroup}>
                <div className={styles.jobDetailItem}>
                  <span className={styles.jobDetailLabel}>Location</span>
                  <span className={styles.jobDetailValue}>{selectedJob.location}</span>
                </div>
                {selectedJob.work_setup && (
                  <div className={styles.jobDetailItem}>
                    <span className={styles.jobDetailLabel}>Work Setup</span>
                    <span className={styles.jobDetailValue}>{selectedJob.work_setup}</span>
                  </div>
                )}
                {selectedJob.work_schedule && (
                  <div className={styles.jobDetailItem}>
                    <span className={styles.jobDetailLabel}>Work Schedule</span>
                    <span className={styles.jobDetailValue}>{selectedJob.work_schedule}</span>
                  </div>
                )}
                {selectedJob.salary != null && (
                  <div className={styles.jobDetailItem}>
                    <span className={styles.jobDetailLabel}>Salary</span>
                    <span className={styles.jobDetailValue}>{selectedJob.salary}</span>
                  </div>
                )}
              </div>

              <div className={styles.jobDetailGroup}>
                <span className={styles.jobDetailLabel}>Description</span>
                <p className={styles.jobDetailDescription}>{selectedJob.description}</p>
              </div>

              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div className={styles.jobDetailGroup}>
                  <span className={styles.jobDetailLabel}>Responsibilities</span>
                  <ul className={styles.jobDetailList}>
                    {selectedJob.responsibilities.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className={styles.jobDetailGroup}>
                  <span className={styles.jobDetailLabel}>Requirements</span>
                  <ul className={styles.jobDetailList}>
                    {selectedJob.requirements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} onClick={closeModal}>Close</button>
              <button
                className={styles.primaryBtn}
                onClick={() => applyToJob(selectedJob.id, selectedJob.company_id)}
                disabled={selectedJob.job_applications?.some(app => app.intern_id === user?.id)}
              >
                {selectedJob.job_applications?.some(app => app.intern_id === user?.id) ? "Applied ✔️" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ THIS WILL NOW DISAPPEAR WHEN MODAL IS OPEN ✨ */}
      <InternNav className={selectedJob ? styles.hidden : ''} />
    </>
  );
}