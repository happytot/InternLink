'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { getCompanyLogbookEntries, approveLogEntry, updateRequiredHours, submitEvaluation } from './actions';
import { toast, Toaster } from 'sonner';
import styles from './CompanyLogbook.module.css';

export default function CompanyLogbookPage() {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [showEvalModal, setShowEvalModal] = useState(false);
    
    // Track which logs are currently loading
    const [approvingLogs, setApprovingLogs] = useState(new Set());

    useEffect(() => {
        loadData();

        // REALTIME LISTENER
        const channel = supabase
            .channel('company-logbook-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'logbooks' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        toast.info("New logbook entry received!");
                    }
                    // When data changes, reload everything
                    loadData(true); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedIntern]); // Add selectedIntern dependency so we can refresh the modal if open

    // Modified loadData to handle modal refreshing
    async function loadData(isRealtime = false) {
        const result = await getCompanyLogbookEntries();
        if (result.success) {
            const processedInterns = groupLogsByIntern(result.logs || []);
            setInterns(processedInterns);

            // 🟢 CRITICAL FIX: If the modal is open, refresh its data too!
            // This ensures if a student adds a log while you are looking at their modal, it pops up.
            if (isRealtime && selectedIntern) {
                const currentOpenIntern = processedInterns.find(i => i.id === selectedIntern.id);
                if (currentOpenIntern) {
                    setSelectedIntern(currentOpenIntern);
                }
            }
        }
        setLoading(false);
    }

    const groupLogsByIntern = (logs) => {
        const groups = {};
        logs.forEach(log => {
            const internId = log.intern_id;
            const app = log.job_applications || {};
            
            if (!groups[internId]) {
                groups[internId] = {
                    id: internId,
                    applicationId: app.id, 
                    profile: log.profiles,
                    jobTitle: app.job_posts?.title || 'Intern',
                    requiredHours: Number(app.required_hours) || 486, 
                    isEvaluated: app.supervisor_evaluations?.length > 0, 
                    logs: [],
                    totalHours: 0,
                    pendingCount: 0
                };
            }
            groups[internId].logs.push(log);
            
            const status = (log.status || '').toLowerCase(); 
            
            if (status === 'approved') {
                const hours = parseFloat(log.hours_worked) || 0;
                groups[internId].totalHours += hours;
            }
            
            if (status === 'pending' || status === 'submitted') {
                groups[internId].pendingCount += 1;
            }
        });
        return Object.values(groups);
    };

    const handleGoalChange = async (e, intern) => {
        const newGoal = parseInt(e.target.value);
        if (!newGoal || newGoal < 1) return;

        const updatedInterns = interns.map(i => i.id === intern.id ? { ...i, requiredHours: newGoal } : i);
        setInterns(updatedInterns);

        await updateRequiredHours(intern.applicationId, newGoal);
        toast.success(`Goal updated to ${newGoal} hours`);
    };

    const handleEvaluationSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await submitEvaluation(formData);
        if (result.success) {
            toast.success("Evaluation Submitted!");
            setShowEvalModal(false);
            loadData(); 
        } else {
            toast.error(result.error);
        }
    };

    const handleApprove = async (logId, internId) => {
        // 1. Disable button instantly
        setApprovingLogs(prev => new Set(prev).add(logId));

        // 🟢 2. OPTIMISTIC UPDATE: Update the MODAL immediately (The Fix)
        // This makes the button turn into text instantly without closing the modal
        if (selectedIntern && selectedIntern.id === internId) {
            setSelectedIntern(prev => {
                const updatedLogs = prev.logs.map(log => 
                    log.id === logId ? { ...log, status: 'Approved' } : log
                );
                // Also update the total hours inside the modal view if you display them there
                let newTotal = 0;
                updatedLogs.forEach(l => {
                    if ((l.status||'').toLowerCase() === 'approved') newTotal += (parseFloat(l.hours_worked) || 0);
                });
                return { ...prev, logs: updatedLogs, totalHours: newTotal };
            });
        }

        // 3. OPTIMISTIC UPDATE: Update the Main List in background
        setInterns(prev => {
            return prev.map(intern => {
                if (intern.id === internId) {
                    const updatedLogs = intern.logs.map(log => 
                        log.id === logId ? { ...log, status: 'Approved' } : log
                    );
                    let newTotal = 0;
                    updatedLogs.forEach(l => {
                        if ((l.status||'').toLowerCase() === 'approved') {
                            newTotal += (parseFloat(l.hours_worked) || 0);
                        }
                    });
                    return { ...intern, logs: updatedLogs, totalHours: newTotal };
                }
                return intern;
            });
        });

        // 4. Send to Server
        const result = await approveLogEntry(logId);
        
        // 5. Re-enable button (though it will now be hidden due to status change)
        setApprovingLogs(prev => {
            const next = new Set(prev);
            next.delete(logId);
            return next;
        });

        if (result.success) {
            toast.success("Approved!");
        } else {
            toast.error("Failed to approve");
            loadData(); // Revert on error
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <Toaster richColors position="top-right" />
            <div className={styles.header}>
                <h1 className={styles.title}>Intern Management</h1>
            </div>

            <div className={styles.internGrid}>
                {interns.map((intern) => {
                    const percent = Math.min((intern.totalHours / intern.requiredHours) * 100, 100);
                    const isCompleted = percent >= 100;

                    return (
                        <div key={intern.id} className={styles.internCard}>
                            <div className={styles.avatarName} onClick={() => setSelectedIntern(intern)}>
                                <div className={styles.avatar}>{intern.profile?.fullname?.[0]}</div>
                                <div className={styles.nameInfo}>
                                    <h3>{intern.profile?.fullname}</h3>
                                    <p className={styles.jobTitle}>{intern.jobTitle}</p>
                                </div>
                                {intern.pendingCount > 0 && (
                                    <div className={styles.pendingIndicator} title={`${intern.pendingCount} Pending Logs`}></div>
                                )}
                            </div>

                            <div className={styles.progressSection}>
                                <div className={styles.progressLabels}>
                                    <span className={styles.progressLabel}>Progress</span>
                                    <div className={styles.goalContainer}>
                                        <span className={styles.progressValues}>{intern.totalHours.toFixed(1)} / </span>
                                        <input 
                                            className={styles.goalInput}
                                            defaultValue={intern.requiredHours}
                                            onBlur={(e) => handleGoalChange(e, intern)}
                                        />
                                    </div>
                                </div>
                                <div className={styles.progressBarContainer}>
                                    <div className={styles.progressBarFill} style={{ width: `${percent}%` }}></div>
                                </div>

                                {intern.isEvaluated ? (
                                    <button className={`${styles.evaluateBtn} ${styles.completed}`} disabled>
                                        ✅ Evaluation Complete
                                    </button>
                                ) : (
                                    <button 
                                        className={`${styles.evaluateBtn} ${isCompleted ? styles.unlocked : styles.locked}`}
                                        disabled={!isCompleted}
                                        onClick={() => { setSelectedIntern(intern); setShowEvalModal(true); }}
                                    >
                                        {isCompleted ? "⭐ Evaluate Intern" : `Locked (Need ${(intern.requiredHours - intern.totalHours).toFixed(1)} more hrs)`}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- DETAILS MODAL --- */}
            {selectedIntern && !showEvalModal && (
                <div className={styles.modalOverlay} onClick={() => setSelectedIntern(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Logbook: {selectedIntern.profile?.fullname}</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedIntern(null)}>&times;</button>
                        </div>
                        <div className={styles.modalBody}>
                            <table className={styles.logTable}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Attendance</th>
                                        <th>Task Log</th>
                                        <th>Hours</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedIntern.logs.map(log => (
                                        <tr key={log.id}>
                                            <td>{new Date(log.date).toLocaleDateString()}</td>
                                            <td><span className={styles.statusBadge}>{log.attendance_status}</span></td>
                                            <td style={{maxWidth: '250px'}}>{log.tasks_completed}</td>
                                            <td><strong>{log.hours_worked}</strong></td>
                                            <td>
                                                {/* Button Logic: Disappears instantly when status changes in State */}
                                                {(log.status||'').toLowerCase() === 'approved' ? (
                                                    <span style={{color:'green', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                                        ✓ Approved
                                                    </span>
                                                ) : (
                                                    <button 
                                                        className={styles.approveBtn} 
                                                        disabled={approvingLogs.has(log.id)}
                                                        style={{
                                                            opacity: approvingLogs.has(log.id) ? 0.5 : 1,
                                                            cursor: approvingLogs.has(log.id) ? 'not-allowed' : 'pointer'
                                                        }}
                                                        onClick={() => handleApprove(log.id, selectedIntern.id)}
                                                    >
                                                        {approvingLogs.has(log.id) ? "Saving..." : "Approve"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EVALUATION MODAL --- */}
            {showEvalModal && selectedIntern && (
                <div className={styles.modalOverlay} onClick={() => setShowEvalModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Final Evaluation</h2>
                            <button className={styles.closeBtn} onClick={() => setShowEvalModal(false)}>&times;</button>
                        </div>
                        <form className={styles.evalForm} onSubmit={handleEvaluationSubmit}>
                            <input type="hidden" name="applicationId" value={selectedIntern.applicationId} />
                            {['Quality of Work', 'Productivity', 'Reliability', 'Teamwork'].map((criteria, i) => (
                                <div key={i} className={styles.evalGroup}>
                                    <label>{criteria} (1-5)</label>
                                    <input type="range" min="1" max="5" defaultValue="3" name={criteria.toLowerCase().split(' ')[0]} className={styles.rangeInput} />
                                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#888'}}>
                                        <span>Poor</span><span>Excellent</span>
                                    </div>
                                </div>
                            ))}
                            <div className={styles.evalGroup}>
                                <label>Final Comments</label>
                                <textarea name="comments" className={styles.commentBox} required placeholder="Comments..."></textarea>
                            </div>
                            <button type="submit" className={styles.approveBtn} style={{width:'100%'}}>Submit Final Grade</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}