'use client';

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useTheme } from "next-themes";
import "./CompanyNav.css"; 

import {
  LayoutDashboard,
  List,
  Users,
  BookOpenCheck,
  UserCircle,
  LogOut,
  Sun,
  Moon
} from "lucide-react";

export default function CompanyNav({ visible = true }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Theme Logic
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        router.push("/");
        router.refresh();
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
    { href: "/company/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/company/jobs/listings", icon: <List size={20} />, label: "Listings" },
    { href: "/company/applicants", icon: <Users size={20} />, label: "Applicants" },
    { href: "/company/logbook", icon: <BookOpenCheck size={20} />, label: "Logbook" },
    { href: "/company/profile", icon: <UserCircle size={20} />, label: "Profile" },
  ];

  if (!visible) return null;

  return (
    <aside className="company-sidebar">
      
      {/* --- Header: Logo + Theme Toggle --- */}
      <div className="sidebar-header">
        <div>
          <h2 className="brand">
            Intern<span>Link</span>
          </h2>
          <span className="sub-brand">Company Portal</span>
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