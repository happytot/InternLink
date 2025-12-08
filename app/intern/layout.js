// src/app/intern/layout.js
import InternNav from '../components/InternNav'; // ✅ Correct Import Name
import '../globals.css';
import { Toaster } from 'sonner';

export default function InternLayout({ children }) {
  return (
    // 1. Renamed Shell
    <div className="intern-shell"> 
      
      {/* Global Toast */}
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

      {/* 2. Sidebar Wrapper */}
      <div className="intern-sidebar-wrapper">
        <InternNav /> {/* ✅ Correct Component Usage */}
      </div>
      
      {/* 3. Main Content */}
      <main className="intern-main-content">
        {/* Padding top matches the mobile header height */}
          {children}
      </main>
      
    </div>
  );
}