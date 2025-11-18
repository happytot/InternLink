'use client';

// 1. ⛔️ REMOVED your old supabase import
// import { supabase } from '../../../lib/supabaseClient';

// 2. ✅ ADDED this import instead
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import toast, { Toaster } from 'react-hot-toast';
import './CompanyDashboard.css';

// 1. ✅ FIXED THE IMPORT PATH
import Header from '../../components/Header';

const CompanyDashboard = () => {
  // 3. ✅ INITIALIZED the client *inside* the component
  const supabase = createClientComponentClient();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    newApplications: 0,
    pendingReviews: 0,
    hiredInterns: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simple refetch function for realtime listeners
  const fetchData = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('job_posts') 
        .select('*')
        .eq('company_id', userId);
      if (jobsError) throw jobsError;

      const activeListings = jobs.length;

      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select('status')
        .in('job_id', jobs.map(j => j.id));
      if (appsError) throw appsError;

      const newApplications = applications.filter(a => a.status === 'Pending').length;
      const pendingReviews = applications.filter(a => a.status === 'Company_Approved_Waiting_Coordinator').length;
      const hiredInterns = applications.filter(a => a.status === 'Accepted').length;

      const { data: recentApps } = await supabase
        .from('job_applications')
        .select('*, profiles:intern_id(fullname)')
        .in('job_id', jobs.map(j => j.id))
        .order('created_at', { ascending: false })
        .limit(3);

      const activityFeed = recentApps.map(a => ({
        title: 'New Application',
        content: `${a.profiles?.fullname || 'A student'} applied for a position.`,
        time: new Date(a.created_at).toLocaleString(),
      }));

      setStats({ activeListings, newApplications, pendingReviews, hiredInterns });
      setRecentActivities(activityFeed);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't toast on initial load, only on realtime failure
      // toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false); // Make sure to set loading false in all cases
    }
  }, [supabase]); // Added supabase dependency

  // ✅ Fetch current user (This will now work)
  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user:', error.message);
        toast.error('Could not find session. Please log in.');
      }
      
      setUser(user);
      
      if (user) {
        await fetchData(user.id); // Fetch data *after* getting user
      } else {
        setLoading(false); // If no user, stop loading
      }
    };
    getUserAndData();
  }, [supabase, fetchData]); // Run when supabase client or fetchData function changes

  // ⚡ Real-time listeners with toast notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('company-dashboard-updates');

    channel
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'job_posts',
          filter: `company_id=eq.${user.id}` 
        },
        (payload) => {
          toast.success(`🏢 New job posted: ${payload.new.title}`);
          fetchData(user.id); 
        }
      )
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'job_applications'
        },
        (payload) => {
          // We can't filter this easily, so just refetch
          toast.success(`🧑‍🎓 New application received!`);
          fetchData(user.id);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'job_applications'
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
  }, [user, supabase, fetchData]); // Added fetchData dependency

  if (loading) return <div className="dashboard-loading">Loading company dashboard...</div>;

  // This will show if the user isn't found after loading
  if (!user) return <div className="dashboard-loading">Session not found. Please log in.</div>

  // 2. ✅ RENDER THE HEADER
  return (
    <>
      <Header />
      <div className="company-dashboard">
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
    </>
  );
};

export default CompanyDashboard;