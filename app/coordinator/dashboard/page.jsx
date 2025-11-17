"use client";

import React, { useEffect, useState } from "react";
import { supabase } from '../../../lib/supabaseClient';
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./dashboard.css"; // optional: see basic CSS below

export default function CoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    companies: 0,
    activeInternships: 0,
    pendingApprovals: 0,
  });
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch overview and lists
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Overview stats
      // ✅ Overview stats (fixed)
const { count: studentCount } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("user_type", "student");

const { count: companyCount } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("user_type", "company");

const { count: activeCount } = await supabase
  .from("internships")
  .select("*", { count: "exact", head: true })
  .eq("status", "active");

const { count: pendingCount } = await supabase
  .from("job_applications")
  .select("*", { count: "exact", head: true })
  .eq("status", "Pending_Coordinator_Approval");

setStats({
  students: studentCount || 0,
  companies: companyCount || 0,
  activeInternships: activeCount || 0,
  pendingApprovals: pendingCount || 0,
});

        // Students list (simple)
        const { data: studentRows } = await supabase
          .from("profiles")
          .select("id, fullname, email, resume_url, created_at")
          .eq("user_type", "student")
          .order("created_at", { ascending: false })
          .limit(100);

        setStudents(studentRows || []);

        // Companies list
        const { data: companyRows } = await supabase
          .from("profiles")
          .select("id, company_name, fullname, email, approved, created_at")
          .eq("user_type", "company")
          .order("created_at", { ascending: false })
          .limit(100);

        setCompanies(companyRows || []);

        // Internships (recent)
        const { data: internshipRows } = await supabase
          .from("internships")
          .select("id, position, status, student_id, company_id, start_date, end_date, created_at")
          .order("created_at", { ascending: false })
          .limit(100);

        setInternships(internshipRows || []);

        // Announcements
        const { data: annRows } = await supabase
          .from("announcements")
          .select("id, title, body, audience, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        setAnnouncements(annRows || []);
      } catch (err) {
        console.error("Error loading dashboard data", err);
        setMessage("Failed to load dashboard. Check console.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Company approval toggle
  const toggleApproveCompany = async (companyId, newStatus) => {
    setMessage("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: newStatus, updated_at: new Date().toISOString() })
        .eq("id", companyId);

      if (error) throw error;
      setCompanies(prev => prev.map(c => (c.id === companyId ? { ...c, approved: newStatus } : c)));
      setMessage("Company approval status updated.");
    } catch (err) {
      console.error("Error updating company", err);
      setMessage("Failed to update company.");
    }
  };

  // Approve internship (simple action)
  const updateInternshipStatus = async (internshipId, status) => {
    setMessage("");
    try {
      const { error } = await supabase
        .from("internships")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", internshipId);

      if (error) throw error;
      setInternships(prev => prev.map(i => (i.id === internshipId ? { ...i, status } : i)));
      setMessage("Internship status updated.");
    } catch (err) {
      console.error("Error updating internship", err);
      setMessage("Failed to update internship.");
    }
  };

  // Post announcement
  const postAnnouncement = async (title, body, audience = "all") => {
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("announcements")
        .insert([{ title, body, audience, created_by: user?.id }]);

      if (error) throw error;
      setAnnouncements(prev => [{ id: Math.random().toString(36), title, body, audience, created_at: new Date().toISOString() }, ...prev]);
      setMessage("Announcement posted.");
    } catch (err) {
      console.error("Error posting announcement", err);
      setMessage("Failed to post announcement.");
    }
  };

  if (loading) return <div className="dash-center">Loading dashboard...</div>;

  return (
    <div className="dashboard-root">
      <CoordinatorSidebar />
      <main className="dashboard-main">
        {message && <div className="alert">{message}</div>}

        <section className="overview-cards">
          <div className="card">
            <h3>{stats.students}</h3>
            <p>Students</p>
          </div>
          <div className="card">
            <h3>{stats.companies}</h3>
            <p>Companies</p>
          </div>
          <div className="card">
            <h3>{stats.activeInternships}</h3>
            <p>Active Internships</p>
          </div>
          <div className="card">
            <h3>{stats.pendingApprovals}</h3>
            <p>Student Approvals</p>
          </div>
        </section>

        <section className="two-column">
          <div className="left-col">
            <div className="panel">
              <h3>Recent Internship Applications</h3>
              <table className="table">
                <thead>
                  <tr><th>Position</th><th>Status</th><th>Dates</th><th>Actions</th></tr>
                </thead>
               <tbody>
  {internships.length === 0 ? (
    <tr><td colSpan="4" className="no-data">No internship applications found.</td></tr>
  ) : (
    internships.map(i => (
      <tr key={i.id}>
        <td>{i.position || "—"}</td>
        <td>{i.status}</td>
        <td>{i.start_date ? `${i.start_date} → ${i.end_date || "—"}` : "—"}</td>
        <td>
          {i.status === "pending" && <button onClick={() => updateInternshipStatus(i.id, "approved")}>Approve</button>}
          {i.status !== "completed" && <button onClick={() => updateInternshipStatus(i.id, "completed")}>Mark Completed</button>}
        </td>
      </tr>
    ))
  )}
</tbody>

              </table>
            </div>

            <div className="panel">
              <h3>Companies</h3>
              <table className="table">
                <thead><tr><th>Company</th><th>Contact</th><th>Approved</th><th>Action</th></tr></thead>
              <tbody>
  {companies.length === 0 ? (
    <tr><td colSpan="4" className="no-data">No companies found.</td></tr>
  ) : (
    companies.map(c => (
      <tr key={c.id}>
        <td>{c.company_name || c.fullname || "—"}</td>
        <td>{c.email}</td>
        <td>{c.approved ? "Yes" : "No"}</td>
        <td>
          <button onClick={() => toggleApproveCompany(c.id, !c.approved)}>
            {c.approved ? "Revoke" : "Approve"}
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>

              </table>
            </div>
          </div>

          <div className="right-col">
            <div className="panel">
              <h3>Students</h3>
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Resume</th><th>Joined</th></tr></thead>
              <tbody>
  {students.length === 0 ? (
    <tr><td colSpan="4" className="no-data">No students found.</td></tr>
  ) : (
    students.map(s => (
      <tr key={s.id}>
        <td>{s.fullname || "—"}</td>
        <td>{s.email}</td>
        <td>{s.resume_url ? <a href={s.resume_url} target="_blank" rel="noreferrer">View</a> : "No resume"}</td>
        <td>{new Date(s.created_at).toLocaleDateString()}</td>
      </tr>
    ))
  )}
</tbody>

              </table>
            </div>

            <div className="panel">
              <h3>Announcements</h3>
              <AnnouncementForm onPost={postAnnouncement} />
             <ul className="ann-list">
  {announcements.length === 0 ? (
    <li className="no-data">No announcements yet.</li>
  ) : (
    announcements.map(a => (
      <li key={a.id}>
        <strong>{a.title}</strong>
        <div className="ann-body">{a.body}</div>
        <small>{new Date(a.created_at).toLocaleString()}</small>
      </li>
    ))
  )}
</ul>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* Announcement form component embedded here for simplicity */
function AnnouncementForm({ onPost }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [posting, setPosting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setPosting(true);
    await onPost(title.trim(), body.trim(), audience);
    setTitle("");
    setBody("");
    setAudience("all");
    setPosting(false);
  };

  return (
    <form onSubmit={submit} className="announcement-form">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message (optional)" />
      <select value={audience} onChange={e => setAudience(e.target.value)}>
        <option value="all">All</option>
        <option value="students">Students</option>
        <option value="companies">Companies</option>
      </select>
      <button type="submit" disabled={posting}>{posting ? "Posting..." : "Post"}</button>
    </form>
  );
}
