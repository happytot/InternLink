'use client';

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useTheme } from "next-themes";
import "./CoordinatorSidebar.css"; 

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  Briefcase,
  Megaphone,
  Settings,
  LogOut,
  Sun,
  Moon
} from "lucide-react";

export default function CoordinatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Theme Logic
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = "/";
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

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

  const isActive = (href) => pathname === href;

  const navItems = [
    { href: "/coordinator/dashboard", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { href: "/coordinator/students", icon: <Users size={20} />, label: "Students" },
    { href: "/coordinator/approvals", icon: <CheckSquare size={20} />, label: "Approvals" },
    { href: "/coordinator/internships", icon: <Briefcase size={20} />, label: "Internships" },
    { href: "/coordinator/companies", icon: <Building2 size={20} />, label: "Companies" },
    { href: "/coordinator/announcements", icon: <Megaphone size={20} />, label: "Announcements" },
    { href: "/coordinator/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <aside className="coordinator-sidebar">
      
      {/* --- Header: Logo + Theme Toggle --- */}
      <div className="sidebar-header">
        <div>
          <h2 className="brand">
            Intern<span>Link</span>
          </h2>
          <span className="sub-brand">Coordinator</span>
        </div>

        {mounted && (
          <button
            onClick={toggleTheme}
            className="theme-btn"
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}