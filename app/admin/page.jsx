'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from 'next-themes'; 
import { Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable'; 
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
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // --- PDF & Export State ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Toggles & Chart Refs
  const [includeCharts, setIncludeCharts] = useState(true); 
  const lineChartRef = useRef(null); // Ref to capture Line Chart
  const pieChartRef = useRef(null);  // Ref to capture Pie Chart

  // --- Data State ---
  const [stats, setStats] = useState({ interns: 0, companies: 0, jobs: 0, applications: 0 });
  const [lineData, setLineData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [tableData, setTableData] = useState([]); 

  const chartTextColor = resolvedTheme === 'dark' ? '#F8FAFC' : '#1e293b';
  const chartGridColor = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // --- 1. Counts ---
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

        // --- 2. Chart Data ---
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
              backgroundColor: ['#EE7428', '#00d4ff', resolvedTheme === 'dark' ? '#F8FAFC' : '#94a3b8'], 
              borderWidth: 0,
          }],
        });

        // --- 3. Table Data ---
        const { data: rawApps } = await supabase
          .from('job_applications')
          .select('*') 
          .order('created_at', { ascending: false })
          .limit(15);

        if (rawApps && rawApps.length > 0) {
           const firstItem = rawApps[0];
           const applicantKey = 'intern_id' in firstItem ? 'intern_id' : 'user_id';
           const jobKey = 'job_id' in firstItem ? 'job_id' : 'post_id';

           const internIds = [...new Set(rawApps.map(a => a[applicantKey]).filter(Boolean))];
           const jobIds = [...new Set(rawApps.map(a => a[jobKey]).filter(Boolean))];

           const { data: users } = await supabase.from('profiles').select('*').in('id', internIds);
           const { data: jobs } = await supabase.from('job_posts').select('*').in('id', jobIds);

           const detailedApps = rawApps.map(app => {
             const user = users?.find(u => u.id === app[applicantKey]);
             const job = jobs?.find(j => j.id === app[jobKey]);
             
             let userName = 'Unknown User';
             if (user) {
                 if (user.fullname) userName = user.fullname;
                 else if (user.full_name) userName = user.full_name;
                 else if (user.first_name) userName = `${user.first_name} ${user.last_name || ''}`;
                 else if (user.email) userName = user.email;
             }

             const jobTitle = job 
               ? (job.job_title || job.title || job.role || 'No Title')
               : 'Unknown Job';

             return {
               ...app,
               profiles: { full_name: userName },
               job_posts: { job_title: jobTitle }
             };
           });
           setTableData(detailedApps);
        } else {
           setTableData([]);
        }

      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, resolvedTheme]);


  // --- 🟢 PDF GENERATION LOGIC ---
  const handleDownloadPDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const today = new Date().toLocaleDateString();

      // --- A. B&W TABLE STYLES ---
      // This enforces the black and white look for TABLES only.
      const bwStyles = {
        theme: 'plain', 
        headStyles: { 
          fillColor: [0, 0, 0], // Black Headers
          textColor: [255, 255, 255], // White Text
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 3, 
          halign: 'center',
          textColor: [0, 0, 0], // Black Text
          lineColor: [200, 200, 200], // Gray Borders
          lineWidth: 0.1,
        },
        margin: { top: 20, bottom: 20 },
      };

      const addHeaderFooter = (pageNumber, totalPages) => {
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text("Admin Dashboard Report", 14, 10);
        doc.text(today, pageWidth - 14, 10, { align: 'right' });
        doc.setFontSize(8);
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      // --- B. DOCUMENT TITLE ---
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0); // Black
      doc.text("Analytics Overview", 14, 20);
      
      let currentY = 30;

      // --- C. TABLE 1: KPI OVERVIEW (B&W) ---
      doc.setFontSize(14);
      doc.text("1. General Overview", 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Total Interns', 'Companies', 'Active Listings', 'Total Applications']],
        body: [[stats.interns, stats.companies, stats.jobs, stats.applications]],
        ...bwStyles,
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // --- D. CHARTS (COLORED) ---
      // We check the toggle. If true, we insert the COLORED images.
      
      doc.text("2. Platform Trends", 14, currentY);
      currentY += 6;

      if (includeCharts && lineChartRef.current) {
        // 🟢 This captures the canvas EXACTLY as seen (Orange/Blue)
        const chartBase64 = lineChartRef.current.toBase64Image(); 
        
        const imgWidth = 160; 
        const imgHeight = 80;
        
        if (currentY + imgHeight > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        doc.addImage(chartBase64, 'PNG', (pageWidth - imgWidth) / 2, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      }

      // --- E. TABLE 2: TRENDS (B&W) ---
      if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
      const trendsBody = lineData ? lineData.labels.map((month, i) => [
        month,
        lineData.datasets[0].data[i], 
        lineData.datasets[1].data[i] 
      ]) : [];

      autoTable(doc, {
        startY: currentY,
        head: [['Month', 'New Jobs', 'Applications']],
        body: trendsBody,
        ...bwStyles,
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // --- F. JOB TYPES (COLORED CHART + B&W TABLE) ---
      doc.text("3. Job Types Distribution", 14, currentY);
      currentY += 6;

      if (includeCharts && pieChartRef.current) {
        // 🟢 Capture Pie Chart Colors
        const chartBase64 = pieChartRef.current.toBase64Image();
        const imgWidth = 80;
        const imgHeight = 80;

        if (currentY + imgHeight > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        doc.addImage(chartBase64, 'PNG', (pageWidth - imgWidth) / 2, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      }

      const pieHead = pieData ? pieData.labels : ['Remote', 'On-site', 'Hybrid'];
      const pieBody = pieData ? [pieData.datasets[0].data] : [[0, 0, 0]];

      autoTable(doc, {
        startY: currentY,
        head: [pieHead],
        body: pieBody,
        ...bwStyles,
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // --- G. TABLE 4: RECENT LOGS (B&W) ---
      if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
      doc.text("4. Recent Applications Log", 14, currentY);
      currentY += 6;

      const activityBody = tableData.map(row => [
        new Date(row.created_at).toLocaleDateString(),
        row.profiles?.full_name || 'Unknown',
        row.job_posts?.job_title || 'Unknown',
        row.status || 'Pending'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Applicant Name', 'Job Title', 'Status']],
        body: activityBody,
        ...bwStyles,
        styles: { ...bwStyles.styles, halign: 'left' },
      });

      // --- Finalize ---
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addHeaderFooter(i, totalPages);
      }

      doc.save(`Report_${new Date().toISOString().split('T')[0]}.pdf`);
      setShowExportModal(false);

    } catch (err) {
      console.error("PDF Failed", err);
      alert("Could not generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Dashboard Overview</h1>
            <p className={styles.subtitle}>Welcome back, Administrator.</p>
          </div>
          <button className={styles.exportBtn} onClick={() => setShowExportModal(true)}>
            Export PDF Report
          </button>
        </div>
      </div>

      <div className={styles.printArea}>
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <StatCard title="Total Interns" value={stats.interns} change="Active" type="positive" />
          <StatCard title="Companies" value={stats.companies} change="Verified" type="neutral" />
          <StatCard title="Active Listings" value={stats.jobs} change="Live" type="positive" />
          <StatCard title="Total Applications" value={stats.applications} change="Total" type="neutral" />
        </div>

        {/* Charts */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Platform Trends</h3>
            <div className={styles.chartContainer}>
              {/* 🟢 Line Chart with Ref */}
              {lineData && <Line ref={lineChartRef} 
                  data={lineData} 
                  options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                          y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                          x: { ticks: { color: chartTextColor }, grid: { display: false } }
                      },
                      plugins: { legend: { labels: { color: chartTextColor } } }
                  }} 
              />}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Job Types</h3>
            <div className={styles.pieContainer}>
               {/* 🟢 Pie Chart with Ref */}
              {pieData && <Doughnut ref={pieChartRef} 
                  data={pieData} 
                  options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { color: chartTextColor } } }
                  }} 
              />}
            </div>
          </div>
        </div>
      </div> 

      {/* Export Modal */}
      {showExportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Export Analytics Report?</h3>
            <p>Generate a structured PDF report of your current dashboard data.</p>
            
            {/* Toggle Switch */}
            <div style={{ margin: '20px 0', textAlign: 'left', background: 'var(--bg-input)', padding: '15px', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={includeCharts} 
                  onChange={(e) => setIncludeCharts(e.target.checked)} 
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 500 }}>Include Visual Charts</span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '28px', marginTop: '4px' }}>
                Charts will be included in full color.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleDownloadPDF} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Download Report'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <span className={`${styles.statChange} ${changeClass}`}>{change}</span>
      </div>
    </div>
  );
}