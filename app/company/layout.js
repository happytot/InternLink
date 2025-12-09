// src/app/company/layout.js
import CompanyNav from '../components/CompanyNav';
import '../globals.css';
import { Toaster } from 'sonner'; // Removed 'toast' import since it's not used directly in layout

export default function CompanyLayout({ children }) {
  return (
    // 1. The Shell: Locks to the screen size (100vh)
    <div className="company-shell">
      
      {/* ✅ Add the Toaster here so it works on EVERY company page */}
     

      {/* 2. Sidebar Wrapper: Fixed on the left */}
      <aside className="company-sidebar-wrapper">
        <CompanyNav />
      </aside>
      
      {/* 3. Main Content: Takes remaining space & scrolls internally */}
      <main className="company-main-content">
        {children}
      </main>
      
    </div>
  );
}