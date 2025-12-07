'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './Jobs.module.css';
import { toast } from 'sonner';
import { FiSearch, FiTrash2, FiMapPin, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function JobModeration() {
  const supabase = createClientComponentClient();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Modal State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // 1. Fetch Jobs with Company Name
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_posts')
        .select(`
          *,
          companies (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data.map(job => ({
        ...job,
        // Handle cases where company might be deleted but job remains (rare due to cascade)
        companyName: job.companies?.name || 'Unknown Company'
      }));

      setJobs(formattedData || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load job posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // 2. Modal Handlers
  const promptDelete = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  // 3. Delete Logic
  const executeDelete = async () => {
    if (!jobToDelete) return;

    try {
      const { error } = await supabase
        .from('job_posts')
        .delete()
        .eq('id', jobToDelete.id);

      if (error) throw error;
      
      toast.success("Job post removed successfully.");
      setJobs(jobs.filter(j => j.id !== jobToDelete.id));
      closeModal();
    } catch (err) {
      toast.error("Error removing job", { description: err.message });
    }
  };

  // 4. Search Filter
  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Job Moderation</h1>
          <p className={styles.subtitle}>Review and manage active job listings.</p>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search jobs or companies..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className={styles.jobsGrid}>
        {loading ? (
          <div className={styles.loading}>Loading job posts...</div>
        ) : filteredJobs.length === 0 ? (
          <div className={styles.loading}>No job posts found.</div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className={styles.jobCard}>
              
              {/* Card Top */}
              <div>
                <div className={styles.cardHeader}>
                  <div>
                     <span className={styles.companyName}>{job.companyName}</span>
                     <h3 className={styles.jobTitle}>{job.title}</h3>
                  </div>
                  <span className={styles.tag}>{job.work_setup}</span>
                </div>
                
                <div className={styles.jobMeta}>
                  <div className={styles.metaItem}>
                    <FiMapPin size={14}/> <span>{job.location}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <FiClock size={14}/> <span>{job.work_schedule}</span>
                  </div>
                </div>
              </div>

              {/* Card Bottom */}
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                
                <button 
                  className={styles.deleteBtn}
                  onClick={() => promptDelete(job)}
                >
                  <FiTrash2 size={16} /> Remove
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            
            <div className={styles.iconWrapper}>
              <FiAlertTriangle size={28} />
            </div>
            
            <h3 className={styles.modalTitle}>Remove Job Post?</h3>
            
            <p className={styles.modalText}>
              Are you sure you want to remove the listing for <strong>{jobToDelete?.title}</strong> at <strong>{jobToDelete?.companyName}</strong>? 
              <br/>This action cannot be undone.
            </p>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={closeModal}>
                Cancel
              </button>
              <button className={styles.btnConfirm} onClick={executeDelete}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}