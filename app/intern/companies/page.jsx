'use client';

import './companies.css';
import { toast } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FloatingAIChatWithCharts from '../../components/chatbot';
import { 
  Briefcase, MapPin, Laptop, DollarSign, 
  MessageCircle, Star, FileText, ArrowLeft, Search 
} from 'lucide-react';

// --- Helper Components ---

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(Number(rating) || 0);
  return (
    <div className="rating-stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < fullStars ? "star-full" : "star-empty"}>★</span>
      ))}
    </div>
  );
};

const DetailsPanel = ({ 
  selectedCompany, reviews, sendMessage, handleApply, 
  message, setMessage, sending, newComment, setNewComment, 
  newRating, setNewRating, handleSubmitReview, submittingReview,
  handleBack 
}) => {
  if (!selectedCompany) return (
    <div className="empty-state">
       <div style={{fontSize: '4rem', marginBottom: '20px', opacity: 0.5}}>🏢</div>
       <h2>Select a Company</h2>
       <p>Select a company from the top bar to view their details.</p>
    </div>
  );

  const averageRating = typeof selectedCompany.star_rating === 'number'
    ? selectedCompany.star_rating.toFixed(1) : '0.0';

  return (
    <div className="details-panel-inner">
      {/* Mobile Back Button */}
      <div className="mobile-header-controls">
         <button onClick={handleBack} className="mobile-back-btn">
           <ArrowLeft size={18}/> Back to List
         </button>
      </div>

      {/* GRID LAYOUT: 30% Left (Hero+Widgets) | 70% Right (Jobs) */}
      <div className="details-content-grid">
        
        {/* LEFT COLUMN: Hero + Widgets */}
        <div className="left-panel-stack">
            
            {/* Hero Header */}
            <div className="details-hero">
                <div className="hero-content">
                <div className="hero-logo-wrapper">
                    {selectedCompany.logo_url ? 
                    <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="hero-logo" /> :
                    <div className="hero-logo placeholder">🏢</div>
                    }
                </div>
                <div className="hero-text">
                    <h1>{selectedCompany.name}</h1>
                    <div className="hero-stats">
                        <span className="badge badge-cyan"><Star size={12} fill="currentColor"/> {averageRating} Rating</span>
                        <span className="badge badge-default"><FileText size={12}/> {selectedCompany.applications_count || 0} Apps</span>
                    </div>
                    <p className="hero-desc">{selectedCompany.description}</p>
                </div>
                </div>
            </div>

            {/* Widgets (Reviews & Contact) */}
            <div className="widgets-column">
                
                {/* Contact Widget */}
                <div className="widget-card">
                    <h4><MessageCircle size={18}/> Contact Coordinator</h4>
                    <div className="chat-box">
                        <textarea 
                        placeholder={`Message ${selectedCompany.name}...`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="3"
                        />
                        <button className="btn-primary" onClick={sendMessage} disabled={sending || !message.trim()}>
                        {sending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>

                {/* Reviews Widget */}
                <div className="widget-card">
                    <h4><Star size={18}/> Reviews</h4>
                    <div className="review-input-area" style={{marginBottom: '20px'}}>
                        <textarea 
                            className="input-base" 
                            placeholder="Write a review..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{marginBottom: '10px'}}
                        />
                        <div style={{display:'flex', gap:'10px'}}>
                            <select 
                            value={newRating} 
                            onChange={(e)=>setNewRating(Number(e.target.value))}
                            className="input-base"
                            style={{width: '80px'}}
                            >
                            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <button 
                            className="btn-secondary" 
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            >
                            Post
                            </button>
                        </div>
                    </div>

                    <div className="reviews-list">
                        {reviews.length > 0 ? reviews.map(r => (
                        <div key={r.id} className="review-bubble">
                            <p className="review-comment">"{r.comment}"</p>
                            <div className="review-meta">
                                <span>{r.profiles?.fullname || 'Student'}</span>
                                <span className="mini-rating">★ {r.rating}</span>
                            </div>
                        </div>
                        )) : <p className="text-muted">No reviews yet.</p>}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Jobs (Scrollable) */}
        <div className="jobs-section">
           <h3 className="section-title"><Briefcase size={20} /> Open Positions</h3>
           
           {selectedCompany.job_posts?.length > 0 ? (
             <div className="jobs-list">
               {selectedCompany.job_posts.map((job) => (
                 <div key={job.id} className="job-card-detailed">
                   <div className="job-header">
                      <h3>{job.title}</h3>
                      <span className="badge badge-default">{job.work_setup || 'On-site'}</span>
                   </div>
                   
                   <div className="job-tags">
                      <span className="tag"><MapPin size={14}/> {job.location}</span>
                      <span className="tag"><DollarSign size={14}/> {job.salary || 'Unpaid'}</span>
                   </div>
                   
                   <p className="job-desc">{job.description}</p>
                   
                   <button className="btn-primary" onClick={() => handleApply(job)}>
                     Apply Now
                   </button>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-muted">No active listings.</p>
           )}
        </div>

      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function CompaniesPage() {
  const supabase = createClientComponentClient();

  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [search, setSearch] = useState('');
  
  // Interactive States
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

// 1. Initial Data Fetching
useEffect(() => {
  const initData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUser(user);

    try {
      let { data: companiesData, error } = await supabase
        .from('companies')
        .select('id, name, description, logo_url, star_rating, email, phone, ceo');

      if (error) throw error;

      const companiesWithDetails = await Promise.all(
        (companiesData || []).map(async (company) => {
          // 1. Fetch Job Posts
          const { data: jobs } = await supabase
            .from('job_posts')
            .select('*').eq('company_id', company.id);

          // 2. Fetch Application Count
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          // --- NEW: Fetch Reviews to calculate rating ---
          const { data: reviews } = await supabase
             .from('company_reviews')
             .select('rating')
             .eq('company_id', company.id);

          // Calculate Average
          const totalRating = reviews?.reduce((sum, r) => sum + (r.rating || 0), 0) || 0;
          const avgRating = reviews?.length > 0 ? (totalRating / reviews.length) : 0;
          // ----------------------------------------------

          return {
            ...company,
            job_posts: jobs || [],
            applications_count: count || 0,
            star_rating: avgRating, // <--- We overwrite the static DB value with the calculated one
          };
        })
      );

      setCompanies(companiesWithDetails);
      if (companiesWithDetails.length > 0) setSelectedCompany(companiesWithDetails[0]);

    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };
  initData();
}, [supabase]);

  // 2. Fetch Reviews
  useEffect(() => {
    if (!selectedCompany) { setReviews([]); return; }
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('company_reviews')
        .select('id, comment, rating, profiles:student_id(fullname)')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    };
    fetchReviews();
  }, [selectedCompany, supabase]);

  // 3. Handlers (Same as before)
  const handleApply = async (job) => {
    if (!user) return toast.error("Please login first.");
    const { data: profile } = await supabase.from('profiles').select('resume_url').eq('id', user.id).single();
    if (!profile?.resume_url) return toast.warning("Please upload your resume in your profile first.");
    const { error } = await supabase.from('job_applications').insert([{ 
        job_id: job.id, intern_id: user.id, company_id: job.company_id, resume_url: profile.resume_url, status: "Pending" 
    }]);
    if (error) error.code === "23505" ? toast.info("Already applied.") : toast.error("Failed to apply.");
    else toast.success("Application submitted!");
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
        await supabase.from('chats').insert([{ receiver_id: selectedCompany.id, message, sender_id: user.id }]);
        toast.success('Message sent!');
        setMessage('');
    } catch(err) { toast.error('Failed to send message.'); }
    finally { setSending(false); }
  };

  const handleSubmitReview = async () => {
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
        await supabase.from('company_reviews').insert([{
            company_id: selectedCompany.id, student_id: user.id, comment: newComment, rating: newRating
        }]);
        toast.success("Review submitted!");
        // Simplified refresh for demo
        setNewComment('');
    } catch(err) { toast.error("Failed to submit review."); }
    finally { setSubmittingReview(false); }
  };

  const filteredCompanies = companies.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-container">Loading Companies...</div>;

  return (
    <div className="companies-page-container">
      
      {/* --- TOP ROW: List + Search --- */}
      <div className="top-bar-layout">
        <div className="companies-ribbon">
            {filteredCompanies.map(company => {
                const avg = typeof company.star_rating === 'number' ? company.star_rating.toFixed(1) : '0.0';
                return (
                    <div 
                        key={company.id} 
                        className={`company-card-compact ${selectedCompany?.id === company.id ? 'card-selected' : ''}`}
                        onClick={() => setSelectedCompany(company)}
                    >
                        {company.logo_url ? 
                            <img src={company.logo_url} alt={company.name} className="company-logo-small"/> : 
                            <div className="company-logo-small placeholder">🏢</div>
                        }
                        <div className="card-info-compact">
                            <h3>{company.name}</h3>
                            <span className="mini-rating">★ {avg}</span>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={e=>setSearch(e.target.value)} 
              className="search-input"
            />
        </div>
      </div>

      {/* --- BOTTOM ROW: Details Panel --- */}
      <div className="details-area">
          <DetailsPanel 
              selectedCompany={selectedCompany}
              reviews={reviews}
              handleApply={handleApply}
              sendMessage={sendMessage}
              message={message} setMessage={setMessage} sending={sending}
              newComment={newComment} setNewComment={setNewComment}
              newRating={newRating} setNewRating={setNewRating}
              handleSubmitReview={handleSubmitReview} submittingReview={submittingReview}
          />
      </div>

      {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
    </div>
  );
}