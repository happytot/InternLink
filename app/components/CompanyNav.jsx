"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // Updated import
import "./CompanyNav.css";

import {
  LayoutDashboard,
  List,
  Users,
  BookOpenCheck,
  UserCircle,
  LogOut
} from "lucide-react";

export default function CompanyNav({ visible = true }) {
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = "/";
  };

  const isActive = (href) => pathname === href;

  const navItems = [
    { href: "/company/dashboard", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
    { href: "/company/jobs/listings", icon: <List size={22} />, label: "Listings" },
    { href: "/company/applicants", icon: <Users size={22} />, label: "Applicants" },
    { href: "/company/logbook", icon: <BookOpenCheck size={22} />, label: "Logbook" },
    { href: "/company/profile", icon: <UserCircle size={22} />, label: "Profile" },
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