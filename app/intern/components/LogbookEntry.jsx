'use client';

import styles from './Logbook.module.css';

export default function LogbookEntry({ log, formatDate, onDelete }) {
  // Normalize status for consistent styling
  const status = log.status ? log.status.toLowerCase() : 'pending';
  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 'submitted';

  // Helper to choose the right status class
  const getStatusClass = () => {
    if (isApproved) return styles.statusApproved;
    if (isPending) return styles.statusPending;
    return styles.statusRejected;
  };

  // Helper to clean up the Task Description
  const getTaskDescription = () => {
    const text = log.tasks_completed;
    if (!text || String(text).trim().toLowerCase() === 'undefined') {
      return "No tasks description provided.";
    }
    return text;
  };

  return (
    <div className={styles.entryCard}>
      {/* Header: Date and Status */}
      <div className={styles.entryHeader}>
        <div>
          <span className={styles.entryDate}>
            {formatDate(log.date)}
          </span>
          
          <div className={styles.entryMeta}>
            {/* Status Badge */}
            <span className={`${styles.entryStatus} ${getStatusClass()}`}>
              {status}
            </span>

            {/* Attendance Badge */}
            {log.attendance_status && (
              <span className={styles.attendanceBadge}>
                {log.attendance_status}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Hours + Time In/Out */}
        <div className={styles.entryHours}>
          <span className={styles.hoursValue}>
            {log.hours_worked} <span style={{fontSize: '0.6em', fontWeight: '500'}}>hrs</span>
          </span>

          {/* Time In / Time Out */}
          <div className={styles.timeInOut}>
            {log.time_in && <span>In: {log.time_in}</span>}
            {log.time_out && <span>Out: {log.time_out}</span>}
          </div>

          {/* Delete Button (only if not approved) */}
          {!isApproved && onDelete && (
            <button 
              onClick={() => onDelete(log.id)}
              className={styles.deleteButton}
            >
              Delete Entry
            </button>
          )}
        </div>
      </div>

      {/* Task Description Box */}
      <div className={styles.entryDescription}>
        <span className={styles.entryDescriptionTitle}>
          Work Accomplished
        </span>
        {getTaskDescription()}
      </div>
    </div>
  );
}
