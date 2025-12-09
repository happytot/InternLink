"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import "./companies.css";

// Font imports
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Icons
import {
  FaInfoCircle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBuilding,
  FaSearch,
  FaThList,
  FaThLarge,
  FaStar,
  FaEnvelopeOpenText,
  FaBriefcase,
  FaTimes,
  FaUserTie,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";

export default function CoordinatorCompanies() {
  const supabase = createClientComponentClient();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Modal sub-states
  const [comments, setComments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, description, location, logo_url, updated_at, ceo, email, phone");

    if (error) {
      console.error("Supabase error:", error);
      // FIXED: Added backticks for template literal
      toast.error(`Failed to load companies: ${error.message}`);
    }
    setCompanies(data || []);
    setLoading(false);
  };

  // Fetch comments & job posts dynamically for modal
  const fetchModalData = async (companyId) => {
    setModalLoading(true);

    const { data: commentData } = await supabase
      .from("company_reviews")
      .select("id, comment, rating, profiles:student_id(fullname)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setComments(commentData || []);

    const { data: jobData } = await supabase
      .from("job_posts")
      .select("id, title, description, salary, responsibilities, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setJobs(jobData || []);
    setModalLoading(false);
  };

  const openModal = (company) => {
    setSelectedCompany(company);
    fetchModalData(company.id);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      return toast.warning("Type a message first!", { duration: 2000 });
    }

    // Ensure you have RLS policies allowing inserts to this table
    const { error } = await supabase.from("coordinator_messages").insert({
      company_id: selectedCompany.id,
      message,
      created_at: new Date()
    });

    if (error) {
      toast.error("Error sending message: " + error.message);
    } else {
      setMessage("");
      // FIXED: Added backticks for template literal
      toast.success(`Message sent to ${selectedCompany.name} successfully!`, { duration: 3000 });
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyLogo = (url) =>
    url && url.trim() !== ""
      ? url
      : "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";

  // Skeleton components
  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-line full large"></div>
      <div className="skeleton-line medium"></div>
      <div className="skeleton-line short"></div>
    </div>
  );

  return (
    <div className="dashboard-inner">
      {/* Header Section */}
      <div className="header-section reveal-on-scroll">
        <div className="header-text">
          <h2>Registered Companies</h2>
          <p className="dash-subtitle">Manage partners and view company details.</p>
        </div>

        <div className="actions">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />
          </div>

          <div className="view-toggle">
            <label className="switch" title="Toggle View">
              <input
                type="checkbox"
                checked={viewMode === "card"}
                onChange={() =>
                  setViewMode(viewMode === "table" ? "card" : "table")
                }
              />
              <span className="slider"></span>
            </label>
            <div className="toggle-icon">
              {viewMode === "table" ? <FaThList /> : <FaThLarge />}
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      {loading ? (
        viewMode === "table" ? (
          <div className="data-area table-view">
            <div className="skeleton-table">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="data-area card-container">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      ) : filteredCompanies.length === 0 ? (
        <div className="empty-state-card reveal-on-scroll">
          <p className="empty-state-text">No companies found matching your search term.</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="data-area table-view reveal-on-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th><FaBuilding className="icon-cyan" /> Company Name</th>
                <th><FaMapMarkerAlt className="icon-cyan" /> Location</th>
                <th><FaCalendarAlt className="icon-cyan" /> Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td>{c.name || "N/A"}</td>
                  <td><span className="text-muted">{c.location || "N/A"}</span></td>
                  <td>{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => openModal(c)}
                    >
                      <FaInfoCircle /> Info
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-area card-container">
          {filteredCompanies.map((c, index) => (
            <div className="data-card reveal-on-scroll" key={c.id}>
              <img
                src={getCompanyLogo(c.logo_url)}
                alt={c.name}
                className="company-logo"
              />
              <h3 className="company-name">{index + 1}. {c.name || "N/A"}</h3>
              <p className="company-location">
                <FaMapMarkerAlt className="icon-muted" />
                {c.location || "N/A"}
              </p>
              <div className="card-actions">
                <button
                  className="btn-secondary"
                  onClick={() => openModal(c)}
                >
                  <FaInfoCircle style={{ marginRight: "5px" }} />
                  Full Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================== MODAL (Glassmorphism) ======================= */}
      {selectedCompany && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedCompany(null)}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{selectedCompany.name} Profile</h2>
              <button
                className="close-modal-icon"
                onClick={() => setSelectedCompany(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="bento-container">
              {/* === LEFT COLUMN: Details, Reviews, Message === */}
              <div className="bento-left">
                <div className="profile-picture-section card-container-inner">
                  <img
                    src={getCompanyLogo(selectedCompany.logo_url)}
                    alt={selectedCompany.name}
                    className="profile-picture"
                  />
                  <div className="company-info-text">
                    <h3 className="company-name-modal">{selectedCompany.name}</h3>
                    <div className="company-location-modal">
                      <div className="detail-row">
                        <FaMapMarkerAlt className="icon-muted" />
                        <span>{selectedCompany.location || "N/A"}</span>
                      </div>
                      <div className="detail-row">
                        <FaUserTie className="icon-muted" />
                        <span>CEO: {selectedCompany.ceo || "N/A"}</span>
                      </div>
                      <div className="detail-row">
                        <FaEnvelope className="icon-muted" />
                        <span>Email: {selectedCompany.email || "N/A"}</span>
                      </div>
                      <div className="detail-row">
                        <FaPhone className="icon-muted" />
                        <span>Phone: {selectedCompany.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Description --- */}
                <div className="profile-section card-container-inner">
                  <h3><FaInfoCircle className="icon-orange" /> Description</h3>
                  <p>{selectedCompany.description || "No description provided."}</p>
                </div>

                {/* --- Reviews and Rating --- */}
                <div className="profile-section card-container-inner">
                  <h3><FaStar className="icon-orange" /> Student Reviews ({comments.length})</h3>
                  {modalLoading ? (
                    <p className="text-muted">Loading reviews...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-muted">No reviews yet.</p>
                  ) : (
                    <>
                      <div className="average-rating">
                        {Array.from({ length: 5 }, (_, i) => (
                          <FaStar
                            key={i}
                            color={i < Math.round(
                              comments.reduce((acc, c) => acc + c.rating, 0) / comments.length
                            ) ? "var(--primary-orange)" : "var(--border-color)"}
                          />
                        ))}
                        <span className="rating-text">
                          ({(comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)} / 5.0)
                        </span>
                      </div>

                      <div className="comments-list">
                        {comments.map((c) => (
                          <div key={c.id} className="comment-card">
                            <div className="comment-header">
                              <strong className="comment-author">{c.profiles?.fullname || "Student"}</strong>
                              <div className="star-rating">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <FaStar key={i} color={i < c.rating ? "var(--primary-orange)" : "var(--text-muted)"} />
                                ))}
                              </div>
                            </div>
                            <p className="comment-body">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* --- Send Message --- */}
                <div className="profile-section card-container-inner">
                  <h3><FaEnvelopeOpenText className="icon-orange" /> Send Message</h3>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message to log communication with the company..."
                    className="message-textarea"
                  />
                  <button onClick={handleSendMessage} className="btn-primary" style={{ marginTop: "15px" }}>
                    <FaEnvelopeOpenText /> Send Message
                  </button>
                </div>
              </div>

              {/* === RIGHT COLUMN: Job Posts === */}
              <div className="bento-right">
                <div className="job-posts-container card-container-inner">
                  <h3><FaBriefcase className="icon-cyan" /> Job Posts ({jobs.length})</h3>
                  {modalLoading ? (
                    <p className="text-muted">Loading job posts...</p>
                  ) : jobs.length === 0 ? (
                    <p className="text-muted">No active job posts found.</p>
                  ) : (
                    <div className="job-grid">
                      {jobs.map((j) => (
                        <div key={j.id} className="job-card">
                          <strong className="job-title">{j.title}</strong>
                          {j.salary && <p className="job-detail"><strong>Salary:</strong> {j.salary}</p>}
                          <p className="job-description"> {j.description || "No description provided."}</p>
                          <small className="job-date">Posted on: {new Date(j.created_at).toLocaleDateString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              className="close-modal-btn btn-secondary"
              onClick={() => setSelectedCompany(null)}
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}