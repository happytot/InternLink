// app/components/intern/LogbookEntry.jsx
'use client';

import styles from './Logbook.module.css'; // 👈 Import CSS Module

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function LogbookEntry({ log, formatDate, onDelete }) {
  const isRecent = new Date() - new Date(log.submitted_at) < 7 * 24 * 60 * 60 * 1000; // 7 days
  const statusClass = log.status === 'submitted' ? styles.statusSubmitted : styles.statusApproved;

  return (
    <div className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <div>
          <h4 className={styles.entryTitle}>{formatDate(log.date)}</h4>
          <span className={styles.entryHours}>{log.hours_worked} Hours</span>
        </div>
        <div className={styles.entryMeta}>
          <span className={`${styles.entryStatus} ${statusClass}`}>
            {log.status === 'submitted' ? 'Pending Review' : 'Approved'}
          </span>
          {isRecent && log.status === 'submitted' && (
            <button
              onClick={() => onDelete(log.id)}
              className={styles.deleteButton}
              title="Delete entry"
            >
              <DeleteIcon />
            </button>
          )}
        </div>
      </div>
      <p className={styles.entryDescription}>{log.description}</p>
    </div>
  );
}