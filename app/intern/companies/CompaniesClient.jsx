"use client";

import './companies.css';
import { toast, Toaster } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Briefcase, 
  MapPin, 
  Laptop, 
  DollarSign, 
  MessageCircle, 
  Star, 
  FileText 
} from 'lucide-react';
import FloatingAIChatWithCharts from '../../components/chatbot';

// Utility: Star rating display
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(Number(rating));
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span key={i} className={i < fullStars ? "star-full" : "star-empty"}>
        ★
      </span>
    );
  }
  return <div className="rating-stars">{stars}</div>;
};

// Details Panel Component
const DetailsPanel = ({ 
  selectedCompany, reviews, sendMessage, handleApply, 
  message, setMessage, sending, newComment, setNewComment, 
  newRating, setNewRating, handleSubmitReview, submittingReview
}) => {
  if (!selectedCompany) return null;

const averageRating = typeof selectedCompany.star_rating === 'number'
  ? selectedCompany.star_rating.toFixed(1)
  : '0.0';




  return (
    <div className="details-panel-container reveal-on-scroll">
      <div className="details-content glass-component">

        {/* 1. Company Profile */}
       

{/* 1. Company Profile */}
<div className="company-profile">
  <div className="profile-header-group"> 
    {selectedCompany.logo_url && <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="profile-logo" />}
    
    <div className="title-block"> {/* New wrapper for title/stats */}
        <h2>{selectedCompany.name}</h2> 
        <div className="stats">
            <span className="badge badge-cyan">
                <StarRating rating={averageRating} />
                {averageRating} / 5
            </span>
            <span className="badge badge-default">   
                <FileText className="lucide-icon" size={16} /> {selectedCompany.applications_count || 0} Applications
            </span>
        </div>
    </div>
    
    {/* Contact info moved here, styled to align right */}
    <div className="contact-info-block">
        {selectedCompany.ceo && <p><strong>CEO:</strong> {selectedCompany.ceo}</p>}
        {selectedCompany.email && <p><strong>Email:</strong> {selectedCompany.email}</p>}
        {selectedCompany.phone && <p><strong>Phone:</strong> {selectedCompany.phone}</p>}
    </div>
  </div> 

  <p className="description-text">{selectedCompany.description}</p>
</div>

        {/* 2. Two-Column Grid */}
        <div className="details-grid">
          {/* Column 1: Job Posts */}
          <div className="details-grid-column job-section-column">
            <div className="section-card job-post-card">
              <h3>
                <Briefcase className="lucide-icon" size={18} /> Available Internship Roles
              </h3>
              {selectedCompany.job_posts?.length > 0 ? (
                <div className="jobs-list">
                  {selectedCompany.job_posts.map((job) => (
                    <div key={job.id} className="job-card">
                      <h4>{job.title}</h4>
                      <hr style={{width: "100%", color: "gray"}} />
                      <p className="job-description-text">{job.description}</p>
                      <div className="job-meta-grid">
                       <span > <MapPin className="lucide-icon" size={14} /> Location: {job.location}</span>
                      <span> <Laptop className="lucide-icon" size={14} />Work Setup:  {job.work_setup || 'N/A'}</span> 
                        <span> <DollarSign className="lucide-icon" size={14} />Salary: {job.salary || 'Unpaid'}</span>
                      </div>
                      <button className="btn-primary apply-btn" onClick={() => handleApply(job)}>Apply Now</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No active job posts from this company at the moment.</p>
              )}
            </div>
          </div>

          {/* Column 2: Reviews & Messaging */}
          <div className="details-grid-column secondary-info-column">

            {/* Reviews */}
            <div className="section-card review-section-card">
              <h3>
                <Star className="lucide-icon" size={18} /> Student Reviews
              </h3>
              <div className="submit-review form-group">
                <h4>Share your experience:</h4>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your review..."
                  rows="3"
                  className="input-base"
                />
                <div className="review-controls">
                  <label className="rating-label">
                    Rating:
                    <select 
                        value={newRating} 
                        onChange={(e)=>setNewRating(Number(e.target.value))}
                        className="input-base select-input"
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

              <div className="reviews-list">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r.id} className="review-bubble">
                      <p className="review-comment">“{r.comment}”</p>
                      <p className="review-meta">
                        <strong className="text-cyan">{r.profiles?.fullname || "Anonymous Student"}</strong> | 
                        <StarRating rating={r.rating} /> {r.rating}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Be the first to leave a review!</p>
                )}
              </div>
            </div>

            {/* Messaging */}
            <div className="section-card messaging-section-card">
              <h3>
                <MessageCircle className="lucide-icon" size={18} /> Connect with the Coordinator
              </h3>
              <p className="text-muted">Send a direct message to the company's coordinator for personalized questions.</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask ${selectedCompany.name} about culture or roles...`}
                rows="3"
                className="input-base"
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

      </div>
    </div>
  );
};

