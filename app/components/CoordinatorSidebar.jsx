"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import "./CoordinatorSidebar.css";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  Briefcase,
  Megaphone,
  Settings,
  LogOut
} from "lucide-react";

export default function CoordinatorSidebar() {
  const [profile, setProfile] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("fullname, user_type")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = "/";
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
    <aside className="sidebar-icon-only">
      <div className="sidebar-nav">
        {navItems.map((item, index) => (
          <Link key={index} href={item.href} className={isActive(item.href) ? "active nav-item" : "nav-item"}>
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
