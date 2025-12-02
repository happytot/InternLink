'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { getCompanyLogbookEntries, approveLogEntry, updateRequiredHours, submitWeeklyEvaluation } from './actions';
import { toast } from 'sonner';
import styles from './CompanyLogbook.module.css';
import '../../globals.css';

import { 
    BookOpen, CheckCircle2, FileText, Lock, Star, X, PenSquare, 
    FileCheck, Clock, AlertCircle
} from 'lucide-react';

export default function CompanyLogbookPage() {
    const [loading, setLoading] = useState(true); 
    const [interns, setInterns] = useState([]);
    const [selectedIntern, setSelectedIntern] = useState(null);
    
    // Modals
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    
    // Data
    const [evaluatingWeek, setEvaluatingWeek] = useState(null);
    const [approvingLogs, setApprovingLogs] = useState(new Set());

    // 1. ✅ Main Data Fetcher (Runs once on mount + Realtime)
    useEffect(() => {
        loadData(true); // Pass true to show skeleton on first load

        const channel = supabase
            .channel('company-logbook-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logbooks' }, () => {
                loadData(false); // Pass false to update in background (no skeleton)
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []); // 👈 Empty array: Only runs on mount

    // 2. ✅ Sync Selected Intern Data (Runs when data updates, but NO SKELETON)
    // This ensures if you are looking at a modal and data changes, the modal updates live.
    useEffect(() => {
        if (selectedIntern) {
            const updatedIntern = interns.find(i => i.id === selectedIntern.id);
            if (updatedIntern) {
                // Only update if data actually changed to prevent loops
                if (JSON.stringify(updatedIntern) !== JSON.stringify(selectedIntern)) {
                    setSelectedIntern(updatedIntern);
                }
            }
        }
    }, [interns]); 

    async function loadData(showSkeleton = false) {
        if (showSkeleton) setLoading(true);
        
        try {
            const result = await getCompanyLogbookEntries();
            if (result.success) {
                const processedInterns = groupLogsByIntern(result.logs || []);
                setInterns(processedInterns);
            }
        } catch (error) {
            console.error("Error loading logbooks:", error);
            toast.error("Failed to load logbooks");
        } finally {
            if (showSkeleton) setLoading(false);
        }
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
                    weeklyEvaluations: app.weekly_evaluations || [],
                    logs: [],
                    totalHours: 0,
                    pendingCount: 0
                };
            }
            groups[internId].logs.push(log);
            
            const status = (log.status || '').toLowerCase(); 
            if (status === 'approved') {
                groups[internId].totalHours += (parseFloat(log.hours_worked) || 0);
            }
            if (status === 'pending' || status === 'submitted') {
                groups[internId].pendingCount += 1;
            }
        });
        return Object.values(groups);
    };

    const getInternWeeks = (intern) => {
        if (!intern || !intern.logs) return [];
        const evaluations = intern.weeklyEvaluations || [];
        const sortedLogs = [...intern.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const weeks = {};

        sortedLogs.forEach(log => {
            const date = new Date(log.date);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(date.setDate(diff));
            monday.setHours(0,0,0,0);
            const key = monday.toISOString();

            if (!weeks[key]) {
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const existingEval = evaluations.find(e => 
                    new Date(e.week_start_date).getTime() === monday.getTime()
                );

                weeks[key] = {
                    startDate: monday,
                    endDate: sunday,
                    logs: [],
                    totalHours: 0,
                    evaluation: existingEval || null
                };
            }
            weeks[key].logs.push(log);
            if(log.status === 'Approved') weeks[key].totalHours += (parseFloat(log.hours_worked) || 0);
        });

        return Object.values(weeks).sort((a, b) => b.startDate - a.startDate);
    };

    const handleGoalChange = async (e, intern) => {
        const newGoal = parseInt(e.target.value);
        if (!newGoal || newGoal < 1) return;
        setInterns(interns.map(i => i.id === intern.id ? { ...i, requiredHours: newGoal } : i));
        await updateRequiredHours(intern.applicationId, newGoal);
        toast.success(`Goal updated to ${newGoal} hours`);
    };

    const handleEvaluationSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await submitWeeklyEvaluation(formData);
        if (result.success) {
            toast.success("Weekly Evaluation Submitted!");
            setShowEvalModal(false);
            setEvaluatingWeek(null);
            loadData(false); // Refresh without skeleton
        } else {
            toast.error(result.error);
        }
    };

    const handleApprove = async (logId, internId) => {
        setApprovingLogs(prev => new Set(prev).add(logId));
        
        // Optimistic Update
        setInterns(prev => {
            return prev.map(intern => {
                if (intern.id === internId) {
                    const updatedLogs = intern.logs.map(log => log.id === logId ? { ...log, status: 'Approved' } : log);
                    let newTotal = 0;
                    updatedLogs.forEach(l => { if ((l.status||'').toLowerCase() === 'approved') newTotal += (parseFloat(l.hours_worked) || 0); });
                    return { ...intern, logs: updatedLogs, totalHours: newTotal };
                }
                return intern;
            });
        });

        const result = await approveLogEntry(logId);
        setApprovingLogs(prev => { const next = new Set(prev); next.delete(logId); return next; });
        
        if (result.success) toast.success("Approved!");
        else { toast.error("Failed to approve"); loadData(false); }
    };

    const getPerformanceSummary = (intern) => {
        if(!intern || !intern.weeklyEvaluations || intern.weeklyEvaluations.length === 0) return null;
        const evals = intern.weeklyEvaluations;
        const totalEvals = evals.length;
        const avg = (key) => (evals.reduce((sum, e) => sum + e[key], 0) / totalEvals).toFixed(1);
        
        return {
            quality: avg('quality_rating'),
            productivity: avg('productivity_rating'),
            reliability: avg('reliability_rating'),
            teamwork: avg('teamwork_rating'),
            finalScore: ((evals.reduce((sum, e) => sum + e.quality_rating + e.productivity_rating + e.reliability_rating + e.teamwork_rating, 0) / (totalEvals * 4))).toFixed(1),
            comments: evals.map(e => ({ date: e.week_start_date, text: e.comments })).filter(c => c.text)
        };
    };

    // 🦴 SKELETON LOADING STATE (Only on Initial Load)
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={`${styles.bentoHeader} ${styles.skeletonPulse}`} style={{height: '100px', marginBottom: '30px'}}></div>
                <div className={styles.internGrid}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`${styles.internCard} ${styles.skeletonPulse}`} style={{height: '300px'}}>
                            <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
                                <div className={styles.skeletonBox} style={{width:56, height:56, borderRadius:'50%'}}></div>
                                <div style={{flex:1}}>
                                    <div className={styles.skeletonBox} style={{width:'60%', height:20, marginBottom:8}}></div>
                                    <div className={styles.skeletonBox} style={{width:'40%', height:14}}></div>
                                </div>
                            </div>
                            <div className={styles.skeletonBox} style={{width:'100%', height:12, marginBottom:30}}></div>
                            <div className={styles.skeletonBox} style={{width:'100%', height:40}}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const weeksData = selectedIntern ? getInternWeeks(selectedIntern) : [];
    const performanceData = selectedIntern ? getPerformanceSummary(selectedIntern) : null;

    return (
        <div className={styles.container}>
            <div className={styles.bentoHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIconBox}>
                        <BookOpen size={24} strokeWidth={2.5} />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>Intern Logbooks</h1>
                        <p>Track progress, hours, and weekly performance.</p>
                    </div>
                </div>
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
                                {intern.pendingCount > 0 && <div className={styles.pendingIndicator}></div>}
                            </div>

                            <div className={styles.progressSection}>
                                <div className={styles.progressLabels}>
                                    <span className={styles.progressLabel}>Progress</span>
                                    <div className={styles.goalContainer}>
                                        <span className={styles.progressValues}>{intern.totalHours.toFixed(1)} / </span>
                                        <input className={styles.goalInput} defaultValue={intern.requiredHours} onBlur={(e) => handleGoalChange(e, intern)} />
                                    </div>
                                </div>
                                <div className={styles.progressBarContainer}>
                                    <div className={styles.progressBarFill} style={{ width: `${percent}%` }}></div>
                                </div>

                                {isCompleted ? (
                                    <button 
                                        className={`${styles.evaluateBtn} ${styles.unlocked}`}
                                        onClick={() => { setSelectedIntern(intern); setShowSummaryModal(true); }}
                                    >
                                        <FileCheck size={18} /> View Automated Report
                                    </button>
                                ) : (
                                    <button 
                                        className={styles.evaluateBtn} 
                                        onClick={() => setSelectedIntern(intern)}
                                    >
                                        <BookOpen size={18} /> View Logbook & Weeks
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- DETAILS MODAL (WEEKLY VIEW) --- */}
            {selectedIntern && !showEvalModal && !showSummaryModal && (
                <div className={styles.modalOverlay} onClick={() => setSelectedIntern(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <BookOpen size={24} className="text-muted" />
                                <h2 className={styles.modalTitle}>Weekly Logbook: {selectedIntern.profile?.fullname}</h2>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setSelectedIntern(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {weeksData.length === 0 ? (
                                <div style={{padding:40, textAlign:'center', color:'#888', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
                                    <AlertCircle size={40} />
                                    <p>No log entries found for this intern yet.</p>
                                </div>
                            ) : (
                                weeksData.map((week, idx) => (
                                    <div key={idx} className={styles.weekContainer}>
                                        <div className={styles.weekHeader}>
                                            <div className={styles.weekTitle}>
                                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                                    <Clock size={16} color="var(--primary-orange)" />
                                                    Week of {week.startDate.toLocaleDateString()}
                                                </div>
                                                <span className={styles.weekHours}>
                                                    {week.startDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {week.endDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})} • {week.totalHours.toFixed(1)} Hrs
                                                </span>
                                            </div>
                                            
                                            {week.evaluation ? (
                                                <div className={styles.weekScoreBadge} style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                                   <Star size={14} fill="var(--primary-orange)" /> 
                                                   Avg: {((week.evaluation.quality_rating + week.evaluation.productivity_rating + week.evaluation.reliability_rating + week.evaluation.teamwork_rating)/4).toFixed(1)}/5
                                                </div>
                                            ) : (
                                                <button 
                                                    className={styles.approveBtn} 
                                                    style={{backgroundColor: 'var(--primary-orange)', display:'flex', alignItems:'center', gap:'6px'}}
                                                    onClick={() => { setEvaluatingWeek(week); setShowEvalModal(true); }}
                                                >
                                                    <PenSquare size={14} /> Evaluate Week
                                                </button>
                                            )}
                                        </div>

                                        <table className={styles.logTable}>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Task</th>
                                                    <th>Hrs</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {week.logs.map(log => (
                                                    <tr key={log.id}>
                                                        <td>{new Date(log.date).toLocaleDateString('en-US', {weekday:'short', month:'numeric', day:'numeric'})}</td>
                                                        <td style={{maxWidth:'300px'}}>{log.tasks_completed}</td>
                                                        <td>{log.hours_worked}</td>
                                                        <td>
                                                            {(log.status||'').toLowerCase() === 'approved' ? (
                                                                <span style={{color:'var(--color-success)', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}>
                                                                    <CheckCircle2 size={16} /> Approved
                                                                </span>
                                                            ) : (
                                                                <button 
                                                                    className={styles.approveBtn} 
                                                                    disabled={approvingLogs.has(log.id)}
                                                                    onClick={() => handleApprove(log.id, selectedIntern.id)}
                                                                >
                                                                    {approvingLogs.has(log.id) ? "..." : "Approve"}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- WEEKLY EVALUATION FORM --- */}
            {showEvalModal && evaluatingWeek && selectedIntern && (
                <div className={styles.modalOverlay} onClick={() => setShowEvalModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Evaluate Week</h2>
                            <button className={styles.closeBtn} onClick={() => setShowEvalModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{padding:'0 24px', marginBottom:'20px'}}>
                            <p style={{fontSize:'0.9rem', color:'var(--text-muted)', margin:0, display:'flex', alignItems:'center', gap:'8px'}}>
                                <Clock size={14} />
                                {evaluatingWeek.startDate.toLocaleDateString()} — {evaluatingWeek.endDate.toLocaleDateString()}
                            </p>
                        </div>
                        <form className={styles.evalForm} onSubmit={handleEvaluationSubmit}>
                            <input type="hidden" name="applicationId" value={selectedIntern.applicationId} />
                            <input type="hidden" name="weekStartDate" value={evaluatingWeek.startDate.toISOString()} />
                            <input type="hidden" name="weekEndDate" value={evaluatingWeek.endDate.toISOString()} />
                            
                            {['Quality of Work', 'Productivity', 'Reliability', 'Teamwork'].map((criteria, i) => (
                                <div key={i} className={styles.evalGroup}>
                                    <label>{criteria}</label>
                                    <input type="range" min="1" max="5" defaultValue="3" name={criteria.toLowerCase().split(' ')[0]} className={styles.rangeInput} />
                                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#888'}}><span>Poor</span><span>Excellent</span></div>
                                </div>
                            ))}
                            <div className={styles.evalGroup}>
                                <label>Weekly Comments</label>
                                <textarea name="comments" className={styles.commentBox} placeholder="How did they do this week?"></textarea>
                            </div>
                            <button type="submit" className={styles.approveBtn} style={{width:'100%'}}>Submit Weekly Evaluation</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- AUTOMATED SUMMARY MODAL --- */}
            {showSummaryModal && performanceData && (
                <div className={styles.modalOverlay} onClick={() => setShowSummaryModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
                        <div className={styles.modalHeader} style={{background: 'linear-gradient(135deg, #1e293b, #0f172a)'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                <FileText size={24} color="white" />
                                <div>
                                    <h2 className={styles.modalTitle} style={{color:'white'}}>Performance Summary</h2>
                                    <p style={{color:'#94a3b8', fontSize:'0.9rem', margin:0}}>Automated report based on weekly data</p>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setShowSummaryModal(false)} style={{color:'white'}}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{padding:'30px'}}>
                            <div style={{textAlign:'center', marginBottom:'30px'}}>
                                <div style={{fontSize:'3rem', fontWeight:'800', color:'var(--primary-orange)'}}>{performanceData.finalScore}</div>
                                <div style={{textTransform:'uppercase', letterSpacing:'1px', fontSize:'0.8rem', color:'#888', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                                    <Star size={14} fill="currentColor" /> Overall Rating / 5.0
                                </div>
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'30px'}}>
                                <div className={styles.statBox}><span>Quality</span> <strong>{performanceData.quality}</strong></div>
                                <div className={styles.statBox}><span>Productivity</span> <strong>{performanceData.productivity}</strong></div>
                                <div className={styles.statBox}><span>Reliability</span> <strong>{performanceData.reliability}</strong></div>
                                <div className={styles.statBox}><span>Teamwork</span> <strong>{performanceData.teamwork}</strong></div>
                            </div>
                            <h3 style={{fontSize:'1rem', marginBottom:'15px', display:'flex', alignItems:'center', gap:'8px'}}>
                                <FileText size={16} /> Weekly Remarks
                            </h3>
                            <div className={styles.commentsList}>
                                {performanceData.comments.map((c, i) => (
                                    <div key={i} style={{marginBottom:'10px', paddingBottom:'10px', borderBottom:'1px dashed #333'}}>
                                        <div style={{fontSize:'0.75rem', color:'var(--primary-orange)', marginBottom:'4px', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <Clock size={12} /> {new Date(c.date).toLocaleDateString()}
                                        </div>
                                        <div style={{fontStyle:'italic', color:'#ccc'}}>"{c.text}"</div>
                                    </div>
                                ))}
                            </div>
                            <button className={`${styles.evaluateBtn} ${styles.completed}`} style={{marginTop:'20px'}}>
                                <CheckCircle2 size={18} /> Evaluation Finalized
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}