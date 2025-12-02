'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import TagInput from '../../../components/TagInput'; 
import './NewJobPost.css'; 
// Note: Header import removed because we use Sidebar layout now

import { Briefcase, MapPin, DollarSign, Clock, Layout } from 'lucide-react';

export default function NewJobPost() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    salary: '',
    description: '',
    responsibilities: [],
    requirements: [],
    work_setup: '',
    work_schedule: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to post a job.');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        company_id: user.id,
        created_at: new Date(),
      };

      // 1. Insert Job
      const { data: newJob, error: insertError } = await supabase
        .from('job_posts')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) throw insertError;

      // 2. Create Embedding (Optional - keep existing logic)
      try {
        await fetch(`/api/embedding/job`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: newJob.id })
        });
      } catch (embedError) {
        console.error("Embedding failed", embedError);
      }

      router.push('/company/jobs/listings');
    } catch (err) {
      console.error(err);
      alert('Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="header-section">
        <h1 className="page-title">Post a New Job</h1>
        <p className="page-subtitle">Create a compelling listing to attract the best interns.</p>
      </div>

      <form onSubmit={handleSubmit} className="bento-grid">
        
        {/* --- CARD 1: CORE INFO (Large, Top Left) --- */}
        <div className="bento-card core-info">
          <div className="card-header">
            <Briefcase size={20} className="card-icon" />
            <h3>Core Information</h3>
          </div>
          
          <div className="form-group">
            <label>Job Title</label>
            <input name="title" required placeholder="e.g. Junior Frontend Developer" value={formData.title} onChange={handleChange} />
          </div>

          <div className="row-group">
            <div className="form-group">
              <label><MapPin size={14}/> Location</label>
              <input name="location" required placeholder="e.g. Manila / Remote" value={formData.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label><DollarSign size={14}/> Salary / Allowance</label>
              <input name="salary" placeholder="e.g. ₱500/day (Optional)" value={formData.salary} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* --- CARD 2: LOGISTICS (Small, Top Right) --- */}
        <div className="bento-card logistics">
          <div className="card-header">
            <Clock size={20} className="card-icon" />
            <h3>Logistics</h3>
          </div>

          <div className="form-group">
            <label>Work Setup</label>
            <div className="select-wrapper">
              <Layout size={16} className="input-icon"/>
              <select name="work_setup" value={formData.work_setup} onChange={handleChange}>
                <option value="">Select setup...</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Schedule</label>
            <div className="select-wrapper">
              <Clock size={16} className="input-icon"/>
              <select name="work_schedule" value={formData.work_schedule} onChange={handleChange}>
                <option value="">Select schedule...</option>
                <option value="Full-time">Full-time (8hrs)</option>
                <option value="Part-time">Part-time</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- CARD 3: DESCRIPTION (Full Width) --- */}
        <div className="bento-card full-width">
          <div className="card-header">
            <h3>Job Description</h3>
          </div>
          <textarea 
            name="description" 
            required 
            rows="6" 
            placeholder="Describe the role, the team, and what the intern will learn..." 
            value={formData.description} 
            onChange={handleChange} 
          />
        </div>

        {/* --- CARD 4: RESPONSIBILITIES (Half Width) --- */}
        <div className="bento-card">
          <div className="card-header">
            <h3>Responsibilities</h3>
            <span className="hint">Press Enter to add</span>
          </div>
          <TagInput 
            value={formData.responsibilities} 
            onChange={(v)=>setFormData({...formData, responsibilities: v})} 
            placeholder="Add task..."
          />
        </div>

        {/* --- CARD 5: REQUIREMENTS (Half Width) --- */}
        <div className="bento-card">
          <div className="card-header">
            <h3>Requirements</h3>
            <span className="hint">Press Enter to add</span>
          </div>
          <TagInput 
            value={formData.requirements} 
            onChange={(v)=>setFormData({...formData, requirements: v})} 
            placeholder="Add skill..."
          />
        </div>

        {/* --- ACTION BAR --- */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="post-job-btn" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Job Post'}
          </button>
        </div>

      </form>
    </div>
  );
}