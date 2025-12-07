'use client';

import { useEffect, useState } from 'react';
// 1. UPDATED IMPORT: Use the auth helper instead of the static client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast, Toaster } from 'sonner';
import { FaUserGraduate, FaBuilding, FaBriefcase, FaUniversity } from 'react-icons/fa';
import './internships.css';

// Font imports (Keep these if not in your root layout, otherwise remove)
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

export default function CoordinatorPlacements() {
    // 2. INITIALIZE CLIENT: Create the client inside the component
    const supabase = createClientComponentClient();

    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. FETCH LOGIC
    const fetchPlacements = async (isBackgroundUpdate = false) => {
        if (!isBackgroundUpdate) setLoading(true);
        
        try {
            // A. FETCH APPLICATIONS
            const { data: apps, error: appError } = await supabase
                .from("job_applications")
                .select(`
                    id, 
                    status, 
                    required_hours, 
                    intern_id,
                    job_posts:fk_job_applications_job ( title, companies ( name ) )
                `)
                .in("status", ["approved_by_coordinator", "active_intern", "ongoing", "Ongoing"]);

            if (appError) throw appError;

            // Collect IDs
            const internIds = apps.map(app => app.intern_id).filter(Boolean);

            if (internIds.length === 0) {
                setPlacements([]);
                setLoading(false);
                return;
            }

            // B. FETCH PROFILES MANUALLY
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, fullname, department')
                .in('id', internIds);

            if (profileError) console.error("Profile Error:", profileError);

            // C. FETCH LOGBOOKS MANUALLY
            const { data: logs, error: logError } = await supabase
                .from("logbooks")
                .select("intern_id, status, hours_worked")
                .in("intern_id", internIds);

            if (logError) console.error("Log Error:", logError);

            // D. MERGE DATA
            const processedData = apps.map(app => {
                const profile = profiles?.find(p => p.id === app.intern_id);
                const studentLogs = logs?.filter(l => l.intern_id === app.intern_id) || [];

                const totalHours = studentLogs
                    .filter(log => (log.status || '').toLowerCase() === 'approved')
                    .reduce((sum, log) => sum + (Number(log.hours_worked) || 0), 0);

                const required = Number(app.required_hours) || 600; 
                const progress = Math.min((totalHours / required) * 100, 100);

                return { 
                    ...app, 
                    profiles: {
                        fullname: profile?.fullname || "Unknown", 
                        department: profile?.department || "N/A" 
                    },
                    totalHours, 
                    required, 
                    progress 
                };
            });

            // Sort by hours (highest first)
            setPlacements(processedData.sort((a, b) => b.totalHours - a.totalHours));

        } catch (err) {
            console.error("Error:", err.message); 
            if (!isBackgroundUpdate) toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    // 2. SETUP EFFECT & REALTIME
    useEffect(() => {
        fetchPlacements();

        // Realtime Listener
        const channel = supabase
            .channel('coordinator-monitoring-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'logbooks' },
                (payload) => {
                    console.log('Logbook changed:', payload);
                    fetchPlacements(true); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isActive = (status) => {
        const s = status ? status.toLowerCase() : '';
        return s === 'active_intern' || s === 'ongoing' || s === 'active' || s === 'ongoing';
    }

    return (
        // ✅ 1. Standard Dashboard Inner Container (Layout wrapper handles the rest)
        <div className="dashboard-inner">
            
            {/* Header Section */}
            <div className="header-section">
                <h2 className="dash-title">Internship Monitoring</h2>
                <p className="dash-subtitle">Track active interns and their logged hours.</p>
            </div>

            {loading ? (
                <div className="loading-state">Loading placements data...</div>
            ) : placements.length === 0 ? (
                <div className="card empty-state-card">
                    <p className="empty-state-text">No active placements found.</p>
                </div>
            ) : (
                <div className="placements-list">
                    {placements.map((app) => (
                        <div key={app.id} className={`placement-card ${isActive(app.status) ? 'active-border' : 'waiting-border'}`}>
                            
                            {/* Card Header */}
                            <div className="card-header-row">
                                <h3 className="intern-name">
                                    <FaUserGraduate className="icon-accent-orange" />
                                    {app.profiles.fullname}
                                </h3>
                                {isActive(app.status) ? 
                                    <span className="status-badge badge-active"><span className="dot green"></span> Active</span> : 
                                    <span className="status-badge badge-waiting"><span className="dot orange"></span> Waiting</span>
                                }
                            </div>
                            
                            {/* Info Stack */}
                            <div className="info-stack">
                                <div className="detail-row">
                                    <FaUniversity className="icon-muted" /> 
                                    <span className="label">Dept:</span>
                                    <span className="value">{app.profiles.department}</span>
                                </div>
                                <div className="detail-row">
                                    <FaBuilding className="icon-muted" /> 
                                    <span className="label">Company:</span>
                                    <span className="value">{app.job_posts?.companies?.name || "N/A"}</span>
                                </div>
                                <div className="detail-row">
                                    <FaBriefcase className="icon-muted" /> 
                                    <span className="label">Role:</span>
                                    <span className="value">{app.job_posts?.title || "Intern"}</span>
                                </div>
                            </div>

                            <div className="card-spacer"></div>

                            {/* Progress Bar Section */}
                            {isActive(app.status) || true ? ( // Showing progress for everyone in list
                                <div className="progress-section">
                                    <div className="progress-labels">
                                        <span className="progress-title">Hours Rendered</span>
                                        <span className="progress-numbers">
                                            <strong>{app.totalHours.toFixed(0)}</strong> / {app.required}
                                        </span>
                                    </div>
                                    <div className="progress-track">
                                        <div 
                                            className="progress-fill" 
                                            style={{ 
                                                width: `${app.progress}%`,
                                                transition: 'width 1s ease-out',
                                                backgroundColor: app.progress >= 100 ? 'var(--color-success)' : 'var(--primary-orange)'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="waiting-message">Student hasn't started yet.</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}