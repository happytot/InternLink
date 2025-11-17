'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { finalizeApplicationStatus, updateLogbookStatus } from '../actions'; 
// ✅ IMPORT THE NEW CSS FILE
import './logbook.css'; 

// Helper function to display messages
const showMessage = (setter, text, type = 'success') => {
    setter({ text, type });
    setTimeout(() => setter(null), 5000);
};

export default function CoordinatorLogbookPage() {
    const [applications, setApplications] = useState([]);
    const [logbooks, setLogbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appMessage, setAppMessage] = useState(null);
    const [logMessage, setLogMessage] = useState(null);
    const router = useRouter();

const fetchData = async () => {
        setLoading(true);

        // 1. Fetch Applications (Fix 1: job_posts)
        const { data: appData, error: appError } = await supabase
            .from('job_applications')
            .select(`
                id,
                created_at,
                profiles:intern_id(fullname, email),
                job_posts:job_posts(title), // ✅ FIX 1: Use 'job_posts' table name
                company_profiles:job_posts!inner(company:company_id(fullname)) // ✅ FIX 1 + Fix 2 (name -> fullname)
            `)
            .eq('status', 'company_accepted') 
            .order('created_at', { ascending: true });
        // ...

        // 2. Fetch Logbook Entries (Fix 2: company name)
        const { data: logData, error: logError } = await supabase
            .from('logbooks') 
            .select(`
                id, 
                date, 
                hours_worked, 
                description, 
                status, 
                intern:intern_id(fullname, email),
                company:company_id(fullname) // ✅ FIX 2: Assuming company name is stored in 'fullname' in the profiles table
            `)
            .eq('status', 'submitted') 
            .order('date', { ascending: false });

        if (logError) console.error('Error fetching logbooks:', logError);
        setLogbooks(logData || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- APPLICATION HANDLERS (Unchanged) ---
    const handleApplicationFinalize = async (appId, action) => {
        const newStatus = action === 'approve' ? 'approved_by_coordinator' : 'rejected_by_coordinator';
        showMessage(setAppMessage, `Finalizing application...`, 'loading');
        
        const result = await finalizeApplicationStatus(appId, newStatus);

        if (result.success) {
            fetchData(); 
            showMessage(setAppMessage, result.message, 'success');
        } else {
            showMessage(setAppMessage, `Failed: ${result.error}`, 'error');
        }
    };

    // --- LOGBOOK HANDLERS (Unchanged) ---
    const handleLogbookReview = async (logId, action) => {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'; 
        showMessage(setLogMessage, `Updating logbook status...`, 'loading');
        
        const result = await updateLogbookStatus(logId, newStatus);

        if (result.success) {
            fetchData(); 
            showMessage(setLogMessage, result.message, 'success');
        } else {
            showMessage(setLogMessage, `Failed: ${result.error}`, 'error');
        }
    };

    // Replace CoordinatorLayout placeholder with simple div wrapper using new class
    const CoordinatorLayout = ({ children }) => <div className="review-container">{children}</div>; 

    if (loading) return <CoordinatorLayout>Loading review data...</CoordinatorLayout>;

    return (
        <CoordinatorLayout>
            <h1 className="page-title">Coordinator Review Hub</h1>

            {/* Application Approval Section */}
            <div className="mb-10">
                <h2 className="section-title">
                    📝 Applications Awaiting Final Approval ({applications.length})
                </h2>
                {appMessage && <div className={`message ${appMessage.type}`}>{appMessage.text}</div>}
                
                {applications.length === 0 ? (
                    <p>No applications are waiting for your final approval.</p>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="card-item app-card">
                                <div>
                                    <p className="font-bold">{app.profiles.fullname} ({app.profiles.email})</p>
                                    <p className="text-sm">Job: {app.job_posts.title}</p>
                                    <p className="text-sm">Company: {app.company_profiles[0]?.company.fullname || 'N/A'}</p>
                                    <small className="text-gray-500">Company Accepted: {new Date(app.created_at).toLocaleDateString()}</small>
                                </div>
                                <div className="button-group">
                                    <button 
                                        onClick={() => handleApplicationFinalize(app.id, 'approve')}
                                        className="action-btn btn-approve-app"
                                    >
                                        Final Approve
                                    </button>
                                    <button 
                                        onClick={() => handleApplicationFinalize(app.id, 'reject')}
                                        className="action-btn btn-reject-app"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="separator"></div>

            {/* Logbook Review Section */}
            <div className="mt-8">
                <h2 className="section-title">
                    📚 Logbooks Awaiting Review ({logbooks.length})
                </h2>
                {logMessage && <div className={`message ${logMessage.type}`}>{logMessage.text}</div>}

                {logbooks.length === 0 ? (
                    <p>No log entries are waiting for your review.</p>
                ) : (
                    <div className="space-y-4">
                        {logbooks.map((log) => (
                            <div key={log.id} className="card-item log-card">
                                <p className="font-bold">{log.intern.fullname} ({log.company.name})</p>
                                <p>Date: {new Date(log.date).toLocaleDateString()} | Hours: {log.hours_worked}</p>
                                <p className="text-gray-700 mt-2">Description: {log.description}</p>
                                <div className="button-group mt-3">
                                    <button 
                                        onClick={() => handleLogbookReview(log.id, 'approve')}
                                        className="action-btn btn-approve-log"
                                    >
                                        Approve Log
                                    </button>
                                    <button 
                                        onClick={() => handleLogbookReview(log.id, 'reject')}
                                        className="action-btn btn-reject-log"
                                    >
                                        Request Revision
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CoordinatorLayout>
    );
}