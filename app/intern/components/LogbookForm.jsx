// app/components/intern/LogbookForm.jsx
'use client';

import { useState, useEffect } from 'react';
import styles from './Logbook.module.css';

export default function LogbookForm({ onSubmit }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [hours, setHours] = useState('');
  const [tasks, setTasks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Automatically calculate hours if time in/out are filled ---
  useEffect(() => {
  if (timeIn && timeOut) {
    const inDate = new Date(`${date}T${timeIn}`);
    const outDate = new Date(`${date}T${timeOut}`);
    const diff = (outDate - inDate) / 1000 / 60 / 60;
    setHours(diff > 0 ? diff.toFixed(1) : '');
  } else {
    setHours(''); // clear hours if either field is empty
  }
}, [timeIn, timeOut, date]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    await onSubmit({
      date,
      hours_worked: parseFloat(hours),
      tasks_completed: tasks,
      time_in: timeIn,
      time_out: timeOut,
    });

    // Reset form
    setTimeIn('');
    setTimeOut('');
    setHours('');
    setTasks('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Entry</h3>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="timeIn">Time In</label>
          <input
            type="time"
            id="timeIn"
            value={timeIn}
            onChange={(e) => setTimeIn(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="timeOut">Time Out</label>
          <input
            type="time"
            id="timeOut"
            value={timeOut}
            onChange={(e) => setTimeOut(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="hours">Hours Worked</label>
          <input
            type="number"
            id="hours"
            step="0.1"
            min="0.5"
            max="12"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g., 8"
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="tasks">Work Accomplished / Tasks</label>
        <textarea
          id="tasks"
          rows="4"
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          className={styles.textarea}
          placeholder="Describe the tasks you completed today..."
          required
        ></textarea>
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Entry'}
        </button>
      </div>
    </form>
  );
}
