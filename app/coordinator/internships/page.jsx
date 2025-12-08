'use client';

import { useEffect, useState, useMemo } from 'react'; // Added useMemo
// 1. UPDATED IMPORT: Use the auth helper instead of the static client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast, Toaster } from 'sonner';
import { FaUserGraduate, FaBuilding, FaBriefcase, FaUniversity } from 'react-icons/fa';
import { Search, ArrowDownUp } from 'lucide-react'; // Added Search and ArrowDownUp for icons
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
    
    // NEW STATE FOR SEARCH AND SORT
    const [searchQuery, setSearchQuery] = useState('');
    // Default sort is by totalHours, descending (highest first)
    const [sortCriteria, setSortCriteria] = useState({ key: 'totalHours', direction: 'descending' });

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

            // Set the placements (sorting will be handled by useMemo)
            setPlacements(processedData);

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
        return s === 'active_intern' || s === 'ongoing';
    }

    const handleSortChange = (e) => {
        const [key, direction] = e.target.value.split(':');
        setSortCriteria({ key, direction });
    };

    // 3. FILTERING AND SORTING LOGIC using useMemo
    const sortedAndFilteredPlacements = useMemo(() => {
        const query = searchQuery.toLowerCase();
        
        // 1. Filter
        const filtered = placements.filter(app => 
            app.profiles.fullname.toLowerCase().includes(query) ||
            app.profiles.department.toLowerCase().includes(query) ||
            app.job_posts?.title?.toLowerCase().includes(query) ||
            app.job_posts?.companies?.name?.toLowerCase().includes(query)
        );

        // 2. Sort
        return filtered.sort((a, b) => {
            let aVal, bVal;
            const { key, direction } = sortCriteria;

            if (key === 'totalHours') {
                aVal = a.totalHours;
                bVal = b.totalHours;
            } else if (key === 'name') {
                aVal = a.profiles.fullname.toLowerCase();
                bVal = b.profiles.fullname.toLowerCase();
            } else if (key === 'company') {
                aVal = a.job_posts?.companies?.name?.toLowerCase() || '';
                bVal = b.job_posts?.companies?.name?.toLowerCase() || '';
            } else {
                return 0; // No valid key
            }

            // Comparison
            if (aVal < bVal) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (aVal > bVal) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

    }, [placements, searchQuery, sortCriteria]);

    return (
        <div className="dashboard-inner">
            <Toaster position="bottom-right" />
            
            {/* Header Section */}
            <div className="header-section">
                <h2 className="dash-title">Internship Monitoring</h2>
                <p className="dash-subtitle">Track active interns and their logged hours.</p>

                {/* Search and Sort Bar */}
                <div className="control-bar">
                    <div className="search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by student, company, or role..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="sort-container">
                        <ArrowDownUp size={16} className="sort-icon" />
                        <select 
                            className="sort-select" 
                            onChange={handleSortChange} 
                            value={`${sortCriteria.key}:${sortCriteria.direction}`}
                        >
                            <option disabled>SORT BY:</option>
                            <option value="totalHours:descending">Hours Rendered (Highest)</option>
                            <option value="totalHours:ascending">Hours Rendered (Lowest)</option>
                            <option value="name:ascending">Student Name (A-Z)</option>
                            <option value="name:descending">Student Name (Z-A)</option>
                            <option value="company:ascending">Company Name (A-Z)</option>
                            <option value="company:descending">Company Name (Z-A)</option>
                        </select>
                    </div>
                </div>

            </div>

            {loading ? (
                <div className="loading-state">Loading placements data...</div>
            ) : sortedAndFilteredPlacements.length === 0 ? (
                <div className="card empty-state-card">
                    <p className="empty-state-text">
                        No active placements found or match your search criteria.
                    </p>
                </div>
            ) : (
                <div className="placements-list">
                    {sortedAndFilteredPlacements.map((app) => (
                        <div key={app.id} className={`placement-card ${isActive(app.status) ? 'active-border' : 'waiting-border'}`}>
                            
                            {/* Card Header */}
                            <div className="card-header-row">
                                <h3 className="intern-name">
                                    <FaUserGraduate className="icon-accent-orange" />
                                    {app.profiles.fullname}
                                </h3>
                                {isActive(app.status) ? 
                                    <span className="status-badge badge-active"><span className="dot green"></span> Active</span> : 
                                    <span className="status-badge badge-waiting"><span className="dot orange"></span> Ongoing</span>
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}