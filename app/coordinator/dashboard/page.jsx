"use client";

import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
// 1. UPDATED IMPORT: Use the helper for Client Components
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import "./dashboard.css";

// Font imports (Keep these if not in your root layout, otherwise remove)
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Dynamic import for ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div style={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>Loading Chart...</div>
});

export default function CoordinatorDashboard() {
  // 2. INITIALIZE CLIENT: Create the supabase client inside the component
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [isLightMode, setIsLightMode] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    companies: 0,
    activeInternships: 0,
    pendingApprovals: 0,
  });

  const [monthlyApplications, setMonthlyApplications] = useState([]);
  const [growthData, setGrowthData] = useState({
    monthlyStudents: [],
    monthlyCompanies: [],
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Set initial time to avoid hydration mismatch
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme toggle with body class
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 3. USE AUTHENTICATED CLIENT
      // Because we use createClientComponentClient, these calls automatically 
      // use the user's cookies/session.
      const { count: studentCount } = await supabase.from("profiles").select("id", { head: true, count: "exact" }).eq("user_type", "student");
      const { count: companyCount } = await supabase.from("companies").select("id", { head: true, count: "exact" });
      const { count: activeCount } = await supabase.from("job_applications").select("id", { head: true, count: "exact" }).eq("status", "approved_by_coordinator");
      const { count: pendingCount } = await supabase.from("job_applications").select("id", { head: true, count: "exact" }).eq("status", "Company_Approved_Waiting_Coordinator");

      setStats({
        students: studentCount || 0,
        companies: companyCount || 0,
        activeInternships: activeCount || 0,
        pendingApprovals: pendingCount || 0,
      });

      // Data fetching logic for charts
      const { data: apps } = await supabase.from("job_applications").select("created_at");
      const monthlyCounts = Array(12).fill(0);
      apps?.forEach((app) => {
        const month = new Date(app.created_at).getMonth();
        monthlyCounts[month]++;
      });
      setMonthlyApplications(monthlyCounts);

      const { data: studentData } = await supabase.from("profiles").select("created_at").eq("user_type", "student");
      const studentMonthly = Array(12).fill(0);
      studentData?.forEach((s) => {
        const month = new Date(s.created_at).getMonth();
        studentMonthly[month]++;
      });

      const { data: companyData } = await supabase.from("companies").select("updated_at");
      const companyMonthly = Array(12).fill(0);
      companyData?.forEach((c) => {
        const month = new Date(c.updated_at).getMonth();
        companyMonthly[month]++;
      });

      setGrowthData({
        monthlyStudents: studentMonthly,
        monthlyCompanies: companyMonthly,
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  const chartTheme = {
    theme: { mode: isLightMode ? 'light' : 'dark' },
    foreColor: isLightMode ? '#0F172A' : '#F1F5F9',
    chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
    tooltip: { enabled: true, theme: isLightMode ? 'light' : 'dark' },
    legend: { labels: { colors: isLightMode ? '#0F172A' : '#F1F5F9' } },
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="dashboard-inner">
         <section className="header-bento">
            <div className="skeleton card" style={{ height: '160px', width: '100%', background: 'var(--bg-card)', borderRadius: '24px' }}></div>
         </section>
         <section className="overview-grid">
           {[...Array(4)].map((_, i) => <div key={i} className="skeleton card" style={{ height: '150px', background: 'var(--bg-card)', borderRadius: '24px' }}></div>)}
         </section>
      </div>
    );
  }

  return (
    <div className="dashboard-inner">
      
      {/* HEADER BENTO: Title Left, Time Right */}
      <section className="header-bento">
        <div className="header-bento-card">
            
            {/* 1. Left Side */}
            <div className="header-left">
                <h1 className="dash-title">Coordinator Dashboard</h1>
                <p className="dash-subtitle">Welcome back. Here is your system overview.</p>
            </div>

            {/* 2. Right Side */}
            <div className="header-right">
                <div className="time-display">
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <span className="current-date">{formatDate(currentTime)}</span>
                </div>
                
                {/* Divider */}
                <div className="theme-divider"></div>
                
                {/* Toggle */}
             
            </div>

        </div>
      </section>

      {/* Stats Grid */}
      <section className="overview-grid">
        <div className="card big">
          <h2>{stats.students}</h2>
          <p>Registered Students</p>
        </div>
        <div className="card big">
          <h2>{stats.companies}</h2>
          <p>Partner Companies</p>
        </div>
        <div className="card big">
          <h2>{stats.activeInternships}</h2>
          <p>Active Internships</p>
        </div>
        <div className="card big alert">
          <h2>{stats.pendingApprovals}</h2>
          <p>Pending Approvals</p>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="charts-grid">
        <div className="chart-card">
          <h3>User Growth (Monthly)</h3>
          <ApexChart
            type="area"
            height={250}
            series={[
              { name: "Students", data: growthData.monthlyStudents },
              { name: "Companies", data: growthData.monthlyCompanies },
            ]}
            options={{
              ...chartTheme,
              stroke: { curve: "smooth", width: 3 },
              colors: ["#EE7428", "#3b82f6"],
              grid: { borderColor: isLightMode ? '#e2e8f0' : '#27343D' },
              xaxis: {
                categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                labels: { style: { colors: chartTheme.foreColor } },
              },
              yaxis: { labels: { style: { colors: chartTheme.foreColor } } },
            }}
          />
        </div>

        <div className="chart-card">
          <h3>Internship Status</h3>
          <ApexChart
            type="donut"
            height={250}
            series={[stats.activeInternships, stats.pendingApprovals, Math.max(0, stats.students - stats.activeInternships - stats.pendingApprovals)]}
            options={{
              ...chartTheme,
              colors: ["#22c55e", "#EE7428", "#8899AA"],
              labels: ["Active", "Pending Your Approval", "Other Students"],
              legend: { position: "bottom", labels: { colors: chartTheme.foreColor } },
              plotOptions: { pie: { donut: { labels: { show: true, value: { color: chartTheme.foreColor } } } } },
            }}
          />
        </div>

        <div className="chart-card full">
          <h3>Applications Per Month</h3>
          <ApexChart
            type="bar"
            height={300}
            series={[{ name: "Applications", data: monthlyApplications }]}
            options={{
              ...chartTheme,
              colors: ["#3b82f6"],
              plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
              grid: { borderColor: isLightMode ? '#e2e8f0' : '#27343D' },
              xaxis: {
                categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                labels: { style: { colors: chartTheme.foreColor } },
              },
              yaxis: { labels: { style: { colors: chartTheme.foreColor } } },
            }}
          />
        </div>
      </section>
    </div>
  );
}