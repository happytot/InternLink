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
  LogOut,
  Menu, // Toggle icon
} from "lucide-react";

export default function CoordinatorSidebar() {
  const [profile, setProfile] = useState(null);
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false); // NEW: sidebar collapse state

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("fullname, user_type")
          .eq("id", user.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = "/";
  };

  const isActive = (href) => pathname === href;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar toggle button */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu size={22} />
      </button>

      <div className="sidebar-top">
        <h3 className="logo-text">InternLink</h3>
        <p className="user-type">{profile?.user_type || "Coordinator"}</p>
      </div>

      <nav className="sidebar-nav">
        <Link
          href="/coordinator/dashboard"
          className={isActive("/coordinator/dashboard") ? "active" : ""}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </Link>

        <Link
          href="/coordinator/students"
          className={isActive("/coordinator/students") ? "active" : ""}
        >
          <Users size={18} />
          <span>Students</span>
        </Link>

        <Link
          href="/coordinator/approvals"
          className={isActive("/coordinator/approvals") ? "active" : ""}
        >
          <CheckSquare size={18} />
          <span>Approvals</span>
        </Link>

        <Link
          href="/coordinator/internships"
          className={isActive("/coordinator/internships") ? "active" : ""}
        >
          <Briefcase size={18} />
          <span>Internships</span>
        </Link>

        <Link
          href="/coordinator/companies"
          className={isActive("/coordinator/companies") ? "active" : ""}
        >
          <Building2 size={18} />
          <span>Companies</span>
        </Link>

        <Link
          href="/coordinator/announcements"
          className={isActive("/coordinator/announcements") ? "active" : ""}
        >
          <Megaphone size={20} />
          <span>Announcements</span>
        </Link>

        <Link
          href="/coordinator/settings"
          className={isActive("/coordinator/settings") ? "active" : ""}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="sidebar-bottom">
        <p className="user-name">
          {profile ? profile.fullname : "Loading..."}
        </p>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
