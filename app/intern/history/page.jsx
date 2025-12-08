'use client';

import Link from 'next/link';
import './ApplicationHistory.css'; 
import { useState, useEffect, useCallback } from 'react';
import { getApplicationHistory, startInternship, cancelApplication } from './actions';
import { RefreshCcw, CheckCircle, Clock, XCircle, ChevronRight, Loader2, PlayCircle, Filter, Zap } from 'lucide-react';
import { toast } from 'sonner';
import FloatingAIChatWithCharts from '../../components/chatbot';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ... (Status Helpers remain the same) ...
const formatStatusText = (status) => {
    switch (status) {
        case 'Pending': return 'Pending Review';
        case 'Company_Approved_Waiting_Coordinator': return 'Company Approved (Awaiting Coordinator)';
        case 'approved_by_coordinator': return 'Ready to Start';
        case 'ongoing': return 'Active Internship';
        case 'Accepted': return 'Accepted (Deprecated)';
        case 'Rejected': return 'Application Rejected';
        default: return status;
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case 'Pending':
        case 'Company_Approved_Waiting_Coordinator': return 'pending'; 
        case 'approved_by_coordinator': return 'ready'; 
        case 'ongoing':
        case 'Accepted': return 'ongoing'; 
        case 'Rejected': return 'rejected'; 
        default: return 'pending';
    }
};

