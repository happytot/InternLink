"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./dashboard.css";
import dynamic from 'next/dynamic';
// Import Google Fonts for the new design system
import '@fontsource/plus-jakarta-sans/700.css'; // For Headings
import '@fontsource/inter/400.css'; // For Body
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function CoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [isLightMode, setIsLightMode] = useState(false); // State for theme

  const [stats, setStats] = useState({
    students: 0,
    companies: 0,
    activeInternships: 0,
    pendingApprovals: 0,
  });

  // For charts
  const [monthlyApplications, setMonthlyApplications] = useState([]);
  const [growthData, setGrowthData] = useState({
    monthlyStudents: [],
    monthlyCompanies: [],
  });

  useEffect(() => {
    // --- Dark/Light Mode Toggle Placeholder (You can integrate a real one later) ---
    const bodyClass = isLightMode ? 'light-mode' : 'dark-mode';
    document.body.className = bodyClass;
    
    // Cleanup function (important for global styling)
    return () => {
        document.body.className = '';
    };
  }, [isLightMode]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // --- COUNT STUDENTS --- (Correct)
      const { count: studentCount } = await supabase
        .from("profiles")
        .select("*", { head: true, count: "exact" })
        .eq("user_type", "student");

      // --- COUNT COMPANIES --- (Correct)
      const { count: companyCount } = await supabase
        .from("companies")
        .select("*", { head: true, count: "exact" });

      // --- COUNT ACTIVE INTERNSHIPS ---
      const { count: activeCount } = await supabase
        .from("job_applications")
        .select("*", { head: true, count: "exact" })
        .eq("status", "approved_by_coordinator"); 

      // --- COUNT PENDING APPROVALS ---
      const { count: pendingCount } = await supabase
        .from("job_applications")
        .select("*", { head: true, count: "exact" })
        .eq("status", "Company_Approved_Waiting_Coordinator");

      setStats({
        students: studentCount || 0,
        companies: companyCount || 0,
        activeInternships: activeCount || 0,
        pendingApprovals: pendingCount || 0,
      });

      // --- MONTHLY APPLICATIONS --- (Correct)
      const { data: apps } = await supabase
        .from("job_applications")
        .select("created_at");

      const monthlyCounts = Array(12).fill(0);
      apps?.forEach((app) => {
        const month = new Date(app.created_at).getMonth();
        monthlyCounts[month]++;
      });
      setMonthlyApplications(monthlyCounts);

      // --- MONTHLY STUDENT GROWTH --- (Correct)
      const { data: studentData } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_type", "student");

      const studentMonthly = Array(12).fill(0);
      studentData?.forEach((s) => {
        const month = new Date(s.created_at).getMonth();
        studentMonthly[month]++;
      });

      // --- MONTHLY COMPANY GROWTH ---
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

  // ApexChart configuration for Dark/Light mode theme - FIX APPLIED HERE
  const chartTheme = {
    // 1. Theme property MUST be an object containing the mode
    theme: { 
      mode: isLightMode ? 'light' : 'dark',
    },
    // 2. foreColor is a root property
    foreColor: isLightMode ? '#0F172A' : '#F1F5F9', 

    // 3. Add robust chart defaults to prevent the previous "reading 'enabled'" errors
    chart: { 
        toolbar: { show: false }, 
        zoom: { enabled: false },
        background: 'transparent' // Background added here for simplicity
    },
    tooltip: {
        enabled: true,
        theme: isLightMode ? 'light' : 'dark', // Tooltip theme can be a string
    },
    legend: {
        labels: {
            colors: isLightMode ? '#0F172A' : '#F1F5F9'
        }
    }
  };

if (loading) {
  return (
    <div className="dashboard-root">
      <CoordinatorSidebar />
      <main className="dashboard-main">

        {/* Dashboard Header Skeleton */}
        <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '10px' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '180px', marginBottom: '30px' }}></div>

        {/* Stats Cards Skeleton */}
        <section className="overview-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton card"></div>
          ))}
        </section>

        {/* Charts Skeleton */}
        <section className="charts-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton chart"></div>
          ))}
        </section>

      </main>
    </div>
  );
}


  return (
    <div className={`dashboard-root ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
      <CoordinatorSidebar />
      <main className="dashboard-main">

        {/* Dashboard Header */}
        <h1 className="dash-title">Coordinator Dashboard</h1>
        <p className="dash-subtitle">Overview of your internship system</p>

        {/* ----- Stats Cards ----- */}
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

        {/* ----- CHARTS ----- */}
        <section className="charts-grid">

          {/* USER GROWTH CHART */}
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
                ...chartTheme, // Apply base theme and defaults
                
                stroke: { curve: "smooth", width: 3 },
                colors: ["#EE7428", "#3b82f6"], // Primary Orange and Secondary Blue
                grid: { borderColor: isLightMode ? '#e2e8f0' : '#27343D' },
                xaxis: {
                  categories: [
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"
                  ],
                  labels: { style: { colors: chartTheme.foreColor } }
                },
                yaxis: {
                    labels: { style: { colors: chartTheme.foreColor } }
                },
              }}
            />
          </div>

          {/* INTERNSHIP STATUS PIE */}
          <div className="chart-card reveal-on-scroll">
            <h3>Internship Status</h3>
            <ApexChart
              type="donut"
              height={250}
              series={[
                stats.activeInternships,
                stats.pendingApprovals,
                // Remaining students not active/pending
                Math.max(0, stats.students - stats.activeInternships - stats.pendingApprovals),
              ]}
              options={{
                ...chartTheme, // Apply base theme and defaults
                
                colors: ["#22c55e", "#EE7428", "#8899AA"], // Success Green, Primary Orange, Muted
                labels: ["Active", "Pending Your Approval", "Other Students"],
                legend: { 
                    position: "bottom",
                    labels: { colors: chartTheme.foreColor } // Overwrite legend labels color from chartTheme
                },
                plotOptions: {
                    pie: {
                        donut: {
                            labels: {
                                show: true,
                                value: {
                                    color: chartTheme.foreColor,
                                }
                            }
                        }
                    }
                }
              }}
            />
          </div>

          {/* MONTHLY APPLICATION BAR */}
          <div className="chart-card full reveal-on-scroll">
            <h3>Applications Per Month</h3>
            <ApexChart
              type="bar"
              height={300}
              series={[
                {
                  name: "Applications",
                  data: monthlyApplications,
                },
              ]}
              options={{
                ...chartTheme, // Apply base theme and defaults
                
                colors: ["#3b82f6"], // Secondary Blue
                plotOptions: { bar: { borderRadius: 12, columnWidth: '60%' } },
                grid: { borderColor: isLightMode ? '#e2e8f0' : '#27343D' },
                xaxis: {
                  categories: [
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"
                  ],
                  labels: { style: { colors: chartTheme.foreColor } }
                },
                yaxis: {
                    labels: { style: { colors: chartTheme.foreColor } }
                },
              }}
            />
          </div>

        </section>
      </main>
    </div>
  );
}