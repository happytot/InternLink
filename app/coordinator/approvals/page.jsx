"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import { finalizeApplicationStatus } from "../actions"; // Import YOUR function
import { toast, Toaster } from "sonner";
import "./approvals.css";

export default function CoordinatorInternships() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

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
        .eq("status", "Company_Approved_Waiting_Coordinator");

      if (error) throw error;
      setApplications(data || []);

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

  // Handle the coordinator's final decision
  const handleApproval = async (applicationId, action) => {
    const newStatus = action === 'approve' ? 'approved_by_coordinator' : 'rejected_by_coordinator';
    const toastId = toast.loading('Updating status...');

    const result = await finalizeApplicationStatus(applicationId, newStatus);

    if (result.success) {
      toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'}.`, { id: toastId });
      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } else {
      toast.error(`Failed: ${result.error}`, { id: toastId });
    }
  };

  return (
    <div className="dashboard-root">
      <CoordinatorSidebar />
      <Toaster richColors position="top-right" />
      <main className="dashboard-main">
        <h1 className="dash-title">Internship Approvals</h1>
        <p className="dash-subtitle">
          Review applications approved by companies.
        </p>

        <section className="applications-table">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Company</th>
                <th>Resume</th>
                <th>Actions</th>
              </tr>
            </thead>
            {/* --- HYDRATION FIX IS HERE --- */}
            <tbody>
              {loading && (
                // "Loading" is now inside a <tr>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td>
                </tr>
              )}
              {!loading && applications.length === 0 && (
                // "No applications" is now inside a <tr>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>
                    No applications are waiting for your approval.
                  </td>
                </tr>
              )}
              {!loading && applications.map((app) => (
                // The application map is unchanged
                <tr key={app.id}>
                  <td>{app.student?.fullname || "N/A"}</td>
                  <td>{app.student?.email || "N/A"}</td>
                  <td>{app.student?.department || "N/A"}</td>
                  <td>{app.job?.title || "N/A"}</td>
                  <td>{app.job?.company?.name || "N/A"}</td>
                  <td>
                    {app.resume_url ? (
                      <a href={app.resume_url} target="_blank" rel="noreferrer" className="resume-link-btn">
                        View
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="action-cell">
                    <button
                      className="action-btn approve-btn"
                      onClick={() => handleApproval(app.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => handleApproval(app.id, 'reject')}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* --- END HYDRATION FIX --- */}
          </table>
        </section>
      </main>
    </div>
  );
}