'use client';

import '../globals.css'; // Ensure globals are loaded
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="company-shell">
      
      {/* 1. Animated Background Orbs (Scoped to Admin) */}
      <div className="bg-gradient-orb orb-1 orb-float" style={{ position: 'fixed' }}></div>
      <div className="bg-gradient-orb orb-2 orb-float" style={{ position: 'fixed', animationDelay: '2s' }}></div>

      {/* 2. Sidebar Wrapper (Left) */}
      <div className="company-sidebar-wrapper">
         <AdminSidebar />
      </div>

      {/* 3. Main Content (Right - Scrollable) */}
      <main className="company-main-content">
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px',
          minHeight: '100vh',
          position: 'relative' // Ensure content sits above orbs
        }}>
          {children}
        </div>
      </main>
      
    </div>
  );
}