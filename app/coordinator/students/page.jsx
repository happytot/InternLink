"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { 
  Info, 
  Calendar, 
  Building2, 
  Mail, 
  Phone, 
  List, 
  LayoutGrid, 
  Search, 
  X, 
  FileText 
} from "lucide-react";
import "./students.css";

// Font imports (Keep these if not in your root layout, otherwise remove)
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';



export default function CoordinatorStudents() {
  // 1. Initialize Client
  const supabase = createClientComponentClient();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Theme Toggle Effect (Sync with parent layout if needed)
  useEffect(() => {
    const checkTheme = () => {
       if (document.body.classList.contains('light-mode')) {
         setIsLightMode(true);
       }
    };
    checkTheme();
  }, []);

  // Sync local toggle
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  // 2. Fetch Real Data
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, fullname, email, phone, created_at, skills, education, summary, department, resume_url, profile_pic_url")
        .eq("user_type", "student")
        .order("created_at", { ascending: false });

      if (error) {
          console.error("Supabase error:", error);
          toast.error("Failed to fetch students");
      }
      else setStudents(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
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
    setTimeout(() => {
        setSelectedStudent(null);
        setIsClosing(false);
    }, 300); 
  };

  const filteredStudents = students.filter((s) =>
    s.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfilePic = (url) => {
    if (!url || url.trim() === "" || url.startsWith("blob:")) {
      return "https://cdn-icons-png.flaticon.com/128/3033/3033143.png"; 
    }
    return url;
  };

  // Loading Skeleton
  if (loading) {
    return (
        <div className="dashboard-inner p-8">
            <div className="skeleton card" style={{ height: '140px', width: '100%', marginBottom: '30px' }}></div>
            <div className="card-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="skeleton card" style={{ height: '200px' }}></div>
                ))}
            </div>
        </div>
    );
  }

  return (
    // ✅ Uses only dashboard-inner (Layout wrapper handles sidebar/shell)
    <div className="dashboard-inner">
       
       {/* --- HEADER BENTO BOX --- */}
       <section className="header-bento">
           <div className="card header-bento-card">
               
               {/* LEFT: Title */}
               <div className="header-left">
                   <h1 className="dash-title">Student Directory</h1>
                   <p className="dash-subtitle">Manage and view all registered students.</p>
               </div>

               {/* RIGHT: Search & Actions */}
               <div className="header-right">
                   
                   {/* Search Bar */}
                   <div className="search-wrapper">
                       <Search className="search-icon" />
                       <input
                           type="text"
                           placeholder="Search students..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="search-input"
                       />
                   </div>

                   <div className="theme-divider"></div>

                   {/* View Toggle */}
                   <div className="view-toggle" onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}>
                        {viewMode === "table" ? <LayoutGrid title="Card View" /> : <List title="Table View" />}
                   </div>

                   <div className="theme-divider"></div>

                   {/* Theme Toggle */}
                   <div className="theme-toggle-wrapper">
                       <label className="switch">
                           <input type="checkbox" checked={isLightMode} onChange={() => setIsLightMode(!isLightMode)} />
                           <span className="slider round"></span>
                       </label>
                   </div>
               </div>
           </div>
       </section>

       {/* --- CONTENT AREA --- */}
       <div className="students-content-area">
           {filteredStudents.length === 0 ? (
               <div className="empty-state card">
                   <p>No students found matching your criteria.</p>
               </div>
           ) : viewMode === "table" ? (
               <div className="card table-wrapper reveal-on-scroll">
                   <table className="students-table">
                   <thead>
                       <tr>
                       <th>#</th>
                       <th><div style={{display:'flex', alignItems:'center', gap:'6px'}}><Calendar size={14}/> Joined</div></th>
                       <th><div style={{display:'flex', alignItems:'center', gap:'6px'}}><Building2 size={14}/> Department</div></th>
                       <th>Full Name</th>
                       <th><div style={{display:'flex', alignItems:'center', gap:'6px'}}><Mail size={14}/> Email</div></th>
                       <th><div style={{display:'flex', alignItems:'center', gap:'6px'}}><Phone size={14}/> Phone</div></th>
                       <th>Actions</th>
                       </tr>
                   </thead>
                   <tbody>
                       {filteredStudents.map((s, index) => (
                       <tr key={s.id}>
                           <td>{index + 1}</td>
                           <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A"}</td>
                           <td>{s.department || "N/A"}</td>
                           <td className="fw-bold">{s.fullname || "N/A"}</td>
                           <td>{s.email || "N/A"}</td>
                           <td>{s.phone || "N/A"}</td>
                           <td>
                           <button
                               className="btn primary-btn info-btn"
                               onClick={() => handleOpenModal(s)}
                           >
                               <Info size={16} /> Info
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
                       <div className="student-card reveal-on-scroll" key={s.id} style={{ animationDelay: `${index * 0.05}s` }}>
                       <img
                           src={getProfilePic(s.profile_pic_url)}
                           alt={s.fullname}
                           className="student-avatar"
                       />
                       <h3 className="card-title">{s.fullname || "N/A"}</h3>
                       <div className="card-info">
                           <p><Building2 size={12}/> {s.department || "N/A"}</p>
                           <p><Mail size={12}/> {s.email || "N/A"}</p>
                       </div>
                       <div className="card-actions">
                           <button
                           className="btn primary-btn info-btn full-width"
                           onClick={() => handleOpenModal(s)}
                           >
                           <Info size={16} /> View Profile
                           </button>
                       </div>
                       </div>
                   ))}
               </div>
           )}
       </div>

      {/* --- MODAL --- */}
      {selectedStudent && (
        <div
          className={`modal-overlay glass-bg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
          onClick={handleCloseModal}
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-x-btn" onClick={handleCloseModal}><X size={20} /></button>
            
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
                <p><Building2 size={16} className="icon-accent" /> <strong>Department:</strong> {selectedStudent.department || "N/A"}</p>
                <p><Mail size={16} className="icon-accent" /> <strong>Email:</strong> {selectedStudent.email || "N/A"}</p>
                <p><Phone size={16} className="icon-accent" /> <strong>Phone:</strong> {selectedStudent.phone || "N/A"}</p>
                <p><Calendar size={16} className="icon-accent" /> <strong>Joined:</strong> {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Professional Summary</h3>
              <p className="summary-text">{selectedStudent.summary || "N/A"}</p>
            </div>

            <div className="profile-section">
              <h3>Education History</h3>
              {Array.isArray(selectedStudent.education) && selectedStudent.education.length > 0 ? (
                selectedStudent.education.map((edu, idx) => (
                  <div key={idx} className="info-grid border-bottom-light" style={{marginBottom: '10px'}}>
                    <p><strong>Institution:</strong> {edu.institution || "N/A"}</p>
                    <p><strong>Degree:</strong> {edu.degree || "N/A"}</p>
                    <p><strong>Years:</strong> {edu.years || "N/A"}</p>
                  </div>
                ))
              ) : ( <p className="text-muted">No education listed.</p> )}
            </div>

            <div className="profile-section">
              <h3>Key Skills</h3>
              {Array.isArray(selectedStudent.skills) && selectedStudent.skills.length > 0 ? (
                <div className="skills-list">
                  {selectedStudent.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : ( <p className="text-muted">No skills listed.</p> )}
            </div>

            <div className="profile-section">
              <h3>Resume</h3>
              {selectedStudent.resume_url ? (
                <a href={selectedStudent.resume_url} target="_blank" rel="noopener noreferrer" className="btn secondary-btn resume-btn" style={{justifyContent: 'center'}}>
                  <FileText size={16} /> View Resume
                </a>
              ) : ( <p className="text-muted">Resume not uploaded.</p> )}
            </div>

            <div className="modal-actions">
                 <button className="btn tertiary-btn" onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}