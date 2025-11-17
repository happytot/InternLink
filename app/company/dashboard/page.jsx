'use client';

import { supabase } from '../../../lib/supabaseClient';
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import './CompanyDashboard.css';

const CompanyDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    newApplications: 0,
    pendingReviews: 0,
    hiredInterns: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error('Error fetching user:', error.message);
      setUser(user);
    };
    getUser();
  }, []);

  // ✅ Fetch dashboard data
  const fetchData = async (userId) => {
    if (!userId) return;

    try {
      // --- FIX: Changed 'jobs' to 'job_posts' ---
      const { data: jobs, error: jobsError } = await supabase
        .from('job_posts') 
        .select('*')
        .eq('company_id', userId);
      if (jobsError) throw jobsError;

      const activeListings = jobs.length; // Assuming all fetched jobs are active

      // --- FIX: Changed 'applications' to 'job_applications' ---
      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select('status') // Only select what you need
        .in('job_id', jobs.map(j => j.id));
      if (appsError) throw appsError;

      // Note: Your schema has 'Pending' and 'Company_Approved_Waiting_Coordinator', etc.
      // Adjust these filters if 'new', 'pending', 'hired' are not the exact status strings.
      const newApplications = applications.filter(a => a.status === 'Pending').length;
      const pendingReviews = applications.filter(a => a.status === 'Company_Approved_Waiting_Coordinator').length;
      const hiredInterns = applications.filter(a => a.status === 'Accepted').length; // Or 'Hired'?

      // --- FIX: Changed 'applications' to 'job_applications' ---
      // --- FIX: Changed 'students(name)' to 'profiles:intern_id(fullname)' ---
      const { data: recentApps } = await supabase
        .from('job_applications')
        .select('*, profiles:intern_id(fullname)') // Fetches profile name via intern_id
        .in('job_id', jobs.map(j => j.id))
        .order('created_at', { ascending: false })
        .limit(3);

      const activityFeed = recentApps.map(a => ({
        title: 'New Application',
        // --- FIX: Changed 'a.students?.name' to 'a.profiles?.fullname' ---
        content: `${a.profiles?.fullname || 'A student'} applied for a position.`,
        time: new Date(a.created_at).toLocaleString(),
      }));

      setStats({ activeListings, newApplications, pendingReviews, hiredInterns });
      setRecentActivities(activityFeed);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch once user ready
  useEffect(() => {
    if (user?.id) fetchData(user.id);
  }, [user]);

  // ⚡ Real-time listeners with toast notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('company-dashboard-updates');

    // 🏢 Job created
    channel
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'job_posts', // --- FIX: 'jobs' -> 'job_posts' ---
          filter: `company_id=eq.${user.id}` 
        },
        (payload) => {
          toast.success(`🏢 New job posted: ${payload.new.title}`);
          fetchData(user.id);
        }
      )

      // 🏢 Job updated
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'job_posts', // --- FIX: 'jobs' -> 'job_posts' ---
          filter: `company_id=eq.${user.id}` 
        },
        (payload) => {
          toast(`🛠️ Job updated: ${payload.new.title}`, { icon: '🛠️' });
          fetchData(user.id);
        }
      )

      // 🧑‍🎓 New application
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'job_applications' // --- FIX: 'applications' -> 'job_applications' ---
        },
        (payload) => {
          // This will fire for *all* new applications,
          // We refetch to see if it's one of ours.
          toast.success(`🧑‍🎓 New application received!`);
          fetchData(user.id);
        }
      )

      // ⚙️ Application updated
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'job_applications' // --- FIX: 'applications' -> 'job_applications' ---
        },
        (payload) => {
          const status = payload.new.status || 'updated';
          toast(`📋 Application ${status}`, { icon: '📋' });
          fetchData(user.id);
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) return <div className="dashboard-loading">Loading company dashboard...</div>;

  return (
    <div className="company-dashboard">
      {/* 👇 Mount Toast Container */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <h1 className="welcome-header">
        Welcome back, {user?.email || 'Guest'}!
      </h1>

      {/* --- Stats Section --- */}
      <section className="dashboard-stats">
        <div className="stat-card"><span>🏢</span><p>Active Listings</p><h2>{stats.activeListings}</h2></div>
        <div className="stat-card"><span>📩</span><p>New Applications</p><h2>{stats.newApplications}</h2></div>
        <div className="stat-card"><span>👀</span><p>Pending Reviews</p><h2>{stats.pendingReviews}</h2></div>
        <div className="stat-card"><span>✅</span><p>Hired Interns</p><h2>{stats.hiredInterns}</h2></div>
      </section>

      {/* --- Activity + Actions --- */}
      <section className="dashboard-content-grid">
        <div className="recent-activity-feed">
          <h2>Recent Activity</h2>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, idx) => (
              <div key={idx} className="activity-card">
                <h3>{activity.title}</h3>
                <p>{activity.content}</p>
                <small>{activity.time}</small>
              </div>
            ))
          ) : (
            <p>No recent activity yet.</p>
          )}
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <button className="btn-primary full-width-btn">✍️ Post a New Internship</button>
          <button className="btn-secondary full-width-btn">📋 Review Applications</button>
          <button className="btn-secondary full-width-btn">⚙️ Company Settings</button>
        </div>
      </section>
    </div>
  );
};

export default CompanyDashboard;