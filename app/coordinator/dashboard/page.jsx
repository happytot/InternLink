"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./dashboard.css";
import dynamic from 'next/dynamic';

import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function CoordinatorDashboard() {
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

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dark/Light Mode Effect
  useEffect(() => {
    const bodyClass = isLightMode ? 'light-mode' : 'dark-mode';
    document.body.className = bodyClass;

    return () => { document.body.className = ''; };
  }, [isLightMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { count: studentCount } = await supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .eq("user_type", "student");

      const { count: companyCount } = await supabase
        .from("companies")
        .select("id", { head: true, count: "exact" });

      const { count: activeCount } = await supabase
        .from("job_applications")
        .select("id", { head: true, count: "exact" })
        .eq("status", "approved_by_coordinator");

      const { count: pendingCount } = await supabase
        .from("job_applications")
        .select("id", { head: true, count: "exact" })
        .eq("status", "Company_Approved_Waiting_Coordinator");

      setStats({
        students: studentCount || 0,
        companies: companyCount || 0,
        activeInternships: activeCount || 0,
        pendingApprovals: pendingCount || 0,
      });

      // Monthly Applications
      const { data: apps } = await supabase.from("job_applications").select("created_at");
      const monthlyCounts = Array(12).fill(0);
      apps?.forEach((app) => {
        const month = new Date(app.created_at).getMonth();
        monthlyCounts[month]++;
      });
      setMonthlyApplications(monthlyCounts);

      // Monthly student growth
      const { data: studentData } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_type", "student");
      const studentMonthly = Array(12).fill(0);
      studentData?.forEach((s) => {
        const month = new Date(s.created_at).getMonth();
        studentMonthly[month]++;
      });

      // Monthly company growth
      const { data: companyData } = await supabase
        .from("companies")
        .select("updated_at");
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

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-root">
        <CoordinatorSidebar />
        <main className="dashboard-main">
          <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '10px' }}></div>
          <div className="skeleton" style={{ height: '20px', width: '180px', marginBottom: '30px' }}></div>
          <section className="overview-grid">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton card"></div>)}
          </section>
          <section className="charts-grid">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton chart"></div>)}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`dashboard-root ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
      <CoordinatorSidebar />
      <main className="dashboard-main">
        {/* Top Bar: Time + Dark/Light Toggle */}
        <div className="dashboard-topbar">
          <div className="dashboard-clock">
            <span>{formatDate(currentTime)}</span> | <span>{formatTime(currentTime)}</span>
          </div>
          <div className="theme-toggle">
            <label className="switch">
              <input type="checkbox" checked={isLightMode} onChange={() => setIsLightMode(!isLightMode)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <h1 className="dash-title">Coordinator Dashboard</h1>
        <p className="dash-subtitle">Overview of your internship system</p>

        {/* Stats Cards */}
        <section className="overview-grid">
          <div className="card big reveal-on-scroll">
            <h2>{stats.students}</h2>
            <p>Registered Students</p>
          </div>
          <div className="card big reveal-on-scroll">
            <h2>{stats.companies}</h2>
            <p>Partner Companies</p>
          </div>
          <div className="card big reveal-on-scroll">
            <h2>{stats.activeInternships}</h2>
            <p>Active Internships</p>
          </div>
          <div className="card big reveal-on-scroll alert">
            <h2>{stats.pendingApprovals}</h2>
            <p>Pending Approvals</p>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-grid">
          {/* User Growth */}
          <div className="chart-card reveal-on-scroll">
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

          {/* Internship Status */}
          <div className="chart-card reveal-on-scroll">
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

          {/* Applications Per Month */}
          <div className="chart-card full reveal-on-scroll">
            <h3>Applications Per Month</h3>
            <ApexChart
              type="bar"
              height={300}
              series={[{ name: "Applications", data: monthlyApplications }]}
              options={{
                ...chartTheme,
                colors: ["#3b82f6"],
                plotOptions: { bar: { borderRadius: 12, columnWidth: '60%' } },
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
      </main>
    </div>
  );
}
