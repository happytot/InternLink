'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import './CompanyDashboard.css';
import Header from '../../components/Header';

// Lucide Icons
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  FileText, 
  Settings,
  Activity,
  Calendar
} from 'lucide-react';

const CompanyDashboard = () => {
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
        .select('id, created_at, status, profiles:intern_id(fullname), job_posts(title)')
        .in('job_id', jobs.map(j => j.id))
        .order('created_at', { ascending: false })
        .limit(5);

      const activityFeed = recentApps.map(a => ({
        id: a.id,
        title: a.job_posts?.title || 'Job Post',
        content: `${a.profiles?.fullname || 'A candidate'} applied for this position.`,
        time: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      }));

      setStats({ activeListings, newApplications, pendingReviews, hiredInterns });
      setRecentActivities(activityFeed);
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
        toast.error('Please log in.');
        setLoading(false);
        return;
      }
      setUser(user);
      await fetchData(user.id);
    };
    getUserAndData();
  }, [supabase, fetchData]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('company-dashboard-updates');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posts', filter: `company_id=eq.${user.id}` }, (payload) => {
          if(payload.eventType === 'INSERT') toast.success(`New job posted!`);
          fetchData(user.id); 
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => {
          toast('Dashboard updated', { icon: 'Hz' });
          fetchData(user.id);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchData]);

  // Navigation
  const handlePostJob = () => router.push('/company/jobs/new'); 
  const navigateToJobs = () => router.push('/company/jobs/listings');
  const navigateToApplications = (filter) => router.push(`/company/applications?status=${filter}`);
  const navigateToApplicationDetail = (id) => router.push(`/company/applications/${id}`);
  const navigateToProfile = () => router.push('/company/profile');

  if (loading) return (
    <>
      <Header />
      <div className="loading-container"><Activity className="spin-icon" size={40} /></div>
    </>
  );

  if (!user) return (
    <>
      <Header />
      <div className="loading-container">Session not found.</div>
    </>
  );

  return (
    <>
      <Header />
      
      <div className="dashboard-container">
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

        {/* ✅ Stats Grid now includes the Welcome Header as the first item */}
        <section className="stats-grid">
          
          {/* 1. The New Horizontal Welcome Widget */}
          <div className="welcome-widget">
            <div className="welcome-content">
              <h1>Dashboard</h1>
              <p>Welcome back, {user.email}</p>
            </div>
            <div className="welcome-date">
              <Calendar size={18} className="date-icon"/>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* 2. Stat Cards */}
          <div className="stat-widget clickable-widget" onClick={navigateToJobs}>
            <div className="stat-icon-bg"><Briefcase size={24} strokeWidth={2} /></div>
            <div>
              <h2 className="stat-value">{stats.activeListings}</h2>
              <span className="stat-label">Active Jobs</span>
            </div>
          </div>

          <div className="stat-widget clickable-widget" onClick={() => navigateToApplications('Pending')}>
            <div className="stat-icon-bg"><Users size={24} strokeWidth={2} /></div>
            <div>
              <h2 className="stat-value">{stats.newApplications}</h2>
              <span className="stat-label">New Applicants</span>
            </div>
          </div>

          <div className="stat-widget clickable-widget" onClick={() => navigateToApplications('Review')}>
            <div className="stat-icon-bg"><Clock size={24} strokeWidth={2} /></div>
            <div>
              <h2 className="stat-value">{stats.pendingReviews}</h2>
              <span className="stat-label">In Review</span>
            </div>
          </div>

          <div className="stat-widget clickable-widget" onClick={() => navigateToApplications('Accepted')}>
            <div className="stat-icon-bg"><CheckCircle2 size={24} strokeWidth={2} /></div>
            <div>
              <h2 className="stat-value">{stats.hiredInterns}</h2>
              <span className="stat-label">Hired</span>
            </div>
          </div>

        </section>

        {/* Content Grid (Activity + Actions) */}
        <section className="content-grid">
          
          <div className="widget-card">
            <h3 className="widget-title">
              <Activity size={20} className="widget-icon-header" /> 
              Recent Activity
            </h3>
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="activity-item clickable-activity"
                    onClick={() => navigateToApplicationDetail(activity.id)}
                  >
                    <div className="activity-dot"></div>
                    <div className="activity-details">
                      <h4>{activity.title}</h4>
                      <p>{activity.content}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                    <ChevronRight size={16} className="activity-arrow" />
                  </div>
                ))
              ) : (
                <div className="empty-state">
                   <FileText size={40} color="#e5e5ea" />
                   <p>No recent activity.</p>
                </div>
              )}
            </div>
          </div>

          <div className="widget-card">
            <h3 className="widget-title">
              <Settings size={20} className="widget-icon-header" /> 
              Quick Actions
            </h3>
            <div className="action-buttons">
              <button onClick={handlePostJob} className="ios-btn btn-primary">
                <div className="btn-content">
                  <Plus size={20} />
                  <span>Post New Job</span>
                </div>
                <ChevronRight size={20} className="btn-arrow" />
              </button>
              
              <button onClick={() => navigateToApplications('All')} className="ios-btn btn-secondary">
                <div className="btn-content">
                  <FileText size={20} />
                  <span>Review Applications</span>
                </div>
                <ChevronRight size={20} className="btn-arrow" />
              </button>
              
              <button onClick={navigateToProfile} className="ios-btn btn-secondary">
                <div className="btn-content">
                  <Settings size={20} />
                  <span>Company Profile</span>
                </div>
                <ChevronRight size={20} className="btn-arrow" />
              </button>
            </div>
          </div>

        </section>
      </div>
    </>
  );
};

export default CompanyDashboard;