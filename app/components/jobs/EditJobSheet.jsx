'use client';

import React, { useEffect, useRef, useState } from 'react';
import TagInput from '../TagInput'; // <-- adjust path to your TagInput
import '../../components/jobs/edit-job.css'; // make sure path matches where you put the CSS

export default function EditJobSheet({
  job,
  onClose,
  onChange,
  onSave,
  saving,
  initialOpen = true,
}) {
  const sheetRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const [isOpen, setIsOpen] = useState(!!job && initialOpen);

  useEffect(() => {
    setIsOpen(!!job);
  }, [job]);

  // prevent background from scrolling while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onPointerDown = (e) => {
    startYRef.current = e.touches ? e.touches[0].clientY : e.clientY;
    sheetRef.current.style.transition = ''; // disable transition while dragging
  };

  const onPointerMove = (e) => {
    if (startYRef.current === 0) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    currentYRef.current = Math.max(0, clientY - startYRef.current);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentYRef.current}px)`;
    }
  };

  const onPointerUp = () => {
    const moved = currentYRef.current;
    startYRef.current = 0;
    currentYRef.current = 0;
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = 'transform 220ms ease';
    sheetRef.current.style.transform = '';
    // if dragged far enough, close
    if (moved > 120) {
      setIsOpen(false);
      setTimeout(() => {
        onClose();
      }, 220);
    }
  };

  if (!job || !isOpen) return null;

  return (
    <div className="ej-sheet-bg" onClick={() => { /* background tap closes (user chose C) */ onClose(); }}>
      <div
        className="ej-sheet"
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()} // prevent immediate bg close
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        role="dialog"
        aria-modal="true"
      >
        <div className="ej-sheet-handle" />
        <button className="ej-sheet-close" onClick={onClose} aria-label="Close sheet">×</button>

        <h3 className="ej-title">Edit Job</h3>
        <div className="ej-form ej-form-sheet">
          <label>Job Title</label>
          <input value={job.title || ''} onChange={(e) => onChange('title', e.target.value)} />

          <label>Location</label>
          <input value={job.location || ''} onChange={(e) => onChange('location', e.target.value)} />

          <label>Salary</label>
          <input value={job.salary || ''} onChange={(e) => onChange('salary', e.target.value)} />

          <label>Description</label>
          <textarea rows={4} value={job.description || ''} onChange={(e) => onChange('description', e.target.value)} />

          <label>Responsibilities</label>
          <TagInput value={job.responsibilities || []} onChange={(v) => onChange('responsibilities', v)} />

          <label>Requirements</label>
          <TagInput value={job.requirements || []} onChange={(v) => onChange('requirements', v)} />

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
