// app/company/jobs/listings/CompanyJobListingsClient.jsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './listings.css';
import '../../../globals.css'

// 1. We now accept the 'initialJobs' prop from the server
export default function CompanyJobListingsClient({ initialJobs }) {
  // 2. We still need a client for our *actions* (delete, update)
  const supabase = createClientComponentClient();

  // 3. We use the prop to set the *initial state*.
  const [jobs, setJobs] = useState(initialJobs);
  
  // 4. Loading is false! The server already loaded the data.
  const [loading, setLoading] = useState(false); 
  
  const [editJob, setEditJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  // 5. The entire 'fetchJobs' function and its 'useEffect' are GONE.
  //    This is what removes the lag.

  // Hide/show the global navbar when modal opens/closes
  useEffect(() => {
    const navbar = document.querySelector('.company-nav');
    if (!navbar) return;

    if (modalOpen) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }

    return () => {
      navbar.classList.remove('hidden'); // cleanup
    };
  }, [modalOpen]);


  // (All your other functions for deleting, editing, and the modal
  //  remain exactly the same. They will use the 'supabase' client
  //  defined on line 12.)

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this job post?')) return;
    try {
      const { error } = await supabase.from('job_posts').delete().eq('id', id);
      if (error) throw error;
      setJobs((prev) => prev.filter((job) => job.id !== id));
      alert('✅ Job post deleted.');
    } catch (err) {
      console.error('Delete error:', err.message);
      alert('❌ Failed to delete job post.');
    }
  };

  const openEditModal = (job) => {
    setEditJob(job);
    setFormData({
      title: job.title,
      location: job.location,
      salary: job.salary || '',
      description: job.description || '',
      responsibilities: job.responsibilities || [],
      requirements: job.requirements || [],
      work_setup: job.work_setup || '',
      work_schedule: job.work_schedule || '',
    });
    setModalOpen(true);
  };

  const closeEditModal = () => {
    setModalOpen(false);
    setEditJob(null);
  };

  const handleEditChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTag = (field, value) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value],
    }));
  };

  const handleTagRemove = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const submitEdit = async () => {
    // We set loading to true *only* during the update
    setLoading(true); 
    try {
      const { error } = await supabase
        .from('job_posts')
        .update(formData)
        .eq('id', editJob.id);
      if (error) throw error;

      // Update the state locally for an instant UI change
      setJobs((prev) =>
        prev.map((job) => (job.id === editJob.id ? { ...job, ...formData } : job))
      );
      closeEditModal();
      alert('✅ Job updated successfully.');
    } catch (err) {
      console.error('Edit error:', err.message);
      alert('❌ Failed to update job.');
    } finally {
      setLoading(false);
    }
  };

  // 6. The main loading state is gone, but we disable
  //    buttons if an *action* (like submitEdit) is happening.
  if (loading) return <div className="text-center mt-8">Updating job...</div>;

  return (
    <>
    <div className="job-listings-container">
      <div className="header-bar">
        <h1>Your Job Listings</h1>
      </div>

      {jobs.length === 0 ? (
        <p className="empty-text">No job posts yet. Click “Post New Job” to add one.</p>
      ) : (
        <>
          {/* Table View */}
          <div className="table-view">
            <table className="min-w-full border border-gray-200 rounded-md">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Salary</th>
                  <th className="px-4 py-2 text-left">Posted</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{job.title}</td>
                    <td className="px-4 py-2">{job.location}</td>
                    <td className="px-4 py-2">{job.salary || '—'}</td>
                    <td className="px-4 py-2">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button onClick={() => openEditModal(job)} className="edit-btn">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="delete-btn">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card View */}
          <div className="card-view">
            <div className="job-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <h2>{job.title}</h2>
                  <p>{job.location}</p>
                  <p>💰 {job.salary || 'Not specified'}</p>
                  <div className="job-actions">
                    <button className="edit-btn" onClick={() => openEditModal(job)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(job.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ---------- EDIT MODAL ---------- */}
      {editJob && modalOpen && (
        <div className="modal-overlay active" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Job</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>

            <div className="modal-body">
              <label>Title</label>
              <input name="title" value={formData.title} onChange={handleEditChange} />

              <label>Location</label>
              <input name="location" value={formData.location} onChange={handleEditChange} />

              <label>Salary</label>
              <input name="salary" value={formData.salary} onChange={handleEditChange} />

              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleEditChange} />

              <label>Responsibilities</label>
              <div className="tag-input-container">
                {formData.responsibilities.map((res, i) => (
                  <span key={i} className="tag-chip">
                    {res} <button onClick={() => handleTagRemove('responsibilities', i)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add responsibility"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag('responsibilities', e.target.value.trim());
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <label>Requirements</label>
              <div className="tag-input-container">
                {formData.requirements.map((req, i) => (
                  <span key={i} className="tag-chip">
                    {req} <button onClick={() => handleTagRemove('requirements', i)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add requirement"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag('requirements', e.target.value.trim());
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <label>Work Setup</label>
              <input name="work_setup" value={formData.work_setup} onChange={handleEditChange} />

              <label>Work Schedule</label>
              <input name="work_schedule" value={formData.work_schedule} onChange={handleEditChange} />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeEditModal}>Cancel</button>
              <button className="save-btn" onClick={submitEdit} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}