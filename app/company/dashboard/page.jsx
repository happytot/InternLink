'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import './CompanyDashboard.css';

// Lucide Icons
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Activity,
  Calendar,
  Layers
} from 'lucide-react';

export default function CompanyDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    newApplications: 0,
    pendingReviews: 0,
    hiredInterns: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      // 1. Get Jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('job_posts') 
        .select('id')
        .eq('company_id', userId);
      if (jobsError) throw jobsError;

      const activeListings = jobs.length;

      // 2. Get Applications linked to those jobs
      if (activeListings > 0) {
        const jobIds = jobs.map(j => j.id);
        const { data: applications, error: appsError } = await supabase
          .from('job_applications')
          .select('id, status, created_at, intern_id, profiles:intern_id(fullname), job_posts(title)')
          .in('job_id', jobIds);
          
        if (appsError) throw appsError;

        const newApplications = applications.filter(a => a.status === 'Pending').length;
        const pendingReviews = applications.filter(a => a.status === 'Company_Approved_Waiting_Coordinator').length;
        const hiredInterns = applications.filter(a => a.status === 'Accepted' || a.status === 'active_intern' || a.status === 'ongoing').length;

        // 3. Activity Feed
        const sortedApps = applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        const activityFeed = sortedApps.map(a => ({
          id: a.id,
          title: a.job_posts?.title || 'Job Post',
          content: `${a.profiles?.fullname || 'A candidate'} applied for this position.`,
          time: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

        setStats({ activeListings, newApplications, pendingReviews, hiredInterns });
        setRecentActivities(activityFeed);
      } else {
        // No jobs yet
        setStats({ activeListings: 0, newApplications: 0, pendingReviews: 0, hiredInterns: 0 });
        setRecentActivities([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setLoading(false);
        return;
      }
      setUser(user);
      await fetchData(user.id);
    };
    getUserAndData();
  }, [supabase, fetchData]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('company-dashboard-updates');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posts', filter: `company_id=eq.${user.id}` }, (payload) => {
          if(payload.eventType === 'INSERT') toast.success(`New job posted!`);
          fetchData(user.id); 
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => {
          fetchData(user.id);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchData]);

  // Navigation Helpers
  const handlePostJob = () => router.push('/company/jobs/new'); 
  const navigateToJobs = () => router.push('/company/jobs/listings');
  const navigateToApplications = (filter) => router.push('/company/applicants'); 

  

  return (
    /* --- ✨ BACKGROUND WRAPPER APPLIED HERE --- */
      <div className="dashboard-content">
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

        {/* --- 🟢 0. NEW TOP BRAND BAR --- */}
        <div className="brand-bar-card">
          <div className="brand-logo">
            <div className="logo-icon-bg">
              <Layers size={22} strokeWidth={2.5} />
            </div>
            <span className="logo-text">InternLink</span>
          </div>
          
          <div className="brand-date">
            <Calendar size={18} className="text-gray-400" />
            <span>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>     

        {/* --- 2. STATS GRID --- */}
        <section className="stats-grid">
          <div className="stat-card" onClick={navigateToJobs}>
            <div className="icon-wrapper blue"><Briefcase size={24} /></div>
            <div className="stat-info">
              <h2>{stats.activeListings}</h2>
              <span>Active Jobs</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigateToApplications('Pending')}>
            <div className="icon-wrapper orange"><Users size={24} /></div>
            <div className="stat-info">
              <h2>{stats.newApplications}</h2>
              <span>New Applicants</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigateToApplications('Review')}>
            <div className="icon-wrapper purple"><Clock size={24} /></div>
            <div className="stat-info">
              <h2>{stats.pendingReviews}</h2>
              <span>Under Review</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigateToApplications('Hired')}>
            <div className="icon-wrapper green"><CheckCircle2 size={24} /></div>
            <div className="stat-info">
              <h2>{stats.hiredInterns}</h2>
              <span>Hired Interns</span>
            </div>
          </div>
        </section>

        {/* --- 3. MAIN CONTENT SPLIT --- */}
        <section className="dashboard-split">
          
          {/* LEFT: Activity Feed */}
          <div className="feed-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="feed-list">
              {recentActivities.length === 0 ? (
                <p className="empty-text">No recent activity found.</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="feed-item">
                    <div className="feed-icon"><Activity size={16} /></div>
                    <div className="feed-content">
                      <h4>{activity.title}</h4>
                      <p>{activity.content}</p>
                    </div>
                    <span className="feed-time">{activity.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Quick Actions / Tips */}
          <div className="tips-card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="tips-list">
              <button className="tip-item" onClick={navigateToJobs}>
                <span>Manage Listings</span>
                <ChevronRight size={16} />
              </button>
              <button className="tip-item" onClick={() => router.push('/company/profile')}>
                <span>Update Company Profile</span>
                <ChevronRight size={16} />
              </button>
              <button className="tip-item" onClick={() => router.push('/company/logbook')}>
                <span>View Logbooks</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </section>
      </div>
  );
}