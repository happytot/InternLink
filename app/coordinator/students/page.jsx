"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./students.css";

// Import icons
import {
  FaInfoCircle,
  FaCalendarAlt,
  FaBuilding,
  FaEnvelope,
  FaPhone,
    FaThList,
  FaThLarge,
  FaSearch
} from "react-icons/fa";

export default function CoordinatorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, fullname, email, phone, created_at, skills, education, summary, department, resume_url, profile_pic_url"
      )
      .eq("user_type", "student")
      .order("created_at", { ascending: false });

    if (error) console.error("Supabase error:", error);
    setStudents(data || []);
    setLoading(false);
  };

  const filteredStudents = students.filter((s) =>
    s.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfilePic = (url) => {
    if (!url || url.trim() === "" || url.startsWith("blob:")) {
      return "https://cdn-icons-png.flaticon.com/128/3033/3033143.png";
    }
    return url;
  };

  return (
    <div className="coordinator-page">
      <CoordinatorSidebar />

      <div className="students-content">
        <div className="header-section">
          <h2>Students</h2>

          <div className="actions">
               <div style={{ position: "relative" }}>
              <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name..."
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
          <p>Loading students...</p>
        ) : viewMode === "table" ? (
          <table className="students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>
                  <FaCalendarAlt style={{ marginRight: "5px" }} />
                  Created
                </th>
                <th>
                  <FaBuilding style={{ marginRight: "5px" }} />
                  Department
                </th>
                <th>Full Name</th>
                <th>
                  <FaEnvelope style={{ marginRight: "5px" }} />
                  Email
                </th>
                <th>
                  <FaPhone style={{ marginRight: "5px" }} />
                  Phone
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td>
                    
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                   
                    {s.department || "N/A"}
                  </td>
                  <td>{s.fullname || "N/A"}</td>
                  <td>
                  
                    {s.email || "N/A"}
                  </td>
                  <td>
                 
                    {s.phone || "N/A"}
                  </td>
                  <td>
                    <button
                      className="info-btn"
                      onClick={() => setSelectedStudent(s)}
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
            {filteredStudents.map((s, index) => (
              <div className="student-card" key={s.id}>
                <img
                  src={getProfilePic(s.profile_pic_url)}
                  alt={s.fullname}
                  className="student-avatar"
                />
                <h3>
                  {index + 1}. {s.fullname || "N/A"}
                </h3>
                <p>
                
                 <strong>Department:</strong> {s.department || "N/A"}
                </p>
                <p>
                 
                 <strong>Email:</strong> {s.email || "N/A"}
                </p>
                <p>
                  
                 <strong>Phone:</strong> {s.phone || "N/A"}
                </p>
                <div className="card-actions">
                  <button
                    className="info-btn"
                    onClick={() => setSelectedStudent(s)}
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

      {selectedStudent && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Student Profile</h2>

            <div className="profile-picture-section">
              <img
                src={getProfilePic(selectedStudent.profile_pic_url)}
                alt={selectedStudent.fullname}
                className="profile-picture"
              />
            </div>

            <div className="profile-section">
              <h3>Personal & Contact Details</h3>
              <div className="info-grid">
                <p>
                  <FaBuilding style={{ marginRight: "5px" }} />
                  <strong>Department:</strong> {selectedStudent.department || "N/A"}
                </p>
                <p>
                  <FaEnvelope style={{ marginRight: "5px" }} />
                  <strong>Email:</strong> {selectedStudent.email || "N/A"}
                </p>
                <p>
                  <FaPhone style={{ marginRight: "5px" }} />
                  <strong>Phone:</strong> {selectedStudent.phone || "N/A"}
                </p>
                <p>
                  <FaCalendarAlt style={{ marginRight: "5px" }} />
                  <strong>Created:</strong>{" "}
                  {selectedStudent.created_at
                    ? new Date(selectedStudent.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="profile-section">
              <h3>Education History</h3>
              {Array.isArray(selectedStudent.education) &&
              selectedStudent.education.length > 0 ? (
                selectedStudent.education.map((edu, idx) => (
                  <div key={idx} className="info-grid">
                    <p><strong>Institution:</strong> {edu.institution || "N/A"}</p>
                    <p><strong>Degree:</strong> {edu.degree || "N/A"}</p>
                    <p><strong>Years:</strong> {edu.years || "N/A"}</p>
                  </div>
                ))
              ) : (
                <p>N/A</p>
              )}
            </div>

            <div className="profile-section">
              <h3>Key Skills</h3>
              {Array.isArray(selectedStudent.skills) &&
              selectedStudent.skills.length > 0 ? (
                <div className="skills-list">
                  {selectedStudent.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <p>N/A</p>
              )}
            </div>

            <div className="profile-section">
              <h3>Professional Summary</h3>
              <p>{selectedStudent.summary || "N/A"}</p>
            </div>

            <div className="profile-section">
              <h3>Resume</h3>
              {selectedStudent.resume_url ? (
                <a
                  href={selectedStudent.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-btn"
                >
                  View Resume
                </a>
              ) : (
                <p>Not uploaded</p>
              )}
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setSelectedStudent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
