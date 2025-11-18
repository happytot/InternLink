'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./companies.css";

// Icons
import {
  FaInfoCircle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBuilding,
  FaSearch,
  FaThList,
  FaThLarge,
  FaStar
} from "react-icons/fa";

export default function CoordinatorCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Modal sub-states
  const [comments, setComments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, description, location, logo_url, updated_at");

    if (error) console.error("Supabase error:", error);
    setCompanies(data || []);
    setLoading(false);
  };

  // Fetch comments & job posts dynamically for modal
  const fetchModalData = async (companyId) => {
    // Comments
    const { data: commentData } = await supabase
      .from("company_reviews")
      .select("id, comment, rating, profiles:student_id(fullname)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    setComments(commentData || []);

    // Job posts
   // Job posts
const { data: jobData } = await supabase
  .from("job_posts")
  .select("id, title, description, salary, responsibilities, created_at")
  .eq("company_id", companyId)
  .order("created_at", { ascending: false });
setJobs(jobData || []);

  };

  const openModal = (company) => {
    setSelectedCompany(company);
    fetchModalData(company.id);
  };

  const handleSendMessage = async () => {
    if (!message) return alert("Type a message first!");
    const { error } = await supabase.from("coordinator_messages").insert({
      company_id: selectedCompany.id,
      message,
      created_at: new Date()
    });
    if (error) alert("Error sending message: " + error.message);
    else {
      setMessage("");
      alert("Message sent successfully!");
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyLogo = (url) =>
    url && url.trim() !== ""
      ? url
      : "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";

  return (
    <div className="coordinator-page">
      <CoordinatorSidebar />

      <div className="students-content">
        <div className="header-section">
          <h2>Companies</h2>

          <div className="actions">
            <div style={{ position: "relative" }}>
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
              <label className="switch">
                <input
                  type="checkbox"
                  checked={viewMode === "card"}
                  onChange={() =>
                    setViewMode(viewMode === "table" ? "card" : "table")
                  }
                />
                <span className="slider"></span>
              </label>
              {viewMode === "table" ? <FaThList /> : <FaThLarge />}
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading companies...</p>
        ) : viewMode === "table" ? (
          <table className="students-table">
            <thead>
              <tr>
                <th>#</th>
                <th> <FaCalendarAlt style={{ marginRight: "5px" }} />Updated</th>
                <th> <FaBuilding style={{ marginRight: "5px" }} />Company Name</th>
                <th><FaMapMarkerAlt style={{ marginRight: "5px" }} />Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td>
                    {c.updated_at
                      ? new Date(c.updated_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{c.name || "N/A"}</td>
                  <td>{c.location || "N/A"}</td>
                  <td>
                    <button
                      className="info-btn"
                      onClick={() => openModal(c)}
                    >
                      Full Info
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card-container">
            {filteredCompanies.map((c, index) => (
              <div className="student-card" key={c.id}>
                <img
                  src={getCompanyLogo(c.logo_url)}
                  alt={c.name}
                  className="student-avatar"
                />
                <h3>
                  {index + 1}. {c.name || "N/A"}
                </h3>
                <p>
                  <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                  {c.location || "N/A"}
                </p>
                <div className="card-actions">
                  <button
                    className="info-btn"
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
      </div>

      {/* ====================== MODAL ======================= */}
      {selectedCompany && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedCompany(null)}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Company Profile</h2>

            <div className="profile-picture-section">
              <img
                src={getCompanyLogo(selectedCompany.logo_url)}
                alt={selectedCompany.name}
                className="profile-picture"
              />
            </div>

            <div className="profile-section">
              <h3>Company Details</h3>
              <div className="info-grid">
                <p>
                  <FaBuilding style={{ marginRight: "5px" }} />
                  <strong>Name:</strong> {selectedCompany.name || "N/A"}
                </p>
                <p>
                  <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                  <strong>Location:</strong> {selectedCompany.location || "N/A"}
                </p>
                <p>
                  <FaCalendarAlt style={{ marginRight: "5px" }} />
                  <strong>Last Updated:</strong>{" "}
                  {selectedCompany.updated_at
                    ? new Date(selectedCompany.updated_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="profile-section">
              <h3>Description</h3>
              <p>{selectedCompany.description || "No description provided."}</p>
            </div>


{comments.length > 0 && (
  <div className="profile-section">
    <h3>Average Rating</h3>
    <div className="average-rating">
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar
          key={i}
          color={i < Math.round(
            comments.reduce((acc, c) => acc + c.rating, 0) / comments.length
          ) ? "#FFD700" : "#ccc"}
        />
      ))}
      <span style={{ marginLeft: "8px", fontWeight: "500" }}>
        ({comments.length} reviews)
      </span>
    </div>
  </div>
)}

{/* ================= Student Reviews with Star Rating ================= */}
<div className="profile-section">

  
  <h3>Student Reviews</h3>
  {comments.length === 0 && <p>No reviews yet.</p>}
  {comments.length > 0 && (
    <div>
      {comments.map((c) => (
        <div key={c.id} className="comment-card">
          <div className="comment-header">
            <strong>{c.profiles?.fullname || "Student"}</strong>
            <div className="star-rating">
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                  key={i}
                  color={i < c.rating ? "#FFD700" : "#ccc"}
                />
              ))}
            </div>
          </div>
          <p>{c.comment}</p>
        </div>
      ))}
    </div>
  )}
</div>


{/* Job posts in two columns */}
{/* Job posts in two columns */}
<div className="profile-section">
  <h3>Job Posts</h3>
  {jobs.length === 0 && <p>No job posts available.</p>}
  <div className="job-grid">
    {jobs.map((j) => (
      <div key={j.id} className="job-card">
        <strong style={{ color: "#000", fontSize: "1.05rem" }}>{j.title}</strong>
        {j.salary && <p style={{ color: "#000", margin: "5px 0" }}><strong>Salary:</strong> {j.salary}</p>}
        {j.responsibilities && (
          <p style={{ color: "#000", margin: "5px 0" }}>
            <strong>Responsibilities:</strong> {j.responsibilities}
          </p>
        )}

        
        <p style={{ color: "#000", margin: "5px 0" }}> <strong>Description: </strong>{j.description || "No description"}</p>
        <small style={{ color: "#000" }}>Posted on: {new Date(j.created_at).toLocaleDateString()}</small>
      </div>
    ))}
  </div>
</div>


            {/* Message Coordinator */}
            <div className="profile-section">
              <h3>Send Message to Coordinator</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                style={{ width: "100%", padding: "10px", borderRadius: "6px" }}
              />
              <button onClick={handleSendMessage} className="resume-btn" style={{ marginTop: "10px" }}>
                Send
              </button>
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setSelectedCompany(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
