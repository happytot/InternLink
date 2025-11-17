// components/TagInput.jsx
'use client';
import React, { useState, useRef } from 'react';

export default function TagInput({ value = [], onChange, placeholder = 'Add item...' }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addTag = (tag) => {
    const clean = String(tag || '').trim();
    if (!clean) return;
    if (value.includes(clean)) return; // avoid duplicates
    onChange([...value, clean]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input) {
      // remove last
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (i) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const handlePaste = (e) => {
    // split by comma or newline
    const pasted = e.clipboardData.getData('text');
    const parts = pasted.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length) {
      const merged = [...value, ...parts.filter(p => !value.includes(p))];
      onChange(merged);
      e.preventDefault();
      setInput('');
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-list" onClick={() => inputRef.current?.focus()}>
        {value.map((tag, i) => (
          <span className="tag-chip" key={tag + i}>
            {tag}
            <button type="button" className="tag-remove" onClick={() => removeTag(i)}>×</button>
          </span>
        ))}

        <input
          ref={inputRef}
          className="tag-input-field"
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <button
          type="button"
          className="tag-add-btn"
          onClick={() => addTag(input)}
        >
          + Add
        </button>
      </div>
      <style jsx>{`
        .tag-input { display:block; }
        .tag-list {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          align-items:center;
          border:1px solid rgba(0,0,0,0.08);
          padding:8px;
          border-radius:10px;
          background: rgba(255,255,255,0.95);
        }
        .tag-chip {
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border-radius:999px;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          font-size:0.9rem;
        }
        .tag-remove {
          background:none;
          border:none;
          font-weight:700;
          cursor:pointer;
          color:#666;
        }
        .tag-input-field {
          min-width:120px;
          border:none;
          outline:none;
          padding:6px;
          font-size:0.95rem;
          background:transparent;
        }
        .tag-add-btn {
          background: linear-gradient(135deg,#007aff,#0a84ff);
          color:white;
          border:none;
          padding:6px 10px;
          border-radius:10px;
          cursor:pointer;
          font-size:0.9rem;
        }
        @media (max-width:480px) {
          .tag-input-field { min-width:70px; }
        }
      `}</style>
    </div>
  );
}
