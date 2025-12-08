"use client";

import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { finalizeApplicationStatus } from "../actions";
import { Search, ArrowDownUp, ChevronUp, ChevronDown } from 'lucide-react'; // Added icons
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
  
  // NEW STATE: Sort configuration
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'ascending' }); 

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

          student:profiles!job_applications_intern_id_fkey (
            fullname,
            email,
            department
          ),

          job:job_posts!fk_job_applications_job (
            title,
            location,
            company:companies (
              name
            )
          )
        `)
        .in("status", [
          "Company_Approved_Waiting_Coordinator",
          "ongoing",
          "active_intern"
        ])
        .order("created_at", { ascending: false }); // Initial fetch order

      if (error) throw error;
      
      // We no longer pre-sort here, we rely on the useMemo hook below
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    // Client-side filtering logic happens in render via filteredApplications
  };

  const handleApproval = async (applicationId, action) => {
    const newStatus = action === "approve" ? "active_intern" : "rejected_by_coordinator";
    const toastId = toast.loading("Updating status...");

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

  // --- SORTING LOGIC ---
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
        // Third click returns to default sort by status (priority)
        setSortConfig({ key: 'status', direction: 'ascending' });
        return;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
        return <ArrowDownUp size={14} className="sort-icon-default" />;
    }
    return sortConfig.direction === 'ascending' ? (
        <ChevronUp size={14} className="sort-icon-active" />
    ) : (
        <ChevronDown size={14} className="sort-icon-active" />
    );
  };
  // -----------------------

  // --- FILTERING AND SORTING MEMO ---
  const sortedAndFilteredApplications = useMemo(() => {
    const filtered = applications.filter((app) => {
        const query = searchQuery.toLowerCase();
        return (
            app.student?.fullname?.toLowerCase().includes(query) ||
            app.student?.email?.toLowerCase().includes(query) ||
            app.student?.department?.toLowerCase().includes(query) ||
            app.job?.title?.toLowerCase().includes(query) ||
            app.job?.company?.name?.toLowerCase().includes(query)
        );
    });

    // Make a shallow copy for sorting
    let sortableItems = [...filtered];

    if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            let aVal, bVal;

            if (sortConfig.key === 'student') {
                aVal = a.student?.fullname || "";
                bVal = b.student?.fullname || "";
            } else if (sortConfig.key === 'department') {
                aVal = a.student?.department || "";
                bVal = b.student?.department || "";
            } else if (sortConfig.key === 'job') {
                aVal = a.job?.title || "";
                bVal = b.job?.title || "";
            } else if (sortConfig.key === 'company') {
                aVal = a.job?.company?.name || "";
                bVal = b.job?.company?.name || "";
            } else if (sortConfig.key === 'status') {
                // Priority: Company_Approved_Waiting_Coordinator always comes first
                const statusPriority = {
                    "Company_Approved_Waiting_Coordinator": 3,
                    "active_intern": 2,
                    "ongoing": 1,
                    // Use a low number for others if they somehow show up
                };
                aVal = statusPriority[a.status] || 0;
                bVal = statusPriority[b.status] || 0;

                // If status is the same, fall back to sorting by date
                if (aVal === bVal) {
                    aVal = a.created_at;
                    bVal = b.created_at;
                }
            } else {
                return 0;
            }

            // Standard string/number comparison
            if (aVal < bVal) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aVal > bVal) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }

    return sortableItems;
  }, [applications, searchQuery, sortConfig]);

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
                        <th onClick={() => handleSort('student')} className="sortable-header">
                            <div className="header-content">
                                Student Name {getSortIcon('student')}
                            </div>
                        </th>
                        <th onClick={() => handleSort('department')} className="sortable-header">
                            <div className="header-content">
                                Department {getSortIcon('department')}
                            </div>
                        </th>
                        <th onClick={() => handleSort('job')} className="sortable-header">
                            <div className="header-content">
                                Job Title {getSortIcon('job')}
                            </div>
                        </th>
                        <th onClick={() => handleSort('company')} className="sortable-header">
                            <div className="header-content">
                                Company {getSortIcon('company')}
                            </div>
                        </th>
                        <th>Resume</th>
                        <th onClick={() => handleSort('status')} className="sortable-header">
                            <div className="header-content">
                                Status / Actions {getSortIcon('status')}
                            </div>
                        </th>
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
                    {!loading && sortedAndFilteredApplications.length === 0 && (
                    <tr>
                        <td colSpan="6" className="no-data-cell">
                            No applications found matching your criteria.
                        </td>
                    </tr>
                    )}
                    {!loading && sortedAndFilteredApplications.map((app) => (
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