export default function ApplicationHistory() {
    const supabase = createClientComponentClient(); 
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All'); 
    const [lastUpdated, setLastUpdated] = useState(Date.now()); 
    const [user, setUser] = useState(null);

    // Fetch logged-in user
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUser(data.user);
        };
        getUser();
    }, [supabase]);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        const result = await getApplicationHistory();

        if (result.success) {
            const sortedData = (result.data || []).sort((a, b) => {
                const order = { 'ongoing': 4, 'approved_by_coordinator': 3, 'Pending': 2, 'Company_Approved_Waiting_Coordinator': 2, 'Rejected': 1 };
                return (order[b.status] || 0) - (order[a.status] || 0);
            });
            setApplications(sortedData);
            setLastUpdated(Date.now()); 
        } else {
            setMessage(result.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleStartInternship = async (appId) => {
        if (!confirm("Are you ready to officially start your OJT hours? This will unlock your logbook.")) return;

        setProcessingId(appId);
        try {
            const result = await startInternship(appId);
            if (result.success) {
                toast.success(result.message); 
                fetchApplications();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelApplication = async (appId) => {
        if (!confirm("Are you sure you want to cancel this application?")) return;

        setProcessingId(appId);
        try {
            const result = await cancelApplication(appId);
            if (result.success) {
                toast.info(result.message);
                setApplications(prev => prev.filter(app => app.id !== appId));
                setLastUpdated(Date.now());
            } else {
                toast.error(result.error);
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredApplications = applications.filter(app => {
        if (filterStatus === 'All') return true;
        const statusMap = {
            'Pending': ['Pending', 'Company_Approved_Waiting_Coordinator'],
            'Ready': ['approved_by_coordinator'],
            'Ongoing': ['ongoing'],
            'Rejected': ['Rejected'],
        };
        return statusMap[filterStatus]?.includes(app.status) || false;
    });

    // --- Components ---
    const ApplicationTable = ({ applications }) => (
        <div className="history-table-wrapper table-view">
            <table>
                <thead>
                    <tr>
                        <th>Internship Title</th>
                        <th>Company</th>
                        <th>Date Applied</th>
                        <th>Updated</th> 
                        <th>Status</th>
                        <th className="action-cell">Action</th> 
                    </tr>
                </thead>
                <tbody>
                    {applications.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="empty-state-cell"> 
                                <Filter size={32} className="text-muted" style={{ marginBottom: '10px' }}/>
                                <p>No applications found matching the {filterStatus} filter.</p>
                                {filterStatus === 'All' && <Link href="/intern/listings" className="link-button">Browse Internships</Link>}
                            </td>
                        </tr>
                    ) : (
                        applications.map(app => (
                            <tr key={app.id}>
                                <td className="job-title-cell">{app.job_posts?.title || 'Unknown Job'}</td>
                                <td className="company-name-cell">{app.companies?.name || 'Unknown Company'}</td>
                                <td>{new Date(app.created_at).toLocaleDateString()}</td>
                                <td>{new Date(app.updated_at || app.created_at).toLocaleDateString()}</td> 
                                <td>
                                    <span className={`status-badge status-${getStatusClass(app.status)}`}>
                                        {formatStatusText(app.status)}
                                    </span>
                                </td>
                                <td>
                                    {app.status === 'approved_by_coordinator' ? (
                                        <button 
                                            onClick={() => handleStartInternship(app.id)}
                                            disabled={processingId === app.id}
                                            className="btn-start-internship"
                                        >
                                            {processingId === app.id ? <Loader2 className="icon-spin" size={16} /> : <PlayCircle size={14} />} Start
                                        </button>
                                    ) : app.status === 'ongoing' ? (
                                        <span className="text-active"><CheckCircle size={14} /> Active</span>
                                    ) : (['Pending', 'Company_Approved_Waiting_Coordinator'].includes(app.status)) ? (
                                        <button
                                            onClick={() => handleCancelApplication(app.id)}
                                            disabled={processingId === app.id}
                                            className="btn-cancel"
                                        >
                                            {processingId === app.id ? <Loader2 className="icon-spin" size={14} /> : <XCircle size={14} />} Cancel
                                        </button>
                                    ) : (
                                        <Link href={`/intern/jobs/${app.job_post_id}`} className="view-link" title="View Details">
                                            <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const ApplicationCards = ({ applications }) => (
        <div className="job-grid card-view">
            {applications.length === 0 ? (
                <div className="empty-state-card">
                    <Filter size={32} className="text-muted" style={{ marginBottom: '10px' }}/>
                    <p>No applications found matching the **'{filterStatus}'** filter.</p>
                </div>
            ) : (
                applications.map(app => (
                    <div key={app.id} className={`job-card status-${getStatusClass(app.status)}`}> 
                        <span className={`status-badge status-${getStatusClass(app.status)} status-mobile`}>
                            {formatStatusText(app.status)}
                        </span>
                        <div className="job-header">
                            <h2>{app.job_posts?.title || 'Unknown Job'}</h2>
                        </div>
                        <p className="company-name">{app.companies?.name || 'Unknown Company'}</p>
                        <p className="date-applied">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                        
                        <div className="card-action-area">
                            {app.status === 'approved_by_coordinator' ? (
                                <button 
                                    onClick={() => handleStartInternship(app.id)}
                                    disabled={processingId === app.id}
                                    className="btn-start-internship full-width"
                                >
                                    Start Internship
                                </button>
                            ) : app.status === 'ongoing' ? (
                                <div className="text-active center-text"><CheckCircle size={14} /> Internship Active</div>
                            ) : (['Pending', 'Company_Approved_Waiting_Coordinator'].includes(app.status)) ? (
                                <button
                                    onClick={() => handleCancelApplication(app.id)}
                                    disabled={processingId === app.id}
                                    className="btn-cancel full-width"
                                >
                                    Cancel
                                </button>
                            ) : (
                                <Link href={`/intern/jobs/${app.job_post_id}`} className="view-link full-width">
                                    View Details <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const totalCount = applications.length;
    const activeCount = applications.filter(a => a.status === 'ongoing').length;
    const readyCount = applications.filter(a => a.status === 'approved_by_coordinator').length;

    // --- Loading State ---
    if (loading) {
        return (
            <div className="history-container loading-state">
                <div className="header-area">
                    <h1><Clock size={28} className="icon-inline"/> Loading History...</h1>
                </div>
                <div className="main-content-area">
                    {/* Simple Skeleton Representation */}
                    <div className="skeleton-cell" style={{ width: '100%', height: '200px', borderRadius: '12px' }}/>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="history-container">
                <div className="main-grid">
                    <div className="main-table-container">
                        
                        {/* Header Area */}
                        <div className="header-area">
                            <div className="title-group">
                                <h1><Clock size={38} /> Application History</h1>
                                <p className="last-updated-time">
                                    Last Updated: {new Date(lastUpdated).toLocaleTimeString()}
                                </p>
                            </div>

                            <div className="summary-card">
                                <div>
                                    <p>Total Applications</p>
                                    <span className="count-large">{totalCount}</span>
                                </div>
                                <hr style={{ borderColor: 'var(--border-color)', margin: '15px 0' }} />
                                <div>
                                    <p>Ready to Start</p>
                                    <span className="count-large" style={{ color: 'var(--secondary-cyan)' }}>{readyCount}</span>
                                </div>
                                <hr style={{ borderColor: 'var(--border-color)', margin: '15px 0' }} />
                                {activeCount > 0 ? (
                                    <div className="active-indicator">
                                        <CheckCircle size={20} />
                                        {activeCount} Internship{activeCount > 1 ? 's' : ''} Active
                                    </div>
                                ) : (
                                    <div className="active-indicator" style={{ color: 'var(--primary-orange)' }}>
                                        <Zap size={20} /> Time to Start!
                                    </div>
                                )}
                            </div>
                        </div>

                        {message && <p className="history-summary error-message">{message}</p>}

                        {/* Filters */}
                        <div className="filter-controls-container">
                            <div className="filter-buttons">
                                {['All', 'Pending', 'Ready', 'Ongoing', 'Rejected'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`btn-filter ${filterStatus === status ? 'active' : ''}`}
                                    >
                                        {status}
                                        {status === 'All' && totalCount > 0 && (
                                            <span className="filter-badge">{totalCount}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <ApplicationTable applications={filteredApplications} />
                        <ApplicationCards applications={filteredApplications} />
                    </div>
                </div>
            </div>
            
            {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
        </>
    );
}