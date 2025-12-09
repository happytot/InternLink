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
const [analytics, setAnalytics] = useState({
  placementRate: 0,        // % students placed
  partnerActivity: 0,      // number of active partners
  studentSuccessRate: 0,   // % students completing internships successfully
  placementTrend: Array(12).fill(0),    // placements per month
  partnerTrend: Array(12).fill(0),      // partner activity per month
  studentOutcomeTrend: Array(12).fill(0), // student outcomes per month
});



  const [monthlyApplications, setMonthlyApplications] = useState([]);
  const [growthData, setGrowthData] = useState({
    monthlyStudents: [],
    monthlyCompanies: [],
  });

  const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);

    // 1️⃣ Registered students
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("user_type", "student");

    // 2️⃣ Active internships
    const { count: activeInternshipsCount } = await supabase
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("status", "ongoing");

    // 3️⃣ Total companies
    const { count: companyCount } = await supabase
      .from("companies")
      .select("id", { head: true, count: "exact" });

    // 4️⃣ Active companies = companies that have at least one ongoing internship
    const { data: activeCompanyApps } = await supabase
      .from("job_applications")
      .select("company_id")
      .eq("status", "ongoing");

    const activeCompanyIds = new Set(activeCompanyApps?.map(app => app.company_id));
    const activeCompanies = activeCompanyIds.size || 0;

    // 5️⃣ Applications per month
    const { data: apps } = await supabase
      .from("job_applications")
      .select("created_at");

    const monthlyApplications = Array(12).fill(0);
    apps?.forEach(app => {
      const month = new Date(app.created_at).getMonth();
      monthlyApplications[month]++;
    });
    setMonthlyApplications(monthlyApplications);

    // 6️⃣ Set stats
    setStats({
      students: studentCount || 0,
      companies: companyCount || 0,
      activeInternships: activeInternshipsCount || 0,
      pendingApprovals: 0, // optional
    });

    // 7️⃣ Placement Rate
    const placementRate = studentCount
      ? Math.round((activeInternshipsCount / studentCount) * 100)
      : 0;

    // 8️⃣ Set analytics
    setAnalytics({
      placementRate,
      partnerActivity: activeCompanies,
      studentSuccessRate: 0, // no students completed yet
      placementTrend: Array(12).fill(placementRate),
      partnerTrend: Array(12).fill(activeCompanies),
      studentOutcomeTrend: Array(12).fill(0),
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

      {/* Analytics & Reports Overview */}


{/* Analytics & Reports Overview */}
<section className="analytics-overview">
 

  <div className="analytics-cards">
    {/* 1. Placement Rates KPI */}
    <div className="analytics-card kpi-card green-accent">
      <div className="kpi-header">
        <h4>Placement Rate</h4>
        <span className="kpi-value">{analytics.placementRate}%</span>
      </div>
      <p>Students successfully placed</p>
      
      {/* Sparkline Chart for Trend */}
      <ApexChart
        type="area"
        height={100}
        series={[{ name: "Placements", data: analytics.placementTrend }]}
        options={{
          ...chartTheme,
          colors: ['#22c55e'],
          chart: { sparkline: { enabled: true }, background: 'transparent' },
          stroke: { curve: 'smooth', width: 2 },
          fill: { opacity: 0.2 },
        }}
      />
    </div>

    {/* 2. Partner Engagement KPI */}
    <div className="analytics-card kpi-card blue-accent">
      <div className="kpi-header">
        <h4>Partner Engagement</h4>
        <span className="kpi-value">{analytics.partnerActivity}</span>
      </div>
      <p>Active companies posting jobs</p>

      {/* Sparkline Chart for Trend */}
      <ApexChart
        type="area"
        height={100}
        series={[{ name: "Partners", data: analytics.partnerTrend }]}
        options={{
          ...chartTheme,
          colors: ['#3b82f6'],
          chart: { sparkline: { enabled: true }, background: 'transparent' },
          stroke: { curve: 'smooth', width: 2 },
          fill: { opacity: 0.2 },
        }}
      />
    </div>

    {/* 3. Student Outcomes KPI */}
    <div className="analytics-card kpi-card orange-accent">
      <div className="kpi-header">
        <h4>Student Outcomes</h4>
        <span className="kpi-value">{analytics.studentSuccessRate}%</span>
      </div>
      <p>Completed internships successfully</p>
      
      {/* Sparkline Chart for Trend */}
      <ApexChart
        type="area"
        height={100}
        series={[{ name: "Success Rate", data: analytics.studentOutcomeTrend }]}
        options={{
          ...chartTheme,
          colors: ['#EE7428'],
          chart: { sparkline: { enabled: true }, background: 'transparent' },
          stroke: { curve: 'smooth', width: 2 },
          fill: { opacity: 0.2 },
        }}
      />
    </div>
  </div>
</section>



      {/* Charts Grid */}
      <section className="charts-grid">
       

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