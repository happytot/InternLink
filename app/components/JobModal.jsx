// src/components/JobModal.jsx ⬅️ RENAMED FILE

import React from 'react';
// 🚨 Ensure you rename the CSS file as well, or point to the old name
import './JobModal.css'; 

const JobModal = ({ job, onClose }) => { // ⬅️ RENAMED COMPONENT
    
    if (!job) return null;

    const handleApply = (e) => {
        e.preventDefault(); 
        alert(`Applying for: ${job.title} at ${job.company}`); 
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                
                {/* --- Internship Detail Content --- */}
                <header className="detail-header-modal">
                    <h1>{job.title}</h1>
                    <p className="detail-company-modal">{job.company}</p>
                    <div className="job-meta-details-modal">
                        <span>📍 {job.location}</span>
                        <span>💼 {job.type}</span>
                        <span>🏷️ {job.field}</span>
                    </div>
                    <button className="btn-apply-modal" onClick={handleApply}>
                        🚀 Apply Now
                    </button>
                </header>

                <div className="modal-body">
                    <section className="detail-description-modal">
                        <h2>Job Description</h2>
                        <p>{job.description}</p>
                    </section>
                    
                    {/* ... Responsibilities and Requirements sections remain the same ... */}

                    <section className="detail-responsibilities-modal">
                        <h2>Key Responsibilities</h2>
                        <ul>
                            {job.responsibilities && job.responsibilities.map((res, index) => (
                                <li key={index}>{res}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="detail-requirements-modal">
                        <h2>Required Qualifications</h2>
                        <ul>
                            {job.requirements && job.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default JobModal;