// src/app/company/layout.js
import CompanyNav from '../components/CompanyNav';
import '../globals.css'

export default function CompanyLayout({ children }) {
  return (
    // 1. Flex Container: Aligns Sidebar (left) and Main (right)
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-main)', // Matches your global dark theme
      overflow: 'hidden' // Prevents double scrollbars
    }}>
      
      {/* 2. The Sidebar (Fixed Width) */}
      <CompanyNav />
      
      {/* 3. The Main Content (Fills remaining space) */}
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', // Allows content to scroll independently of sidebar
        height: '100vh',   // Full viewport height
        position: 'relative'
      }}>
        {children}
      </main>
    </div>
  );
}