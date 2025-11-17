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
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', userId);
      if (jobsError) throw jobsError;

      const activeListings = jobs.filter(j => j.status === 'active').length;

      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('job_id', jobs.map(j => j.id));
      if (appsError) throw appsError;

      const newApplications = applications.filter(a => a.status === 'new').length;
      const pendingReviews = applications.filter(a => a.status === 'pending').length;
      const hiredInterns = applications.filter(a => a.status === 'hired').length;

      const { data: recentApps } = await supabase
        .from('applications')
        .select('*, students(name)')
        .in('job_id', jobs.map(j => j.id))
        .order('created_at', { ascending: false })
        .limit(3);

      const activityFeed = recentApps.map(a => ({
        title: 'New Application',
        content: `${a.students?.name || 'A student'} applied for a position.`,
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

    const channel = supabase.channel('company-dashboard-updates')

      // 🏢 Job created
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'jobs', filter: `company_id=eq.${user.id}` },
        (payload) => {
          toast.success(`🏢 New job posted: ${payload.new.title}`);
          fetchData(user.id);
        }
      )

      // 🏢 Job updated
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `company_id=eq.${user.id}` },
        (payload) => {
          toast(`🛠️ Job updated: ${payload.new.title}`, { icon: '🛠️' });
          fetchData(user.id);
        }
      )

      // 🧑‍🎓 New application
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'applications' },
        (payload) => {
          toast.success(`🧑‍🎓 New application received!`);
          fetchData(user.id);
        }
      )

      // ⚙️ Application updated
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'applications' },
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
