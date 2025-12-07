// src/app/intern/layout.js
import InternSidebar from '../components/InternNav';
import '../globals.css';
import { Toaster } from 'sonner'; // 1. Import Sonner

export default function InternLayout({ children }) {
  return (
    <div className="company-shell"> 
      
      {/* 2. Global Toast Notification Component */}
      <Toaster 
        position="bottom-right" 
        richColors 
        toastOptions={{ 
            style: { 
                background: 'var(--bg-card)', 
                color: 'var(--text-main)', 
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-card)',
                backdropFilter: 'blur(12px)'
            } 
        }} 
      />

      {/* Sidebar Wrapper */}
      <div className="company-sidebar-wrapper">
        <InternSidebar />
      </div>
      
      {/* Main Content */}
      <main className="company-main-content">
        {/* Padding top is for mobile header clearance */}
        <div style={{ paddingTop: '60px' }} className="md:pt-0"> 
          {children}
        </div>
      </main>
      
    </div>
  );
}