// Main Client Component
export default function CompaniesClient({ initialCompanies }) {
  const supabase = createClientComponentClient();

  // ✅ All hooks inside the component
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    getUser();
  }, [supabase]);

  // Initialize selectedCompany with the first one
  useEffect(() => {
    if (initialCompanies && initialCompanies.length > 0 && !selectedCompany) {
      setSelectedCompany(initialCompanies[0]);
    }
  }, [initialCompanies, selectedCompany]);

  // Fetch reviews
  useEffect(() => {
    if (!selectedCompany) {
      setReviews([]);
      return;
    }

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('id, comment, rating, profiles:student_id(fullname)')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Failed to fetch reviews:', error);
      else setReviews(data);
    };

    fetchReviews();
  }, [selectedCompany, supabase]);

  // Handlers
  const selectCompany = (company) => {
    setSelectedCompany(company);
    setMessage('');
    setNewComment('');
    setNewRating(5);
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
        { receiver_id: selectedCompany.id, message: message, sender_id: user.id }
      ]);
      if (error) throw error;
      toast.success('Message sent!');
      setMessage('');
    } catch (err) {
      console.error(err);
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
      .insert([{ job_id: job.id, intern_id: user.id, company_id: job.company_id, resume_url: profile.resume_url, status: "Pending" }]);

    if (error) {
      if (error.code === "23505") toast.info("You already applied for this job.");
      else toast.error("Failed to apply. Try again.");
      return;
    }

    toast.success("Application submitted successfully!");
  }, [supabase]);

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
    // 1️⃣ Insert the new review
    const { error: insertError } = await supabase.from('company_reviews').insert([{
      company_id: selectedCompany.id,
      student_id: user.id,
      comment: newComment,
      rating: newRating,
    }]);

    if (insertError) throw insertError;

    toast.success("Review submitted!");

    // 2️⃣ Recalculate average rating for this company
  // Fetch all reviews for this company
const { data: companyReviews, error: fetchError } = await supabase
  .from('company_reviews')
  .select('rating')
  .eq('company_id', selectedCompany.id);

if (fetchError) throw fetchError;

// Calculate average
const averageRating = typeof company.star_rating === 'number'
  ? company.star_rating.toFixed(1)
  : '0.0';



    // 3️⃣ Update the company's star_rating in the companies table
   const avgRatingNumber = parseFloat(avgRating); // convert string to number

const { error: updateError } = await supabase
  .from('companies')
  .update({ star_rating: avgRatingNumber })
  .eq('id', selectedCompany.id);

if (updateError) throw updateError;


    // 4️⃣ Update local state
    setCompanies(prev =>
      prev.map(c =>
        c.id === selectedCompany.id ? { ...c, star_rating: avgRating } : c
      )
    );

    setNewComment('');
    setNewRating(5);

    // 5️⃣ Refresh selected company reviews
    const { data: updatedReviews } = await supabase
      .from('company_reviews')
      .select('id, comment, rating, profiles:student_id(fullname)')
      .eq('company_id', selectedCompany.id)
      .order('created_at', { ascending: false });

    setReviews(updatedReviews);

  } catch (err) {
    console.error(err);
    toast.error("Failed to submit review or update rating.");
  } finally {
    setSubmittingReview(false);
  }
}, [newComment, newRating, selectedCompany, supabase]);


  const filteredCompanies = companies.filter(c =>
    (c.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="companies-page-container">
      <div className="bg-gradient-orb"></div>
      <Toaster richColors position="top-right" theme="dark" />

      <div className={`main-layout ${selectedCompany ? 'details-visible' : ''}`}>
        {/* Left: Company List */}
        <div className="list-column">
          <div className="search-bar reveal-on-scroll">
            <input
              type="text"
              placeholder="Search companies, technologies, or roles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="companies-grid">
  {filteredCompanies.map((company, index) => {
    const averageRating = typeof company.star_rating === 'number'
      ? company.star_rating.toFixed(1) // only for display
      : '0.0';

    return (
      <div
        key={company.id}
        className={`company-card reveal-on-scroll ${selectedCompany?.id === company.id ? 'card-selected' : ''}`}
        onClick={() => selectCompany(company)}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        {company.logo_url && <img src={company.logo_url} alt={company.name} className="company-logo" />}
        <h2>{company.name}</h2>
        <p className="company-description">{company.description}</p>

        <div className="card-metrics-row">
          <span className="badge badge-cyan">
            <StarRating rating={averageRating} />
            {averageRating} / 5
          </span>
          <span className="badge badge-default">
            📄 {company.applications_count || 0} apps
          </span>
        </div>
      </div>
    );
  })}
</div>



        </div>

        {/* Right: Details Panel */}
        <DetailsPanel 
          selectedCompany={selectedCompany}
          reviews={reviews}
          sendMessage={sendMessage}
          handleApply={handleApply}
          message={message}
          setMessage={setMessage}
          sending={sending}
          newComment={newComment}
          setNewComment={setNewComment}
          newRating={newRating}
          setNewRating={setNewRating}
          handleSubmitReview={handleSubmitReview}
          submittingReview={submittingReview}
        />
      </div>

      {/* Floating AI Chat */}
      {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
    </div>
  );
}
