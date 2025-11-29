'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import CoordinatorSidebar from '../../components/CoordinatorSidebar'; 
import { toast, Toaster } from 'sonner';
import { FaUserGraduate, FaBuilding, FaBriefcase, FaUniversity } from 'react-icons/fa';
import './internships.css'; 

export default function CoordinatorPlacements() {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. EXTRACT FETCH LOGIC
    // We extracted this so it can be called by both useEffect and Realtime
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

            // Sort
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
        // Initial Load
        fetchPlacements();

        // Realtime Listener
        console.log("🟢 Listening for hours updates...");
        const channel = supabase
            .channel('coordinator-monitoring-realtime')
            .on(
                'postgres_changes',
                // Listen for UPDATES (Approvals) or INSERTS (New Logs) on logbooks
                { event: '*', schema: 'public', table: 'logbooks' },
                (payload) => {
                    console.log('Logbook changed:', payload);
                    // Reload data silently (true = background update, no loading spinner)
                    fetchPlacements(true); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const isActive = (status) => {
        const s = status ? status.toLowerCase() : '';
        return s === 'active_intern' || s === 'ongoing' || s === 'active';
    }

    return (
        <div className="coordinator-page">
            <CoordinatorSidebar />
            <Toaster richColors position="top-right" />
            <div className="placements-content">
                <div className="header-section">
                    <h2 className="page-title">Internship Monitoring</h2>
                    <p className="page-subtitle">Track active interns' hours.</p>
                </div>

                {loading ? (
                    <div className="loading-state">Loading data...</div>
                ) : placements.length === 0 ? (
                    <div className="card empty-state-card">
                        <p className="empty-state-text">No active placements found.</p>
                    </div>
                ) : (
                    <div className="placements-list">
                        {placements.map((app) => (
                            <div key={app.id} className={`placement-card ${isActive(app.status) ? 'active-border' : 'waiting-border'}`}>
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

                                {isActive(app.status) ? (
                                    <div className="progress-section">
                                        <div className="progress-labels">
                                            <span className="progress-title">Hours Rendered</span>
                                            <span className="progress-numbers">
                                                <strong>{app.totalHours.toFixed(0)}</strong> / {app.required}
                                            </span>
                                        </div>
                                        <div className="progress-track">
                                            {/* Added smooth transition for the bar */}
                                            <div 
                                                className="progress-fill" 
                                                style={{ 
                                                    width: `${app.progress}%`,
                                                    transition: 'width 1s ease-out' 
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
        </div>
    );
}