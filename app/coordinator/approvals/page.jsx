"use client";

import React, { useEffect, useState } from "react";
// 1. UPDATED IMPORT: Use the component client helper
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { finalizeApplicationStatus } from "../actions";
import { Search } from 'lucide-react';
import { toast } from 'sonner'; 
import "./approvals.css";

// Font imports (Keep these if not in your root layout, otherwise remove)
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

export default function CoordinatorInternships() {
  // 2. INITIALIZE CLIENT: Create the client instance inside the component
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // This call now uses the authenticated session automatically
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          id,
          created_at,
          status,
          resume_url,
          student:profiles!fk_job_applications_intern ( fullname, email, department ),
          job:job_posts!fk_job_applications_job ( 
            title, 
            location,
            company:companies ( name ) 
          ) 
        `)
        .in("status", ["Company_Approved_Waiting_Coordinator", "ongoing", "active_intern"])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const sortedData = (data || []).sort((a, b) => {
         if (a.status === 'Company_Approved_Waiting_Coordinator' && b.status !== 'Company_Approved_Waiting_Coordinator') return -1;
         if (a.status !== 'Company_Approved_Waiting_Coordinator' && b.status === 'Company_Approved_Waiting_Coordinator') return 1;
         return 0;
      });

      setApplications(sortedData);
    } catch (err) {
      console.error("Error fetching applications:", err);
      toast.error(`Error fetching applications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    // Client-side filtering logic happens in render via filteredApplications
  };

  const handleApproval = async (applicationId, action) => {
    const newStatus = action === "approve" ? "active_intern" : "rejected_by_coordinator";
    const toastId = toast.loading("Updating status...");

    // Note: If 'finalizeApplicationStatus' is a Server Action, it handles its own auth.
    // If it is a client-side utility helper, you might need to check if it needs updating too.
    const result = await finalizeApplicationStatus(applicationId, newStatus);

    if (result.success) {
      toast.success(
        `Application ${action === "approve" ? "approved" : "rejected"}.`,
        { id: toastId }
      );
      
      if (action === "reject") {
          setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      } else {
          setApplications((prev) => prev.map(app => 
              app.id === applicationId ? { ...app, status: newStatus } : app
          ));
      }
    } else {
      toast.error(`Failed: ${result.error}`, { id: toastId });
    }
  };

  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    return (
      app.student?.fullname?.toLowerCase().includes(query) ||
      app.student?.email?.toLowerCase().includes(query) ||
      app.student?.department?.toLowerCase().includes(query) ||
      app.job?.title?.toLowerCase().includes(query) ||
      app.job?.company?.name?.toLowerCase().includes(query)
    );
  });

  return (
    // ✅ 1. Standard Dashboard Inner Container (Layout wrapper handles the rest)
    <div className="dashboard-inner">
        
        {/* HEADER BENTO BOX */}
        <section className="header-bento">
            <div className="header-bento-card">
                
                {/* Left: Title & Subtitle */}
                <div className="header-left">
                    <h1 className="dash-title">Internship Management</h1>
                    <p className="dash-subtitle">
                        Approve requests and view ongoing internships.
                    </p>
                </div>

                {/* Right: Search Bar */}
                <div className="header-right search-area">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search student, job, or company..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                        />
                        <button className="search-button" onClick={handleSearch}>
                            <Search size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </section>

        {/* TABLE SECTION */}
        <section className="applications-table-section">
            <div className="table-wrapper">
                <table className="approvals-table">
                <thead>
                    <tr>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Resume</th>
                    <th>Status / Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                    <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            Loading applications...
                        </td>
                    </tr>
                    )}
                    {!loading && filteredApplications.length === 0 && (
                    <tr>
                        <td colSpan="6" className="no-data-cell">
                            No applications found matching your criteria.
                        </td>
                    </tr>
                    )}
                    {!loading && filteredApplications.map((app) => (
                    <tr key={app.id}>
                        <td>
                            <p className="student-name">{app.student?.fullname || "N/A"}</p>
                            <p className="student-email">{app.student?.email || "N/A"}</p>
                        </td>
                        <td>{app.student?.department || "N/A"}</td>
                        <td>
                            <p className="job-title">{app.job?.title || "N/A"}</p>
                            <p className="job-location">{app.job?.location || "N/A"}</p>
                        </td>
                        <td>{app.job?.company?.name || "N/A"}</td>
                        <td>
                            {app.resume_url ? (
                                <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                className="resume-link-btn"
                                >
                                View Resume
                                </a>
                            ) : (
                                <span className="text-muted">N/A</span>
                            )}
                        </td>
                        <td className="action-cell">
                            {app.status === "Company_Approved_Waiting_Coordinator" ? (
                                <div className="btn-group">
                                    <button
                                        className="action-btn approve-btn"
                                        onClick={() => handleApproval(app.id, "approve")}
                                        title="Approve Internship"
                                    >
                                        <i className="fas fa-check"></i> Approve
                                    </button>
                                    <button
                                        className="action-btn reject-btn"
                                        onClick={() => handleApproval(app.id, "reject")}
                                        title="Reject Application"
                                    >
                                        <i className="fas fa-times"></i> Reject
                                    </button>
                                </div>
                            ) : (
                                <div className="status-badge active">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Active / Ongoing</span>
                                </div>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </section>
    </div>
  );
}