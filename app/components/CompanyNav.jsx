"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabaseClient"; 
import "./CompanyNav.css";

import {
  LayoutDashboard,
  PlusCircle,
  List,
  Users,
  MessageSquare,
  UserCircle,
  BookOpenCheck,
  LogOut
} from "lucide-react";

export default function CompanyNav({ visible = true }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = "/";
  };

  const isActive = (href) => pathname === href;

  // Company specific navigation items
  const navItems = [
    { href: "/company/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/company/jobs/new", icon: <PlusCircle size={20} />, label: "Post Job" },
    { href: "/company/jobs/listings", icon: <List size={20} />, label: "Listings" },
    { href: "/company/applicants", icon: <Users size={20} />, label: "Applicants" },
    { href: "/company/logbook", icon: <BookOpenCheck size={20} />, label: "Logbook" },
    { href: "/company/messages", icon: <MessageSquare size={20} />, label: "Messages" },
    { href: "/company/profile", icon: <UserCircle size={20} />, label: "Profile" },
  ];

  if (!visible) return null;

  return (
    <aside className="company-sidebar-icon-only">
      <div className="sidebar-nav">
        {navItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.href} 
            className={isActive(item.href) ? "active nav-item" : "nav-item"}
          >
            {item.icon}
            <span className="tooltip">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span className="tooltip">Logout</span>
        </button>
      </div>
    </aside>
  );
}