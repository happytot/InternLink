'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import styles from './Logbook.module.css';
import { 
  BarChart2, Star, Zap, Award, Users, TrendingUp 
} from 'lucide-react';

export default function WeeklyEvaluations() {
  const supabase = createClientComponentClient(); // Move inside component
  const [weeklyEvaluations, setWeeklyEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyEvaluations = async () => {
      setIsLoading(true);
      
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
          setIsLoading(false);
          return;
      }

      // 2. Get the User's Application ID(s) first
      // We need to know WHICH application these evaluations belong to.
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('id')
        .eq('intern_id', user.id);

      if (appError || !applications || applications.length === 0) {
          console.log("No application found for user.");
          setIsLoading(false);
          return;
      }

      // Extract IDs (in case intern has multiple applications, though usually 1 active)
      const applicationIds = applications.map(app => app.id);

      // 3. Fetch Evaluations ONLY for this Intern's Application(s)
      const { data, error } = await supabase
        .from('weekly_evaluations')
        .select(`
          id,
          week_start_date,
          week_end_date,
          quality_rating,
          productivity_rating,
          reliability_rating,
          teamwork_rating,
          comments
        `)
        .in('application_id', applicationIds) // ✅ FIXED: Filter by Application ID
        .order('week_start_date', { ascending: false });

      if (error) {
        toast.error("Failed to fetch weekly evaluations.");
        console.error(error);
      } else {
        setWeeklyEvaluations(data || []);
      }

      setIsLoading(false);
    };

    fetchWeeklyEvaluations();
  }, []);

  // --- Calculate Performance Summary ---
  const summary = useMemo(() => {
    if (!weeklyEvaluations.length) return null;

    const total = weeklyEvaluations.length;
    const sum = (key) => weeklyEvaluations.reduce((acc, curr) => acc + (curr[key] || 0), 0);

    const quality = (sum('quality_rating') / total).toFixed(1);
    const productivity = (sum('productivity_rating') / total).toFixed(1);
    const reliability = (sum('reliability_rating') / total).toFixed(1);
    const teamwork = (sum('teamwork_rating') / total).toFixed(1);

    // Overall Average
    const overall = (
      (parseFloat(quality) + parseFloat(productivity) + parseFloat(reliability) + parseFloat(teamwork)) / 4
    ).toFixed(1);

    return { quality, productivity, reliability, teamwork, overall, total };
  }, [weeklyEvaluations]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (weeklyEvaluations.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      
      <h2 className={styles.listHeader}>
        <BarChart2 size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--primary-orange)' }} />
        Performance Summary
      </h2>

      {/* --- SINGLE COMPACT BENTO CARD --- */}
      {summary && (
        <div className={styles.performanceBoard}>
            
            {/* Left: Overall Score */}
            <div className={styles.boardLeft}>
                <div className={styles.overallScoreCircle}>
                    <span className={styles.bigScore}>{summary.overall}</span>
                    <span className={styles.smallScore}>/ 5.0</span>
                </div>
                <div className={styles.boardInfo}>
                    <h3>Overall Rating</h3>
                    <p>
                       <TrendingUp size={14} style={{display:'inline', marginRight:'4px'}}/>
                       Based on {summary.total} week{summary.total > 1 ? 's' : ''} of data
                    </p>
                </div>
            </div>

            {/* Right: Metrics Grid (Compact) */}
            <div className={styles.boardRight}>
                <div className={styles.compactMetric}>
                    <div className={styles.iconBg}><Star size={16} /></div>
                    <div className={styles.metricDetails}>
                        <span className={styles.metricLabel}>Quality</span>
                        <div className={styles.metricBarBg}>
                            <div className={styles.metricBarFill} style={{width: `${(summary.quality/5)*100}%`}}></div>
                        </div>
                    </div>
                    <span className={styles.metricScore}>{summary.quality}</span>
                </div>

                <div className={styles.compactMetric}>
                    <div className={styles.iconBg}><Zap size={16} /></div>
                    <div className={styles.metricDetails}>
                        <span className={styles.metricLabel}>Productivity</span>
                        <div className={styles.metricBarBg}>
                            <div className={styles.metricBarFill} style={{width: `${(summary.productivity/5)*100}%`}}></div>
                        </div>
                    </div>
                    <span className={styles.metricScore}>{summary.productivity}</span>
                </div>

                <div className={styles.compactMetric}>
                    <div className={styles.iconBg}><Award size={16} /></div>
                    <div className={styles.metricDetails}>
                        <span className={styles.metricLabel}>Reliability</span>
                        <div className={styles.metricBarBg}>
                            <div className={styles.metricBarFill} style={{width: `${(summary.reliability/5)*100}%`}}></div>
                        </div>
                    </div>
                    <span className={styles.metricScore}>{summary.reliability}</span>
                </div>

                <div className={styles.compactMetric}>
                    <div className={styles.iconBg}><Users size={16} /></div>
                    <div className={styles.metricDetails}>
                        <span className={styles.metricLabel}>Teamwork</span>
                        <div className={styles.metricBarBg}>
                            <div className={styles.metricBarFill} style={{width: `${(summary.teamwork/5)*100}%`}}></div>
                        </div>
                    </div>
                    <span className={styles.metricScore}>{summary.teamwork}</span>
                </div>
            </div>
        </div>
      )}

      {/* --- HISTORY TABLE --- */}
      <h3 className={styles.subHeader} style={{ marginBottom: '20px', marginTop: '15px' }}>
        <strong>Weekly Evaluation History</strong>
      </h3>
      
      <div className={styles.evaluationsTableContainer}>
        <div className={styles.evaluationsTable}>
            <div className={styles.tableHeader}>
                <span>Week Range</span>
                <span className="mobile-hide">Quality</span>
                <span className="mobile-hide">Productivity</span>
                <span className="mobile-hide">Reliability</span>
                <span className="mobile-hide">Teamwork</span>
                <span>Avg</span>
                <span>Comments</span>
            </div>
            {weeklyEvaluations.map((evalItem) => {
                const avg = ((evalItem.quality_rating + evalItem.productivity_rating + evalItem.reliability_rating + evalItem.teamwork_rating) / 4).toFixed(1);
                
                return (
                    <div key={evalItem.id} className={styles.tableRow} data-label="Entry">
                        <div className={styles.dateGroup}>
                            <span>{new Date(evalItem.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className={styles.dateArrow}>→</span>
                            <span>{new Date(evalItem.week_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        
                        <span className={`${styles.ratingNum} mobile-hide`}>{evalItem.quality_rating}</span>
                        <span className={`${styles.ratingNum} mobile-hide`}>{evalItem.productivity_rating}</span>
                        <span className={`${styles.ratingNum} mobile-hide`}>{evalItem.reliability_rating}</span>
                        <span className={`${styles.ratingNum} mobile-hide`}>{evalItem.teamwork_rating}</span>
                        
                        <span className={styles.ratingAvg}>
                            <Star size={12} fill="currentColor" /> {avg}
                        </span>
                        
                        <span className={styles.commentText}>{evalItem.comments || "-"}</span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}