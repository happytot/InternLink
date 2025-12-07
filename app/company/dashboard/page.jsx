'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './CompanyDashboard.css';
import '../../globals.css';

// Lucide Icons
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  Calendar, 
  Layers,
  FileText
} from 'lucide-react';

export default function CompanyDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    newApplications: 0,
    activeInterns: 0, // 🔄 Changed from pendingReviews
    hoursToApprove: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      // --- 1. Get Active Job Listings ---
      const { data: jobs, error: jobsError } = await supabase
        .from('job_posts') 
        .select('id, title')
        .eq('company_id', userId);
      
      if (jobsError) throw jobsError;

      const activeListings = jobs.length;
      const jobIds = jobs.map(j => j.id);

      // --- 2. Get Applications ---
      let newApplications = 0;
      let activeInterns = 0;
      let activityFeed = [];

      if (activeListings > 0) {
        // Fix for PGRST201: Explicitly specify the relationship
        const { data: applications, error: appsError } = await supabase
          .from('job_applications')
          .select(`
            id, 
            status, 
            created_at, 
            intern_id, 
            profiles:intern_id(fullname), 
            job_posts!fk_job_applications_job(title)
          `)
          .in('job_id', jobIds);
          
        if (appsError) throw appsError;

        // Logic: New Applicants = 'Pending'
        newApplications = applications.filter(a => a.status === 'Pending').length;
        
        // 🔄 Logic: Active Interns = 'ongoing' (or 'active_intern' / 'Accepted')
        activeInterns = applications.filter(a => 
          a.status === 'ongoing' || a.status === 'active_intern' || a.status === 'Accepted'
        ).length;

        // Logic: Activity Feed
        const sortedApps = applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        activityFeed = sortedApps.map(a => ({
          id: a.id,
          title: a.job_posts?.title || 'Job Post',
          content: `${a.profiles?.fullname || 'A candidate'} applied for this position.`,
          time: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
      }

      // --- 3. Get Logbook Hours (Hours to Approve) ---
      const { data: logs, error: logsError } = await supabase
        .from('logbooks')
        .select('total_hours')
        .eq('company_id', userId)
        .eq('status', 'Pending'); 

      if (logsError) console.error("Logbook Error:", logsError);

      const hoursToApprove = logs ? logs.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0) : 0;

      // Update State
      setStats({ 
        activeListings, 
        newApplications, 
        activeInterns, // 🔄 Updated key
        hoursToApprove 
      });
      setRecentActivities(activityFeed);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Failed to load dashboard data.");
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

  // Realtime Listeners
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('company-dashboard-updates');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posts', filter: `company_id=eq.${user.id}` }, (payload) => {
        if(payload.eventType === 'INSERT') toast.success('New job posted!');
        fetchData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => fetchData(user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logbooks', filter: `company_id=eq.${user.id}` }, () => fetchData(user.id))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchData]);

  // Navigation
  const navigateToJobs = () => router.push('/company/jobs/listings');
  const navigateToApplications = () => router.push('/company/applicants'); 
  const navigateToLogbook = () => router.push('/company/logbook');

  return (
    <div className="dashboard-content">
      {/* Header */}
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

      {/* Stats Grid */}
      <section className="stats-grid">
        
        {/* 1. Active Jobs */}
        <div className="stat-card" onClick={navigateToJobs}>
          <div className="icon-wrapper blue"><Briefcase size={24} /></div>
          <div className="stat-info">
            <h2>{stats.activeListings}</h2>
            <span>Active Jobs</span>
          </div>
        </div>

        {/* 2. New Applicants */}
        <div className="stat-card" onClick={navigateToApplications}>
          <div className="icon-wrapper orange"><Users size={24} /></div>
          <div className="stat-info">
            <h2>{stats.newApplications}</h2>
            <span>New Applicants</span>
          </div>
        </div>

        {/* 3. Active Interns (Ongoing) */}
        {/* 🔄 CHANGED: Purple Clock -> Green CheckCircle to represent 'Active' */}
        <div className="stat-card" onClick={navigateToApplications}>
          <div className="icon-wrapper green"><CheckCircle2 size={24} /></div>
          <div className="stat-info">
            <h2>{stats.activeInterns}</h2>
            <span>Active Interns</span>
          </div>
        </div>

        {/* 4. Hours to Approve */}
        {/* Changed color to Purple/File to differentiate from Active Interns */}
        <div className="stat-card" onClick={navigateToLogbook}>
          <div className="icon-wrapper purple"><FileText size={24} /></div>
          <div className="stat-info">
            <h2>{stats.hoursToApprove} hrs</h2>
            <span>Hours to Approve</span>
          </div>
        </div>

      </section>

      {/* Split Section */}
      <section className="dashboard-split">
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
            <button className="tip-item" onClick={navigateToLogbook}>
              <span>View Logbooks</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}