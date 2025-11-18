// app/components/intern/LogbookForm.jsx
'use client';

import { useState } from 'react';
import styles from './Logbook.module.css'; // 👈 Import CSS Module

export default function LogbookForm({ onSubmit }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit({
      date: date,
      hours_worked: parseFloat(hours),
      description: description,
    });
    setHours('');
    setDescription('');
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
        <label htmlFor="description">Work Accomplished / Tasks</label>
        <textarea
          id="description"
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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