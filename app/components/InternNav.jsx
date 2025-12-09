'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from 'next-themes';
import './InternNav.css'; 

// Icons (Using your preferred Lucide React Icons)
import { 
  LuLayoutDashboard, 
  LuClipboardList, 
  LuHistory, 
  LuBuilding, 
  LuBook, 
  LuUser,
  LuLogOut,
  LuSun,
  LuMoon,
  LuMenu,
  LuX
} from "react-icons/lu";

export default function InternSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // State
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
    router.refresh();
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  // ✨ Theme Transition Effect (Same as Admin)
  const toggleTheme = (e) => {
    if (!document.startViewTransition) {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { href: "/intern/dashboard", icon: <LuLayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/intern/listings", icon: <LuClipboardList size={20} />, label: "Listings" },
    { href: "/intern/history", icon: <LuHistory size={20} />, label: "History" },
    { href: "/intern/companies", icon: <LuBuilding size={20} />, label: "Companies" },
    { href: "/intern/logbook", icon: <LuBook size={20} />, label: "Logbook" },
    { href: "/intern/profile", icon: <LuUser size={20} />, label: "Profile" },
  ];

  return (
    <>
      {/* 📱 MOBILE HEADER (Only visible on small screens) */}
      <div className="mobile-header">
        <div className="brand-mobile">
          Intern<span>Link</span>
        </div>
        <button 
          className="mobile-toggle-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <LuX size={24} /> : <LuMenu size={24} />}
        </button>
      </div>

      {/* 🌑 MOBILE OVERLAY (Click to close) */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* 🖥️ SIDEBAR (Desktop: Fixed | Mobile: Drawer) */}
      <aside className={`intern-sidebar ${isMobileOpen ? 'open' : ''}`}>
        
        {/* --- Header --- */}
        <div className="sidebar-header">
          <div>
            <h2 className="brand">
              Intern<span>Link</span>
            </h2>
            <span className="sub-brand">Student Portal</span>
          </div>

          {mounted && (
            <button
              onClick={toggleTheme}
              className="theme-btn"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <LuSun size={18} /> : <LuMoon size={18} />}
            </button>
          )}
        </div>

        {/* --- Navigation --- */}
        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              className={`nav-button ${isActive(item.href) ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* --- Footer / Logout --- */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-button logout-btn">
            <LuLogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}