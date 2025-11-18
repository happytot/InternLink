"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import CoordinatorSidebar from "../../components/CoordinatorSidebar";
import "./dashboard.css";
import dynamic from 'next/dynamic';
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function CoordinatorDashboard() {
  const [loading, setLoading] = useState(true);

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
    const fetchData = async () => {
      setLoading(true);

      // --- COUNT STUDENTS --- (This is correct)
      const { count: studentCount } = await supabase
        .from("profiles")
        .select("*", { head: true, count: "exact" })
        .eq("user_type", "student");

      // --- COUNT COMPANIES (NOW USING companies TABLE) --- (This is correct)
      const { count: companyCount } = await supabase
        .from("companies")
        .select("*", { head: true, count: "exact" });

      // --- COUNT ACTIVE INTERNSHIPS ---
      // FIX 1: This should query 'job_applications'
      const { count: activeCount } = await supabase
        .from("job_applications") 
        .select("*", { head: true, count: "exact" })
        // FIX 2: This is the status for a fully approved intern
        .eq("status", "approved_by_coordinator"); 

      // --- COUNT PENDING APPROVALS ---
      const { count: pendingCount } = await supabase
        .from("job_applications")
        .select("*", { head: true, count: "exact" })
        // FIX 3: This is the status for apps waiting for YOU
        .eq("status", "Company_Approved_Waiting_Coordinator"); 

      setStats({
        students: studentCount || 0,
        companies: companyCount || 0,
        activeInternships: activeCount || 0,
        pendingApprovals: pendingCount || 0,
      });

      // --- MONTHLY APPLICATIONS --- (This is correct)
      const { data: apps } = await supabase
        .from("job_applications")
        .select("created_at");

      const monthlyCounts = Array(12).fill(0);
      apps?.forEach((app) => {
        const month = new Date(app.created_at).getMonth();
        monthlyCounts[month]++;
      });
      setMonthlyApplications(monthlyCounts);

      // --- MONTHLY STUDENT GROWTH --- (This is correct)
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
  .select("updated_at"); // <-- use the correct column

const companyMonthly = Array(12).fill(0);
companyData?.forEach((c) => {
  const month = new Date(c.updated_at).getMonth(); // <-- updated field
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

  if (loading) return <div className="dash-center">Loading dashboard...</div>;

  return (
    <div className="dashboard-root">
      <CoordinatorSidebar />
      <main className="dashboard-main">

        {/* Dashboard Header */}
        <h1 className="dash-title">Coordinator Dashboard</h1>
        <p className="dash-subtitle">Overview of your internship system</p>

        {/* ----- Stats Cards ----- */}
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

          <div className="card big">
            <h2>{stats.pendingApprovals}</h2>
            <p>Pending Approvals</p>
          </div>
        </section>

        {/* ----- CHARTS ----- */}
        <section className="charts-grid">

          {/* USER GROWTH CHART */}
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
                chart: { toolbar: { show: false } },
                stroke: { curve: "smooth" },
                xaxis: {
                  categories: [
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"
                  ],
                },
              }}
            />
          </div>

          {/* INTERNSHIP STATUS PIE */}
          <div className="chart-card">
            <h3>Internship Status</h3>
            <ApexChart
              type="donut"
              height={250}
              series={[
                stats.activeInternships,
                stats.pendingApprovals,
                // This logic is still a guess, but it will be
                // more accurate now that the other stats are correct.
                Math.max(0, stats.students - stats.activeInternships - stats.pendingApprovals), 
              ]}
              options={{
                labels: ["Active", "Pending Your Approval", "Other Students"],
                legend: { position: "bottom" },
              }}
            />
          </div>

          {/* MONTHLY APPLICATION BAR */}
          <div className="chart-card full">
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
                xaxis: {
                  categories: [
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"
                  ],
                },
                plotOptions: { bar: { borderRadius: 6 } },
              }}
            />
          </div>

        </section>
      </main>
    </div>
  );
}