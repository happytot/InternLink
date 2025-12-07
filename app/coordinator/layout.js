'use client';

import React from 'react';
import CoordinatorSidebar from '../components/CoordinatorSidebar'; // Adjust path if needed
import './coordinator-layout.css';

export default function CoordinatorLayout({ children }) {
  return (
    <div className="company-shell">
      {/* SIDEBAR WRAPPER 
        - Flex-shrink: 0 ensures it never shrinks.
        - Height: 100% ensures it fills the screen vertically.
      */}
      <aside className="company-sidebar-wrapper">
        <CoordinatorSidebar />
      </aside>

      {/* GLOBAL TOASTER (So you don't need it on every page) */}

      {/* MAIN CONTENT AREA
        - This is the only part that scrolls.
      */}
      <main className="company-main-content">
        {children}
      </main>
    </div>
  );
}