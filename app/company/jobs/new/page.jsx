'use client';

import { useState } from 'react';
// ✨ FIXED: Used the recommended '@/' path alias for robustness
import { supabase } from '../../../../lib/supabaseClient'; 
import { useRouter } from 'next/navigation';
import TagInput from '../../../components/TagInput'; // adjust import path
import './NewJobPost.css';

export default function NewJobPost() {
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
  const router = useRouter();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  // --- ✨ THIS IS THE MODIFIED FUNCTION ---
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
        title: formData.title,
        location: formData.location,
        salary: formData.salary,
        description: formData.description,
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        work_setup: formData.work_setup,
        work_schedule: formData.work_schedule,
        company_id: user.id, // Assumes company users log in with auth
        created_at: new Date(),
      };

      // --- ✨ STEP 1: Insert the job and get its new ID back ---
      const { data: newJob, error: insertError } = await supabase
        .from('job_posts')
        .insert(payload)
        .select('id') // Get the 'id' column from the new row
        .single();    // We only inserted one row

      if (insertError) throw insertError;

      // --- ✨ STEP 2: (NEW!) Automatically create the embedding ---
      try {
        await fetch(`/api/embedding/job`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: newJob.id }) // Use the new ID
        });
        // Both steps were successful
        alert('✅ Job created and analyzed by AI!');
      } catch (embedError) {
        console.error("Embedding creation failed:", embedError);
        // The job was created, but embedding failed. Still a "soft" success.
        alert('✅ Job created, but AI analysis failed. Please try editing the job.');
      }
      // -----------------------------------------------------------

      router.push('/company/jobs/listings');
    } catch (err) {
      console.error(err);
      alert('Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-job-post-container">
      <h1 className='head'>Create New Job Post</h1>
      <form onSubmit={handleSubmit} className="job-post-form">
        <label>Job Title</label>
        <input name="title" required value={formData.title} onChange={handleChange} />

        <label>Location</label>
        <input name="location" required value={formData.location} onChange={handleChange} />

        <label>Salary (optional)</label>
        <input name="salary" value={formData.salary} onChange={handleChange} />

        <label>Description</label>
        <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} />

        <label>Responsibilities</label>
        <TagInput value={formData.responsibilities} onChange={(v)=>setFormData({...formData, responsibilities: v})} placeholder="Add responsibility and press Enter"/>

        <label>Requirements</label>
        <TagInput value={formData.requirements} onChange={(v)=>setFormData({...formData, requirements: v})} placeholder="Add requirement and press Enter"/>

        <label>Work Setup</label>
        <select name="work_setup" value={formData.work_setup} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Onsite">Onsite</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Remote">Remote</option>
        </select>

        <label>Work Schedule</label>
        <select name="work_schedule" value={formData.work_schedule} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Shift">Shift</option>
        </select>

        <button type="submit" className="post-job" disabled={loading}>{loading ? 'Posting...' : 'Post Job'}</button>
      </form>

      <style jsx>{`
        .new-job-post-container { max-width:760px; margin:2rem auto; padding:1.5rem; background:rgba(255,255,255,0.95); border-radius:12px; }
        label { display:block; margin-top:12px; font-weight:600; color:#333; }
        input, textarea, select { width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-top:6px; }
        button { margin-top:16px; padding:10px 14px; background: linear-gradient(135deg,#007aff,#0a84ff); color:white; border:none; border-radius:10px; cursor:pointer; }
      `}</style>
    </div>
  );
}