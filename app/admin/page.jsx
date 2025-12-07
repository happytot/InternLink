'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from 'next-themes'; // 👈 1. Import this
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './AdminDashboard.module.css'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const { resolvedTheme } = useTheme(); // 👈 2. Get current theme
  const [loading, setLoading] = useState(true);
  
  // Stats & Data State
  const [stats, setStats] = useState({ interns: 0, companies: 0, jobs: 0, applications: 0 });
  const [lineData, setLineData] = useState(null);
  const [pieData, setPieData] = useState(null);

  // --- 3. Compute Chart Colors based on Theme ---
  // If Dark Mode: Text is White, Grid is faint white
  // If Light Mode: Text is Slate 800, Grid is faint black
  const chartTextColor = resolvedTheme === 'dark' ? '#F8FAFC' : '#1e293b';
  const chartGridColor = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // --- FETCH KPI COUNTS ---
        const { count: internCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'student'); 
        const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
        const { count: jobCount } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });
        const { count: appCount } = await supabase.from('job_applications').select('*', { count: 'exact', head: true });

        setStats({
          interns: internCount || 0,
          companies: companyCount || 0,
          jobs: jobCount || 0,
          applications: appCount || 0
        });

        // --- FETCH LINE CHART DATA ---
        const { data: jobDates } = await supabase.from('job_posts').select('created_at').order('created_at', { ascending: true });
        const { data: appDates } = await supabase.from('job_applications').select('created_at').order('created_at', { ascending: true });

        const processByMonth = (data) => {
          const months = {};
          data?.forEach(item => {
            const date = new Date(item.created_at);
            const key = date.toLocaleString('default', { month: 'short' }); 
            months[key] = (months[key] || 0) + 1;
          });
          return months;
        };

        const jobsByMonth = processByMonth(jobDates || []);
        const appsByMonth = processByMonth(appDates || []);
        const allMonths = [...new Set([...Object.keys(jobsByMonth), ...Object.keys(appsByMonth)])];
        
        setLineData({
          labels: allMonths,
          datasets: [
            {
              label: 'New Jobs',
              data: allMonths.map(m => jobsByMonth[m] || 0),
              borderColor: '#EE7428', 
              backgroundColor: 'rgba(238, 116, 40, 0.2)',
              tension: 0.4,
            },
            {
              label: 'Applications',
              data: allMonths.map(m => appsByMonth[m] || 0),
              borderColor: '#00d4ff',
              backgroundColor: 'rgba(0, 212, 255, 0.2)',
              tension: 0.4,
            }
          ],
        });

        // --- FETCH PIE CHART DATA ---
        const { data: jobTypes } = await supabase.from('job_posts').select('work_setup');
        const typeCounts = { 'Remote': 0, 'On-site': 0, 'Hybrid': 0 };
        jobTypes?.forEach(job => {
            const setup = job.work_setup || 'On-site';
            if (typeCounts[setup] !== undefined) typeCounts[setup]++;
            else typeCounts['On-site']++;
        });

        setPieData({
          labels: Object.keys(typeCounts),
          datasets: [{
              data: Object.values(typeCounts),
              backgroundColor: ['#EE7428', '#00d4ff', resolvedTheme === 'dark' ? '#F8FAFC' : '#94a3b8'], // Adjust 'Hybrid' color for light mode visibility
              borderWidth: 0,
          }],
        });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, resolvedTheme]); // Re-run if theme changes (to update chart colors)

  if (loading) return <div className={styles.loadingContainer}>Loading Dashboard...</div>;

  return (
    <div className={styles.dashboardWrapper}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Overview</h1>
        <p className={styles.subtitle}>Welcome back, Administrator.</p>
      </div>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <StatCard title="Total Interns" value={stats.interns} change="Active" type="positive" />
        <StatCard title="Companies" value={stats.companies} change="Verified" type="neutral" />
        <StatCard title="Active Listings" value={stats.jobs} change="Live" type="positive" />
        <StatCard title="Total Applications" value={stats.applications} change="Total" type="neutral" />
      </div>

      {/* CHARTS */}
      <div className={styles.chartsGrid}>
        
        {/* Main Line Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Platform Trends</h3>
          <div className={styles.chartContainer}>
            {lineData && <Line 
                data={lineData} 
                options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                          ticks: { color: chartTextColor, font: { size: 12 } }, 
                          grid: { color: chartGridColor } 
                        },
                        x: { 
                          ticks: { color: chartTextColor, font: { size: 12 } }, 
                          grid: { display: false } 
                        }
                    },
                    plugins: { 
                        legend: { 
                            display: true, 
                            labels: { color: chartTextColor, font: { size: 14 } } 
                        } 
                    }
                }} 
            />}
          </div>
        </div>

        {/* Side Pie Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Job Types</h3>
          <div className={styles.pieContainer}>
            {pieData && <Doughnut 
                data={pieData} 
                options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { color: chartTextColor, font: { size: 14 }, padding: 20 } 
                        } 
                    }
                }} 
            />}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, change, type }) {
  const changeClass = type === 'positive' ? styles.positive : styles.neutral;
  return (
    <div className={styles.statCard}>
      <h4 className={styles.statTitle}>{title}</h4>
      <div className={styles.statRow}>
        <span className={styles.statValue}>{value}</span>
        <span className={`${styles.statChange} ${changeClass}`}>
          {change}
        </span>
      </div>
    </div>
  );
}