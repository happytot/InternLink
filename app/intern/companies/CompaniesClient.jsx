"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast, Toaster } from 'sonner';
import './companies.css';

export default function CompaniesClient({ initialCompanies }) {
  const supabase = createClientComponentClient();

  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [animateClose, setAnimateClose] = useState(false);

  // For submitting new review
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Scroll lock
  useEffect(() => {
    if (selectedCompany) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedCompany]);

  // Fetch company reviews dynamically
  useEffect(() => {
    if (!selectedCompany) return;

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('id, comment, rating, profiles:student_id(fullname)')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch reviews:', error);
        return;
      }

      setReviews(data);
    };

    fetchReviews();
  }, [selectedCompany, supabase]);

  const closeModal = () => {
    setAnimateClose(true);
    setTimeout(() => {
      setSelectedCompany(null);
      setAnimateClose(false);
      setReviews([]);
      setNewComment('');
      setNewRating(5);
    }, 350); // Increased timeout to match CSS animation duration
  };

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !selectedCompany) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to send a message.');
      setSending(false);
      return;
    }

    try {
      // NOTE: The receiver_id in your chat table should probably be the Company's Coordinator's ID, not the Company's ID. 
      // Assuming for now, selectedCompany.id is the correct receiver.
      const { error } = await supabase.from('chats').insert([
        { 
          receiver_id: selectedCompany.id,
          message: message,
          sender_id: user.id
        }
      ]);
      if (error) throw error;
      toast.success('Message sent! The company will be notified.');
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  }, [supabase, message, selectedCompany]);

  const handleApply = useCallback(async (job) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login first.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resume_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.resume_url) {
      toast.warning("Please upload your resume in your profile before applying.");
      return;
    }

    const { error } = await supabase
      .from('job_applications')
      .insert([
        {
          job_id: job.id,
          intern_id: user.id,
          company_id: job.company_id,
          resume_url: profile.resume_url,
          status: "Pending",
        },
      ]);

    if (error) {
      if (error.code === "23505") {
        toast.info("You already applied for this job.");
      } else {
        toast.error("Failed to apply. Try again.");
      }
      return;
    }

    closeModal();
    toast.success("Application submitted successfully!");
  }, [supabase, closeModal]);

  // Submit comment/rating
  const handleSubmitReview = useCallback(async () => {
    if (!newComment.trim()) return;

    setSubmittingReview(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to submit a review.");
      setSubmittingReview(false);
      return;
    }

    try {
      const { error } = await supabase.from('company_reviews').insert([
        {
          company_id: selectedCompany.id,
          student_id: user.id,
          comment: newComment,
          rating: newRating,
        }
      ]);
      if (error) throw error;
      toast.success("Review submitted!");
      setNewComment('');
      setNewRating(5);

      // Refresh reviews
      const { data } = await supabase
        .from('company_reviews')
        .select('id, comment, rating, profiles:student_id(fullname)')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false });

      setReviews(data);

    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }, [newComment, newRating, selectedCompany, supabase]);

  const filteredCompanies = companies.filter((c) =>
    (c.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="companies-page-container">
      {/* Toaster with Glassmorphism styles */}
      <Toaster richColors position="top-right" />

      <div className="search-bar reveal-on-scroll">
        <input
          type="text"
          placeholder="Search companies, technologies, or roles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-glass"
        />
      </div>

      <div className="companies-grid">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="company-card glass-card reveal-on-scroll"
            onClick={() => setSelectedCompany(company)}
            style={{animationDelay: `${Math.random() * 0.4}s`}}
          >
            <div className="company-logo-container">
              {company.logo_url && <img src={company.logo_url} alt={company.name} className="company-logo" />}
            </div>
            <h2>{company.name}</h2>
            <p className="company-description">{company.description}</p>
            <button className="btn-secondary view-btn">View Profile & Jobs</button>
          </div>
        ))}
      </div>

      {selectedCompany && (
        <div
          className={`modal-overlay ${animateClose ? 'modal-closing-overlay' : 'active'}`}
          onClick={closeModal}
        >
          <div
            className={`modal-content glass-card ${animateClose ? 'modal-closing-content' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal}>✕</button>

            {/* Company Profile */}
            <div className="company-profile">
              {selectedCompany.logo_url && <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="profile-logo" />}
              <h2>{selectedCompany.name}</h2>
              <p className="description-text">{selectedCompany.description}</p>
              <div className="stats">
                <span className="badge">⭐ {(reviews.length ? (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1) : 0)} / 5</span>
                <span className="badge">📄 {selectedCompany.applications_count || 0} student(s) applied</span>
              </div>
            </div>

            {/* Job Posts */}
            <div className="section-card">
              <h3>💼 Available Internship Roles</h3>
              {selectedCompany.job_posts?.length > 0 ? (
                <div className="jobs-list">
                  {selectedCompany.job_posts.map((job) => (
                    <div key={job.id} className="job-card">
                      <h4>{job.title}</h4>
                      <p className="job-description-text">{job.description}</p>
                      <div className="job-meta-grid">
                        <span className="meta-badge">📍 {job.location}</span>
                        <span className="meta-badge">💻 {job.work_setup || 'N/A'}</span>
                        <span className="meta-badge">💰 {job.salary || 'Unpaid'}</span>
                      </div>
                      <button className="btn-primary apply-btn" onClick={() => handleApply(job)}>Apply Now</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No active job posts from this company at the moment.</p>
              )}
            </div>

            {/* Reviews */}
            <div className="section-card">
              <h3>⭐ Student Reviews</h3>
              <div className="reviews-list">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r.id} className="review-bubble">
                      <p className="review-comment">“{r.comment}”</p>
                      <p className="review-meta">
                        <strong>{r.profiles?.fullname || "Anonymous Student"}</strong> | Rating: ⭐ {r.rating}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Be the first to leave a review!</p>
                )}
              </div>

              {/* Submit review form */}
              <div className="submit-review form-group">
                <h4>Share your experience:</h4>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your review..."
                  rows="3"
                  className="input-glass"
                />
                <div className="review-controls">
                  <label className="rating-label">
                    Rating:
                    <select 
                        value={newRating} 
                        onChange={(e)=>setNewRating(Number(e.target.value))}
                        className="input-glass"
                    >
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </label>
                  <button 
                        onClick={handleSubmitReview} 
                        disabled={submittingReview || !newComment.trim() || newRating === 0}
                        className="btn-secondary"
                    >
                    {submittingReview ? "Posting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>

            {/* Send Message */}
            <div className="section-card">
              <h3>💬 Connect with the Coordinator</h3>
              <p className="text-muted">Send a direct message to the company's coordinator for personalized questions.</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask ${selectedCompany.name} about culture or roles...`}
                rows="3"
                className="input-glass"
              />
              <button 
                  onClick={sendMessage} 
                  disabled={sending || !message.trim()}
                  className="btn-primary"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}