'use client';

import React from 'react';
import TagInput from '../TagInput'; // <-- adjust import if your TagInput is elsewhere
import '../../components/jobs/edit-job.css'; // make sure path matches where you put the CSS
// If you keep edit-job.css inside same folder, adjust path accordingly

export default function EditJobModal({
  job,
  onClose,
  onChange,
  onSave,
  saving,
}) {
  if (!job) return null;

  return (
    <div className="ej-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="ej-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ej-close" aria-label="Close" onClick={onClose}>×</button>

        <h3 className="ej-title">Edit Job</h3>

        <div className="ej-form">
          <label>Job Title</label>
          <input value={job.title || ''} onChange={(e) => onChange('title', e.target.value)} />

          <label>Location</label>
          <input value={job.location || ''} onChange={(e) => onChange('location', e.target.value)} />

          <label>Salary</label>
          <input value={job.salary || ''} onChange={(e) => onChange('salary', e.target.value)} />

          <label>Description</label>
          <textarea rows={4} value={job.description || ''} onChange={(e) => onChange('description', e.target.value)} />

          <label>Responsibilities</label>
          <TagInput
            value={job.responsibilities || []}
            onChange={(v) => onChange('responsibilities', v)}
            placeholder="Add responsibility (press Enter / comma)"
          />

          <label>Requirements</label>
          <TagInput
            value={job.requirements || []}
            onChange={(v) => onChange('requirements', v)}
            placeholder="Add requirement (press Enter / comma)"
          />

          <label>Work Setup</label>
          <select value={job.work_setup || ''} onChange={(e) => onChange('work_setup', e.target.value)}>
            <option value="">Select...</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>

          <label>Work Schedule</label>
          <select value={job.work_schedule || ''} onChange={(e) => onChange('work_schedule', e.target.value)}>
            <option value="">Select...</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Shift">Shift</option>
          </select>
        </div>

        <div className="ej-actions">
          <button className="ej-btn cancel" onClick={onClose}>Cancel</button>
          <button className="ej-btn save" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
