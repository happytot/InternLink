"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import { finalizeApplicationStatus } from "../actions";
import { toast, Toaster } from "sonner";
import "./approvals.css";

export default function CoordinatorInternships() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  

  const fetchApplications = async () => {
    setLoading(true);
    try {
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
        // UPDATED: Now fetching both 'Waiting' AND 'ongoing' (or active_intern)
        // Ensure "ongoing" matches exactly what is in your database text
        .in("status", ["Company_Approved_Waiting_Coordinator", "ongoing", "active_intern"])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Optional: Sort so 'Waiting' comes first (Action items first)
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
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      fetchApplications(); 
      return;
    }
    const filtered = applications.filter(app =>
      app.student?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setApplications(filtered);
  };

  // Handle the coordinator's final decision
  const handleApproval = async (applicationId, action) => {
    // If approving, change to 'active_intern' (or 'ongoing' depending on your DB preference)
    // Based on your prompt, it sounds like you use 'ongoing' or 'active_intern'
    const newStatus =
      action === "approve"
        ? "active_intern" // OR "ongoing"
        : "rejected_by_coordinator";
        
    const toastId = toast.loading("Updating status...");

    const result = await finalizeApplicationStatus(applicationId, newStatus);

    if (result.success) {
      toast.success(
        `Application ${action === "approve" ? "approved" : "rejected"}.`,
        { id: toastId }
      );
      // Remove from list if rejected, or just update status if approved
      if (action === "reject") {
          setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      } else {
          // If approved, update local state to show as Active immediately
          setApplications((prev) => prev.map(app => 
              app.id === applicationId ? { ...app, status: newStatus } : app
          ));
      }
      fetchApplications(); // Refresh to be safe
    } else {
      toast.error(`Failed: ${result.error}`, { id: toastId });
    }
  };

  // Filter applications based on search query
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
    <div className="dashboard-root">
      <CoordinatorSidebar />
      <Toaster richColors position="top-right" />
      <main className="dashboard-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Internship Management</h1>
            <p className="dash-subtitle">
              Approve new requests and view ongoing internships.
            </p>
          </div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

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
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      Loading applications...
                    </td>
                  </tr>
                )}
                {!loading && filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data-cell">
                      No applications found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredApplications.map((app) => (
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
                        {/* CONDITIONAL RENDERING: Check Status */}
                        {app.status === "Company_Approved_Waiting_Coordinator" ? (
                            <>
                                <button
                                className="action-btn approve-btn"
                                onClick={() => handleApproval(app.id, "approve")}
                                >
                                <i className="fas fa-check"></i> Approve
                                </button>
                                <button
                                className="action-btn reject-btn"
                                onClick={() => handleApproval(app.id, "reject")}
                                >
                                <i className="fas fa-times"></i> Reject
                                </button>
                            </>
                        ) : (
                            <div style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                background: '#e6fffa',
                                color: '#047857',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                border: '1px solid #a7f3d0'
                            }}>
                                <i className="fas fa-check-circle" style={{marginRight:'5px'}}></i>
                                Active / Ongoing
                            </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}