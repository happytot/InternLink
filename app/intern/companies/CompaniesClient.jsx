'use client';

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
    }, 200);
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
      const { error } = await supabase.from('chats').insert([
        { 
          receiver_id: selectedCompany.id,
          message: message,
          sender_id: user.id
        }
      ]);
      if (error) throw error;
      toast.success('Message sent!');
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
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
      toast.error("Please upload your resume in your profile before applying.");
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
        toast("You already applied for this job.");
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
    <>
      <Toaster richColors position="top-right" />

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="companies-grid">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="company-card"
            onClick={() => setSelectedCompany(company)}
          >
            {company.logo_url && <img src={company.logo_url} alt={company.name} className="company-logo" />}
            <h2>{company.name}</h2>
            <p className="company-description">{company.description}</p>
            <button className="view-btn">View Profile & Jobs</button>
          </div>
        ))}
      </div>

      {selectedCompany && (
        <div
          className={`modal-overlay ${animateClose ? 'modal-closing' : 'active'}`}
          onClick={closeModal}
        >
          <div
            className={`modal-content ${animateClose ? 'modal-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal}>✕</button>

            {/* Company Profile */}
            <div className="company-profile">
              {selectedCompany.logo_url && <img src={selectedCompany.logo_url} alt={selectedCompany.name} />}
              <h2>{selectedCompany.name}</h2>
              <p className="description-text">{selectedCompany.description}</p>
              <div className="stats">
                <span>⭐ {reviews.length ? (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1) : 0} / 5</span>
                <span>📄 {selectedCompany.applications_count} student(s) applied</span>
              </div>
            </div>

            {/* Job Posts */}
            <div className="company-job-posts">
              <h3>Available Job Posts</h3>
              {selectedCompany.job_posts?.length > 0 ? (
                <div className="jobs-grid">
                  {selectedCompany.job_posts.map((job) => (
                    <div key={job.id} className="job-card">
                      <h4>{job.title}</h4>
                      <p className="job-description-text">{job.description}</p>
                      {job.responsibilities && (
                        <p><strong>Responsibilities:</strong> {job.responsibilities.join(', ')}</p>
                      )}
                      <div className="job-details">
                        <span><strong>Location:</strong> {job.location}</span>
                        <span><strong>Work Setup:</strong> {job.work_setup || 'N/A'}</span>
                        <span><strong>Salary:</strong> {job.salary || 'N/A'}</span>
                      </div>
                      <button className="apply-btn" onClick={() => handleApply(job)}>Apply Now</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No job posts available.</p>
              )}
            </div>

            {/* Reviews */}
            <div className="company-comments">
              <h3>Comments / Reviews</h3>
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <p key={r.id}>
                    <strong>{r.profiles?.fullname || "Anonymous"}:</strong> {r.comment} ⭐ {r.rating}
                  </p>
                ))
              ) : (
                <p>No reviews yet.</p>
              )}

              {/* Submit review */}
              <div className="submit-review">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your review..."
                />
                <div>
                  <label>
                    Rating:
                    <select value={newRating} onChange={(e)=>setNewRating(Number(e.target.value))}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <button onClick={handleSubmitReview} disabled={submittingReview || !newComment.trim()}>
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>

            {/* Send Message */}
            <div className="send-message">
              <h3>Send Message to {selectedCompany.name}</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
              />
              <button onClick={sendMessage} disabled={sending || !message.trim()}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
