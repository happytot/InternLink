"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./students.css";

import {
  FaInfoCircle,
  FaCalendarAlt,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaThList,
  FaThLarge,
  FaSearch,
  FaTimes // Added for modal close icon
} from "react-icons/fa";

const supabase = createClientComponentClient();

// --- 🌟 SKELETON COMPONENTS ---

const SkeletonTable = () => (
    <div className="card table-wrapper skeleton-loading">
        <table className="students-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th><FaCalendarAlt /> Joined</th>
                    <th><FaBuilding /> Department</th>
                    <th>Full Name</th>
                    <th><FaEnvelope /> Email</th>
                    <th><FaPhone /> Phone</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index}>
                        <td><div className="skeleton-line short"></div></td>
                        <td><div className="skeleton-line medium"></div></td>
                        <td><div className="skeleton-line medium"></div></td>
                        <td><div className="skeleton-line long"></div></td>
                        <td><div className="skeleton-line full"></div></td>
                        <td><div className="skeleton-line medium"></div></td>
                        <td><div className="skeleton-line btn-skel"></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const SkeletonCards = () => (
    <div className="card-container skeleton-loading">
        {Array.from({ length: 6 }).map((_, index) => (
            <div className="student-card skeleton-card" key={index}>
                <div className="student-avatar skeleton-avatar"></div>
                <div className="skeleton-line long center"></div>
                <div className="skeleton-line short center"></div>
                <div className="skeleton-line medium center"></div>
                <div className="skeleton-line btn-skel center"></div>
            </div>
        ))}
    </div>
);

// --- 📦 CORE COMPONENT ---

export default function CoordinatorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isClosing, setIsClosing] = useState(false); // New state for modal closing animation

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    // Simulate network delay for seeing the skeleton loader
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, fullname, email, phone, created_at, skills, education, summary, department, resume_url, profile_pic_url"
        )
        .eq("user_type", "student")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenModal = (student) => {
    setIsClosing(false);
    setSelectedStudent(student);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    // Wait for the exit animation to complete (set to 300ms in CSS)
    setTimeout(() => {
        setSelectedStudent(null);
        setIsClosing(false);
    }, 300); 
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
        <div className="card header-section">
          <h2>Student Directory</h2>

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
              <FaThList /> / <FaThLarge />
            </div>
          </div>
        </div>
        
        {loading ? (
            viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state card">
            <p>No students found matching your criteria.</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="card table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>
                    <FaCalendarAlt style={{ marginRight: "5px" }} />
                    Joined
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
                    <td>{s.department || "N/A"}</td>
                    <td>{s.fullname || "N/A"}</td>
                    <td>{s.email || "N/A"}</td>
                    <td>{s.phone || "N/A"}</td>
                    <td>
                      <button
                        className="btn primary-btn info-btn"
                        onClick={() => handleOpenModal(s)}
                      >
                        <FaInfoCircle /> Full Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-container">
            {filteredStudents.map((s, index) => (
              <div className="student-card" key={s.id}>
                <img
                  src={getProfilePic(s.profile_pic_url)}
                  alt={s.fullname}
                  className="student-avatar"
                />
                <h3 className="card-title">
                  {index + 1}. {s.fullname || "N/A"}
                </h3>
                <p>
                  <FaBuilding /> <strong>Dept:</strong> {s.department || "N/A"}
                </p>
                <p>
                  <FaEnvelope /> <strong>Email:</strong> {s.email || "N/A"}
                </p>
                <p>
                  <FaPhone /> <strong>Phone:</strong> {s.phone || "N/A"}
                </p>
                <div className="card-actions">
                  <button
                    className="btn primary-btn info-btn"
                    onClick={() => handleOpenModal(s)}
                  >
                    <FaInfoCircle /> View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <div
          className={`modal-overlay glass-bg ${isClosing ? 'modal-exit' : 'modal-enter'}`} // Class for animations
          onClick={handleCloseModal}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-x-btn" onClick={handleCloseModal}>
                <FaTimes />
            </button>
            <h2 className="modal-title">{selectedStudent.fullname}'s Profile</h2>

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
                  <FaBuilding className="icon-accent" />
                  <strong>Department:</strong> {selectedStudent.department || "N/A"}
                </p>
                <p>
                  <FaEnvelope className="icon-accent" />
                  <strong>Email:</strong> {selectedStudent.email || "N/A"}
                </p>
                <p>
                  <FaPhone className="icon-accent" />
                  <strong>Phone:</strong> {selectedStudent.phone || "N/A"}
                </p>
                <p>
                  <FaCalendarAlt className="icon-accent" />
                  <strong>Joined:</strong>{" "}
                  {selectedStudent.created_at
                    ? new Date(selectedStudent.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Professional Summary</h3>
              <p className="summary-text">{selectedStudent.summary || "N/A"}</p>
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
              <h3>Resume</h3>
              {selectedStudent.resume_url ? (
                <a
                  href={selectedStudent.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn resume-btn"
                >
                  View Resume
                </a>
              ) : (
                <p className="text-muted">Resume not uploaded.</p>
              )}
            </div>

            <button
              className="btn tertiary-btn close-modal-btn"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}